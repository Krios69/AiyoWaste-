<template>
  <div class="analytics-page">
    <div class="page-header">
      <h1>📊 Track and Report</h1>
      <p class="subtitle">Monitor your food-saving impact and progress</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📈</div>
      <h2>No Data Available Yet</h2>
      <p>Start logging and using food items to see your impact!</p>
      <router-link to="/food-inventory" class="cta-button">
        Go to Food Inventory
      </router-link>
    </div>

    <!-- Analytics Content -->
    <div v-else class="analytics-content">
      <!-- Filter Controls -->
      <div class="filter-controls">
        <div class="date-range-selector">
          <label>Date Range:</label>
          <select v-model="selectedTimeRange" @change="onTimeRangeChange">
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        
        <div class="chart-type-selector">
          <label>View:</label>
          <select v-model="chartType" @change="onChartTypeChange">
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="stat-card total-saved" @click="showDetails('saved')">
          <div class="card-icon">🎯</div>
          <div class="card-content">
            <h3>{{ summary.foodSavedFromWaste }}</h3>
            <p>Total Food Saved</p>
            <small>Click for details</small>
          </div>
        </div>

        <div class="stat-card items-used" @click="showDetails('used')">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <h3>{{ summary.totalItemsUsed }}</h3>
            <p>Items Used</p>
            <small>Click for details</small>
          </div>
        </div>

        <div class="stat-card items-donated" @click="showDetails('donated')">
          <div class="card-icon">❤️</div>
          <div class="card-content">
            <h3>{{ summary.totalItemsDonated }}</h3>
            <p>Items Donated</p>
            <small>Click for details</small>
          </div>
        </div>

        <div class="stat-card items-expired" @click="showDetails('expired')">
          <div class="card-icon">⚠️</div>
          <div class="card-content">
            <h3>{{ summary.totalItemsExpired }}</h3>
            <p>Items Expired</p>
            <small>Click for details</small>
          </div>
        </div>
      </div>

      <!-- Impact Summary -->
      <div class="impact-section">
        <h2>Your Impact</h2>
        <div class="impact-content">
          <div class="impact-stat">
            <div class="stat-label">Success Rate</div>
            <div class="stat-value">{{ successRate }}%</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: successRate + '%' }"></div>
            </div>
          </div>
          <div class="impact-description">
            <p>You've successfully used or donated <strong>{{ summary.foodSavedFromWaste }}</strong> out of <strong>{{ summary.totalItemsLogged }}</strong> food items, preventing them from going to waste!</p>
          </div>
        </div>
      </div>

      <!-- Category Stats Table -->
      <div class="stats-table-section" v-if="categoryStats.length > 0">
        <h2>Detailed Category Statistics</h2>
        <div class="stats-table">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total</th>
                <th>Used</th>
                <th>Donated</th>
                <th>Expired</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stat in categoryStats" :key="stat._id">
                <td class="category-cell">{{ stat._id }}</td>
                <td>{{ stat.total }}</td>
                <td class="used-cell">{{ stat.used }}</td>
                <td class="donated-cell">{{ stat.donated }}</td>
                <td class="expired-cell">{{ stat.expired }}</td>
                <td>
                  <span class="success-badge" :class="getSuccessClass(stat)">
                    {{ calculateCategorySuccess(stat) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Time Series Chart -->
      <div class="time-series-section" v-if="timeSeriesData.length > 0">
        <h2>Activity Over Time (Last 30 Days)</h2>
        <div class="time-chart">
          <div class="chart-container">
            <div 
              v-for="(point, index) in timeSeriesData" 
              :key="index"
              class="chart-bar"
              :style="{ height: (point.added / maxTimeSeriesValue * 100) + '%' }"
              :title="`${point._id.month}/${point._id.day}: ${point.added} added, ${point.used} used`"
            >
              <div class="bar-segment added" :style="{ height: '100%' }"></div>
              <div 
                class="bar-segment used" 
                :style="{ height: (point.used / point.added * 100) + '%' }"
              ></div>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color added"></span>
              <span>Items Added</span>
            </div>
            <div class="legend-item">
              <span class="legend-color used"></span>
              <span>Items Used</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity-section" v-if="recentUsedItems.length > 0">
        <h2>Recently Used Items</h2>
        <div class="activity-list">
          <div 
            v-for="item in recentUsedItems.slice(0, 10)" 
            :key="item._id"
            class="activity-item"
          >
            <div class="activity-icon">✓</div>
            <div class="activity-content">
              <div class="activity-name">{{ item.name }}</div>
              <div class="activity-meta">
                <span class="activity-category">{{ item.category }}</span>
                <span class="activity-date">{{ formatDate(item.usedDate) }}</span>
              </div>
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
  name: 'AnalyticsPage',
  setup() {
    const auth = inject('auth')
    return { auth }
  },
  data() {
    return {
      isLoading: true,
      selectedTimeRange: 'all',
      chartType: 'weekly',
      dateRange: {},
      summary: {
        totalItemsLogged: 0,
        totalItemsUsed: 0,
        totalItemsDonated: 0,
        totalItemsExpired: 0,
        foodSavedFromWaste: 0,
        categoryBreakdown: []
      },
      categoryStats: [],
      timeSeriesData: [],
      recentUsedItems: []
    }
  },
  computed: {
    hasData() {
      return this.summary.totalItemsLogged > 0
    },
    successRate() {
      if (this.summary.totalItemsLogged === 0) return 0
      return Math.round((this.summary.foodSavedFromWaste / this.summary.totalItemsLogged) * 100)
    },
    maxTimeSeriesValue() {
      if (this.timeSeriesData.length === 0) return 1
      return Math.max(...this.timeSeriesData.map(d => d.added))
    }
  },
  mounted() {
    this.loadAnalytics()
  },
  methods: {
    async loadAnalytics() {
      this.isLoading = true
      try {
        // Check if user is logged in
        if (!this.auth || !user.value) {
          alert('Please login to view analytics')
          this.$router.push('/login')
          return
        }

        // Load all analytics data
        await Promise.all([
          this.loadSummary(),
          this.loadCategoryStats(),
          this.loadTimeSeriesData(),
          this.loadRecentUsedItems()
        ])
      } catch (error) {
        console.error('Error loading analytics:', error)
        alert('Failed to load analytics data. Please try again.')
      } finally {
        this.isLoading = false
      }
    },

    getDateRange() {
      const today = new Date()
      let startDate = null
      
      switch (this.selectedTimeRange) {
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = null
      }
      
      return {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: today.toISOString().split('T')[0]
      }
    },

    async loadSummary() {
      try {
        const dateRange = this.getDateRange()
        let url = 'http://localhost:3001/api/analytics/summary'
        
        if (dateRange.startDate) {
          url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        }
        
        const response = await fetch(url, {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.summary = result.summary
        }
      } catch (error) {
        console.error('Error loading summary:', error)
      }
    },

    async loadCategoryStats() {
      try {
        const response = await fetch('http://localhost:3001/api/analytics/category-stats', {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.categoryStats = result.stats
        }
      } catch (error) {
        console.error('Error loading category stats:', error)
      }
    },

    async loadTimeSeriesData() {
      try {
        const days = this.getDaysForTimeRange()
        const response = await fetch(`http://localhost:3001/api/analytics/time-series?days=${days}`, {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.timeSeriesData = result.data
        }
      } catch (error) {
        console.error('Error loading time series data:', error)
      }
    },

    async loadRecentUsedItems() {
      try {
        const dateRange = this.getDateRange()
        let url = 'http://localhost:3001/api/analytics/used-items'
        
        if (dateRange.startDate) {
          url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        }
        
        const response = await fetch(url, {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.recentUsedItems = result.items
        }
      } catch (error) {
        console.error('Error loading recent used items:', error)
      }
    },

    getDaysForTimeRange() {
      switch (this.selectedTimeRange) {
        case 'week': return 7
        case 'month': return 30
        case '3months': return 90
        case 'year': return 365
        default: return 365
      }
    },

    onTimeRangeChange() {
      this.loadAnalytics()
    },

    onChartTypeChange() {
      this.loadTimeSeriesData()
    },

    showDetails(type) {
      console.log('Showing details for:', type)
      // System Response: Display detailed information based on clicked data point
      alert(`Details for ${type}:\n\nTotal: ${this.summary['totalItems' + type.charAt(0).toUpperCase() + type.slice(1)] || this.summary['foodSavedFromWaste']}\n\nThis represents your impact in preventing food waste!`)
    },

    calculateCategorySuccess(stat) {
      const successCount = stat.used + stat.donated
      return stat.total === 0 ? 0 : Math.round((successCount / stat.total) * 100)
    },

    getSuccessClass(stat) {
      const rate = this.calculateCategorySuccess(stat)
      if (rate >= 80) return 'excellent'
      if (rate >= 60) return 'good'
      if (rate >= 40) return 'fair'
      return 'poor'
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.analytics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 40px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.1rem;
  color: #5a6c5d;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.empty-state p {
  color: #5a6c5d;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.cta-button {
  display: inline-block;
  padding: 15px 30px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: transform 0.3s;
}

.cta-button:hover {
  transform: translateY(-2px);
}

/* Analytics Content */
.analytics-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.date-range-selector,
.chart-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range-selector label,
.chart-type-selector label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.date-range-selector select,
.chart-type-selector select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #2c3e50;
  cursor: pointer;
  transition: border-color 0.3s;
}

.date-range-selector select:hover,
.chart-type-selector select:hover {
  border-color: #4CAF50;
}

.date-range-selector select:focus,
.chart-type-selector select:focus {
  outline: none;
  border-color: #4CAF50;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.stat-card:active {
  transform: translateY(-2px);
}

.card-icon {
  font-size: 3rem;
}

.card-content h3 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 5px;
}

.card-content p {
  color: #5a6c5d;
  font-size: 1rem;
}

.card-content small {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-top: 8px;
}

.total-saved {}

.items-used {}

.items-donated {}

.items-expired {}

/* Impact Section */
.impact-section,
.stats-table-section,
.time-series-section,
.recent-activity-section {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.impact-section h2,
.stats-table-section h2,
.time-series-section h2,
.recent-activity-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.impact-content {
  display: flex;
  gap: 40px;
  align-items: center;
}

.impact-stat {
  flex: 1;
}

.stat-label {
  font-size: 1rem;
  color: #5a6c5d;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 3rem;
  color: #4CAF50;
  font-weight: bold;
  margin-bottom: 15px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.5s ease;
}

.impact-description {
  flex: 2;
}

.impact-description p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #2c3e50;
}

/* Stats Table */
.stats-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
}

tbody td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #5a6c5d;
}

.category-cell {
  font-weight: 600;
  color: #2c3e50;
}

.used-cell {
  color: #2196F3;
  font-weight: 600;
}

.donated-cell {
  color: #FF5722;
  font-weight: 600;
}

.expired-cell {
  color: #FF9800;
  font-weight: 600;
}

.success-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.success-badge.excellent {
  background: #4CAF50;
  color: white;
}

.success-badge.good {
  background: #8BC34A;
  color: white;
}

.success-badge.fair {
  background: #FFC107;
  color: #333;
}

.success-badge.poor {
  background: #FF5722;
  color: white;
}

/* Time Series Chart */
.time-chart {
  padding: 20px 0;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  margin-bottom: 20px;
}

.chart-bar {
  flex: 1;
  position: relative;
  background: #e3f2fd;
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.bar-segment {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-radius: 4px 4px 0 0;
}

.bar-segment.added {
  background: #4CAF50;
}

.bar-segment.used {
  background: #2196F3;
}

.chart-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #5a6c5d;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.added {
  background: #4CAF50;
}

.legend-color.used {
  background: #2196F3;
}

/* Recent Activity */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: background 0.3s;
}

.activity-item:hover {
  background: #f0f0f0;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.activity-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #5a6c5d;
}

.activity-category {
  padding: 2px 8px;
  background: #e0e0e0;
  border-radius: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .analytics-page {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .impact-content {
    flex-direction: column;
    gap: 20px;
  }

  .stats-table {
    font-size: 0.85rem;
  }
}
</style>

