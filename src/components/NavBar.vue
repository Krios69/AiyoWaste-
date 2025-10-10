<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <img src="../img/AiyoWaste 1.png" alt="AiyoWaste Logo" class="logo" />
      </div>
      <div class="nav-right">
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/" class="nav-link">Home</router-link>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Food Analytics</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Plan</a>
          </li>
          <li class="nav-item">
            <router-link to="/food-inventory" class="nav-link">Food Inventory</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/browse-food" class="nav-link">Browse Food</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin" class="nav-link">Admin</router-link>
          </li>
          <li class="nav-item" v-if="!isLoggedIn">
            <router-link to="/login" class="nav-link">Login</router-link>
          </li>
          <li class="nav-item" v-if="isLoggedIn">
            <a href="#" class="nav-link" @click.prevent="handleLogout">Logout</a>
          </li>
        </ul>
        <div class="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="white"/>
            <circle cx="18" cy="5" r="4" fill="#ff4444"/>
          </svg>
        </div>
        
        <div class="profile-icon" v-if="isLoggedIn" @click="handleProfileClick">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
            <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { inject } from 'vue'
import { isLoggedIn } from '../store/auth.js'

export default {
  name: 'NavBar',
  setup() {
    const auth = inject('auth')
    
    const handleLogout = () => {
      if (confirm('Are you sure you want to logout?')) {
        auth.logout()
        // 可以在这里添加跳转到主页的逻辑
        window.location.href = '/'
      }
    }
    
    const handleProfileClick = () => {
      // 跳转到profile页面
      window.location.href = '/profile'
    }
    
    return {
      isLoggedIn,
      handleLogout,
      handleProfileClick
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #B6CBB3;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 90px;
}

.logo {
  height: 80px;
  width: auto;
  object-fit: contain;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 30px;
}

.notification-icon {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  position: relative;
}

.notification-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.profile-icon {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  position: relative;
  margin-left: 10px;
}

.profile-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item {
  margin: 0;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 15px 20px;
  }
  
  .nav-right {
    flex-direction: column;
    gap: 15px;
    margin-top: 15px;
  }
  
  .nav-menu {
    gap: 20px;
  }
}
</style>
