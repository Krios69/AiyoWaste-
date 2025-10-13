<template>
  <div class="browse-food-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Browse Food Items</h1>
      <p class="page-subtitle">Discover available food items and donation opportunities</p>
    </div>

    <!-- 筛选和搜索工具栏 -->
    <div class="toolbar">
      <!-- 搜索框 -->
      <div class="search-section">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search food items..."
          class="search-input"
        />
      </div>
      
      <!-- 筛选按钮 -->
      <div class="filter-toggle">
        <button @click="toggleFilters" class="filter-btn" :class="{ active: showFilters }">
          <span class="filter-icon">🔍</span>
          <span class="filter-text">Filters</span>
          <span v-if="hasActiveFilters" class="filter-badge">{{ activeFiltersCount }}</span>
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filters-header">
        <h3>Filter Options</h3>
        <button @click="resetFilters" class="reset-btn">Reset All</button>
      </div>
      
      <div class="filters-grid">
        <!-- 库存类型筛选 -->
        <div class="filter-group">
          <label class="filter-label">Item Type</label>
          <div class="filter-options">
            <button 
              @click="setFilter('type', 'all')"
              :class="{ active: filters.type === 'all' }"
              class="filter-option-btn"
            >
              All Items
            </button>
            <button 
              @click="setFilter('type', 'inventory')"
              :class="{ active: filters.type === 'inventory' }"
              class="filter-option-btn"
            >
              Inventory Items
            </button>
            <button 
              @click="setFilter('type', 'donation')"
              :class="{ active: filters.type === 'donation' }"
              class="filter-option-btn"
            >
              Donation List
            </button>
          </div>
        </div>

        <!-- 类别筛选 -->
        <div class="filter-group">
          <label class="filter-label">Category</label>
          <select v-model="filters.category" class="filter-select">
            <option value="">All Categories</option>
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
          </select>
        </div>

        <!-- 到期日期筛选 -->
        <div class="filter-group">
          <label class="filter-label">Expiry Status</label>
          <select v-model="filters.expiryStatus" class="filter-select">
            <option value="">All Items</option>
            <option value="fresh">Fresh (3+ days)</option>
            <option value="expiring">Expiring Soon (1-2 days)</option>
            <option value="today">Expires Today</option>
          </select>
        </div>

        <!-- 储存类型筛选 -->
        <div class="filter-group">
          <label class="filter-label">Storage Type</label>
          <select v-model="filters.storage" class="filter-select">
            <option value="">All Storage</option>
            <option value="Refrigerator">Refrigerator</option>
            <option value="Freezer">Freezer</option>
            <option value="Pantry">Pantry</option>
            <option value="Kitchen Cabinet">Kitchen Cabinet</option>
            <option value="Countertop">Countertop</option>
            <option value="Basement">Basement</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 结果统计 -->
    <div class="results-info">
      <p>Showing {{ filteredItems.length }} items</p>
    </div>

    <!-- 食物物品显示区域 -->
    <div class="items-section">
      <!-- 空状态 -->
      <div v-if="filteredItems.length === 0" class="no-items">
        <div class="no-items-icon">🔍</div>
        <h3>No items found</h3>
        <p>Please adjust your filter conditions to find items.</p>
      </div>

      <!-- 食物物品网格 -->
      <div v-else class="food-grid">
        <div 
          v-for="item in filteredItems" 
          :key="item._id" 
          class="food-item"
          :class="{ 
            'expiring': isExpiringSoon(item.expiryDate),
            'expired': isExpired(item.expiryDate),
            'donation': item.forDonation
          }"
          @click="showItemDetails(item)"
        >
          <!-- 食物图片 -->
          <div class="food-image">
            <img :src="getFoodImage(item)" :alt="item.name" />
            <div v-if="item.forDonation" class="donation-badge">❤️</div>
          </div>

          <!-- 食物信息 -->
          <div class="food-info">
            <h4 class="food-name">{{ item.name }}</h4>
            <div class="food-details">
              <div class="detail-item">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">{{ item.quantity }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Expires:</span>
                <span class="detail-value" :class="getExpiryClass(item.expiryDate)">
                  {{ formatDate(item.expiryDate) }}
                </span>
              </div>
              
              <!-- 捐赠物品显示额外信息 -->
              <div v-if="item.forDonation && item.donationInfo" class="donation-info">
                <div class="detail-item">
                  <span class="detail-label">Pickup:</span>
                  <span class="detail-value">{{ item.donationInfo.location }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Contact:</span>
                  <span class="detail-value">{{ item.donationInfo.contact }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="item-actions">
            <button 
              @click.stop="markAsUsed(item)"
              class="action-btn used-btn"
              title="Mark as Used"
            >
              ✅ Used
            </button>
            <button 
              @click.stop="addToMealPlan(item)"
              class="action-btn plan-btn"
              title="Add to Meal Plan"
            >
              📅 Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 物品详情模态框 -->
    <ItemDetailsModal 
      v-if="showDetailsModal"
      :item="selectedItem"
      @close="showDetailsModal = false"
    />

  </div>
</template>

<script>
import ItemDetailsModal from './ItemDetailsModal.vue'
import { inject } from 'vue'
import { user } from '../store/auth.js'

export default {
  name: 'BrowseFoodPage',
  components: {
    ItemDetailsModal
  },
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      foodItems: [],
      searchQuery: '',
      filters: {
        type: 'all',
        category: '',
        expiryStatus: '',
        storage: ''
      },
      showDetailsModal: false,
      showFilters: false,
      selectedItem: null,
      isLoading: false
    }
  },
  computed: {
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

      // 类型过滤
      if (this.filters.type === 'inventory') {
        filtered = filtered.filter(item => !item.forDonation)
      } else if (this.filters.type === 'donation') {
        filtered = filtered.filter(item => item.forDonation)
      }

      // 类别过滤
      if (this.filters.category) {
        filtered = filtered.filter(item => item.category === this.filters.category)
      }

      // 到期状态过滤
      if (this.filters.expiryStatus) {
        const today = new Date()
        filtered = filtered.filter(item => {
          const expiry = new Date(item.expiryDate)
          const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
          
          switch (this.filters.expiryStatus) {
            case 'fresh':
              return daysUntilExpiry > 2
            case 'expiring':
              return daysUntilExpiry <= 2 && daysUntilExpiry > 0
            case 'today':
              return daysUntilExpiry === 0
            default:
              return true
          }
        })
      }

      // 储存类型过滤
      if (this.filters.storage) {
        filtered = filtered.filter(item => item.location === this.filters.storage)
      }

      // 按到期日期排序
      return filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    },
    
    hasActiveFilters() {
      return this.filters.type !== 'all' || 
             this.filters.category !== '' || 
             this.filters.expiryStatus !== '' || 
             this.filters.storage !== ''
    },
    
    activeFiltersCount() {
      let count = 0
      if (this.filters.type !== 'all') count++
      if (this.filters.category !== '') count++
      if (this.filters.expiryStatus !== '') count++
      if (this.filters.storage !== '') count++
      return count
    }
  },
  mounted() {
    this.loadFoodItems()
  },
  methods: {
    async loadFoodItems() {
      this.isLoading = true
      try {
        // 检查用户是否已登录
        if (!this.auth || !user.value) {
          console.log('❌ 用户未登录，跳转到登录页面')
          alert('Please login to browse food items')
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
          alert('Failed to load food items: ' + result.message)
        }
      } catch (error) {
        console.error('Error loading food items:', error)
        alert('Failed to load food items. Please try again.')
      } finally {
        this.isLoading = false
      }
    },

    setFilter(filterType, value) {
      this.filters[filterType] = value
    },

    resetFilters() {
      this.filters = {
        type: 'all',
        category: '',
        expiryStatus: '',
        storage: ''
      }
      this.searchQuery = ''
    },
    
    toggleFilters() {
      this.showFilters = !this.showFilters
    },

    showItemDetails(item) {
      this.selectedItem = item
      this.showDetailsModal = true
    },

    async markAsUsed(item) {
      if (!confirm(`Mark "${item.name}" as used?`)) {
        return
      }

      try {
        const response = await fetch(`http://localhost:3001/api/food-inventory/${item._id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Item marked as used and removed from inventory!')
          this.loadFoodItems()
        } else {
          alert('Failed to mark as used: ' + result.message)
        }
      } catch (error) {
        console.error('Error marking as used:', error)
        alert('Failed to mark as used. Please try again.')
      }
    },

    addToMealPlan(item) {
      // TODO: 实现添加到餐食计划功能
      alert(`"${item.name}" will be added to meal plan (Feature coming soon!)`)
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

    getExpiryClass(expiryDate) {
      if (this.isExpired(expiryDate)) return 'expired'
      if (this.isExpiringSoon(expiryDate)) return 'expiring'
      return 'fresh'
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
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
.browse-food-page {
  min-height: 100vh;
  background-color: #C8D5B9;
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 300;
  color: #333;
  margin-bottom: 10px;
  letter-spacing: -1px;
}

.page-subtitle {
  font-size: 1.2rem;
  color: #666;
}

/* 工具栏 */
.toolbar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-section {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e1e1e1;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #8BC34A;
}

.filter-toggle {
  flex-shrink: 0;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: #f8f9fa;
  border: 2px solid #e1e1e1;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #333;
  position: relative;
}

.filter-btn:hover {
  border-color: #8BC34A;
  background: #f0f8f0;
}

.filter-btn.active {
  background-color: #8BC34A;
  border-color: #8BC34A;
  color: white;
}

.filter-icon {
  font-size: 1.2rem;
}

.filter-text {
  font-size: 1rem;
}

.filter-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

/* 筛选面板 */
.filters-panel {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.filters-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.reset-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  font-size: 1rem;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-option-btn {
  padding: 8px 16px;
  border: 2px solid #e1e1e1;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.filter-option-btn.active {
  background-color: #8BC34A;
  border-color: #8BC34A;
  color: white;
}

.filter-option-btn:hover {
  border-color: #8BC34A;
  color: #8BC34A;
}

.filter-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #8BC34A;
}

/* 结果统计 */
.results-info {
  margin-bottom: 20px;
  color: #666;
  font-size: 1.1rem;
}

/* 物品显示区域 */
.items-section {
  margin-top: 30px;
}

.no-items {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-items-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-items h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-items p {
  color: #666;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.food-item {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.food-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.food-item.expiring {
  border-left: 4px solid #f39c12;
}

.food-item.expired {
  border-left: 4px solid #e74c3c;
  opacity: 0.7;
}

.food-item.donation {
  border-left: 4px solid #e74c3c;
  background: linear-gradient(135deg, #fff, #fff5f5);
}

.food-image {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.food-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.donation-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.food-info {
  text-align: center;
  margin-bottom: 20px;
}

.food-name {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.food-details {
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-label {
  font-weight: 600;
  color: #666;
}

.detail-value {
  color: #333;
}

.detail-value.fresh {
  color: #27ae60;
}

.detail-value.expiring {
  color: #f39c12;
  font-weight: 600;
}

.detail-value.expired {
  color: #e74c3c;
  font-weight: 600;
}

.donation-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.item-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.used-btn {
  background-color: #27ae60;
  color: white;
}

.used-btn:hover {
  background-color: #229954;
}

.plan-btn {
  background-color: #3498db;
  color: white;
}

.plan-btn:hover {
  background-color: #2980b9;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .browse-food-page {
    padding: 20px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .filter-options {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-header {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
