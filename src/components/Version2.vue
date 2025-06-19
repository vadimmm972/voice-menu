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
      <div v-if="saveMsg" class="voice-message">
        {{ saveMsg }}
      </div>
      <div v-if="candidates.length" class="voice-candidates">
        <strong>Variants:</strong>
        <ol>
          <li v-for="(c, i) in candidates" :key="c.id">{{ i + 1 }}. {{ c.name }}</li>
        </ol>
      </div>
    </div>

    <div class="menu">
      <div v-for="category in menu" :key="category.id" class="category">
        <h2 :class="{ selected: selectedCategory && selectedCategory.id === category.id }">{{ category.name }}</h2>
        <div v-if="selectedCategory && selectedCategory.id === category.id">
          <div v-for="subcategory in category.subcategories" :key="subcategory.id" class="subcategory">
            <h3 :class="{ selected: selectedSubcategory && selectedSubcategory.id === subcategory.id }">
              {{ subcategory.name }}
            </h3>
            <div v-if="selectedSubcategory && selectedSubcategory.id === subcategory.id">
              <ul>
                <li v-for="dish in subcategory.dishes" :key="dish.id" :class="{ selected: selectedDish && selectedDish.id === dish.id }">
                  {{ dish.name }} – {{ dish.price }} $
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDish" class="dish-details">
      <h3>Selected dish: {{ selectedDish.name }}</h3>
      <p>Price: {{ selectedDish.price }} $</p>
      <input v-model="editName" placeholder="New dish name" />
      <input v-model.number="editPrice" placeholder="New price" type="number" min="0" />
      <button @click="saveDish">Save</button>
      <p v-if="saveMsg" style="color: green">{{ saveMsg }}</p>
    </div>
  </div>
</template>

<script>
import menuData from '../menuData.js';
import { handleVoiceCommand } from '../utils/voiceMenuLogic.js';

export default {
  name: "VoiceMenuV2",
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
      keepListening: false,
      // Voice state:
      currentLevel: 'category',
      candidates: [],
      pendingAction: null,
      tempSelection: null
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
          }, 250);
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
    saveDish() {
      if (this.editName && this.editPrice >= 0) {
        this.selectedDish.name = this.editName;
        this.selectedDish.price = this.editPrice;
        this.saveMsg = 'Saved!';
      }
    },

    getCategories() { return this.menu; },
    getSubcategories() { return this.selectedCategory ? this.selectedCategory.subcategories : []; },
    getDishes() { return this.selectedSubcategory ? this.selectedSubcategory.dishes : []; },
    selectCategory(category) {
      this.selectedCategory = category;
      this.selectedSubcategory = null;
      this.selectedDish = null;
      this.currentLevel = 'subcategory';
    },
    selectSubcategory(subcategory) {
      this.selectedSubcategory = subcategory;
      this.selectedDish = null;
      this.currentLevel = 'dish';
    },
    selectDish(dish) {
      this.selectedDish = dish;
      this.currentLevel = 'action';
    },
    updateCategoryName(newName) {
      if (this.selectedCategory) this.selectedCategory.name = newName;
    },
    updateSubcategoryName(newName) {
      if (this.selectedSubcategory) this.selectedSubcategory.name = newName;
    },
    updateDishName(newName) {
      if (this.selectedDish) {
        this.selectedDish.name = newName;
        this.editName = newName;
      }
    },
    updateDishPrice(newPrice) {
      if (this.selectedDish) {
        this.selectedDish.price = newPrice;
        this.editPrice = newPrice;
      }
    },
 
    processVoiceCommand(text) {
      const state = {
        currentLevel: this.currentLevel,
        selectedCategory: this.selectedCategory,
        selectedSubcategory: this.selectedSubcategory,
        selectedDish: this.selectedDish,
        candidates: this.candidates,
        pendingAction: this.pendingAction,
        tempSelection: this.tempSelection
      };
        const api = {
            getCategories: this.getCategories,
            getSubcategories: this.getSubcategories,
            getDishes: this.getDishes,
            selectCategory: this.selectCategory,
            selectSubcategory: this.selectSubcategory,
            selectDish: this.selectDish,
            updateCategoryName: this.updateCategoryName,
            updateSubcategoryName: this.updateSubcategoryName,
            updateDishName: this.updateDishName,
            updateDishPrice: this.updateDishPrice,
            saveDish: this.saveDish,
            saveSubcategory: this.saveSubcategory,
            saveCategory: this.saveCategory
        };
      const { newState, message } = handleVoiceCommand(text, state, api);

      this.currentLevel = newState.currentLevel ?? this.currentLevel;
      this.candidates = newState.candidates ?? [];
      this.pendingAction = newState.pendingAction ?? null;
      this.tempSelection = newState.tempSelection ?? null;
      this.saveMsg = message;
    }
  }
};
</script>
<style>
.app {
  max-width: 700px;
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

.category .selected,
.subcategory .selected,
li.selected {
  font-weight: bold;
  color: #d35400;
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

.voice-candidates {
  margin-top: 10px;
}

.voice-message {
  margin-top: 8px;
  color: #0a0;
  font-weight: 500;
}
</style>
