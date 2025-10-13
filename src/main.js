import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import MainPage from './components/MainPage.vue'
import LoginPage from './components/LoginPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import ActivatePage from './components/ActivatePage.vue'
import AdminPage from './components/AdminPage.vue'
import FoodInventoryPage from './components/FoodInventoryPage.vue'
import DonationsPage from './components/DonationsPage.vue'
import BrowseFoodPage from './components/BrowseFoodPage.vue'
import ProfilePage from './components/ProfilePage.vue'
import { auth } from './store/auth.js'

const routes = [
  { path: '/', component: MainPage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/activate', component: ActivatePage },
  { path: '/admin', component: AdminPage },
  { path: '/food-inventory', component: FoodInventoryPage },
  { path: '/donations', component: DonationsPage },
  { path: '/browse-food', component: BrowseFoodPage },
  { path: '/profile', component: ProfilePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建应用实例
const app = createApp(App)

// 初始化认证状态
auth.init()

// 提供认证状态给整个应用
app.provide('auth', auth)

app.use(router).mount('#app')