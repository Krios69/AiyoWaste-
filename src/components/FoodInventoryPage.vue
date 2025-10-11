<template>
  <div class="food-inventory-page">
    <!-- View List Button -->
    <button 
      class="view-list-btn" 
      @click="showListView = !showListView"
      title="View List"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>View List</span>
    </button>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-content">
        <!-- Food area -->
        <div class="section">
          <h2 class="section-title">Food</h2>
          <div class="food-grid">
            <div 
              v-for="item in regularItems" 
              :key="item._id" 
              class="food-item clickable"
              @click="editItem(item)"
              :class="{ selected: selectedItem && selectedItem._id === item._id }"
              title="点击编辑食物信息"
            >
              <div class="food-image">
                <img :src="getFoodImage(item)" :alt="item.name" />
              </div>
              <div class="food-name">{{ item.name }}</div>
            </div>
            <!-- 空占位符 -->
            <div class="food-item empty" @click="showAddFoodModal = true">
              <div class="food-image empty-placeholder">
                <div class="empty-cross">
                  <div class="line1"></div>
                  <div class="line2"></div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Expiry 区域 -->
        <div class="section">
          <h2 class="section-title">Expiry</h2>
          <div class="food-grid">
            <div 
              v-for="item in expiringItemsList" 
              :key="'exp_' + item._id" 
              class="food-item expiring"
              :class="{ selected: selectedItem && selectedItem._id === item._id }"
            >
              <!-- 捐赠图标 -->
              <button 
                class="donate-icon-btn" 
                @click.stop="markForDonation(item)"
                title="标记为可捐赠"
              >
                <span class="donate-icon">🎁</span>
              </button>
              
              <div class="food-image">
                <img :src="getFoodImage(item)" :alt="item.name" />
              </div>
              <div class="food-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- List Modal -->
    <div v-if="showListView" class="list-modal-overlay" @click="showListView = false">
      <div class="list-modal" @click.stop>
        <div class="list-header">
          <h3>Food Inventory List</h3>
          <button @click="showListView = false" class="close-btn">✕</button>
        </div>
        <div class="list-content">
          <div class="list-stats">
            <div class="stat-item">
              <span class="stat-number">{{ totalItems }}</span>
              <span class="stat-label">Total Items</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ expiringItems }}</span>
              <span class="stat-label">Expiring Soon</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ donationItems }}</span>
              <span class="stat-label">For Donation</span>
            </div>
          </div>
          
          <div class="list-items">
            <div v-for="item in filteredItems" :key="item._id" class="list-item">
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-details">{{ item.quantity }} - {{ formatDate(item.expiryDate) }}</div>
              </div>
              <div class="item-actions">
                <button @click="editItem(item)" class="mini-btn">✏️</button>
                <button @click="deleteItem(item._id)" class="mini-btn">🗑️</button>
                <button 
                  v-if="!item.forDonation && isExpiringSoon(item.expiryDate)"
                  @click="markForDonation(item)"
                  class="mini-btn donate"
                >
                  ❤️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加食物模态框 -->
    <AddFoodModal 
      v-if="showAddFoodModal"
      @close="showAddFoodModal = false"
      @food-added="onFoodAdded"
    />
    
    <!-- 编辑食物模态框 -->
    <EditFoodModal 
      v-if="showEditFoodModal"
      :food-item="editingItem"
      @close="showEditFoodModal = false"
      @food-updated="onFoodUpdated"
    />
    
    <!-- 捐赠表单模态框 -->
    <DonationFormModal 
      v-if="showDonationModal"
      :item="donationItem"
      @close="showDonationModal = false"
      @donation-created="onDonationCreated"
    />
  </div>
</template>

<script>
import AddFoodModal from './AddFoodModal.vue'
import EditFoodModal from './EditFoodModal.vue'
import DonationFormModal from './DonationFormModal.vue'
import { inject } from 'vue'
import { user } from '../store/auth.js'

