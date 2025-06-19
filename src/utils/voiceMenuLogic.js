import { similarity, fuzzyCandidates } from './voiceUtils';

function isPerfectMatch(item, query) {
  if (!query) return false;
  const q = query.toLowerCase();
  const name = item.name.toLowerCase();
  return name === q || name.includes(q);
}

export function handleVoiceCommand(text, state, api) {
  const t = text.toLowerCase().trim();
  let message = '';
  let newState = { ...state };

  const changeName = t.match(/change name to (.+)/i);
  if (changeName) {
    const newName = changeName[1].trim();
    if (state.selectedDish) {
      const oldName = state.selectedDish.name;
      api.updateDishName(newName);
      message = `Dish name changed from "${oldName}" to "${newName}"`;
      return { newState, message };
    } else if (state.selectedSubcategory) {
      const oldName = state.selectedSubcategory.name;
      api.updateSubcategoryName(newName);
      message = `Subcategory name changed from "${oldName}" to "${newName}"`;
      return { newState, message };
    } else if (state.selectedCategory) {
      const oldName = state.selectedCategory.name;
      api.updateCategoryName(newName);
      message = `Category name changed from "${oldName}" to "${newName}"`;
      return { newState, message };
    } else {
      message = "Nothing selected to change name.";
      return { newState, message };
    }
  }

const changeTo = t.match(/^change to (.+)$/i);
if (changeTo) {
  let targetName = changeTo[1].trim().toLowerCase();
  let items = [];
  if (state.currentLevel === 'category') items = api.getCategories();
  else if (state.currentLevel === 'subcategory') items = api.getSubcategories();
  else if (state.currentLevel === 'dish') items = api.getDishes();
  let found = items.find(i => i.name.toLowerCase() === targetName);
  if (!found) found = fuzzyCandidates(items, targetName)[0];

  if (!found && state.currentLevel !== 'category') {
    let subcategories = [];
    api.getCategories().forEach(cat => {
      if (cat.subcategories) subcategories.push(...cat.subcategories);
    });
    found = subcategories.find(i => i.name.toLowerCase() === targetName)
         || fuzzyCandidates(subcategories, targetName)[0];
    if (found) {
      api.selectCategory(api.getCategories().find(cat =>
        cat.subcategories && cat.subcategories.some(sub => sub.id === found.id)
      ));
      api.selectSubcategory(found);
      newState.tempSelection = null;
      newState.pendingAction = null;
      newState.candidates = [];
      message = `Changed to subcategory: ${found.name}`;
      return { newState, message };
    }
  }

  if (!found && state.currentLevel !== 'category') {
    let categories = api.getCategories();
    found = categories.find(i => i.name.toLowerCase() === targetName)
         || fuzzyCandidates(categories, targetName)[0];
    if (found) {
      api.selectCategory(found);
      newState.tempSelection = null;
      newState.pendingAction = null;
      newState.candidates = [];
      message = `Changed to category: ${found.name}`;
      return { newState, message };
    }
  }

  if (found) {
    if (state.currentLevel === 'dish') api.selectDish(found);
    newState.tempSelection = null;
    newState.pendingAction = null;
    newState.candidates = [];
    message = `Changed to: ${found.name}`;
    return { newState, message };
  } else {
    message = "Not found. Please try another name.";
    return { newState, message };
  }
}

if (t === 'back') {
  if (state.selectedDish) {
    newState.selectedDish = null;
    newState.currentLevel = 'dish';
    setTimeout(() => {
      newState.currentLevel = 'dish';
    }, 10);
    message = 'Back to dishes.';
    return { newState, message };
  } else if (state.selectedSubcategory) {
    newState.selectedSubcategory = null;
        setTimeout(() => {
      newState.currentLevel = 'dish';
    }, 10);
    newState.currentLevel = 'subcategory';
    message = 'Back to subcategories.';
    return { newState, message };
  } else if (state.selectedCategory) {
    newState.selectedCategory = null;
        setTimeout(() => {
      newState.currentLevel = 'dish';
    }, 10);
    newState.currentLevel = 'category';
    message = 'Back to categories.';
    return { newState, message };
  } else {
    message = "You're already at the top level.";
    return { newState, message };
  }
}

  if (t === 'save') {
  if (state.selectedDish) {
    api.saveDish();
    message = 'Dish saved!';
    return { newState, message };
  } else if (state.selectedSubcategory) {
    api.saveSubcategory && api.saveSubcategory();
    message = 'Subcategory saved!';
    return { newState, message };
  } else if (state.selectedCategory) {
    api.saveCategory && api.saveCategory();
    message = 'Category saved!';
    return { newState, message };
  } else {
    message = "Nothing selected to save.";
    return { newState, message };
  }
}

  const changePrice = t.match(/change price to (\d+)/i);
  if (changePrice) {
    if (state.selectedDish) {
      const oldPrice = state.selectedDish.price;
      const newPrice = Number(changePrice[1]);
      api.updateDishPrice(newPrice);
      message = `Dish price changed from ${oldPrice} to ${newPrice}`;
      return { newState, message };
    } else {
      message = "Price can only be changed for a selected dish.";
      return { newState, message };
    }
  }

  if (state.pendingAction === 'confirm-selection' && state.tempSelection) {
    if (['yes', 'yeah', 'correct'].includes(t)) {
      if (state.currentLevel === 'category') api.selectCategory(state.tempSelection);
      else if (state.currentLevel === 'subcategory') api.selectSubcategory(state.tempSelection);
      else if (state.currentLevel === 'dish') api.selectDish(state.tempSelection);

      newState.tempSelection = null;
      newState.pendingAction = null;
      newState.candidates = [];
      message = `Selected: ${state.tempSelection.name}`;
      return { newState, message };
    }
    if (['no', 'not'].includes(t)) {
      message = 'Okay, please say the number or name again.';
      newState.pendingAction = 'choose-candidate';
      return { newState, message };
    }
  }

  if (state.pendingAction === 'choose-candidate' && state.candidates.length) {
    let candidate = null;
    const numMatch = t.match(/(\d+)/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (state.candidates[idx]) candidate = state.candidates[idx];
    }
    if (!candidate) {
      candidate = state.candidates.find(c => isPerfectMatch(c, t)) ||
                  fuzzyCandidates(state.candidates, t)[0];
    }
    if (candidate) {
      newState.tempSelection = candidate;
      if (isPerfectMatch(candidate, t)) {
        if (state.currentLevel === 'category') api.selectCategory(candidate);
        else if (state.currentLevel === 'subcategory') api.selectSubcategory(candidate);
        else if (state.currentLevel === 'dish') api.selectDish(candidate);

        newState.tempSelection = null;
        newState.pendingAction = null;
        newState.candidates = [];
        message = `Selected: ${candidate.name}`;
        return { newState, message };
      }
      message = `Do you mean "${candidate.name}"? Say "Yes" or "No".`;
      newState.pendingAction = 'confirm-selection';
      return { newState, message };
    } else {
      message = `No match in the list. Please try again.`;
      return { newState, message };
    }
  }

  let items = [];
  if (state.currentLevel === 'category') {
    items = api.getCategories();
  } else if (state.currentLevel === 'subcategory' && state.selectedCategory) {
    items = api.getSubcategories();
  } else if (state.currentLevel === 'dish' && state.selectedSubcategory) {
    items = api.getDishes();
  }

  let query = t.replace(/^select /, '').trim();

  let perfect = items.filter(i => isPerfectMatch(i, query));
if (perfect.length === 1) {
  const item = perfect[0];
  if (state.currentLevel === 'category') {
    api.selectCategory(item);
    newState.currentLevel = 'subcategory';
  }
  else if (state.currentLevel === 'subcategory') {
    api.selectSubcategory(item);
    newState.currentLevel = 'dish';
  }
  else if (state.currentLevel === 'dish') {
    api.selectDish(item);
    newState.currentLevel = 'action';
  }
  newState.tempSelection = null;
  newState.pendingAction = null;
  newState.candidates = [];
  message = `Selected: ${item.name}`;
  return { newState, message };
}

  if (perfect.length > 1) {
    newState.candidates = perfect;
    message = `Multiple matches: ${perfect.map((c, i) => `[${i+1}] ${c.name}`).join(', ')}. Say the number or name.`;
    newState.pendingAction = 'choose-candidate';
    return { newState, message };
  }

  let candidates = items.filter(i =>
    i.name.toLowerCase().includes(query) ||
    similarity(i.name.toLowerCase(), query) > 0.7
  );
  if (candidates.length === 0 && query) {
    candidates = fuzzyCandidates(items, query);
  }

  if (candidates.length === 1) {
    const item = candidates[0];
    if (isPerfectMatch(item, query)) {
      if (state.currentLevel === 'category') api.selectCategory(item);
      else if (state.currentLevel === 'subcategory') api.selectSubcategory(item);
      else if (state.currentLevel === 'dish') api.selectDish(item);

      newState.tempSelection = null;
      newState.pendingAction = null;
      newState.candidates = [];
      message = `Selected: ${item.name}`;
      return { newState, message };
    } else {
      newState.tempSelection = item;
      message = `Do you mean "${item.name}"? Say "Yes" or "No".`;
      newState.pendingAction = 'confirm-selection';
      newState.candidates = [item];
      return { newState, message };
    }
  }
  if (candidates.length > 1) {
    newState.candidates = candidates;
    message = `Multiple matches: ${candidates.map((c, i) => `[${i+1}] ${c.name}`).join(', ')}. Say the number or name.`;
    newState.pendingAction = 'choose-candidate';
    return { newState, message };
  }
  if (candidates.length === 0) {
    message = `No match found. Please try again.`;
    return { newState, message };
  }

  message = "Sorry, I didn't understand the command.";
  return { newState, message };
}