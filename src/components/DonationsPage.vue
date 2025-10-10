<template>
  <div class="donations-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Donation Management</h1>
      <p class="page-subtitle">Manage items marked for donation and create donation records</p>
    </div>

    <!-- 返回按钮 -->
    <div class="navigation">
      <button @click="goBackToInventory" class="back-btn">
        <span class="btn-icon">←</span>
        Back to Inventory
      </button>
    </div>

    <!-- 统计仪表盘 -->
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-info">
            <div class="stat-number">{{ donationItems.length }}</div>
            <div class="stat-label">Items for Donation</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-number">{{ publishedDonations.length }}</div>
            <div class="stat-label">Published Donations</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-info">
            <div class="stat-number">{{ urgentItems }}</div>
            <div class="stat-label">Urgent Items</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 待捐赠物品列表 -->
    <div class="donation-items-section">
      <div class="section-header">
        <h2>Items Marked for Donation</h2>
        <button 
          v-if="selectedItems.length > 0"
          @click="createBulkDonation"
          class="btn-primary"
        >
          Create Donation Record ({{ selectedItems.length }} items)
        </button>
      </div>

      <div v-if="donationItems.length === 0" class="no-items">
        <div class="no-items-icon">❤️</div>
        <h3>No items marked for donation</h3>
        <p>Items will appear here when you mark them for donation from your inventory.</p>
        <button @click="goBackToInventory" class="btn-secondary">
          Go to Inventory
        </button>
      </div>

      <div v-else class="donation-items-grid">
        <div 
          v-for="item in donationItems" 
          :key="item._id" 
          class="donation-item-card"
          :class="{ 
            'selected': selectedItems.includes(item._id),
            'urgent': isUrgent(item.expiryDate)
          }"
        >
          <div class="item-header">
            <div class="item-select">
              <input 
                type="checkbox" 
                :value="item._id"
                v-model="selectedItems"
                class="item-checkbox"
              />
            </div>
            <h3 class="item-name">{{ item.name }}</h3>
            <div class="item-actions">
              <button @click="removeFromDonation(item._id)" class="action-btn remove" title="Remove from donation">
                ✕
              </button>
            </div>
          </div>

          <div class="item-details">
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">{{ item.quantity }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value category-tag">{{ item.category }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expires:</span>
              <span class="detail-value" :class="getExpiryClass(item.expiryDate)">
                {{ formatDate(item.expiryDate) }}
              </span>
            </div>
            <div v-if="item.location" class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">{{ item.location }}</span>
            </div>
          </div>

          <div class="item-footer">
            <div class="urgency-badge" v-if="isUrgent(item.expiryDate)">
              ⚠️ Urgent
            </div>
            <div class="days-left">
              {{ getDaysUntilExpiry(item.expiryDate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已发布的捐赠记录 -->
    <div class="published-donations-section">
      <h2>Published Donation Records</h2>

      <div v-if="publishedDonations.length === 0" class="no-donations">
        <div class="no-donations-icon">📋</div>
        <h3>No donation records yet</h3>
        <p>Create donation records from items marked for donation.</p>
      </div>

      <div v-else class="donations-grid">
        <div 
          v-for="donation in publishedDonations" 
          :key="donation._id" 
          class="donation-record-card"
        >
          <div class="donation-header">
            <h3 class="donation-title">Donation #{{ donation.donationId }}</h3>
            <div class="donation-status" :class="donation.status.toLowerCase()">
              {{ donation.status }}
            </div>
          </div>

          <div class="donation-details">
            <div class="detail-row">
              <span class="detail-label">Items Count:</span>
              <span class="detail-value">{{ donation.items.length }} items</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pickup Location:</span>
              <span class="detail-value">{{ donation.pickupLocation }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pickup Time:</span>
              <span class="detail-value">{{ formatDateTime(donation.pickupTime) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(donation.createdAt) }}</span>
            </div>
            <div v-if="donation.notes" class="detail-row notes">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">{{ donation.notes }}</span>
            </div>
          </div>

          <div class="donation-items">
            <h4>Items in this donation:</h4>
            <div class="items-list">
              <span 
                v-for="(item, index) in donation.items" 
                :key="index"
                class="item-tag"
              >
                {{ item.name }} ({{ item.quantity }})
              </span>
            </div>
          </div>

          <div class="donation-actions">
            <button @click="editDonation(donation)" class="btn-edit">
              Edit
            </button>
            <button @click="deleteDonation(donation._id)" class="btn-delete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建捐赠记录模态框 -->
    <CreateDonationModal 
      v-if="showCreateDonationModal"
      :selected-items="getSelectedItemsData()"
      @close="showCreateDonationModal = false"
      @donation-created="onDonationCreated"
    />
  </div>
</template>

<script>
import CreateDonationModal from './CreateDonationModal.vue'
import { inject } from 'vue'
import { user } from '../store/auth.js'

export default {
  name: 'DonationsPage',
  components: {
    CreateDonationModal
  },
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      donationItems: [],
      publishedDonations: [],
      selectedItems: [],
      showCreateDonationModal: false,
      isLoading: false
    }
  },
  computed: {
    urgentItems() {
      return this.donationItems.filter(item => this.isUrgent(item.expiryDate)).length
    }
  },
  mounted() {
    this.loadDonationItems()
    this.loadPublishedDonations()
  },
  methods: {
    async loadDonationItems() {
      try {
        // 检查用户是否已登录
        if (!this.auth || !user.value) {
          console.log('❌ 用户未登录，跳转到登录页面')
          alert('Please login to view donation items')
          this.$router.push('/login')
          return
        }
        
        const response = await fetch('http://localhost:3001/api/food-inventory?forDonation=true', {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.donationItems = result.items
        } else {
          alert('Failed to load donation items: ' + result.message)
        }
      } catch (error) {
        console.error('Error loading donation items:', error)
        alert('Failed to load donation items. Please try again.')
      }
    },

    async loadPublishedDonations() {
      try {
        // 检查用户是否已登录
        if (!this.auth || !user.value) {
          return // 不显示错误，因为这个功能可能不需要认证
        }
        
        const response = await fetch('http://localhost:3001/api/donations', {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.publishedDonations = result.donations
        } else {
          console.error('Failed to load donations:', result.message)
        }
      } catch (error) {
        console.error('Error loading donations:', error)
      }
    },

    async removeFromDonation(itemId) {
      if (!confirm('Remove this item from donation list?')) {
        return
      }

      try {
        const response = await fetch(`http://localhost:3001/api/food-inventory/${itemId}/donate`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ forDonation: false })
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Item removed from donation list!')
          this.loadDonationItems()
        } else {
          alert('Failed to remove from donation: ' + result.message)
        }
      } catch (error) {
        console.error('Error removing from donation:', error)
        alert('Failed to remove from donation. Please try again.')
      }
    },

    createBulkDonation() {
      if (this.selectedItems.length === 0) {
        alert('Please select items to create a donation record.')
        return
      }
      this.showCreateDonationModal = true
    },

    getSelectedItemsData() {
      return this.donationItems.filter(item => this.selectedItems.includes(item._id))
    },

    async deleteDonation(donationId) {
      if (!confirm('Are you sure you want to delete this donation record?')) {
        return
      }

      try {
        const response = await fetch(`http://localhost:3001/api/donations/${donationId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Donation record deleted successfully!')
          this.loadPublishedDonations()
        } else {
          alert('Failed to delete donation: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting donation:', error)
        alert('Failed to delete donation. Please try again.')
      }
    },

    editDonation(donation) {
      // TODO: 实现编辑功能
      alert('Edit functionality will be implemented soon.')
    },

    isUrgent(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 2
    },

    getDaysUntilExpiry(expiryDate) {
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
        return `${daysUntilExpiry} days left`
      }
    },

    getExpiryClass(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) return 'expired'
      if (daysUntilExpiry <= 2) return 'urgent'
      if (daysUntilExpiry <= 7) return 'expiring'
      return 'fresh'
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },

    formatDateTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString()
    },

    goBackToInventory() {
      this.$router.push('/food-inventory')
    },

    onDonationCreated() {
      this.showCreateDonationModal = false
      this.selectedItems = []
      this.loadDonationItems()
      this.loadPublishedDonations()
    }
  }
}
</script>

<style scoped>
.donations-page {
  min-height: 100vh;
  background-color: #DEEDDC;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.page-subtitle {
  font-size: 1.2rem;
  color: #666;
}

.navigation {
  margin-bottom: 30px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #B6CBB3;
  color: #333;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #a5b8a2;
  transform: translateY(-2px);
}

/* 仪表盘样式 */
.dashboard {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 捐赠物品部分 */
.donation-items-section, .published-donations-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #333;
  margin: 0;
}

.btn-primary {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.no-items, .no-donations {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.no-items-icon, .no-donations-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.btn-secondary {
  background-color: #B6CBB3;
  color: #333;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.btn-secondary:hover {
  background-color: #a5b8a2;
}

/* 捐赠物品网格 */
.donation-items-grid, .donations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.donation-item-card, .donation-record-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.donation-item-card:hover, .donation-record-card:hover {
  transform: translateY(-5px);
}

.donation-item-card.selected {
  border: 2px solid #e74c3c;
}

.donation-item-card.urgent {
  border-left: 4px solid #f39c12;
}

.item-header, .donation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-select {
  margin-right: 10px;
}

.item-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #e74c3c;
}

.item-name, .donation-title {
  color: #333;
  margin: 0;
  flex: 1;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.action-btn.remove {
  color: #e74c3c;
}

.action-btn:hover {
  background-color: #f0f0f0;
}

.donation-status {
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.donation-status.active {
  background-color: #27ae60;
  color: white;
}

.donation-status.completed {
  background-color: #95a5a6;
  color: white;
}

.item-details, .donation-details {
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-row.notes {
  flex-direction: column;
  align-items: flex-start;
}

.detail-label {
  font-weight: 600;
  color: #666;
}

.detail-value {
  color: #333;
}

.category-tag {
  background-color: #B6CBB3;
  color: #333;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.detail-value.fresh {
  color: #27ae60;
}

.detail-value.expiring {
  color: #f39c12;
  font-weight: 600;
}

.detail-value.urgent {
  color: #e74c3c;
  font-weight: 600;
}

.detail-value.expired {
  color: #e74c3c;
  font-weight: 600;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e1e1e1;
}

.urgency-badge {
  background-color: #f39c12;
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.days-left {
  font-size: 0.9rem;
  font-weight: 600;
}

.donation-items {
  margin-bottom: 15px;
}

.donation-items h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.item-tag {
  background-color: #f8f9fa;
  color: #666;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.8rem;
}

.donation-actions {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e1e1e1;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background-color: #3498db;
  color: white;
}

.btn-edit:hover {
  background-color: #2980b9;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background-color: #c0392b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .donations-page {
    padding: 10px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .donation-items-grid, .donations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
