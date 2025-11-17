<template>
  <div class="meal-plan-page">
    <div class="page-header">
      <h1>Weekly Meal Planner</h1>
      <p class="subtitle">
        Plan meals using ingredients you already have to reduce waste and stay organized.
      </p>
    </div>

    <div class="planner-controls">
      <button class="week-nav-btn" @click="changeWeek(-1)" :disabled="isLoading">
        ‹ Previous Week
      </button>
      <div class="week-label">
        {{ weekRangeLabel }}
      </div>
      <button class="week-nav-btn" @click="changeWeek(1)" :disabled="isLoading">
        Next Week ›
      </button>
    </div>

    <div v-if="loadError" class="status-message error">
      {{ loadError }}
    </div>

    <div v-else class="planner-content">
      <div class="planner-grid">
        <div class="planner-header">
          <div class="header-cell sticky">
            Day / Meal
          </div>
          <div
            v-for="slot in mealSlots"
            :key="slot"
            class="header-cell"
          >
            {{ formatMealSlot(slot) }}
          </div>
        </div>

        <div
          v-for="day in weekDays"
          :key="day.key"
          class="planner-row"
        >
          <div class="day-cell sticky">
            <div class="day-name">{{ day.label }}</div>
            <div class="day-date">{{ formatDayDate(day.dateISO) }}</div>
          </div>

          <div
            v-for="slot in mealSlots"
            :key="`${day.key}-${slot}`"
            class="meal-cell"
          >
            <div class="meal-select-group">
              <select
                class="meal-select"
                :value="getMealSelectionValue(day.key, slot)"
                @change="onMealSelect(day.key, slot, $event.target.value)"
                :disabled="isLoading"
              >
                <option value="empty">Not planned</option>
                <option value="custom">Custom meal…</option>
                <optgroup
                  label="Inventory items"
                  v-if="inventoryItems.length > 0"
                >
                  <option
                    v-for="item in inventoryItems"
                    :key="item._id"
                    :value="`inventory:${item._id}`"
                  >
                    {{ item.name }} ({{ item.quantity }} in stock)
                  </option>
                </optgroup>
              </select>

              <div
                v-if="isCustomMeal(day.key, slot)"
                class="custom-input"
              >
                <input
                  type="text"
                  class="custom-meal-field"
                  placeholder="Custom meal name"
                  :value="getCustomMealName(day.key, slot)"
                  @input="onCustomNameChange(day.key, slot, $event.target.value)"
                  :disabled="isLoading"
                />
              </div>

              <div
                v-if="isInventoryMeal(day.key, slot)"
                class="quantity-group"
              >
                <label>Servings:</label>
                <input
                  type="number"
                  min="1"
                  class="quantity-input"
                  :value="getMealQuantity(day.key, slot)"
                  @input="onQuantityChange(day.key, slot, $event.target.value)"
                  :disabled="isLoading"
                />
              </div>
            </div>
            <div
              v-if="isInventoryMeal(day.key, slot)"
              class="inventory-meta"
            >
              <div class="meta-name">
                {{ getInventoryItemName(day.key, slot) }}
              </div>
              <div class="meta-expiry">
                {{ getInventoryExpiryLabel(day.key, slot) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="inventory-sidebar">
        <h2>Available Ingredients</h2>
        <p class="sidebar-subtitle">
          Focus on items nearing expiry to keep your pantry fresh.
        </p>
        <div v-if="inventoryItems.length === 0" class="status-message">
          No items in inventory yet.
        </div>
        <ul v-else class="inventory-list">
          <li
            v-for="item in sortedInventoryItems"
            :key="item._id"
            class="inventory-item"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">
              <span>Qty: {{ item.quantity }}</span>
              <span>Expiry: {{ formatInventoryExpiry(item.expiryDate) }}</span>
            </div>
            <div
              v-if="item.reservedForMealPlan"
              class="item-reserved"
            >
              Reserved for meals: {{ item.reservedForMealPlan }}
            </div>
          </li>
        </ul>
      </aside>
    </div>

    <section class="suggestions-panel">
      <div class="suggestions-header">
        <div>
          <h2>AI Recipe Suggestions</h2>
          <p class="suggestions-subtitle">
            Generate meal ideas tailored to your inventory. Suggestions prioritize ingredients nearing expiry.
          </p>
          <div v-if="usedIngredientsForSuggestions.length > 0" class="ingredients-chip-list">
            <span class="chip-label">Using:</span>
            <span
              v-for="item in usedIngredientsForSuggestions"
              :key="item.id"
              class="ingredient-chip"
            >
              {{ item.name }}
              <span class="chip-meta" v-if="item.daysUntilExpiry !== null">
                ({{ item.daysUntilExpiry < 0 ? 'expired' : 'in ' + item.daysUntilExpiry + ' days' }})
              </span>
            </span>
          </div>
        </div>
        <button
          class="suggest-btn"
          type="button"
          @click="fetchAiSuggestions"
          :disabled="isLoadingSuggestions || isLoading"
        >
          {{ isLoadingSuggestions ? 'Generating recipes…' : 'Suggest recipes with AI' }}
        </button>
      </div>

      <div v-if="suggestionError" class="status-message error">
        {{ suggestionError }}
      </div>

      <div
        v-else-if="aiSuggestions.length === 0"
        class="status-message"
      >
        Click “Suggest recipes with AI” to get ideas based on your pantry.
      </div>

      <div v-else class="suggestion-list">
        <div
          v-for="(recipe, index) in aiSuggestions"
          :key="`${recipe.title}-${index}`"
          class="suggestion-card"
        >
          <div class="suggestion-card-body">
            <div class="suggestion-card-header">
              <h3>{{ recipe.title }}</h3>
              <span
                class="source-badge"
                :class="suggestionSource === 'ai' ? 'badge-ai' : 'badge-fallback'"
              >
                {{ suggestionSource === 'ai' ? 'Gemini AI' : 'Fallback idea' }}
              </span>
            </div>
            <p class="suggestion-description">
              {{ recipe.description }}
            </p>
            <div class="suggestion-section">
              <h4>Key ingredients</h4>
              <p>{{ formatFocusItems(recipe.focusItems) }}</p>
            </div>
            <div class="suggestion-section">
              <h4>Ingredients list</h4>
              <ul>
                <li v-for="(ingredient, idx) in recipe.ingredients" :key="idx">
                  {{ ingredient }}
                </li>
              </ul>
            </div>
            <div class="suggestion-section">
              <h4>Steps</h4>
              <ol>
                <li v-for="(step, stepIdx) in recipe.steps" :key="stepIdx">
                  {{ step }}
                </li>
              </ol>
            </div>
            <div
              v-if="recipe.tips"
              class="suggestion-section tips"
            >
              <h4>Tips</h4>
              <p>{{ recipe.tips }}</p>
            </div>
          </div>
          <div class="suggestion-actions">
            <div class="apply-select">
              <label>
                Day
                <select
                  :value="suggestionAssignments[index]?.day || ''"
                  @change="updateSuggestionAssignment(index, 'day', $event.target.value)"
                >
                  <option value="">Select day</option>
                  <option
                    v-for="day in weekDays"
                    :key="day.key"
                    :value="day.key"
                  >
                    {{ day.label }}
                  </option>
                </select>
              </label>
              <label>
                Meal
                <select
                  :value="suggestionAssignments[index]?.slot || ''"
                  @change="updateSuggestionAssignment(index, 'slot', $event.target.value)"
                >
                  <option value="">Select meal</option>
                  <option
                    v-for="slot in mealSlots"
                    :key="slot"
                    :value="slot"
                  >
                    {{ formatMealSlot(slot) }}
                  </option>
                </select>
              </label>
            </div>
            <button
              class="apply-btn"
              type="button"
              @click="applySuggestion(index)"
              :disabled="isLoading || isSaving"
            >
              Apply to planner
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="planner-footer">
      <button
        class="save-btn"
        @click="saveCurrentPlan"
        :disabled="isSaving || isLoading"
      >
        {{ isSaving ? 'Saving plan…' : 'Save Weekly Plan' }}
      </button>
      <span v-if="saveMessage" class="status-message success">
        {{ saveMessage }}
      </span>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { user } from '../store/auth.js'
import { fetchMealPlan, saveMealPlan } from '../services/mealPlanService.js'

export default {
  name: 'PlanMealsPage',
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      mealSlots: ['breakfast', 'lunch', 'dinner', 'snacks'],
      weekStartDate: '',
      mealPlan: {},
      inventoryItems: [],
      isLoading: false,
      isSaving: false,
      loadError: '',
      saveMessage: '',
      aiSuggestions: [],
      isLoadingSuggestions: false,
      suggestionError: '',
      suggestionSource: '',
      suggestionAssignments: [],
      usedIngredientsForSuggestions: []
    }
  },
  computed: {
    weekDays() {
      if (!this.weekStartDate) return []
      const start = new Date(this.weekStartDate)
      const days = []
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        const dateISO = date.toISOString().split('T')[0]
        days.push({
          key: dateISO,
          label: date.toLocaleDateString(undefined, { weekday: 'long' }),
          dateISO
        })
      }
      return days
    },
    weekRangeLabel() {
      if (this.weekDays.length === 0) return ''
      const first = new Date(this.weekDays[0].dateISO)
      const last = new Date(this.weekDays[this.weekDays.length - 1].dateISO)
      const options = { month: 'short', day: 'numeric' }
      return `${first.toLocaleDateString(undefined, options)} – ${last.toLocaleDateString(undefined, options)}`
    },
    sortedInventoryItems() {
      return [...this.inventoryItems].sort((a, b) => {
        const dateA = new Date(a.expiryDate || 0).getTime()
        const dateB = new Date(b.expiryDate || 0).getTime()
        return dateA - dateB
      })
    }
  },
  watch: {
    weekDays() {
      if (this.suggestionAssignments.length === 0) {
        return
      }
      this.suggestionAssignments = this.suggestionAssignments.map(assignment => {
        const dayValid = this.weekDays.some(day => day.key === assignment.day)
        const slotValid = this.mealSlots.includes(assignment.slot)
        return {
          day: dayValid ? assignment.day : '',
          slot: slotValid ? assignment.slot : ''
        }
      })
    }
  },
  mounted() {
    this.initializeWeek()
    this.loadInitialData()
  },
  methods: {
    initializeWeek() {
      const today = new Date()
      const day = today.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(today)
      monday.setDate(today.getDate() + diff)
      monday.setHours(0, 0, 0, 0)
      this.weekStartDate = monday.toISOString().split('T')[0]
      this.mealPlan = this.createEmptyPlan()
    },
    createEmptyPlan() {
      const plan = {}
      this.weekDays.forEach(day => {
        plan[day.key] = {
          date: day.dateISO,
          meals: {}
        }
        this.mealSlots.forEach(slot => {
          plan[day.key].meals[slot] = { type: 'empty' }
        })
      })
      return plan
    },
    async loadInitialData() {
      if (!this.auth || !user.value) {
        alert('Please login to access the meal planner')
        this.$router.push('/login')
        return
      }

      this.isLoading = true
      this.loadError = ''

      try {
        const [inventoryResponse, mealPlanResponse] = await Promise.all([
          this.fetchInventory(),
          fetchMealPlan(this.weekStartDate, user.value.id)
        ])

        this.inventoryItems = this.filterFreshInventory(inventoryResponse)
        this.applyPlan(mealPlanResponse?.mealPlan?.plan)
        this.fetchAiSuggestions()
      } catch (error) {
        console.error('Failed to load meal planner data:', error)
        this.loadError = error.message || 'Failed to load meal planner data.'
      } finally {
        this.isLoading = false
      }
    },
    async fetchInventory() {
      const response = await fetch('http://localhost:3001/api/food-inventory', {
        headers: {
          'x-user-id': user.value.id
        }
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Unable to load inventory.')
      }
      return result.items || []
    },
    isExpired(dateString) {
      if (!dateString) return false
      const expiry = new Date(dateString)
      if (Number.isNaN(expiry.getTime())) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return expiry < today
    },
    filterFreshInventory(items = []) {
      return items.filter(item => !this.isExpired(item.expiryDate))
    },
    applyPlan(planData) {
      const basePlan = this.createEmptyPlan()
      if (planData && typeof planData === 'object') {
        Object.entries(planData).forEach(([dayKey, dayValue]) => {
          if (!basePlan[dayKey]) return
          basePlan[dayKey].date = dayValue.date || basePlan[dayKey].date
          const meals = dayValue.meals || {}
          this.mealSlots.forEach(slot => {
            if (meals[slot]) {
              basePlan[dayKey].meals[slot] = { ...meals[slot] }
            }
          })
        })
      }
      this.mealPlan = basePlan
    },
    changeWeek(offset) {
      if (!this.weekStartDate) return
      const start = new Date(this.weekStartDate)
      start.setDate(start.getDate() + offset * 7)
      this.weekStartDate = start.toISOString().split('T')[0]
      this.mealPlan = this.createEmptyPlan()
      this.reloadPlanForWeek()
    },
    async reloadPlanForWeek() {
      if (!user.value?.id) return
      this.isLoading = true
      this.saveMessage = ''

      try {
        const mealPlanResponse = await fetchMealPlan(this.weekStartDate, user.value.id)
        this.applyPlan(mealPlanResponse?.mealPlan?.plan)
      } catch (error) {
        console.error('Failed to load meal plan:', error)
        this.loadError = error.message || 'Failed to load meal plan.'
      } finally {
        this.isLoading = false
      }
    },
    formatMealSlot(slot) {
      return slot.charAt(0).toUpperCase() + slot.slice(1)
    },
    formatDayDate(dateISO) {
      const date = new Date(dateISO)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    },
    getMealSelectionValue(dayKey, slot) {
      const meal = this.mealPlan?.[dayKey]?.meals?.[slot]
      if (!meal || meal.type === 'empty') return 'empty'
      if (meal.type === 'inventory') return `inventory:${meal.itemId}`
      if (meal.type === 'custom') return 'custom'
      return 'empty'
    },
    getMeal(dayKey, slot) {
      return this.mealPlan?.[dayKey]?.meals?.[slot]
    },
    setMeal(dayKey, slot, meal) {
      const currentDay = this.mealPlan?.[dayKey] || { date: dayKey, meals: {} }
      const updatedDay = {
        ...currentDay,
        meals: {
          ...currentDay.meals,
          [slot]: meal
        }
      }
      this.mealPlan = {
        ...this.mealPlan,
        [dayKey]: updatedDay
      }
    },
    onMealSelect(dayKey, slot, value) {
      if (value === 'empty') {
        this.setMeal(dayKey, slot, { type: 'empty' })
        return
      }

      if (value === 'custom') {
        this.setMeal(dayKey, slot, { type: 'custom', customName: '' })
        return
      }

      if (value.startsWith('inventory:')) {
        const itemId = value.split(':')[1]
        const item = this.inventoryItems.find(entry => entry._id === itemId)
        this.setMeal(dayKey, slot, {
          type: 'inventory',
          itemId,
          itemName: item?.name || '',
          quantity: 1
        })
      }
    },
    onCustomNameChange(dayKey, slot, newValue) {
      const meal = this.getMeal(dayKey, slot) || { type: 'custom', customName: '' }
      this.setMeal(dayKey, slot, {
        type: 'custom',
        customName: newValue
      })
    },
    onQuantityChange(dayKey, slot, rawValue) {
      const existingMeal = this.getMeal(dayKey, slot)
      if (!existingMeal || existingMeal.type !== 'inventory') return
      const value = Number(rawValue)
      this.setMeal(dayKey, slot, {
        ...existingMeal,
        quantity: Number.isNaN(value) || value <= 0 ? 1 : value
      })
    },
    getMealQuantity(dayKey, slot) {
      const meal = this.getMeal(dayKey, slot)
      if (!meal || meal.type !== 'inventory') return 1
      return meal.quantity || 1
    },
    isInventoryMeal(dayKey, slot) {
      return this.getMeal(dayKey, slot)?.type === 'inventory'
    },
    isCustomMeal(dayKey, slot) {
      return this.getMeal(dayKey, slot)?.type === 'custom'
    },
    getCustomMealName(dayKey, slot) {
      const meal = this.getMeal(dayKey, slot)
      return meal?.customName || ''
    },
    getInventoryItemName(dayKey, slot) {
      const meal = this.getMeal(dayKey, slot)
      if (!meal || meal.type !== 'inventory') return ''
      return meal.itemName || ''
    },
    getInventoryExpiryLabel(dayKey, slot) {
      const meal = this.getMeal(dayKey, slot)
      if (!meal || meal.type !== 'inventory' || !meal.itemId) return ''
      const item = this.inventoryItems.find(entry => entry._id === meal.itemId)
      if (!item) return ''
      return `Expires ${this.formatInventoryExpiry(item.expiryDate)}`
    },
    formatInventoryExpiry(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    },
    async saveCurrentPlan() {
      if (!user.value?.id) {
        alert('Please login to save your meal plan')
        return
      }

      this.isSaving = true
      this.saveMessage = ''

      try {
        await saveMealPlan({
          weekStartDate: this.weekStartDate,
          plan: this.mealPlan
        }, user.value.id)
        this.saveMessage = 'Meal plan saved successfully!'
      } catch (error) {
        console.error('Failed to save meal plan:', error)
        this.loadError = error.message || 'Failed to save meal plan.'
      } finally {
        this.isSaving = false
        if (this.saveMessage) {
          setTimeout(() => {
            this.saveMessage = ''
          }, 4000)
        }
      }
    },
    resetSuggestionAssignments() {
      this.suggestionAssignments = this.aiSuggestions.map(() => ({
        day: '',
        slot: ''
      }))
    },
    async fetchAiSuggestions() {
      if (!user.value?.id) {
        alert('Please login to get AI suggestions')
        return
      }

      this.isLoadingSuggestions = true
      this.suggestionError = ''
      this.suggestionSource = ''

      try {
        const response = await fetch('http://localhost:3001/api/meal-plans/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.value.id
          },
          body: JSON.stringify({
            focusExpiringOnly: true
          })
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to generate recipe suggestions.')
        }
        this.aiSuggestions = Array.isArray(result.suggestions) ? result.suggestions : []
        this.usedIngredientsForSuggestions = Array.isArray(result.usedIngredients) ? result.usedIngredients : []
        this.suggestionSource = result.source || 'ai'
        this.resetSuggestionAssignments()
        if (this.aiSuggestions.length === 0) {
          this.suggestionError = result.message || 'No fresh ingredients available for recipe suggestions.'
        }
      } catch (error) {
        console.error('Failed to get AI suggestions:', error)
        this.suggestionError = error.message || 'Failed to load recipe suggestions.'
        this.aiSuggestions = []
      } finally {
        this.isLoadingSuggestions = false
      }
    },
    updateSuggestionAssignment(index, field, value) {
      const assignments = this.suggestionAssignments.slice()
      const existing = assignments[index] ? { ...assignments[index] } : { day: '', slot: '' }
      existing[field] = value
      assignments[index] = existing
      this.suggestionAssignments = assignments
    },
    applySuggestion(index) {
      const suggestion = this.aiSuggestions[index]
      const assignment = this.suggestionAssignments[index]

      if (!suggestion) {
        return
      }

      if (!assignment || !assignment.day || !assignment.slot) {
        alert('Please select a day and meal slot before applying the recipe.')
        return
      }

      const focusItems = (suggestion.focusItems || []).map(item => item.toLowerCase())
      const matchedInventory = this.inventoryItems.find(item =>
        focusItems.some(focus => item.name.toLowerCase().includes(focus))
      )

      if (matchedInventory) {
        this.setMeal(assignment.day, assignment.slot, {
          type: 'inventory',
          itemId: matchedInventory._id,
          itemName: matchedInventory.name,
          quantity: 1
        })
      } else {
        this.setMeal(assignment.day, assignment.slot, {
          type: 'custom',
          customName: suggestion.title
        })
      }

      this.saveMessage = ''
      const dayLabel = this.weekDays.find(day => day.key === assignment.day)?.label || this.formatDayDate(assignment.day)
      alert(`Applied "${suggestion.title}" to ${this.formatMealSlot(assignment.slot)} on ${dayLabel}`)
    },
    formatFocusItems(focusItems) {
      if (!focusItems || focusItems.length === 0) return 'Uses flexible ingredients'
      return `Highlights: ${focusItems.join(', ')}`
    }
  }
}
</script>

