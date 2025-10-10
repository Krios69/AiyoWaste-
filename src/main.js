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

const routes = [
  { path: '/', component: MainPage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/activate', component: ActivatePage },
  { path: '/admin', component: AdminPage },
  { path: '/food-inventory', component: FoodInventoryPage },
  { path: '/donations', component: DonationsPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')