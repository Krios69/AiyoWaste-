import { reactive, computed } from 'vue'

// 全局认证状态
const state = reactive({
  isLoggedIn: false,
  user: null
})

// 认证相关的方法
const auth = {
  // 登录
  login(userData) {
    state.isLoggedIn = true
    state.user = userData
    // 将登录状态保存到localStorage
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('user', JSON.stringify(userData))
  },
  
  // 登出
  logout() {
    state.isLoggedIn = false
    state.user = null
    // 清除localStorage
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
  },
  
  // 初始化状态（从localStorage恢复）
  init() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const userStr = localStorage.getItem('user')
    
    if (isLoggedIn && userStr) {
      state.isLoggedIn = true
      state.user = JSON.parse(userStr)
    }
  }
}

// 计算属性
const isLoggedIn = computed(() => state.isLoggedIn)
const user = computed(() => state.user)

export { auth, isLoggedIn, user }
