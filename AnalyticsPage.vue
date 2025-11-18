<template>
  <div class="analytics-page">
    <div class="page-header">
      <h1>Track and Report</h1>
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
      <div class="analytics-card">
        <!-- Food Impact Overview + Your Impact side by side -->
        <div class="overview-impact-row" v-if="hasAnyData || summaryRange !== 'all'">
          <!-- Food Impact Overview -->
          <div class="overview-section">
            <div class="section-header">
              <div>
                <h2>Food Impact Overview</h2>
                <p>Visual breakdown of how your food items were handled</p>
              </div>
              <div class="section-filter">
                <label>Range</label>
                <select v-model="summaryRange" @change="handleSummaryRangeChange">
                  <option 
                    v-for="option in rangeOptions" 
                    :key="`summary-${option.value}`" 
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
            <div v-if="isLoadingSummary" class="section-loading">Updating summary...</div>
            <div v-else class="overview-content">
              <div class="donut-wrapper">
                <div class="donut-chart" :style="donutStyle">
                  <div class="donut-center">
                    <div class="center-value">{{ summary.foodSavedFromWaste }}</div>
                    <div class="center-label">Items Saved</div>
                  </div>
                </div>
              </div>
              <div class="donut-legend">
                <div 
                  class="legend-item" 
                  v-for="segment in impactSegments" 
                  :key="segment.key"
                >
                  <span class="legend-dot" :style="{ background: segment.color }"></span>
                  <div class="legend-text">
                    <div class="legend-label">{{ segment.label }}</div>
                    <div class="legend-value">{{ segment.value }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Impact Summary -->
          <div class="impact-section">
            <div class="section-header compact">
              <div>
                <h2>Your Impact</h2>
                <p>{{ getRangeLabel(summaryRange) }}</p>
              </div>
            </div>
            <div class="impact-content">
              <div class="impact-stat">
                <div class="stat-label">Donation Success Rate</div>
                <div class="stat-value">{{ successRate }}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: successRate + '%' }"></div>
                </div>
              </div>
              <div class="impact-description">
                <p>You've donated <strong>{{ summary.totalItemsDonated }}</strong> out of <strong>{{ summary.totalItemsLogged }}</strong> food items, helping others and preventing food waste!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Stats Table -->
        <div class="stats-table-section" v-if="hasAnyData || categoryRange !== 'all'">
          <div class="section-header">
            <div>
              <h2>Detailed Category Statistics</h2>
              <p>{{ getRangeLabel(categoryRange) }}</p>
            </div>
            <div class="section-filter">
              <label>Range</label>
              <select v-model="categoryRange" @change="handleCategoryRangeChange">
                <option 
                  v-for="option in rangeOptions" 
                  :key="`category-${option.value}`" 
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="isLoadingCategories" class="section-loading">Loading category data...</div>
          <div v-else-if="categoryStats.length === 0" class="section-empty">
            No category data for the selected range.
          </div>
          <div v-else class="stats-table">
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
        <div class="time-series-section" v-if="hasAnyData || timeSeriesData.length > 0 || timeSeriesRange !== 'all'">
          <div class="section-header time-series-header">
            <div>
              <h2>Activity Over Time</h2>
              <p>{{ getRangeLabel(timeSeriesRange) }}</p>
            </div>
            <div class="section-filter-group">
              <div class="section-filter">
                <label>Range</label>
                <select v-model="timeSeriesRange" @change="handleTimeSeriesRangeChange">
                  <option 
                    v-for="option in rangeOptions" 
                    :key="`timeseries-${option.value}`" 
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="section-filter">
                <label>View</label>
                <select v-model="chartType" @change="onChartTypeChange">
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
          <div class="time-chart">
            <div v-if="isLoadingTimeSeries" class="section-loading">Loading activity data...</div>
            <div v-else-if="timeSeriesData.length === 0" class="section-empty">
              No activity data for the selected range.
            </div>
            <div v-else class="chart-wrapper">
              <div class="chart-area">
                <svg 
                  class="line-chart" 
                  viewBox="0 0 800 250" 
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <!-- Gradient for added items area -->
                    <linearGradient id="addedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.3" />
                      <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0.05" />
                    </linearGradient>
                    <!-- Gradient for used items area -->
                    <linearGradient id="usedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#2196F3;stop-opacity:0.3" />
                      <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0.05" />
                    </linearGradient>
                    <!-- Drop shadow filter -->
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <!-- Grid lines -->
                  <g class="grid-lines">
                    <line 
                      v-for="(tick, i) in chartTicks" 
                      :key="'grid-'+i"
                      :x1="60" 
                      :y1="20 + (i * 210 / 5)" 
                      :x2="780" 
                      :y2="20 + (i * 210 / 5)" 
                      class="grid-line"
                    />
                  </g>
                  
                  <!-- Y-axis title -->
                  <text 
                    x="30" 
                    y="125" 
                    class="y-axis-title"
                    text-anchor="middle"
                    transform="rotate(-90, 30, 125)"
                  >
                    Items
                  </text>
                  
                  <!-- Y-axis labels -->
                  <g class="y-labels">
                    <text 
                      v-for="(tick, i) in chartTicks" 
                      :key="'label-'+i"
                      :x="55" 
                      :y="25 + (i * 210 / 5)" 
                      class="y-label"
                      text-anchor="end"
                    >
                      {{ tick }}
                    </text>
                  </g>
                  
                  <!-- Area fill for added items -->
                  <path 
                    v-if="addedAreaPath" 
                    :d="addedAreaPath" 
                    class="area-fill added"
                    fill="url(#addedGradient)"
                  />
                  
                  <!-- Area fill for used items -->
                  <path 
                    v-if="usedAreaPath" 
                    :d="usedAreaPath" 
                    class="area-fill used"
                    fill="url(#usedGradient)"
                  />
                  
                  <!-- Line for added items -->
                  <path 
                    v-if="addedLinePath" 
                    :d="addedLinePath" 
                    class="line added"
                    filter="url(#shadow)"
                  />
                  
                  <!-- Line for used items -->
                  <path 
                    v-if="usedLinePath" 
                    :d="usedLinePath" 
                    class="line used"
                    filter="url(#shadow)"
                  />
                  
                  <!-- Data points for added items -->
                  <g v-if="addedDataPoints.length > 0">
                    <circle 
                      v-for="(point, idx) in addedDataPoints" 
                      :key="'added-'+idx"
                      :cx="point.x" 
                      :cy="point.y" 
                      r="4"
                      class="data-point added"
                      :data-tooltip="`${point.date}: ${point.value} added`"
                    />
                    <circle 
                      v-for="(point, idx) in addedDataPoints" 
                      :key="'added-inner-'+idx"
                      :cx="point.x" 
                      :cy="point.y" 
                      r="2"
                      class="data-point-inner added"
                    />
                  </g>
                  
                  <!-- Data points for used items -->
                  <g v-if="usedDataPoints.length > 0">
                    <circle 
                      v-for="(point, idx) in usedDataPoints" 
                      :key="'used-'+idx"
                      :cx="point.x" 
                      :cy="point.y" 
                      r="4"
                      class="data-point used"
                      :data-tooltip="`${point.date}: ${point.value} used`"
                    />
                    <circle 
                      v-for="(point, idx) in usedDataPoints" 
                      :key="'used-inner-'+idx"
                      :cx="point.x" 
                      :cy="point.y" 
                      r="2"
                      class="data-point-inner used"
                    />
                  </g>
                  
                  <!-- X-axis labels -->
                  <g class="x-labels">
                    <text 
                      v-for="(point, idx) in xAxisLabels" 
                      :key="'x-label-'+idx"
                      :x="point.x" 
                      :y="245" 
                      class="x-label"
                      text-anchor="middle"
                    >
                      {{ point.label }}
                    </text>
                  </g>
                </svg>
                <div class="x-axis-title">
                  <span>Range: {{ getRangeLabel(timeSeriesRange) }}</span>
                </div>
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
      summaryRange: 'all',
      categoryRange: 'all',
      timeSeriesRange: 'month',
      chartType: 'weekly',
      rangeOptions: [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
        { value: '3months', label: 'Last 90 Days' },
        { value: 'year', label: 'Last Year' }
      ],
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
      isLoadingSummary: false,
      isLoadingCategories: false,
      isLoadingTimeSeries: false,
      hasAnyData: false
    }
  },
  computed: {
    hasData() {
      return this.hasAnyData
    },
    successRate() {
      if (this.summary.totalItemsLogged === 0) return 0
      return Math.round((this.summary.totalItemsDonated / this.summary.totalItemsLogged) * 100)
    },
    maxTimeSeriesValue() {
      if (this.timeSeriesData.length === 0) return 1
      return Math.max(
        ...this.timeSeriesData.map(d => Math.max(d.added || 0, d.used || 0))
      )
    },
    addedLinePath() {
      if (!this.timeSeriesData.length) return ''
      return this.calculateLinePath('added')
    },
    usedLinePath() {
      if (!this.timeSeriesData.length) return ''
      return this.calculateLinePath('used')
    },
    addedAreaPath() {
      if (!this.timeSeriesData.length) return ''
      return this.calculateAreaPath('added')
    },
    usedAreaPath() {
      if (!this.timeSeriesData.length) return ''
      return this.calculateAreaPath('used')
    },
    addedDataPoints() {
      if (!this.timeSeriesData.length) return []
      return this.calculateDataPoints('added')
    },
    usedDataPoints() {
      if (!this.timeSeriesData.length) return []
      return this.calculateDataPoints('used')
    },
    xAxisLabels() {
      if (!this.timeSeriesData.length) return []
      const count = this.timeSeriesData.length
      const step = count > 1 ? 720 / (count - 1) : 0
      const labels = []
      const showEvery = Math.max(1, Math.floor(count / 8)) // Show ~8 labels
      
      this.timeSeriesData.forEach((point, index) => {
        if (index % showEvery === 0 || index === count - 1) {
          labels.push({
            x: 60 + (step * index),
            label: `${point._id.month}/${point._id.day}`
          })
        }
      })
      return labels
    },
    chartTicks() {
      const max = this.maxTimeSeriesValue
      const top = Math.max(1, Math.ceil(max / 5) * 5)
      const step = Math.max(1, Math.round(top / 5))
      const ticks = []
      for (let i = 0; i <= 5; i++) {
        ticks.push(top - i * step)
      }
      return ticks
    },
    impactSegments() {
      const used = this.summary.totalItemsUsed || 0
      const donated = this.summary.totalItemsDonated || 0
      const expired = this.summary.totalItemsExpired || 0
      const unexpired = this.summary.totalUnexpiredItems || 0

      return [
        { key: 'used', label: 'Items Used', value: used, color: '#4CAF50' },
        { key: 'donated', label: 'Items Donated', value: donated, color: '#FF6B6B' },
        { key: 'unexpired', label: 'Unexpired Items', value: unexpired, color: '#90CAF9' },
        { key: 'expired', label: 'Expired Items', value: expired, color: '#FFC107' }
      ].filter(segment => segment.value > 0)
    },
    donutStyle() {
      const total = this.impactSegments.reduce((sum, segment) => sum + segment.value, 0)
      if (total === 0) {
        return {
          background: 'conic-gradient(#e0e0e0 0deg 360deg)'
        }
      }

      let cumulative = 0
      const gradients = this.impactSegments.map(segment => {
        const start = (cumulative / total) * 360
        cumulative += segment.value
        const end = (cumulative / total) * 360
        return `${segment.color} ${start}deg ${end}deg`
      })

      return {
        background: `conic-gradient(${gradients.join(', ')})`
      }
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
          this.loadTimeSeriesData()
        ])
      } catch (error) {
        console.error('Error loading analytics:', error)
        alert('Failed to load analytics data. Please try again.')
      } finally {
        this.isLoading = false
      }
    },

    getDateRange(rangeValue = 'all') {
      const today = new Date()
      const range = rangeValue || 'all'
      if (range === 'all') {
        return { startDate: null, endDate: null }
      }

      let startDate = null
      
      switch (range) {
        case 'today': {
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          startDate = startOfToday
          break
        }
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
      
      if (!startDate) {
        return { startDate: null, endDate: null }
      }

      return {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: today.toISOString().split('T')[0]
      }
    },

    async loadSummary(rangeValue = this.summaryRange) {
      this.isLoadingSummary = true
      try {
        const dateRange = this.getDateRange(rangeValue)
        let url = 'http://localhost:3001/api/analytics/summary'
        
        const params = new URLSearchParams()
        if (dateRange.startDate) {
          params.append('startDate', dateRange.startDate)
        }
        if (dateRange.endDate) {
          params.append('endDate', dateRange.endDate)
        }

        if ([...params.keys()].length > 0) {
          url += `?${params.toString()}`
        }
        
        const response = await fetch(url, {
          headers: {
            'x-user-id': user.value.id
          }
        })
        const result = await response.json()
        
        if (result.success) {
          this.summary = result.summary
          if (rangeValue === 'all') {
            this.hasAnyData = result.summary.totalItemsLogged > 0
          }
        }
      } catch (error) {
        console.error('Error loading summary:', error)
      } finally {
        this.isLoadingSummary = false
      }
    },

    async loadCategoryStats(rangeValue = this.categoryRange) {
      this.isLoadingCategories = true
      try {
        const dateRange = this.getDateRange(rangeValue)
        let url = 'http://localhost:3001/api/analytics/category-stats'
        const params = new URLSearchParams()
        if (dateRange.startDate) {
          params.append('startDate', dateRange.startDate)
        }
        if (dateRange.endDate) {
          params.append('endDate', dateRange.endDate)
        }
        if ([...params.keys()].length > 0) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url, {
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
      } finally {
        this.isLoadingCategories = false
      }
    },

    async loadTimeSeriesData(rangeValue = this.timeSeriesRange) {
      this.isLoadingTimeSeries = true
      try {
        const days = this.getDaysForRange(rangeValue)
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
      } finally {
        this.isLoadingTimeSeries = false
      }
    },

    getDaysForRange(rangeValue = 'month') {
      switch (rangeValue) {
        case 'today': return 1
        case 'week': return 7
        case 'month': return 30
        case '3months': return 90
        case 'year': return 365
        default: return 365
      }
    },

    handleSummaryRangeChange() {
      this.loadSummary()
    },

    handleCategoryRangeChange() {
      this.loadCategoryStats()
    },

    handleTimeSeriesRangeChange() {
      this.loadTimeSeriesData()
    },

    getRangeLabel(rangeValue) {
      const option = this.rangeOptions.find(option => option.value === rangeValue)
      return option ? option.label : 'All Time'
    },

    onChartTypeChange() {
      this.loadTimeSeriesData()
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

    calculateLinePath(type) {
      const max = this.maxTimeSeriesValue || 1
      const count = this.timeSeriesData.length
      if (count === 0) return ''
      
      const chartWidth = 720 // 780 - 60 (margins)
      const chartHeight = 210 // 250 - 40 (margins)
      const step = count > 1 ? chartWidth / (count - 1) : 0
      
      // Calculate all points first
      const points = this.timeSeriesData.map((point, index) => {
        const x = 60 + (step * index)
        const value = type === 'added' ? (point.added || 0) : (point.used || 0)
        const y = 20 + chartHeight - (value / max) * chartHeight
        return { x, y }
      })
      
      if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`
      }
      
      // Build smooth curve using cubic bezier
      let path = `M ${points[0].x} ${points[0].y}`
      
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const prev = i > 0 ? points[i - 1] : current
        const afterNext = i < points.length - 2 ? points[i + 2] : next
        
        // Calculate control points for smooth curve
        const cp1x = current.x + (next.x - prev.x) * 0.2
        const cp1y = current.y + (next.y - prev.y) * 0.2
        const cp2x = next.x - (afterNext.x - current.x) * 0.2
        const cp2y = next.y - (afterNext.y - current.y) * 0.2
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
      }
      
      return path
    },

    calculateAreaPath(type) {
      const max = this.maxTimeSeriesValue || 1
      const count = this.timeSeriesData.length
      if (count === 0) return ''
      
      const chartWidth = 720
      const chartHeight = 210
      const step = count > 1 ? chartWidth / (count - 1) : 0
      const bottomY = 20 + chartHeight
      
      // Calculate all points first
      const points = this.timeSeriesData.map((point, index) => {
        const x = 60 + (step * index)
        const value = type === 'added' ? (point.added || 0) : (point.used || 0)
        const y = 20 + chartHeight - (value / max) * chartHeight
        return { x, y }
      })
      
      if (points.length === 1) {
        return `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y} L ${points[0].x} ${bottomY} Z`
      }
      
      // Start from bottom left
      let path = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`
      
      // Build smooth curve using cubic bezier (same as line path)
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const prev = i > 0 ? points[i - 1] : current
        const afterNext = i < points.length - 2 ? points[i + 2] : next
        
        // Calculate control points for smooth curve
        const cp1x = current.x + (next.x - prev.x) * 0.2
        const cp1y = current.y + (next.y - prev.y) * 0.2
        const cp2x = next.x - (afterNext.x - current.x) * 0.2
        const cp2y = next.y - (afterNext.y - current.y) * 0.2
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
      }
      
      // Close the path
      const lastX = points[points.length - 1].x
      path += ` L ${lastX} ${bottomY} Z`
      
      return path
    },

    calculateDataPoints(type) {
      const max = this.maxTimeSeriesValue || 1
      const count = this.timeSeriesData.length
      if (count === 0) return []
      
      const chartWidth = 720
      const chartHeight = 210
      const step = count > 1 ? chartWidth / (count - 1) : 0
      
      return this.timeSeriesData.map((point, index) => {
        const x = 60 + (step * index)
        const value = type === 'added' ? (point.added || 0) : (point.used || 0)
        const y = 20 + chartHeight - (value / max) * chartHeight
        
        return {
          x,
          y,
          value,
          date: `${point._id.month}/${point._id.day}`
        }
      })
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

.analytics-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Section Filters */
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.section-header.compact {
  align-items: center;
}

.section-header p {
  margin: 6px 0 0;
  color: #6a7a6c;
  font-size: 0.9rem;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
}

.section-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.section-filter label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.85rem;
}

.section-filter select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  color: #2c3e50;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.section-filter select:hover {
  border-color: #4CAF50;
}