<style scoped>
.meal-plan-page {
  min-height: 100vh;
  padding: 40px;
  background: linear-gradient(135deg, #eef6ed 0%, #f9fdf8 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #2f3e2c;
}

.page-header {
  max-width: 960px;
  margin: 0 auto 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 2.4rem;
  margin-bottom: 10px;
  color: #284a2a;
}

.subtitle {
  font-size: 1.05rem;
  color: #4c5d4b;
  margin: 0;
}

.planner-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-bottom: 25px;
}

.week-nav-btn {
  background: linear-gradient(135deg, #86b080, #6ea56d);
  border: none;
  color: white;
  padding: 10px 18px;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(110, 165, 109, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.week-nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(110, 165, 109, 0.3);
}

.week-nav-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.week-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #375338;
}

.planner-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 30px;
  align-items: start;
}

.planner-grid {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(46, 77, 46, 0.12);
  overflow: hidden;
}

.planner-header,
.planner-row {
  display: grid;
  grid-template-columns: 180px repeat(4, minmax(0, 1fr));
}

.header-cell {
  padding: 16px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #375338;
  background: #f2f8ef;
  border-bottom: 1px solid #e1eddd;
}

.planner-row:nth-child(odd) .meal-cell {
  background: #fbfdf9;
}

.planner-row:nth-child(even) .meal-cell {
  background: #f5fbf2;
}