export default {
  name: 'FoodInventoryPage',
  components: {
    AddFoodModal,
    EditFoodModal,
    DonationFormModal
  },
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      foodItems: [],
      searchQuery: '',
      filterCategory: 'all',
      showAddFoodModal: false,
      showEditFoodModal: false,
      showDonationModal: false,
      showListView: false,
      editingItem: null,
      donationItem: null,
      selectedItem: null,
      isLoading: false
    }
  },
  computed: {
    totalItems() {
      return this.foodItems.length
    },
    expiringItems() {
      return this.foodItems.filter(item => 
        this.isExpiringSoon(item.expiryDate) && !item.forDonation
      ).length
    },
    donationItems() {
      return this.foodItems.filter(item => item.forDonation).length
    },
    uniqueCategories() {
      const categories = new Set(this.foodItems.map(item => item.category))
      return categories.size
    },
    availableCategories() {
      const categories = [...new Set(this.foodItems.map(item => item.category))]
      return categories.sort()
    },
    filteredItems() {
      let filtered = this.foodItems
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.location && item.location.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        )
      }
      
      // 分类过滤
      if (this.filterCategory === 'expiring') {
        filtered = filtered.filter(item => this.isExpiringSoon(item.expiryDate))
      } else if (this.filterCategory !== 'all') {
        filtered = filtered.filter(item => item.category === this.filterCategory)
      }
      
      // 按到期日期排序
      return filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    },
    regularItems() {
      // Food列表：显示所有未过期的食物（排除已过期的）
      return this.foodItems.filter(item => !this.isExpired(item.expiryDate)).slice(0, 4)
    },
    expiringItemsList() {
      // Expiry列表：只显示即将过期的食物（2天内过期且未过期）
      return this.foodItems.filter(item => 
        this.isExpiringSoon(item.expiryDate) && !this.isExpired(item.expiryDate)
      ).slice(0, 3)
    }
  },
  mounted() {
    this.loadInventory()
    
    // 检查URL参数，如果有action=add，则自动打开添加食物模态框
    if (this.$route.query.action === 'add') {
      this.showAddFoodModal = true
      // 清除URL参数，避免刷新时重复打开
      this.$router.replace({ path: '/food-inventory' })
    }
  },
  methods: {
    async loadInventory() {
      this.isLoading = true
      try {
        // 检查用户是否已登录
        if (!this.auth || !user.value) {
          console.log('❌ 用户未登录，跳转到登录页面')
          alert('Please login to view your food inventory')
          this.$router.push('/login')
          return
        }
        
        console.log('✅ 用户已登录，用户ID:', user.value.id)
        
        const response = await fetch('http://localhost:3001/api/food-inventory', {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.foodItems = result.items
        } else {
          alert('Failed to load inventory: ' + result.message)
        }
      } catch (error) {
        console.error('Error loading inventory:', error)
        alert('Failed to load inventory. Please try again.')
      } finally {
        this.isLoading = false
      }
    },
    
    isExpiringSoon(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 2 && daysUntilExpiry >= 0
    },
    
    isExpired(expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      return expiry < today
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
      if (this.isExpired(expiryDate)) return 'expired'
      if (this.isExpiringSoon(expiryDate)) return 'expiring'
      return 'fresh'
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    
    editItem(item) {
      this.editingItem = item
      this.showEditFoodModal = true
    },
    
    async deleteItem(itemId) {
      if (!confirm('Are you sure you want to delete this food item?')) {
        return
      }
      
      try {
        const response = await fetch(`http://localhost:3001/api/food-inventory/${itemId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Food item deleted successfully!')
          this.loadInventory()
        } else {
          alert('Failed to delete item: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Failed to delete item. Please try again.')
      }
    },
    
    markForDonation(item) {
      this.donationItem = item
      this.showDonationModal = true
    },
    
    onDonationCreated() {
      this.showDonationModal = false
      this.loadInventory()
    },
    
    goToDonations() {
      this.$router.push('/donations')
    },
    
    onFoodAdded() {
      this.showAddFoodModal = false
      this.loadInventory()
    },
    
    onFoodUpdated() {
      this.showEditFoodModal = false
      this.loadInventory()
    },
    
    selectItem(item) {
      this.selectedItem = item
    },
    
    getFoodImage(item) {
      // 优先显示Unsplash生成的图片
      if (item.imagePath) {
        // 如果imagePath是完整的URL，直接返回
        if (item.imagePath.startsWith('http')) {
          return item.imagePath
        }
        // 如果是相对路径，添加服务器地址
        return `http://localhost:3001${item.imagePath}`
      }
      
      // 如果没有Unsplash图片，显示占位符
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik02MCA2MEg5MFY5MEg2MFY2MFoiIGZpbGw9IiNEOUQ5RDkiLz4KPHN2ZyB4PSI2NSIgeT0iNjUiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOTk5OTk5Ij4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjhIMThWMjBINlY4SDEwVjRDMTAgMi45IDEwLjkgMiAxMiAyWk0xMiA0VjZIMTJWNFpNOCAxMFYxOEgxNlYxMEg4WiIvPgo8L3N2Zz4KPC9zdmc+'
    }
  }
}
</script>

<style scoped>
.food-inventory-page {
  min-height: 100vh;
  background-color: #C8D5B9;
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

/* View List Button */
.view-list-btn {
  position: fixed;
  top: 120px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
  z-index: 100;
}

.view-list-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049, #3d8b40);
}

.view-list-btn svg {
  flex-shrink: 0;
}

.view-list-btn span {
  font-weight: 600;
}

.main-content {
  display: flex;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.left-content {
  flex: 1;
}

.section {
  margin-bottom: 60px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 300;
  color: #333;
  margin-bottom: 30px;
  letter-spacing: -1px;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.food-item {
  background: white;
  border-radius: 8px;
  padding: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.food-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.food-item.selected {
  border: 3px solid #8BC34A;
  transform: translateY(-5px);
}

.food-item.expiring {
  background: #FFF3CD;
  border: 2px solid #FFC107;
  position: relative !important;
}

.food-item.empty {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  cursor: pointer;
}

.food-item.empty:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.food-item.clickable {
  cursor: pointer;
  position: relative;
}

.food-item.clickable:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 2px solid #007bff;
}

.food-item.clickable::after {
  content: '✏️';
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.food-item.clickable:hover::after {
  opacity: 1;
}

/* 捐赠按钮样式 */
.donate-icon-btn {
  position: absolute !important;
  top: 5px !important;
  right: 5px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  width: auto !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  font-size: 20px !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
  z-index: 100 !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  padding: 0 !important;
}

.donate-icon-btn:hover {
  background: transparent !important;
  border: none !important;
  transform: scale(1.2);
  box-shadow: none !important;
}

.donate-icon-btn:active {
  transform: scale(0.95);
}

.donate-icon {
  font-size: 20px;
  line-height: 1;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.donate-icon-btn:hover .donate-icon {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.food-image {
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.food-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.food-image.empty-placeholder {
  background: transparent;
  position: relative;
}

.empty-cross {
  position: relative;
  width: 20px;
  height: 20px;
}

.empty-cross .line1,
.empty-cross .line2 {
  position: absolute;
  background: #adb5bd;
  border-radius: 2px;
}

.empty-cross .line1 {
  width: 2px;
  height: 20px;
  left: 9px;
  top: 0;
}

.empty-cross .line2 {
  width: 20px;
  height: 2px;
  left: 0;
  top: 9px;
}

.food-name {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* 列表模态框 */
.list-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.list-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.list-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
}

.close-btn:hover {
  color: #333;
}

.list-content {
  padding: 30px;
  max-height: 60vh;
  overflow-y: auto;
}

.list-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: background-color 0.3s ease;
}

.list-item:hover {
  background: #e9ecef;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.item-details {
  color: #666;
  font-size: 0.9rem;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.mini-btn {
  background: none;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.mini-btn:hover {
  background: #dee2e6;
}

.mini-btn.donate {
  color: #e74c3c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .food-inventory-page {
    padding: 20px;
  }
  
  .view-list-btn {
    top: 100px;
    right: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }
  
  .view-list-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .main-content {
    flex-direction: column;
    gap: 30px;
  }
  
  .food-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .list-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .view-list-btn {
    top: 90px;
    right: 15px;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  
  .view-list-btn span {
    display: none;
  }
  
  .food-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}
</style>
