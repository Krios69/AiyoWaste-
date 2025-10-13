<template>
  <div class="activate-page">
    <!-- 左侧品牌区域 -->
    <div class="left-section">
      <div class="brand-content">
        <!-- Logo区域 -->
        <div class="logo-container">
          <div class="logo-icon">
            <img src="../img/AiyoWaste 1.png" alt="AiyoWaste Logo" class="activate-logo" />
          </div>
        </div>
        
        <!-- Welcome文字 -->
        <h2 class="welcome-text">Almost There!</h2>
        <p class="welcome-subtitle">Activate your account to start your sustainable journey</p>
      </div>
    </div>

    <!-- 右侧激活表单区域 -->
    <div class="right-section">
      <div class="activate-container">
        <h3 class="activate-title">Account Activation</h3>
        <p class="activate-subtitle">Please enter the verification code and set your password</p>
        
        <form class="activate-form">
          <!-- 邮箱显示 -->
          <div class="form-group">
            <label>Email Address:</label>
            <div class="email-display">{{ email }}</div>
          </div>
          
          <!-- 验证码输入 -->
          <div class="form-group">
            <label for="verificationCode">6-Digit Verification Code:</label>
            <input 
              type="text" 
              id="verificationCode" 
              v-model="verificationCode"
              class="form-input code-input"
              placeholder="Enter 6-digit code"
              maxlength="6"
              @input="formatCode"
            />
            <div v-if="codeError" class="error-message">{{ codeError }}</div>
          </div>
          
          <!-- 新密码 -->
          <div class="form-group">
            <label for="newPassword">New Password:</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="newPassword"
              class="form-input"
              placeholder="Create a new password"
            />
            <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          </div>
          
          <!-- 确认密码 -->
          <div class="form-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword"
              class="form-input"
              placeholder="Confirm your password"
            />
            <div v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</div>
          </div>
          
          <!-- 激活按钮 -->
          <button 
            type="submit" 
            class="activate-button" 
            @click.prevent="handleActivation"
            :disabled="!canActivate"
          >
            {{ isLoading ? 'Activating...' : 'Activate Account' }}
          </button>
          
          <!-- 返回登录链接 -->
          <div class="login-link">
            <a href="#" @click.prevent="goToLogin">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActivatePage',
  data() {
    return {
      email: '',
      token: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
      codeError: '',
      passwordError: '',
      confirmPasswordError: '',
      isLoading: false
    }
  },
  computed: {
    canActivate() {
      return this.verificationCode.length === 6 && 
             this.newPassword.length >= 6 && 
             this.confirmPassword === this.newPassword &&
             !this.isLoading
    }
  },
  mounted() {
    // 从URL参数获取邮箱和激活令牌
    const urlParams = new URLSearchParams(window.location.search)
    this.email = urlParams.get('email') || ''
    this.token = urlParams.get('token') || ''
    
    if (!this.email || !this.token) {
      alert('Invalid activation link. Please check your email and try again.')
      this.$router.push('/login')
    }
  },
  methods: {
    formatCode() {
      // 只允许数字
      this.verificationCode = this.verificationCode.replace(/\D/g, '')
      this.codeError = ''
    },
    
    validatePassword() {
      if (this.newPassword.length < 6) {
        this.passwordError = 'Password must be at least 6 characters'
        return false
      }
      this.passwordError = ''
      return true
    },
    
    validateConfirmPassword() {
      if (this.confirmPassword !== this.newPassword) {
        this.confirmPasswordError = 'Passwords do not match'
        return false
      }
      this.confirmPasswordError = ''
      return true
    },
    
    async handleActivation() {
      // 验证输入
      if (this.verificationCode.length !== 6) {
        this.codeError = 'Please enter a valid 6-digit code'
        return
      }
      
      if (!this.validatePassword()) return
      if (!this.validateConfirmPassword()) return
      
      this.isLoading = true
      
      try {
        const response = await fetch('http://localhost:3001/api/activate-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            token: this.token,
            verificationCode: this.verificationCode,
            newPassword: this.newPassword
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Account activated successfully! You can now login.')
          this.$router.push('/login')
        } else {
          if (result.field === 'code') {
            this.codeError = result.message
          } else {
            alert('Activation failed: ' + result.message)
          }
        }
      } catch (error) {
        console.error('Activation error:', error)
        alert('Activation failed. Please try again.')
      } finally {
        this.isLoading = false
      }
    },
    
    goToLogin() {
      this.$router.push('/login')
    }
  },
  watch: {
    newPassword() {
      if (this.newPassword) {
        this.validatePassword()
      }
    },
    confirmPassword() {
      if (this.confirmPassword) {
        this.validateConfirmPassword()
      }
    }
  }
}
</script>

<style scoped>
.activate-page {
  display: flex;
  min-height: 100vh;
  height: auto;
  margin: 0;
  padding: 0;
  background-color: #B6CBB3;
}

/* 左侧区域 - 品牌展示 */
.left-section {
  flex: 0 0 50%;
  background-color: #B6CBB3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.brand-content {
  text-align: center;
  color: #333;
}

.logo-container {
  margin-bottom: 40px;
}

.logo-icon {
  margin-bottom: 20px;
}

.activate-logo {
  height: 200px;
  width: auto;
  object-fit: contain;
}

.welcome-text {
  font-size: 3.5rem;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #2c3e50, #27ae60);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: #5a6c5d;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

/* 右侧区域 - 激活表单 */
.right-section {
  flex: 0 0 50%;
  background-color: #DEEDDC;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.activate-container {
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

.activate-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
}

.activate-subtitle {
  font-size: 1rem;
  color: #666;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.5;
}

.activate-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e1e1e1;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #B6CBB3;
  box-shadow: 0 0 0 3px rgba(182, 203, 179, 0.1);
}

.email-display {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  border: 2px solid #e1e1e1;
  color: #555;
  font-family: monospace;
  font-size: 1rem;
}

.code-input {
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
}

.activate-button {
  background-color: #B6CBB3;
  color: #333;
  border: none;
  padding: 18px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.activate-button:hover:not(:disabled) {
  background-color: #a5b8a2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(182, 203, 179, 0.4);
}

.activate-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link a {
  color: #B6CBB3;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-link a:hover {
  color: #a5b8a2;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activate-page {
    flex-direction: column;
  }
  
  .left-section {
    flex: 0 0 40%;
  }
  
  .right-section {
    flex: 0 0 60%;
    padding: 20px;
  }
  
  .welcome-text {
    font-size: 2.5rem;
  }
  
  .activate-container {
    padding: 30px;
  }
}

@media (max-width: 480px) {
  .left-section {
    flex: 0 0 35%;
  }
  
  .right-section {
    flex: 0 0 65%;
    padding: 15px;
  }
  
  .welcome-text {
    font-size: 2rem;
  }
  
  .activate-container {
    padding: 25px;
  }
}
</style>
