<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Create Donation Record</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- 选中的物品预览 -->
        <div class="selected-items-preview">
          <h3>Selected Items ({{ selectedItems.length }})</h3>
          <div class="items-list">
            <div v-for="item in selectedItems" :key="item._id" class="item-preview">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-quantity">{{ item.quantity }}</span>
              <span class="item-expiry" :class="getExpiryClass(item.expiryDate)">
                {{ formatDate(item.expiryDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 捐赠信息表单 -->
        <form @submit.prevent="submitForm" class="donation-form">
          <!-- 取货地点 -->
          <div class="form-group">
            <label for="pickupLocation" class="required">Pickup Location</label>
            <input 
              id="pickupLocation"
              v-model="form.pickupLocation" 
              type="text" 
              class="form-input"
              placeholder="e.g., 123 Main St, Apartment 4B"
              required
            />
            <div v-if="errors.pickupLocation" class="error-message">{{ errors.pickupLocation }}</div>
          </div>

          <!-- 取货时间 -->
          <div class="form-group">
            <label for="pickupDate" class="required">Pickup Date</label>
            <input 
              id="pickupDate"
              v-model="form.pickupDate" 
              type="date" 
              class="form-input"
              :min="today"
              required
            />
            <div v-if="errors.pickupDate" class="error-message">{{ errors.pickupDate }}</div>
          </div>

          <div class="form-group">
            <label for="pickupTime" class="required">Pickup Time</label>
            <input 
              id="pickupTime"
              v-model="form.pickupTime" 
              type="time" 
              class="form-input"
              required
            />
            <div v-if="errors.pickupTime" class="error-message">{{ errors.pickupTime }}</div>
          </div>

          <!-- 联系信息 -->
          <div class="form-group">
            <label for="contactName">Contact Name (Optional)</label>
            <input 
              id="contactName"
              v-model="form.contactName" 
              type="text" 
              class="form-input"
              placeholder="Your name for pickup coordination"
            />
          </div>

          <div class="form-group">
            <label for="contactPhone">Contact Phone (Optional)</label>
            <input 
              id="contactPhone"
              v-model="form.contactPhone" 
              type="tel" 
              class="form-input"
              placeholder="Phone number for pickup coordination"
            />
          </div>

          <!-- 特殊说明 -->
          <div class="form-group">
            <label for="notes">Additional Notes (Optional)</label>
            <textarea 
              id="notes"
              v-model="form.notes" 
              class="form-textarea"
              placeholder="Any special instructions, dietary information, or additional details..."
              rows="3"
            ></textarea>
          </div>

          <!-- 捐赠类型 -->
          <div class="form-group">
            <label for="donationType">Donation Type</label>
            <select 
              id="donationType"
              v-model="form.donationType" 
              class="form-select"
            >
              <option value="food-bank">Food Bank</option>
              <option value="community">Community Sharing</option>
              <option value="charity">Charity Organization</option>
              <option value="neighbor">Neighbor to Neighbor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- 优先级 -->
          <div class="form-group">
            <label for="priority">Priority Level</label>
            <select 
              id="priority"
              v-model="form.priority" 
              class="form-select"
            >
              <option value="normal">Normal</option>
              <option value="high">High (Expiring Soon)</option>
              <option value="urgent">Urgent (Expires Today/Tomorrow)</option>
            </select>
            <small class="form-help">Priority is automatically set based on expiry dates</small>
          </div>

          <!-- 表单按钮 -->
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Cancel
            </button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Donation Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateDonationModal',
  props: {
    selectedItems: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      form: {
        pickupLocation: '',
        pickupDate: '',
        pickupTime: '',
        contactName: '',
        contactPhone: '',
        notes: '',
        donationType: 'community',
        priority: 'normal'
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
  mounted() {
    this.setPriorityBasedOnItems()
  },
  methods: {
    setPriorityBasedOnItems() {
      const today = new Date()
      let hasUrgent = false
      let hasExpiringSoon = false

      for (const item of this.selectedItems) {
        const expiry = new Date(item.expiryDate)
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 1) {
          hasUrgent = true
          break
        } else if (daysUntilExpiry <= 3) {
          hasExpiringSoon = true
        }
      }

      if (hasUrgent) {
        this.form.priority = 'urgent'
      } else if (hasExpiringSoon) {
        this.form.priority = 'high'
      }
    },

    closeModal() {
      this.$emit('close')
    },
    
    validateForm() {
      this.errors = {}
      
      if (!this.form.pickupLocation.trim()) {
        this.errors.pickupLocation = 'Pickup location is required'
      }
      
      if (!this.form.pickupDate) {
        this.errors.pickupDate = 'Pickup date is required'
      } else {
        const pickupDate = new Date(this.form.pickupDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (pickupDate < today) {
          this.errors.pickupDate = 'Pickup date cannot be in the past'
        }
      }
      
      if (!this.form.pickupTime) {
        this.errors.pickupTime = 'Pickup time is required'
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    async submitForm() {
      if (!this.validateForm()) {
        return
      }
      
      this.isSubmitting = true
      
      try {
        // 组合日期和时间
        const pickupDateTime = new Date(`${this.form.pickupDate}T${this.form.pickupTime}`)
        
        // 准备提交数据
        const submitData = {
          items: this.selectedItems.map(item => ({
            foodItemId: item._id,
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            expiryDate: item.expiryDate
          })),
          pickupLocation: this.form.pickupLocation.trim(),
          pickupTime: pickupDateTime.toISOString(),
          contactName: this.form.contactName.trim(),
          contactPhone: this.form.contactPhone.trim(),
          notes: this.form.notes.trim(),
          donationType: this.form.donationType,
          priority: this.form.priority,
          status: 'active'
        }
        
        const response = await fetch('http://localhost:3001/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Donation record created successfully!')
          this.$emit('donation-created')
        } else {
          alert('Failed to create donation record: ' + result.message)
        }
      } catch (error) {
        console.error('Error creating donation record:', error)
        alert('Failed to create donation record. Please try again.')
      } finally {
        this.isSubmitting = false
      }
    },

    getExpiryClass(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) return 'expired'
      if (daysUntilExpiry <= 1) return 'urgent'
      if (daysUntilExpiry <= 3) return 'expiring'
      return 'fresh'
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
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
  max-width: 600px;
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

.modal-body {
  padding: 30px;
}

/* 选中物品预览 */
.selected-items-preview {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.selected-items-preview h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-preview {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  align-items: center;
}

.item-name {
  font-weight: 600;
  color: #333;
}

.item-quantity {
  color: #666;
  text-align: center;
}

.item-expiry {
  text-align: right;
  font-size: 0.9rem;
  font-weight: 600;
}

.item-expiry.fresh {
  color: #27ae60;
}

.item-expiry.expiring {
  color: #f39c12;
}

.item-expiry.urgent {
  color: #e74c3c;
}

.item-expiry.expired {
  color: #e74c3c;
}

/* 表单样式 */
.donation-form {
  display: flex;
  flex-direction: column;
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

.form-help {
  display: block;
  margin-top: 5px;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
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
  background-color: #e74c3c;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: #c0392b;
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
  
  .modal-header, .modal-body {
    padding: 20px;
  }
  
  .item-preview {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-submit {
    width: 100%;
  }
}
</style>