.section-filter select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.15);
}

.section-filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section-loading,
.section-empty {
  padding: 20px;
  text-align: center;
  color: #5b6d5b;
  font-weight: 500;
}

.section-empty {
  background: #fdfdf9;
  border: 1px dashed #dfe7d8;
  border-radius: 12px;
}

/* Summary Cards */
.summary-cards {
  margin: 0;
}

.overview-impact-row {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.overview-section {
  background: #f8fbf8;
  padding: 30px;
  border-radius: 20px;
  border: 1px solid #edf5ed;
  flex: 2;
}

.impact-section {
  flex: 1.4;
}

.overview-content {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  align-items: center;
  justify-content: space-between;
}

.donut-wrapper {
  flex: 1;
  min-width: 240px;
  display: flex;
  justify-content: center;
}

.donut-chart {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.08);
}

.donut-center {
  width: 140px;
  height: 140px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.center-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.1;
}

.center-label {
  font-size: 0.9rem;
  color: #5a6c5d;
}

.donut-legend {
  flex: 1;
  min-width: 260px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.legend-item {
  display: flex;
  gap: 12px;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #edf5ed;
  align-items: center;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 600;
  color: #2c3e50;
}

.legend-value {
  color: #5a6c5d;
  font-size: 0.9rem;
}

/* Impact Section */
.impact-section,
.stats-table-section,
.time-series-section {
  background: #f8fbf8;
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #edf5ed;
}

.impact-section h2,
.stats-table-section h2,
.time-series-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.time-series-header {
  flex-wrap: wrap;
  gap: 16px;
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

.chart-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.y-axis {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.axis-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.85rem;
  color: #5a6c5d;
  font-weight: 600;
}

.y-axis-ticks {
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.8rem;
  color: #7a8a7a;
}

.y-axis-ticks .tick {
  position: relative;
  padding-right: 10px;
}

.y-axis-ticks .tick::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 8px;
  height: 1px;
  background: #c8d5c8;
}

.chart-area {
  flex: 1;
}

/* Line Chart Styles */
.line-chart {
  width: 100%;
  height: 250px;
  background: #ffffff;
  border-radius: 12px;
  padding: 10px;
  box-sizing: border-box;
}

/* Grid lines */
.grid-line {
  stroke: #f0f0f0;
  stroke-width: 1;
  stroke-dasharray: 2, 2;
}

/* Y-axis title */
.y-axis-title {
  font-size: 12px;
  fill: #2c3e50;
  font-weight: 600;
}

/* Y-axis labels */
.y-labels {
  font-size: 11px;
  fill: #7a8a7a;
  font-weight: 500;
}

.y-label {
  font-size: 11px;
  fill: #7a8a7a;
  font-weight: 500;
}

/* Area fills */
.area-fill {
  opacity: 1;
}

/* Lines */
.line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line.added {
  stroke: #4CAF50;
}

.line.used {
  stroke: #2196F3;
}

/* Data points */
.data-point {
  fill: white;
  stroke-width: 3;
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point.added {
  stroke: #4CAF50;
}

.data-point.used {
  stroke: #2196F3;
}

.data-point:hover {
  r: 5;
  filter: brightness(1.1);
}

.data-point-inner {
  fill: white;
  pointer-events: none;
}

.data-point-inner.added {
  fill: #4CAF50;
}

.data-point-inner.used {
  fill: #2196F3;
}

/* X-axis labels */
.x-labels {
  font-size: 10px;
  fill: #7a8a7a;
  font-weight: 500;
}

.x-label {
  font-size: 10px;
  fill: #7a8a7a;
  font-weight: 500;
}

.x-axis-title {
  text-align: center;
  font-size: 0.85rem;
  color: #5a6c5d;
  font-weight: 600;
  margin-top: 8px;
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

/* Responsive */
@media (max-width: 768px) {
  .analytics-page {
    padding: 20px;
  }

  .analytics-card {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .overview-impact-row {
    flex-direction: column;
  }

  .overview-content {
    flex-direction: column;
    align-items: stretch;
  }

  .donut-wrapper {
    justify-content: center;
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

