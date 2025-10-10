<template>
  <div class="profile-page">
    <!-- 左侧导航面板 -->
    <div class="left-panel">
      <!-- 用户头像和ID -->
      <div class="user-section">
        <div class="user-avatar">
          <div class="avatar-circle">
            <div class="avatar-inner">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#666"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#666"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="user-id">User ID</div>
      </div>

      <!-- 导航菜单 -->
      <div class="menu-section">
        <div class="menu-item">
          <span>Family Member</span>
        </div>
        <div class="menu-divider"></div>
        
        <div class="menu-item active">
          <span>Donation List</span>
        </div>
        <div class="menu-divider"></div>
        
        <div class="menu-item">
          <span>Profile Info</span>
        </div>
        <div class="menu-divider"></div>
        
        <div class="menu-item">
          <span>Privacy & Security</span>
        </div>
        <div class="menu-divider"></div>
        
        <div class="menu-item" @click="handleLogout">
          <span>Logout</span>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="right-panel">
      <div class="content-header">
        <h1 class="page-title">Donation List</h1>
      </div>

      <div class="content-body">
        <div v-if="loading" class="loading-message">
          Loading donation list...
        </div>
        <div v-else-if="donationItems.length === 0" class="empty-message">
          No donation items found.
        </div>
        <div v-else>
          <div 
            v-for="(item, index) in donationItems" 
            :key="item._id" 
            class="donation-item"
          >
            <div class="item-info">
              <div class="item-number">{{ index + 1 }}.</div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-details">
                <span class="quantity">{{ item.quantity }}</span>
                <span class="expiry">Expires: {{ formatDate(item.expiryDate) }}</span>
                <span v-if="item.canCancel" class="time-remaining">
                  Can cancel for {{ (8 - item.hoursSinceDonation).toFixed(1) }} more hours
                </span>
                <span v-else class="time-expired">
                  Cannot cancel ({{ item.hoursSinceDonation }}h ago)
                </span>
              </div>
            </div>
            <div class="item-actions">
              <button 
                v-if="item.canCancel" 
                class="action-btn cancel-btn"
                @click="cancelDonation(item)"
                :disabled="cancellingItem === item._id"
              >
                {{ cancellingItem === item._id ? 'Cancelling...' : 'Cancel' }}
              </button>
              <button 
                class="action-btn view-btn"
                @click="viewDonationDetails(item)"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 捐赠详情模态框 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Donation Details</h2>
          <button @click="closeDetailsModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body" v-if="selectedItem">
          <div class="item-preview">
            <div class="item-image">
              <img :src="getFoodImage(selectedItem)" :alt="selectedItem.name" />
            </div>
            <div class="item-info">
              <h3>{{ selectedItem.name }}</h3>
              <p>Quantity: {{ selectedItem.quantity }}</p>
              <p>Expires: {{ formatDate(selectedItem.expiryDate) }}</p>
            </div>
          </div>
          
          <div class="donation-details" v-if="selectedItem.donationInfo">
            <h4>Pickup Information</h4>
            <div class="detail-group">
              <label>Location:</label>
              <span>{{ selectedItem.donationInfo.pickupLocation }}</span>
            </div>
            <div class="detail-group">
              <label>Available Time:</label>
              <span>{{ selectedItem.donationInfo.availableTime }}</span>
            </div>
            <div class="detail-group">
              <label>Contact:</label>
              <span>{{ selectedItem.donationInfo.contact }}</span>
            </div>
            <div class="detail-group" v-if="selectedItem.donationInfo.notes">
              <label>Special Instructions:</label>
              <span>{{ selectedItem.donationInfo.notes }}</span>
            </div>
            <div class="detail-group">
              <label>Status:</label>
              <span class="status-badge" :class="selectedItem.donationInfo.urgent ? 'urgent' : 'normal'">
                {{ selectedItem.donationInfo.urgent ? 'Urgent' : 'Normal' }}
              </span>
            </div>
            <div class="detail-group">
              <label>Created:</label>
              <span>{{ formatDateTime(selectedItem.donationInfo.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { user } from '../store/auth.js'

export default {
  name: 'ProfilePage',
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      donationItems: [],
      loading: false,
      showDetailsModal: false,
      selectedItem: null,
      cancellingItem: null
    }
  },
  mounted() {
    // 检查用户是否已登录
    if (!this.auth || !user.value) {
      this.$router.push('/login')
      return
    }
    
    // 加载捐赠列表
    this.loadDonationItems()
  },
  methods: {
    async loadDonationItems() {
      this.loading = true
      try {
        const response = await fetch('http://localhost:3001/api/donation-items', {
          headers: {
            'x-user-id': user.value?.id || 'demo-user-id'
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          this.donationItems = result.items
        } else {
          console.error('Failed to load donation items:', result.message)
        }
      } catch (error) {
        console.error('Error loading donation items:', error)
      } finally {
        this.loading = false
      }
    },
    
    async cancelDonation(item) {
      if (!confirm(`Are you sure you want to cancel the donation for "${item.name}"?`)) {
        return
      }
      
      this.cancellingItem = item._id
      
      try {
        const response = await fetch(`http://localhost:3001/api/donation-items/${item._id}/cancel`, {
          method: 'PUT',
          headers: {
            'x-user-id': user.value?.id || 'demo-user-id'
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Donation cancelled successfully!')
          // 重新加载列表
          this.loadDonationItems()
        } else {
          alert(`Failed to cancel donation: ${result.message}`)
        }
      } catch (error) {
        console.error('Error cancelling donation:', error)
        alert('Failed to cancel donation. Please try again.')
      } finally {
        this.cancellingItem = null
      }
    },
    
    viewDonationDetails(item) {
      this.selectedItem = item
      this.showDetailsModal = true
    },
    
    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedItem = null
    },
    
    handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        this.auth.logout()
        window.location.href = '/'
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    
    formatDateTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString()
    },
    
    getFoodImage(item) {
      // 使用与FoodInventoryPage相同的图片逻辑
      if (item.imagePath) {
        return item.imagePath
      }
      
      // 如果没有图片路径，返回通用SVG
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="150" height="150" fill="#f0f0f0"/>
          <text x="75" y="75" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#999">
            ${item.name}
          </text>
        </svg>
      `)}`
    }
  }
}
</script>

<style scoped>
.profile-page {
  display: flex;
  height: 100vh;
  background-color: #C8D5B9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 左侧面板 */
.left-panel {
  width: 20%;
  background-color: #B6CBB3;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 用户区域 */
.user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.user-avatar {
  margin-bottom: 20px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-inner {
  width: 60px;
  height: 60px;
  background-color: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-id {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

/* 菜单区域 */
.menu-section {
  width: 100%;
  max-width: 200px;
}

.menu-item {
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 5px;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.menu-item span {
  color: #333;
  font-size: 16px;
}

.menu-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 5px 0;
}

/* 右侧面板 */
.right-panel {
  width: 80%;
  background-color: #C8D5B9;
  padding: 60px 80px;
  display: flex;
  flex-direction: column;
}

.content-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.content-body {
  flex: 1;
}

/* 加载和空状态 */
.loading-message, .empty-message {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

/* 捐赠项目 */
.donation-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  max-width: 600px;
}

.item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  min-width: 30px;
}

.item-name {
  font-size: 18px;
  color: #333;
  font-weight: 500;
  min-width: 120px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.quantity {
  font-weight: 600;
}

.time-remaining {
  color: #27ae60;
  font-weight: 600;
}

.time-expired {
  color: #e74c3c;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #c0392b;
}

.cancel-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.view-btn {
  background-color: #27ae60;
  color: white;
}

.view-btn:hover {
  background-color: #229954;
}

/* 模态框样式 */
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

.item-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
}

.item-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.donation-details h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.2rem;
  border-bottom: 2px solid #e74c3c;
  padding-bottom: 8px;
}

.detail-group {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.detail-group label {
  font-weight: 600;
  color: #333;
  min-width: 140px;
  margin-right: 15px;
}

.detail-group span {
  color: #666;
  flex: 1;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.urgent {
  background-color: #ffebee;
  color: #c62828;
}

.status-badge.normal {
  background-color: #e8f5e8;
  color: #2e7d32;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    padding: 20px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .user-section {
    margin-bottom: 0;
    flex-direction: row;
    align-items: center;
  }
  
  .avatar-circle {
    width: 60px;
    height: 60px;
  }
  
  .avatar-inner {
    width: 45px;
    height: 45px;
  }
  
  .menu-section {
    display: flex;
    gap: 15px;
    max-width: none;
  }
  
  .menu-item {
    margin-bottom: 0;
    padding: 10px 15px;
  }
  
  .menu-divider {
    display: none;
  }
  
  .right-panel {
    width: 100%;
    padding: 30px 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .donation-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .item-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .left-panel {
    flex-direction: column;
    gap: 20px;
  }
  
  .menu-section {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>