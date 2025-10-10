<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Mark for Donation</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- 物品预览 -->
        <div class="item-preview">
          <div class="item-image">
            <img :src="getFoodImage(item.name)" :alt="item.name" />
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <p class="item-details">{{ item.quantity }} • Expires {{ formatDate(item.expiryDate) }}</p>
          </div>
        </div>

        <!-- 捐赠表单 -->
        <form @submit.prevent="submitForm" class="donation-form">
          <div class="form-section">
            <h4>Pickup Information</h4>
            
            <div class="form-group">
              <label for="pickupLocation" class="required">Pickup Location</label>
              <input 
                id="pickupLocation"
                v-model="form.pickupLocation" 
                type="text" 
                class="form-input"
                placeholder="e.g., 123 Main St, Apartment 4B, Lobby"
                required
              />
              <div v-if="errors.pickupLocation" class="error-message">{{ errors.pickupLocation }}</div>
            </div>

            <div class="form-group">
              <label for="availableTime" class="required">Available Time</label>
              <input 
                id="availableTime"
                v-model="form.availableTime" 
                type="text" 
                class="form-input"
                placeholder="e.g., Mon-Fri 9AM-6PM, Weekends 10AM-4PM"
                required
              />
              <div v-if="errors.availableTime" class="error-message">{{ errors.availableTime }}</div>
            </div>

            <div class="form-group">
              <label for="contactInfo" class="required">Contact Information</label>
              <input 
                id="contactInfo"
                v-model="form.contactInfo" 
                type="text" 
                class="form-input"
                placeholder="Phone number or email for coordination"
                required
              />
              <div v-if="errors.contactInfo" class="error-message">{{ errors.contactInfo }}</div>
            </div>
          </div>

          <div class="form-section">
            <h4>Additional Details</h4>
            
            <div class="form-group">
              <label for="specialInstructions">Special Instructions (Optional)</label>
              <textarea 
                id="specialInstructions"
                v-model="form.specialInstructions" 
                class="form-textarea"
                placeholder="Any special handling instructions, dietary notes, or pickup preferences..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="form.urgentDonation"
                  class="form-checkbox"
                />
                <span class="checkbox-text">This is an urgent donation (expires within 24 hours)</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="form.allowPartialPickup"
                  class="form-checkbox"
                />
                <span class="checkbox-text">Allow partial quantity pickup</span>
              </label>
            </div>
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
import { inject } from 'vue'
import { user } from '../store/auth.js'

export default {
  name: 'DonationFormModal',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      form: {
        pickupLocation: '',
        availableTime: '',
        contactInfo: '',
        specialInstructions: '',
        urgentDonation: false,
        allowPartialPickup: false
      },
      errors: {},
      isSubmitting: false
    }
  },
  mounted() {
    // 检查是否是紧急捐赠
    this.checkUrgentStatus()
  },
  methods: {
    checkUrgentStatus() {
      const today = new Date()
      const expiry = new Date(this.item.expiryDate)
      const hoursUntilExpiry = (expiry - today) / (1000 * 60 * 60)
      
      if (hoursUntilExpiry <= 24) {
        this.form.urgentDonation = true
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
      
      if (!this.form.availableTime.trim()) {
        this.errors.availableTime = 'Available time is required'
      }
      
      if (!this.form.contactInfo.trim()) {
        this.errors.contactInfo = 'Contact information is required'
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    async submitForm() {
      if (!this.validateForm()) {
        return
      }
      
      this.isSubmitting = true
      
      try {
        // 准备捐赠数据
        const donationData = {
          pickupLocation: this.form.pickupLocation.trim(),
          availableTime: this.form.availableTime.trim(),
          contact: this.form.contactInfo.trim(),
          notes: this.form.specialInstructions.trim(),
          urgent: this.form.urgentDonation,
          allowPartialPickup: this.form.allowPartialPickup,
          createdAt: new Date().toISOString() // 添加创建时间戳
        }

        // 更新物品为捐赠状态
        const response = await fetch(`http://localhost:3001/api/food-inventory/${this.item._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.value?.id || this.item.userId || 'demo-user-id' // 使用当前登录用户ID
          },
          body: JSON.stringify({
            name: this.item.name,
            quantity: this.item.quantity,
            expiryDate: this.item.expiryDate,
            category: this.item.category,
            location: this.item.location,
            notes: this.item.notes,
            imagePath: this.item.imagePath,
            forDonation: true,
            donationInfo: donationData
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Item successfully marked for donation!')
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

    getFoodImage(itemName) {
      const foodImages = {
        'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=150&h=150&fit=crop&crop=center',
        'sardine': 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=150&h=150&fit=crop&crop=center',
        'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&h=150&fit=crop&crop=center',
        'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&h=150&fit=crop&crop=center'
      }
      
      const name = itemName.toLowerCase()
      return foodImages[name] || `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=150&h=150&fit=crop&crop=center`
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
  border-radius: 20px;
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
  padding: 25px 30px;
  border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
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

/* 物品预览 */
.item-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
}

.item-details {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* 表单样式 */
.donation-form {
  display: flex;
  flex-direction: column;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.2rem;
  border-bottom: 2px solid #e74c3c;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group label.required::after {
  content: ' *';
  color: #e74c3c;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #e74c3c;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 0;
}

.form-checkbox {
  margin: 0;
  width: 18px;
  height: 18px;
  accent-color: #e74c3c;
  cursor: pointer;
}

.checkbox-text {
  color: #333;
  font-weight: normal;
  line-height: 1.4;
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
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
}

.btn-cancel, .btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
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
    flex-direction: column;
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
