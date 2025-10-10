<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Food Item Details</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="item-preview">
          <div class="item-image">
            <img :src="getFoodImage(item.name)" :alt="item.name" />
            <div v-if="item.forDonation" class="donation-badge">❤️ For Donation</div>
          </div>
          
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <div class="item-status" :class="getExpiryClass(item.expiryDate)">
              {{ getExpiryStatus(item.expiryDate) }}
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-section">
            <h4>Basic Information</h4>
            <div class="detail-item">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">{{ item.quantity }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Category:</span>
              <span class="detail-value">{{ item.category }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Expiry Date:</span>
              <span class="detail-value" :class="getExpiryClass(item.expiryDate)">
                {{ formatDate(item.expiryDate) }}
              </span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Storage & Location</h4>
            <div class="detail-item">
              <span class="detail-label">Storage Location:</span>
              <span class="detail-value">{{ item.location || 'Not specified' }}</span>
            </div>
            <div v-if="item.notes" class="detail-item notes">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">{{ item.notes }}</span>
            </div>
          </div>

          <div v-if="item.forDonation && item.donationInfo" class="detail-section donation-section">
            <h4>Donation Information</h4>
            <div class="detail-item">
              <span class="detail-label">Pickup Location:</span>
              <span class="detail-value">{{ item.donationInfo.location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Available Time:</span>
              <span class="detail-value">{{ item.donationInfo.availableTime }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact:</span>
              <span class="detail-value">{{ item.donationInfo.contact }}</span>
            </div>
            <div v-if="item.donationInfo.notes" class="detail-item notes">
              <span class="detail-label">Special Notes:</span>
              <span class="detail-value">{{ item.donationInfo.notes }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="btn-close">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemDetailsModal',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
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

    getExpiryClass(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) return 'expired'
      if (daysUntilExpiry <= 2) return 'expiring'
      return 'fresh'
    },

    getExpiryStatus(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) {
        return `Expired ${Math.abs(daysUntilExpiry)} days ago`
      } else if (daysUntilExpiry === 0) {
        return 'Expires today'
      } else if (daysUntilExpiry === 1) {
        return 'Expires tomorrow'
      } else {
        return `${daysUntilExpiry} days until expiry`
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
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

.item-preview {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
}

.item-image {
  width: 100px;
  height: 100px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.donation-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
}

.item-status {
  font-size: 1rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  display: inline-block;
}

.item-status.fresh {
  background: #d4edda;
  color: #155724;
}

.item-status.expiring {
  background: #fff3cd;
  color: #856404;
}

.item-status.expired {
  background: #f8d7da;
  color: #721c24;
}

.details-grid {
  display: grid;
  gap: 25px;
}

.detail-section {
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  padding: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
  border-bottom: 2px solid #8BC34A;
  padding-bottom: 8px;
}

.donation-section {
  border: 2px solid #e74c3c;
  background: linear-gradient(135deg, #fff, #fff5f5);
}

.donation-section h4 {
  border-bottom-color: #e74c3c;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-item.notes {
  flex-direction: column;
  align-items: flex-start;
}

.detail-item.notes .detail-value {
  margin-top: 5px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}

.detail-label {
  font-weight: 600;
  color: #666;
  min-width: 120px;
}

.detail-value {
  color: #333;
  flex: 1;
  text-align: right;
}

.detail-value.fresh {
  color: #27ae60;
  font-weight: 600;
}

.detail-value.expiring {
  color: #f39c12;
  font-weight: 600;
}

.detail-value.expired {
  color: #e74c3c;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
}

.btn-close {
  background-color: #8BC34A;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background-color: #7CB342;
  transform: translateY(-2px);
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
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-value {
    text-align: left;
    margin-top: 5px;
  }
}
</style>

