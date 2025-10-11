<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Logo Brand -->
      <div class="nav-brand">
        <router-link to="/" class="logo-link">
          <img src="../img/AiyoWaste 1.png" alt="AiyoWaste Logo" class="logo" />
        </router-link>
      </div>

      <!-- Mobile Menu Toggle -->
      <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Toggle menu">
        <span class="hamburger-line" :class="{ 'active': mobileMenuOpen }"></span>
        <span class="hamburger-line" :class="{ 'active': mobileMenuOpen }"></span>
        <span class="hamburger-line" :class="{ 'active': mobileMenuOpen }"></span>
      </button>

      <!-- Navigation Right Section -->
      <div class="nav-right" :class="{ 'mobile-open': mobileMenuOpen }">
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/" class="nav-link" @click="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Home</span>
            </router-link>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link" @click.prevent="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 9L13 14L9 10L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Analytics</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link" @click.prevent="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Plan</span>
            </a>
          </li>
          <li class="nav-item">
            <router-link to="/food-inventory" class="nav-link" @click="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Inventory</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/browse-food" class="nav-link" @click="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Browse</span>
            </router-link>
          </li>
        </ul>

        <!-- Action Icons -->
        <div class="action-icons">
          <div class="icon-wrapper notification-wrapper">
            <div class="notification-icon" title="Notifications">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
              </svg>
              <span class="notification-badge">3</span>
            </div>
          </div>

          <div class="icon-wrapper" v-if="isLoggedIn">
            <div class="profile-icon" @click="handleProfileClick" title="Profile">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          <div class="login-btn-wrapper" v-if="!isLoggedIn">
            <router-link to="/login" class="login-btn" @click="closeMobileMenu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Login</span>
            </router-link>
          </div>

          <div class="logout-btn-wrapper" v-if="isLoggedIn">
            <button class="logout-btn" @click="handleLogout" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { inject, ref } from 'vue'
import { isLoggedIn } from '../store/auth.js'

export default {
  name: 'NavBar',
  setup() {
    const auth = inject('auth')
    const mobileMenuOpen = ref(false)
    
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }
    
    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
    }
    
    const handleLogout = () => {
      if (confirm('Are you sure you want to logout?')) {
        auth.logout()
        closeMobileMenu()
        window.location.href = '/'
      }
    }
    
    const handleProfileClick = () => {
      closeMobileMenu()
      window.location.href = '/profile'
    }
    
    return {
      isLoggedIn,
      mobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      handleLogout,
      handleProfileClick
    }
  }
}
</script>

<style scoped>
.navbar {
  background: #7b9977;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  height: 90px;
  position: relative;
}

.nav-brand {
  display: flex;
  align-items: center;
  z-index: 1001;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo {
  height: 80px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background-color: white;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.hamburger-line.active:nth-child(1) {
  transform: translateY(11px) rotate(45deg);
}

.hamburger-line.active:nth-child(2) {
  opacity: 0;
}

.hamburger-line.active:nth-child(3) {
  transform: translateY(-11px) rotate(-45deg);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
  align-items: center;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 10px 18px;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: -1;
}

.nav-link:hover::before {
  transform: translateX(0);
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  flex-shrink: 0;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  position: relative;
}

.notification-icon,
.profile-icon {
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-icon:hover,
.profile-icon:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-wrapper {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #ff4444, #ff6b6b);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(255, 68, 68, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.login-btn,
.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
  text-decoration: none;
}

.login-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.login-btn:hover {
  background: white;
  color: #86b080;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logout-btn {
  background: transparent;
  color: white;
}

.logout-btn:hover {
  background: rgba(255, 68, 68, 0.2);
  border-color: rgba(255, 68, 68, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
}

/* Responsive Design */
@media (max-width: 992px) {
  .nav-container {
    padding: 0 20px;
    height: 85px;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-right {
    position: fixed;
    top: 0;
    right: -100%;
    width: 300px;
    height: 100vh;
    background: #86b080;
    flex-direction: column;
    justify-content: flex-start;
    padding: 100px 30px 30px;
    gap: 0;
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    overflow-y: auto;
  }

  .nav-right.mobile-open {
    right: 0;
  }

  .nav-menu {
    flex-direction: column;
    width: 100%;
    gap: 0;
    margin-bottom: 30px;
  }

  .nav-item {
    width: 100%;
  }

  .nav-link {
    width: 100%;
    padding: 16px 20px;
    border-radius: 12px;
    justify-content: flex-start;
    margin-bottom: 8px;
    font-size: 1rem;
  }

  .action-icons {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .icon-wrapper,
  .login-btn-wrapper,
  .logout-btn-wrapper {
    width: 100%;
  }

  .notification-icon,
  .profile-icon {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    justify-content: center;
  }

  .login-btn,
  .logout-btn {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
    font-size: 1rem;
  }

  .logo {
    height: 70px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 16px;
  }

  .nav-right {
    width: 100%;
    right: -100%;
  }

  .logo {
    height: 65px;
  }
}

/* Smooth scrolling for mobile menu */
.nav-right::-webkit-scrollbar {
  width: 6px;
}

.nav-right::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.nav-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.nav-right::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
