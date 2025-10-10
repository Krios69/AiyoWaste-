<template>
  <div class="admin-page">
    <div class="admin-container">
      <h1 class="admin-title">AiyoWaste Admin Panel</h1>
      <p class="admin-subtitle">Manage user accounts for testing</p>
      
      <!-- 刷新按钮 -->
      <div class="action-bar">
        <button @click="loadUsers" class="refresh-btn" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Refresh Users' }}
        </button>
        <div class="user-count">Total Users: {{ users.length }}</div>
      </div>
      
      <!-- 用户列表 -->
      <div class="users-section">
        <h2>Registered Users</h2>
        
        <div v-if="users.length === 0" class="no-users">
          No users found in database
        </div>
        
        <div v-else class="users-list">
          <div v-for="user in users" :key="user._id" class="user-card">
            <div class="user-info">
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-details">
                <span class="detail-item">
                  <strong>Status:</strong> 
                  <span :class="user.isActive ? 'status-active' : 'status-inactive'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </span>
                <span class="detail-item">
                  <strong>Email Verified:</strong> 
                  <span :class="user.emailVerified ? 'status-active' : 'status-inactive'">
                    {{ user.emailVerified ? 'Yes' : 'No' }}
                  </span>
                </span>
                <span class="detail-item">
                  <strong>Household Size:</strong> {{ user.householdSize || 'Not specified' }}
                </span>
                <span class="detail-item">
                  <strong>Created:</strong> {{ formatDate(user.createdAt) }}
                </span>
                <span v-if="user.activatedAt" class="detail-item">
                  <strong>Activated:</strong> {{ formatDate(user.activatedAt) }}
                </span>
              </div>
            </div>
            
            <div class="user-actions">
              <button 
                @click="deleteUser(user._id, user.email)" 
                class="delete-btn"
                :disabled="isDeleting === user._id"
              >
                {{ isDeleting === user._id ? 'Deleting...' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 激活令牌列表 -->
      <div class="tokens-section">
        <h2>Activation Tokens</h2>
        
        <div v-if="tokens.length === 0" class="no-tokens">
          No activation tokens found
        </div>
        
        <div v-else class="tokens-list">
          <div v-for="token in tokens" :key="token._id" class="token-card">
            <div class="token-info">
              <div class="token-email">{{ token.email }}</div>
              <div class="token-details">
                <span class="detail-item">
                  <strong>Token:</strong> {{ token.token.substring(0, 10) }}...
                </span>
                <span class="detail-item">
                  <strong>Code:</strong> {{ token.code }}
                </span>
                <span class="detail-item">
                  <strong>Used:</strong> 
                  <span :class="token.used ? 'status-active' : 'status-inactive'">
                    {{ token.used ? 'Yes' : 'No' }}
                  </span>
                </span>
                <span class="detail-item">
                  <strong>Expires:</strong> {{ formatDate(token.expiresAt) }}
                </span>
              </div>
            </div>
            
            <div class="token-actions">
              <button 
                @click="deleteToken(token._id)" 
                class="delete-btn"
                :disabled="isDeletingToken === token._id"
              >
                {{ isDeletingToken === token._id ? 'Deleting...' : 'Delete Token' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 验证码列表 -->
      <div class="codes-section">
        <h2>Verification Codes</h2>
        
        <div v-if="codes.length === 0" class="no-codes">
          No verification codes found
        </div>
        
        <div v-else class="codes-list">
          <div v-for="code in codes" :key="code._id" class="code-card">
            <div class="code-info">
              <div class="code-email">{{ code.email }}</div>
              <div class="code-details">
                <span class="detail-item">
                  <strong>Code:</strong> {{ code.code }}
                </span>
                <span class="detail-item">
                  <strong>Attempts:</strong> {{ code.attempts || 0 }}
                </span>
                <span class="detail-item">
                  <strong>Verified:</strong> 
                  <span :class="code.verified ? 'status-active' : 'status-inactive'">
                    {{ code.verified ? 'Yes' : 'No' }}
                  </span>
                </span>
                <span class="detail-item">
                  <strong>Created:</strong> {{ formatDate(code.createdAt) }}
                </span>
              </div>
            </div>
            
            <div class="code-actions">
              <button 
                @click="deleteCode(code._id)" 
                class="delete-btn"
                :disabled="isDeletingCode === code._id"
              >
                {{ isDeletingCode === code._id ? 'Deleting...' : 'Delete Code' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="back-section">
        <button @click="goBack" class="back-btn">Back to Main Page</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPage',
  data() {
    return {
      users: [],
      tokens: [],
      codes: [],
      isLoading: false,
      isDeleting: null,
      isDeletingToken: null,
      isDeletingCode: null
    }
  },
  mounted() {
    this.loadUsers()
    this.loadTokens()
    this.loadCodes()
  },
  methods: {
    async loadUsers() {
      this.isLoading = true
      try {
        const response = await fetch('http://localhost:3001/api/admin/users')
        const result = await response.json()
        
        if (result.success) {
          this.users = result.users
        } else {
          alert('Failed to load users: ' + result.message)
        }
      } catch (error) {
        console.error('Error loading users:', error)
        alert('Failed to load users. Please try again.')
      } finally {
        this.isLoading = false
      }
    },
    
    async loadTokens() {
      try {
        const response = await fetch('http://localhost:3001/api/admin/tokens')
        const result = await response.json()
        
        if (result.success) {
          this.tokens = result.tokens
        }
      } catch (error) {
        console.error('Error loading tokens:', error)
      }
    },
    
    async loadCodes() {
      try {
        const response = await fetch('http://localhost:3001/api/admin/codes')
        const result = await response.json()
        
        if (result.success) {
          this.codes = result.codes
        }
      } catch (error) {
        console.error('Error loading codes:', error)
      }
    },
    
    async deleteUser(userId, email) {
      if (!confirm(`Are you sure you want to delete user: ${email}?`)) {
        return
      }
      
      this.isDeleting = userId
      try {
        const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          alert('User deleted successfully!')
          this.loadUsers()
          this.loadTokens()
          this.loadCodes()
        } else {
          alert('Failed to delete user: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user. Please try again.')
      } finally {
        this.isDeleting = null
      }
    },
    
    async deleteToken(tokenId) {
      if (!confirm('Are you sure you want to delete this activation token?')) {
        return
      }
      
      this.isDeletingToken = tokenId
      try {
        const response = await fetch(`http://localhost:3001/api/admin/tokens/${tokenId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Token deleted successfully!')
          this.loadTokens()
        } else {
          alert('Failed to delete token: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting token:', error)
        alert('Failed to delete token. Please try again.')
      } finally {
        this.isDeletingToken = null
      }
    },
    
    async deleteCode(codeId) {
      if (!confirm('Are you sure you want to delete this verification code?')) {
        return
      }
      
      this.isDeletingCode = codeId
      try {
        const response = await fetch(`http://localhost:3001/api/admin/codes/${codeId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        
        if (result.success) {
          alert('Code deleted successfully!')
          this.loadCodes()
        } else {
          alert('Failed to delete code: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting code:', error)
        alert('Failed to delete code. Please try again.')
      } finally {
        this.isDeletingCode = null
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString()
    },
    
    goBack() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #DEEDDC;
  padding: 20px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.admin-title {
  font-size: 2.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 10px;
}

.admin-subtitle {
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.refresh-btn {
  background-color: #B6CBB3;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #a5b8a2;
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.user-count {
  font-weight: 600;
  color: #333;
}

.users-section, .tokens-section, .codes-section {
  margin-bottom: 40px;
}

.users-section h2, .tokens-section h2, .codes-section h2 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #B6CBB3;
}

.no-users, .no-tokens, .no-codes {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.users-list, .tokens-list, .codes-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-card, .token-card, .code-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e1e1e1;
  transition: all 0.3s ease;
}

.user-card:hover, .token-card:hover, .code-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-info, .token-info, .code-info {
  flex: 1;
}

.user-name, .token-email, .code-email {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.user-details, .token-details, .code-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.9rem;
}

.detail-item {
  color: #666;
}

.status-active {
  color: #27ae60;
  font-weight: 600;
}

.status-inactive {
  color: #e74c3c;
  font-weight: 600;
}

.user-actions, .token-actions, .code-actions {
  margin-left: 20px;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-1px);
}

.delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-section {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #B6CBB3;
}

.back-btn {
  background-color: #B6CBB3;
  color: #333;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #a5b8a2;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-container {
    padding: 20px;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 10px;
  }
  
  .user-card, .token-card, .code-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-actions, .token-actions, .code-actions {
    margin-left: 0;
    margin-top: 15px;
    width: 100%;
  }
  
  .delete-btn {
    width: 100%;
  }
  
  .user-details, .token-details, .code-details {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
