<template>
  <div class="app">
    <h1>Menu</h1>

    <div class="voice">
      <button v-if="!recognizing" @click="startRecognition">
        Start voice input
      </button>
      <button v-else @click="stopRecognition">
        Stop listening
      </button>
      <div v-if="voiceText" class="voice-text">
        <strong>Recognized:</strong> {{ voiceText }}
      </div>
    </div>

    <div class="menu">
      <div v-for="category in menu" :key="category.id" class="category">
        <h2 @click="selectCategory(category)">{{ category.name }}</h2>
        <div v-if="selectedCategory && selectedCategory.id === category.id">
          <div v-for="subcategory in category.subcategories" :key="subcategory.id" class="subcategory">
            <h3 @click="selectSubcategory(subcategory)">{{ subcategory.name }}</h3>
            <div v-if="selectedSubcategory && selectedSubcategory.id === subcategory.id">
              <ul>
                <li v-for="dish in subcategory.dishes" :key="dish.id" @click="selectDish(dish)">
                  <span :class="{ selected: selectedDish && selectedDish.id === dish.id }">
                    {{ dish.name }} – {{ dish.price }} UAH
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDish" class="dish-details">
      <h3>Selected dish: {{ selectedDish.name }}</h3>
      <p>Price: {{ selectedDish.price }} UAH</p>
      <input v-model="editName" placeholder="New dish name" />
      <input v-model.number="editPrice" placeholder="New price" type="number" min="0" />
      <button @click="saveDish">Save</button>
      <p v-if="saveMsg" style="color: green">{{ saveMsg }}</p>
    </div>
  </div>
</template>

<script>
import menuData from '../menuData.js';

export default {
  data() {
    return {
      menu: menuData,
      selectedCategory: null,
      selectedSubcategory: null,
      selectedDish: null,
      editName: '',
      editPrice: '',
      saveMsg: '',
      voiceText: '',
      recognizing: false,
      recognition: null,
      keepListening: false
    };
  },
  watch: {
    selectedDish(newDish) {
      if (newDish) {
        this.editName = newDish.name;
        this.editPrice = newDish.price;
        this.saveMsg = '';
      }
    }
  },
mounted() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    const self = this;

    this.recognition.onresult = function(event) {
      self.voiceText = event.results[0][0].transcript;
      self.processVoiceCommand(self.voiceText);
    };

    this.recognition.onerror = function(event) {
      self.voiceText = 'Recognition error: ' + event.error;
      self.recognizing = false;
      self.keepListening = false;
    };

    this.recognition.onend = function() {
      if (self.keepListening) {
        setTimeout(() => {
          self.recognition.start();
        }, 200);
      } else {
        self.recognizing = false;
      }
    };
  }
},
  methods: {
    startRecognition() {
    if (this.recognition) {
      this.voiceText = '';
      this.recognizing = true;
      this.keepListening = true;
      this.recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  },
  stopRecognition() {
    if (this.recognition) {
      this.keepListening = false;
      this.recognition.stop();
      this.recognizing = false;
    }
  },
    selectCategory(category) {
      this.selectedCategory = category;
      this.selectedSubcategory = null;
      this.selectedDish = null;
    },
    selectSubcategory(subcategory) {
      this.selectedSubcategory = subcategory;
      this.selectedDish = null;
    },
    selectDish(dish) {
      this.selectedDish = dish;
    },
    saveDish() {
      if (this.editName && this.editPrice >= 0) {
        this.selectedDish.name = this.editName;
        this.selectedDish.price = this.editPrice;
        this.saveMsg = 'Saved!';
      }
    },
    processVoiceCommand(text) {
      const t = text.toLowerCase().trim();

      // 1. Select category
      const categoryRegex = /select category (.+)/i;
      const catMatch = t.match(categoryRegex);
      if (catMatch) {
        const catName = catMatch[1].trim();
        const foundCat = this.menu.find(cat => cat.name.toLowerCase().includes(catName));
        if (foundCat) {
          this.selectCategory(foundCat);
          this.saveMsg = `Category "${foundCat.name}" selected.`;
        } else {
          this.saveMsg = `Category "${catName}" not found.`;
        }
        return;
      }

      // 2. Select subcategory
      const subcategoryRegex = /select sub-category (.+)/i;
      const subcatMatch = t.match(subcategoryRegex);
      if (subcatMatch && this.selectedCategory) {
        const subName = subcatMatch[1].trim();
        const foundSub = this.selectedCategory.subcategories.find(sub => sub.name.toLowerCase().includes(subName));
        if (foundSub) {
          this.selectSubcategory(foundSub);
          this.saveMsg = `Subcategory "${foundSub.name}" selected.`;
        } else {
          this.saveMsg = `Subcategory "${subName}" not found.`;
        }
        return;
      }

      // 3. Select dish
      const dishRegex = /select dish (.+)/i;
      const dishMatch = t.match(dishRegex);
      if (dishMatch && this.selectedSubcategory) {
        const dishName = dishMatch[1].trim();
        const foundDish = this.selectedSubcategory.dishes.find(d => d.name.toLowerCase().includes(dishName));
        if (foundDish) {
          this.selectDish(foundDish);
          this.saveMsg = `Dish "${foundDish.name}" selected.`;
        } else {
          this.saveMsg = `Dish "${dishName}" not found.`;
        }
        return;
      }

      // 4. Change dish name (when dish is selected)
      const changeNameRegex = /change name to (.+)/i;
      const nameMatch = t.match(changeNameRegex);
      if (nameMatch && this.selectedDish) {
        const newName = nameMatch[1].trim();
        const oldName = this.selectedDish.name;
        this.selectedDish.name = newName;
        this.editName = newName;
        this.saveMsg = `Dish name changed from "${oldName}" to "${newName}"`;
        return;
      }

      // 5. Change dish price (when dish is selected)
      const changePriceRegex = /change price to (\d+)/i;
      const priceMatch = t.match(changePriceRegex);
      if (priceMatch && this.selectedDish) {
        const newPrice = Number(priceMatch[1]);
        const oldPrice = this.selectedDish.price;
        this.selectedDish.price = newPrice;
        this.editPrice = newPrice;
        this.saveMsg = `Price changed from ${oldPrice} to ${newPrice}`;
        return;
      }

      this.saveMsg = "Sorry, I didn't understand the command.";
    }
  },

};
</script>

<style>
.app {
  max-width: 600px;
  margin: 40px auto;
  font-family: Arial, sans-serif;
}

.category {
  margin-bottom: 16px;
}

.category h2 {
  cursor: pointer;
  color: #2d7fff;
}

.subcategory h3 {
  cursor: pointer;
  margin-left: 20px;
  color: #007855;
}

ul {
  margin-left: 40px;
}

li {
  margin-bottom: 8px;
  cursor: pointer;
}

.selected {
  font-weight: bold;
  color: #d35400;
}

.dish-details {
  background: #f2f2f2;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.voice {
  margin-bottom: 24px;
}

.voice-text {
  margin-top: 8px;
  font-size: 1.1em;
}
</style>
