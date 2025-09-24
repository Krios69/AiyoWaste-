<template>
  <div class="login-page">
    <!-- 左侧品牌区域 -->
    <div class="left-section">
      <div class="brand-content">
        <!-- Logo区域 -->
        <div class="logo-container">
          <div class="logo-icon">
            <img src="../img/AiyoWaste 1.png" alt="AiyoWaste Logo" class="login-logo" />
          </div>
        </div>
        
        <!-- Welcome文字 -->
        <h2 class="welcome-text">Welcome Back!</h2>
        <p class="welcome-subtitle">Join us in making the world a better place</p>
      </div>
    </div>

    <!-- 右侧登录表单区域 -->
    <div class="right-section">
      <div class="login-container">
        <h3 class="login-title">Login</h3>
        
        <form class="login-form">
          <div class="form-group">
            <label for="email">Email Address:</label>
            <input 
              type="email" 
              id="email" 
              v-model="email"
              class="form-input"
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              v-model="password"
              class="form-input"
              placeholder="Enter your password"
            />
          </div>
          
          <div class="register-link">
            <a href="#" @click.prevent="goToRegister">Register</a>
          </div>
          
          <button type="submit" class="login-button" @click.prevent="handleLogin">
            Login
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    async handleLogin() {
      // 验证输入
      if (!this.email || !this.password) {
        alert('Please enter both email and password')
        return
      }
      
      try {
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          // 登录成功，跳转到主页面
          alert('Login successful!')
          this.$router.push('/')
        } else {
          alert('Login failed: ' + result.message)
        }
      } catch (error) {
        console.error('Login error:', error)
        alert('Login failed. Please try again.')
      }
    },
    goToRegister() {
      // 跳转到注册页面
      this.$router.push('/register')
    }
  }
}
</script>

<style scoped>
.login-page {
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

.login-logo {
  height: 200px;
  width: auto;
  object-fit: contain;
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

/* 右侧区域 - 登录表单 */
.right-section {
  flex: 0 0 50%;
  background-color: #DEEDDC;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-container {
  background-color: #DEEDDC;
  border: 2px solid #B6CBB3;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 30px 0;
  text-align: center;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-form {
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

.register-link {
  text-align: center;
  margin: 10px 0;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.login-button {
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

.login-button:hover {
  background-color: #8BC34A;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.login-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  
  .left-section {
    flex: 0 0 40%;
  }
  
  .right-section {
    flex: 0 0 60%;
    padding: 20px;
  }
  
  .brand-name {
    font-size: 2rem;
  }
  
  .welcome-text {
    font-size: 2.5rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .login-container {
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
  
  .brand-name {
    font-size: 1.8rem;
  }
  
  .welcome-text {
    font-size: 2rem;
  }
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
  
  .login-container {
    padding: 25px;
  }
}
</style>