.day-cell {
  padding: 18px 16px;
  background: linear-gradient(135deg, #f2f8ef, #e7f2e2);
  border-right: 1px solid #e1eddd;
  border-bottom: 1px solid #e1eddd;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-name {
  font-size: 1rem;
  font-weight: 600;
}

.day-date {
  font-size: 0.9rem;
  color: #5b6d5b;
}

.meal-cell {
  padding: 16px;
  border-bottom: 1px solid #e6f0e3;
  border-right: 1px solid #e6f0e3;
}

.planner-row .meal-cell:last-child {
  border-right: none;
}

.meal-select-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meal-select {
  appearance: none;
  border: 1px solid #c6d8c3;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 0.95rem;
  background: white;
  color: #2f3e2c;
  box-shadow: 0 4px 10px rgba(46, 77, 46, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.meal-select:hover,
.meal-select:focus {
  border-color: #6ea56d;
  box-shadow: 0 6px 16px rgba(46, 77, 46, 0.12);
}

.custom-input,
.quantity-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.custom-meal-field {
  flex: 1;
  border: 1px solid #c6d8c3;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.95rem;
}

.quantity-input {
  width: 70px;
  border: 1px solid #c6d8c3;
  border-radius: 10px;
  padding: 6px;
  font-size: 0.9rem;
}

.inventory-meta {
  margin-top: 8px;
  background: rgba(110, 165, 109, 0.1);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.85rem;
  color: #3f5a3f;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-name {
  font-weight: 600;
}

.meta-expiry {
  font-size: 0.8rem;
  color: #547454;
}

.inventory-sidebar {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 18px 36px rgba(46, 77, 46, 0.1);
  position: sticky;
  top: 140px;
}

.inventory-sidebar h2 {
  margin: 0 0 10px;
  font-size: 1.4rem;
  color: #284a2a;
}

.sidebar-subtitle {
  font-size: 0.9rem;
  color: #5b6d5b;
  margin-bottom: 18px;
}

.inventory-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inventory-item {
  padding: 14px;
  border: 1px solid #e1eddd;
  border-radius: 14px;
  background: #f7fbf6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  font-weight: 600;
  color: #2f3e2c;
}

.item-meta {
  font-size: 0.85rem;
  color: #4c5d4b;
  display: flex;
  justify-content: space-between;
}

.item-reserved {
  font-size: 0.8rem;
  color: #6c8f6f;
}

.suggestions-panel {
  margin-top: 40px;
  background: white;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 22px 44px rgba(46, 77, 46, 0.15);
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.suggestions-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #284a2a;
}

.suggestions-subtitle {
  margin: 6px 0 12px;
  font-size: 0.95rem;
  color: #5b6d5b;
  max-width: 540px;
}

.ingredients-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.chip-label {
  font-weight: 600;
  color: #2f3e2c;
}

.ingredient-chip {
  background: rgba(110, 165, 109, 0.14);
  color: #2f3e2c;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip-meta {
  color: #547454;
  font-size: 0.8rem;
}

.suggest-btn {
  background: linear-gradient(135deg, #4c8cff, #3a72d6);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 26px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(76, 140, 255, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.suggest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(76, 140, 255, 0.3);
}

.suggest-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.suggestion-list {
  margin-top: 24px;
  display: grid;
  gap: 20px;
}

.suggestion-card {
  border: 1px solid #e3f0e0;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fdfefb;
}

.suggestion-card-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.suggestion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.suggestion-card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2f3e2c;
}

.source-badge {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-ai {
  background: rgba(76, 140, 255, 0.15);
  color: #2f60d6;
}

.badge-fallback {
  background: rgba(255, 198, 109, 0.2);
  color: #c26a00;
}

.suggestion-description {
  margin: 0;
  font-size: 0.95rem;
  color: #4c5d4b;
}

.suggestion-section h4 {
  margin: 0 0 6px;
  font-size: 0.95rem;
  color: #375338;
}

.suggestion-section ul,
.suggestion-section ol {
  margin: 0;
  padding-left: 18px;
  color: #4c5d4b;
  font-size: 0.9rem;
}

.suggestion-section.tips {
  background: rgba(255, 198, 109, 0.12);
  border-radius: 14px;
  padding: 12px 14px;
}

.suggestion-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 22px 20px;
  border-top: 1px solid #e3f0e0;
  background: #f6fbf4;
  flex-wrap: wrap;
}

.apply-select {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.apply-select label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  color: #375338;
  gap: 4px;
}

.apply-select select {
  border: 1px solid #c6d8c3;
  border-radius: 10px;
  padding: 6px 10px;
  background: white;
  font-size: 0.9rem;
  min-width: 140px;
}

.apply-btn {
  background: linear-gradient(135deg, #8bc34a, #6fa73a);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(139, 195, 74, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(139, 195, 74, 0.3);
}

.apply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.planner-footer {
  margin-top: 30px;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.save-btn {
  background: linear-gradient(135deg, #ffb347, #ff8b3d);
  border: none;
  color: white;
  padding: 12px 26px;
  border-radius: 28px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(255, 161, 78, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(255, 161, 78, 0.35);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.status-message {
  font-size: 0.95rem;
  color: #4c5d4b;
}

.status-message.error {
  color: #c0392b;
  text-align: center;
  margin: 20px 0;
}

.status-message.success {
  color: #2f8f2f;
}

.sticky {
  position: sticky;
  left: 0;
  z-index: 2;
}

.planner-header .sticky {
  z-index: 3;
}

@media (max-width: 1200px) {
  .planner-content {
    grid-template-columns: 1fr;
  }

  .inventory-sidebar {
    position: static;
  }

  .suggestions-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .suggestions-header h2 {
    font-size: 1.4rem;
  }
}

@media (max-width: 992px) {
  .meal-plan-page {
    padding: 24px;
  }

  .planner-header,
  .planner-row {
    grid-template-columns: 140px repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .planner-header,
  .planner-row {
    grid-template-columns: 120px repeat(4, minmax(0, 1fr));
  }

  .meal-select {
    font-size: 0.85rem;
  }

  .custom-meal-field,
  .quantity-input {
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .planner-header,
  .planner-row {
    grid-template-columns: 1fr;
  }

  .planner-grid {
    overflow-x: auto;
  }

  .planner-header,
  .planner-row {
    min-width: 640px;
  }
}
</style>

