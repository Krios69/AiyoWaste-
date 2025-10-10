<template>
  <div class="food-inventory-page">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-content">
        <!-- Food 区域 -->
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

            <div class="food-item empty" @click="showAddFoodModal = true">
              <div class="food-image empty-placeholder">
                <div class="empty-cross">
                  <div class="line1"></div>
                  <div class="line2"></div>
                </div>
              </div>
            </div>
            <div class="food-item empty">
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

    <!-- 右下角浮动按钮 -->
    <div class="floating-actions">
      <!-- 子按钮 -->
      <button 
        class="floating-btn add-btn" 
        @click="showAddFoodModal = true" 
        title="Add Food Item"
        :class="{ 'show': showFloatingMenu }"
        style="transition-delay: 0.1s"
      >
        <span class="add-icon">🍎</span>
      </button>
      
      <button 
        class="floating-btn list-btn" 
        @click="showListView = !showListView" 
        title="View List"
        :class="{ 'show': showFloatingMenu }"
        style="transition-delay: 0.2s"
      >
        <span class="list-icon">☰</span>
      </button>
      
      <!-- 主按钮 -->
      <button 
        class="floating-btn main-btn" 
        @click="toggleFloatingMenu"
        title="Menu"
        :class="{ 'rotated': showFloatingMenu }"
      >
        <span class="plus-icon" :class="{ 'rotated': showFloatingMenu }">+</span>
      </button>
    </div>

    <!-- 列表视图模态框 -->
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
      showFloatingMenu: false,
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
    },
    
    toggleFloatingMenu() {
      this.showFloatingMenu = !this.showFloatingMenu
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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.food-item {
  background: white;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 100px;
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
  width: 45px;
  height: 45px;
  margin-bottom: 8px;
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
  width: 25px;
  height: 25px;
}

.empty-cross .line1,
.empty-cross .line2 {
  position: absolute;
  background: #adb5bd;
  border-radius: 2px;
}

.empty-cross .line1 {
  width: 2px;
  height: 25px;
  left: 11.5px;
  top: 0;
}

.empty-cross .line2 {
  width: 25px;
  height: 2px;
  left: 0;
  top: 11.5px;
}

.food-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* 右下角浮动按钮 */
.floating-actions {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
}

.floating-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  position: absolute;
  bottom: 0;
  right: 0;
}

/* 主按钮样式 */
.floating-btn.main-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.floating-btn.main-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 30px rgba(76, 175, 80, 0.5);
}

.floating-btn.main-btn.rotated {
  transform: rotate(180deg);
}

.floating-btn.main-btn.rotated:hover {
  transform: rotate(180deg) translateY(-3px) scale(1.05);
}

/* 子按钮样式 */
.floating-btn.add-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: scale(0) translateY(0);
  pointer-events: none;
}

.floating-btn.list-btn {
  background: linear-gradient(135deg, #8BC34A, #7CB342);
  color: white;
  box-shadow: 0 6px 25px rgba(139, 195, 74, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: scale(0) translateY(0);
  pointer-events: none;
}


/* 展开状态 */
.floating-btn.show {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

.floating-btn.add-btn.show {
  transform: scale(1) translateY(-80px);
}

.floating-btn.list-btn.show {
  transform: scale(1) translateY(-160px);
}


/* 悬停效果 */
.floating-btn:hover:not(:disabled):not(.main-btn) {
  transform: scale(1.1) translateY(var(--translate-y, 0));
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.floating-btn.add-btn:hover:not(:disabled) {
  --translate-y: -80px;
  box-shadow: 0 8px 30px rgba(76, 175, 80, 0.5);
}

.floating-btn.list-btn:hover:not(:disabled) {
  --translate-y: -160px;
  box-shadow: 0 8px 30px rgba(139, 195, 74, 0.5);
}


/* 图标样式 */
.plus-icon {
  font-size: 2rem;
  line-height: 1;
  font-weight: 300;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.plus-icon.rotated {
  transform: rotate(45deg);
}

.add-icon {
  font-size: 1.8rem;
  line-height: 1;
  transition: transform 0.3s ease;
}

.list-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.edit-icon {
  font-size: 1.3rem;
  line-height: 1;
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
  
  .main-content {
    flex-direction: column;
    gap: 30px;
  }
  
  .food-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .floating-actions {
    bottom: 20px;
    right: 20px;
  }
  
  .floating-btn {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .floating-btn.add-btn.show {
    transform: scale(1) translateY(-70px);
  }
  
  .floating-btn.list-btn.show {
    transform: scale(1) translateY(-140px);
  }
  
  
  .floating-btn.add-btn:hover:not(:disabled) {
    --translate-y: -70px;
  }
  
  .floating-btn.list-btn:hover:not(:disabled) {
    --translate-y: -140px;
  }
  
  
  .plus-icon {
    font-size: 1.5rem;
  }
  
  .add-icon {
    font-size: 1.4rem;
  }
  
  .list-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .floating-actions {
    bottom: 15px;
    right: 15px;
  }
  
  .floating-btn {
    width: 45px;
    height: 45px;
    font-size: 1rem;
  }
  
  .floating-btn.add-btn.show {
    transform: scale(1) translateY(-60px);
  }
  
  .floating-btn.list-btn.show {
    transform: scale(1) translateY(-120px);
  }
  
  .floating-btn.add-btn:hover:not(:disabled) {
    --translate-y: -60px;
  }
  
  .floating-btn.list-btn:hover:not(:disabled) {
    --translate-y: -120px;
  }
  
  .plus-icon {
    font-size: 1.3rem;
  }
  
  .add-icon {
    font-size: 1.2rem;
  }
}
</style>
