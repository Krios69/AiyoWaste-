<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Add Food Item</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <form @submit.prevent="submitForm" class="food-form">
        <!-- 物品名称 -->
        <div class="form-group">
          <label for="name" class="required">Food Item Name</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            class="form-input"
            placeholder="e.g., Apples, Canned Tomatoes"
            required
          />
          <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
        </div>

        <!-- 数量 -->
        <div class="form-group">
          <label for="quantity" class="required">Quantity</label>
          <input 
            id="quantity"
            v-model="form.quantity" 
            type="text" 
            class="form-input"
            placeholder="e.g., 5 pieces, 2 cans, 1 kg"
            required
          />
          <div v-if="errors.quantity" class="error-message">{{ errors.quantity }}</div>
        </div>

        <!-- 到期日期 -->
        <div class="form-group">
          <label for="expiryDate" class="required">Expiry Date</label>
          <input 
            id="expiryDate"
            v-model="form.expiryDate" 
            type="date" 
            class="form-input"
            :min="today"
            required
          />
          <div v-if="errors.expiryDate" class="error-message">{{ errors.expiryDate }}</div>
        </div>

        <!-- 类别 -->
        <div class="form-group">
          <label for="category" class="required">Category</label>
          <select 
            id="category"
            v-model="form.category" 
            class="form-select"
            required
          >
            <option value="">Select category</option>
            <option value="Fresh Produce">Fresh Produce</option>
            <option value="Dairy">Dairy</option>
            <option value="Meat & Poultry">Meat & Poultry</option>
            <option value="Seafood">Seafood</option>
            <option value="Canned Goods">Canned Goods</option>
            <option value="Frozen Foods">Frozen Foods</option>
            <option value="Bakery">Bakery</option>
            <option value="Pantry Staples">Pantry Staples</option>
            <option value="Beverages">Beverages</option>
            <option value="Snacks">Snacks</option>
            <option value="Other">Other</option>
          </select>
          <div v-if="errors.category" class="error-message">{{ errors.category }}</div>
        </div>

        <!-- 自定义类别 -->
        <div v-if="form.category === 'Other'" class="form-group">
          <label for="customCategory">Custom Category</label>
          <input 
            id="customCategory"
            v-model="form.customCategory" 
            type="text" 
            class="form-input"
            placeholder="Enter custom category"
          />
        </div>

        <!-- 储存位置 -->
        <div class="form-group">
          <label for="location">Storage Location (Optional)</label>
          <select 
            id="location"
            v-model="form.location" 
            class="form-select"
          >
            <option value="">Select location</option>
            <option value="Refrigerator">Refrigerator</option>
            <option value="Freezer">Freezer</option>
            <option value="Pantry">Pantry</option>
            <option value="Kitchen Cabinet">Kitchen Cabinet</option>
            <option value="Countertop">Countertop</option>
            <option value="Basement">Basement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- 自定义位置 -->
        <div v-if="form.location === 'Other'" class="form-group">
          <label for="customLocation">Custom Location</label>
          <input 
            id="customLocation"
            v-model="form.customLocation" 
            type="text" 
            class="form-input"
            placeholder="Enter custom location"
          />
        </div>

        <!-- 备注 -->
        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea 
            id="notes"
            v-model="form.notes" 
            class="form-textarea"
            placeholder="Any additional notes about this food item..."
            rows="3"
          ></textarea>
        </div>

        <!-- 表单按钮 -->
        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn-cancel">
            Cancel
          </button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Adding...' : 'Add Food Item' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddFoodModal',
  data() {
    return {
      form: {
        name: '',
        quantity: '',
        expiryDate: '',
        category: '',
        customCategory: '',
        location: '',
        customLocation: '',
        notes: ''
      },
      errors: {},
      isSubmitting: false
    }
  },
  computed: {
    today() {
      return new Date().toISOString().split('T')[0]
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    validateForm() {
      this.errors = {}
      
      if (!this.form.name.trim()) {
        this.errors.name = 'Food item name is required'
      }
      
      if (!this.form.quantity.trim()) {
        this.errors.quantity = 'Quantity is required'
      }
      
      if (!this.form.expiryDate) {
        this.errors.expiryDate = 'Expiry date is required'
      } else {
        const expiryDate = new Date(this.form.expiryDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (expiryDate < today) {
          this.errors.expiryDate = 'Expiry date cannot be in the past'
        }
      }
      
      if (!this.form.category) {
        this.errors.category = 'Category is required'
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    async submitForm() {
      if (!this.validateForm()) {
        return
      }
      
      this.isSubmitting = true
      
      try {
        // 准备提交数据
        const submitData = {
          name: this.form.name.trim(),
          quantity: this.form.quantity.trim(),
          expiryDate: this.form.expiryDate,
          category: this.form.category === 'Other' ? this.form.customCategory : this.form.category,
          location: this.form.location === 'Other' ? this.form.customLocation : this.form.location,
          notes: this.form.notes.trim()
        }
        
        const response = await fetch('http://localhost:3001/api/food-inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Food item added successfully!')
          this.$emit('food-added')
        } else {
          alert('Failed to add food item: ' + result.message)
        }
      } catch (error) {
        console.error('Error adding food item:', error)
        alert('Failed to add food item. Please try again.')
      } finally {
        this.isSubmitting = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.food-form {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group label.required::after {
  content: ' *';
  color: #e74c3c;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #B6CBB3;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn-cancel, .btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background-color: #f8f9fa;
  color: #666;
  border: 2px solid #e1e1e1;
}

.btn-cancel:hover {
  background-color: #e9ecef;
}

.btn-submit {
  background-color: #B6CBB3;
  color: #333;
}

.btn-submit:hover:not(:disabled) {
  background-color: #a5b8a2;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .modal-header, .food-form {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-submit {
    width: 100%;
  }
}
</style>
