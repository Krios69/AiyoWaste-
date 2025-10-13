<template>
  <div class="register-page">
    <!-- 左侧品牌区域 -->
    <div class="left-section">
      <div class="brand-content">
        <!-- Logo区域 -->
        <div class="logo-container">
          <div class="logo-icon">
            <img src="../img/AiyoWaste 1.png" alt="AiyoWaste Logo" class="register-logo" />
          </div>
        </div>
        
        <!-- Welcome文字 -->
        <h2 class="welcome-text">Join Our Mission!</h2>
        <p class="welcome-subtitle">Start your journey towards a sustainable future</p>
      </div>
    </div>

    <!-- 右侧注册表单区域 -->
    <div class="right-section">
      <div class="register-container">
        <h3 class="register-title">Create Account</h3>
        
        <form class="register-form">
          <div class="form-group">
            <label for="fullName">Full Name:</label>
            <input 
              type="text" 
              id="fullName" 
              v-model="fullName"
              class="form-input"
              placeholder="Enter your full name"
            />
          </div>
          
           <div class="form-group">
             <label for="email">Email Address:</label>
             <div class="email-input-group">
               <input 
                 type="email" 
                 id="email" 
                 v-model="email"
                 class="form-input email-input"
                 :class="{ 'error-input': emailError }"
                 placeholder="Enter your email"
                 @input="validateEmail"
                 @blur="validateEmail"
               />
               <button 
                 type="button" 
                 class="send-code-btn"
                 :disabled="!isEmailValid || isCodeSent"
                 @click="sendVerificationCode"
               >
                 {{ sendCodeButtonText }}
               </button>
             </div>
             <div v-if="emailError" class="error-message">{{ emailError }}</div>
             <div v-if="showDomainWarning && !emailError" class="warning-message">{{ domainWarningMessage }}</div>
             <div v-if="!emailError && email && !showDomainWarning" class="info-message">
               💡 Click "Send Code" to verify this email address exists
             </div>
           </div>
           
           <div class="form-group" v-if="isCodeSent">
             <label for="verificationCode">Verification Code:</label>
             <input 
               type="text" 
               id="verificationCode" 
               v-model="verificationCode"
               class="form-input"
               placeholder="Enter 6-digit code"
               maxlength="6"
             />
             <div v-if="verificationError" class="error-message">{{ verificationError }}</div>
           </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              v-model="password"
              class="form-input"
              placeholder="Create a password"
            />
          </div>
          
          
          <div class="form-group">
            <label for="householdSize">Household Size (Optional):</label>
            <select 
              id="householdSize" 
              v-model="householdSize"
              class="form-select"
            >
              <option value="">Select household size</option>
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
              <option value="5">5+ people</option>
            </select>
          </div>
          
          
          
          <div class="login-link">
            <a href="#" @click.prevent="goToLogin">Already have an account? Login</a>
          </div>
          
          <button type="submit" class="register-button" @click.prevent="handleRegister">
            Create Account
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterPage',
  data() {
    return {
      fullName: '',
      email: '',
      password: '',
      householdSize: '',
      enable2FA: false,
      verificationCode: '',
      isEmailValid: false,
      isCodeSent: false,
      countdown: 0,
      emailError: '',
      verificationError: '',
      showDomainWarning: false,
      domainWarningMessage: ''
    }
  },
  computed: {
    sendCodeButtonText() {
      if (this.countdown > 0) {
        return `Resend in ${this.countdown}s`
      }
      return this.isCodeSent ? 'Code Sent' : 'Send Code'
    }
  },
  methods: {
    validateEmail() {
      // 重置警告状态
      this.showDomainWarning = false
      this.domainWarningMessage = ''
      
      if (!this.email) {
        this.isEmailValid = false
        this.emailError = 'Email address is required'
        return
      }
      
      // 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.email)) {
        this.isEmailValid = false
        this.emailError = 'Please enter a valid email address (e.g., user@example.com)'
        return
      }
      
      // 检查邮箱长度
      if (this.email.length > 254) {
        this.isEmailValid = false
        this.emailError = 'Email address is too long'
        return
      }
      
      // 检查是否包含无效字符
      const invalidChars = /[<>]/
      if (invalidChars.test(this.email)) {
        this.isEmailValid = false
        this.emailError = 'Email address contains invalid characters'
        return
      }
      
        // 检查域名部分
        const parts = this.email.split('@')
        if (parts.length === 2) {
          const domain = parts[1].toLowerCase()
          
          // 检查域名长度（至少5个字符）
          if (domain.length < 5) {
            this.isEmailValid = false
            this.emailError = 'Email domain is too short. Please use a real email domain.'
            return
          }
          
          if (!domain.includes('.')) {
            this.isEmailValid = false
            this.emailError = 'Email must have a valid domain (e.g., .com, .org)'
            return
          }
          
          // 扩展的无效域名列表
          const invalidDomains = [
            'example.com', 'test.com', 'invalid.com', 'fake.com', 'temp.com', 'demo.com', 'sample.com',
            'g.com', 'a.com', 'b.com', 'c.com', 'd.com', 'e.com', 'f.com', 'h.com', 'i.com', 'j.com',
            'k.com', 'l.com', 'm.com', 'n.com', 'o.com', 'p.com', 'q.com', 'r.com', 's.com', 't.com',
            'u.com', 'v.com', 'w.com', 'x.com', 'y.com', 'z.com', '1.com', '2.com', '3.com',
            'localhost', 'local', 'test.local', 'example.local'
          ]
          
          if (invalidDomains.includes(domain)) {
            this.isEmailValid = false
            this.emailError = 'Please use a real email address. This domain is not valid.'
            return
          }
          
          // 检查域名格式
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
          if (!domainRegex.test(domain)) {
            this.isEmailValid = false
            this.emailError = 'Invalid domain format'
            return
          }
          
          // 检查是否为可疑的短域名（如 g.com, a.com 等）
          const domainParts = domain.split('.')
          if (domainParts.length >= 2) {
            const mainDomain = domainParts[0]
            if (mainDomain.length <= 2) {
              this.isEmailValid = false
              this.emailError = 'Suspicious domain detected. Please use a real email address.'
              return
            }
          }
          
          // 检查是否为已知的真实邮箱服务商（可选验证）
          const commonProviders = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
            '163.com', 'qq.com', 'sina.com', 'sohu.com', '126.com',
            'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com'
          ]
          
          // 如果不是常见服务商，显示警告但不阻止
          if (!commonProviders.includes(domain)) {
            this.showDomainWarning = true
            this.domainWarningMessage = `Uncommon domain "${domain}". Please ensure this is a real email address.`
          } else {
            this.showDomainWarning = false
          }
        }
      
      this.isEmailValid = true
      this.emailError = ''
    },
    
    async sendVerificationCode() {
      if (!this.isEmailValid) {
        this.emailError = 'Please enter a valid email address'
        return
      }
      
      try {
        const response = await fetch('http://localhost:3001/api/send-verification-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: this.email })
        })
        
        const result = await response.json()
        
        if (result.success) {
          this.isCodeSent = true
          this.startCountdown()
          this.emailError = ''
          alert(`Verification code sent to ${this.email}`)
        } else {
          // 根据不同的错误类型显示不同的提示
          if (result.message && result.message.includes('not found')) {
            this.emailError = 'This email address does not exist. Please check and try again.'
          } else if (result.message && result.message.includes('invalid')) {
            this.emailError = 'Invalid email address. Please enter a valid email.'
          } else if (result.message && result.message.includes('blocked')) {
            this.emailError = 'This email address is blocked. Please use a different email.'
          } else {
            this.emailError = result.message || 'Failed to send verification code'
          }
        }
      } catch (error) {
        console.error('Failed to send verification code:', error)
        this.emailError = 'Network error. Please check your connection and try again.'
      }
    },
    
    startCountdown() {
      this.countdown = 60
      const timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    },
    
    async verifyCode() {
      if (!this.verificationCode || this.verificationCode.length !== 6) {
        this.verificationError = 'Please enter a valid 6-digit code'
        return false
      }
      
      try {
        const response = await fetch('http://localhost:3001/api/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: this.email, 
            code: this.verificationCode 
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          this.verificationError = ''
          return true
        } else {
          this.verificationError = result.message || 'Invalid verification code'
          return false
        }
      } catch (error) {
        console.error('Failed to verify code:', error)
        this.verificationError = 'Failed to verify code. Please try again.'
        return false
      }
    },
    
    async handleRegister() {
      // 验证验证码
      if (this.isCodeSent) {
        const isCodeValid = await this.verifyCode()
        if (!isCodeValid) {
          return
        }
      }
      
      // 调用后端注册API
      try {
        const response = await fetch('http://localhost:3001/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: this.fullName,
            email: this.email,
            password: this.password,
            householdSize: this.householdSize
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert('Registration successful! Please check your email to activate your account.')
          this.$router.push('/login')
        } else {
          alert('Registration failed: ' + result.message)
        }
      } catch (error) {
        console.error('Registration error:', error)
        alert('Registration failed. Please try again.')
      }
    },
    
    goToLogin() {
      // 跳转到登录页面
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.register-page {
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

.register-logo {
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

/* 右侧区域 - 注册表单 */
.right-section {
  flex: 0 0 50%;
  background-color: #DEEDDC;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.register-container {
  background-color: #DEEDDC;
  border: 2px solid #B6CBB3;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.register-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 30px 0;
  text-align: center;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f5f5f5;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #B6CBB3;
  background-color: white;
}

.error-input {
  border-color: #e74c3c !important;
  background-color: #fdf2f2 !important;
}

.error-input:focus {
  border-color: #e74c3c !important;
  background-color: #fdf2f2 !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}

.email-input-group {
  display: flex;
  gap: 10px;
}

.email-input {
  flex: 1;
}

.send-code-btn {
  background-color: #B6CBB3;
  border: 2px solid #B6CBB3;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.send-code-btn:hover:not(:disabled) {
  background-color: #9BB89A;
  border-color: #9BB89A;
}

.send-code-btn:disabled {
  background-color: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  animation: shake 0.5s ease-in-out;
}

.error-message::before {
  content: "⚠️";
  font-size: 0.8rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.info-message {
  color: #27ae60;
  font-size: 0.85rem;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 400;
  font-style: italic;
}

.warning-message {
  color: #f39c12;
  font-size: 0.85rem;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  background-color: #fef9e7;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #f39c12;
}

.warning-message::before {
  content: "⚠️";
  font-size: 0.8rem;
}

.form-select {
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f5f5f5;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #B6CBB3;
  background-color: white;
}

.privacy-section {
  margin: 10px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: #B6CBB3;
}

.checkbox-text {
  font-weight: 400;
}

.login-link {
  text-align: center;
  margin: 10px 0;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

.register-button {
  background-color: #B0E66C;
  border: 2px solid #B6CBB3;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.register-button:hover {
  background-color: #8BC34A;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.register-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-page {
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
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .register-container {
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
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
  
  .register-container {
    padding: 25px;
  }
}
</style>
