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
          <li class="nav-item">
            <router-link to="/meal-planner" class="nav-link" @click="handlePlanClick">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Plan</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/analytics" class="nav-link" @click="closeMobileMenu">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 9L13 14L9 10L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Analytics</span>
            </router-link>
          </li>
        </ul>

        <!-- Action Icons -->
        <div class="action-icons">
          <div
            class="icon-wrapper notification-wrapper"
            ref="notificationWrapperRef"
          >
            <button
              class="notification-icon"
              :class="{ active: notificationPanelOpen }"
              type="button"
              title="Notifications"
              @click.stop="toggleNotificationPanel"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
              </svg>
              <span
                v-if="unreadCount > 0"
                class="notification-badge"
                title="You have unread notifications"
              ></span>
            </button>

            <div
              v-if="notificationPanelOpen"
              class="notification-panel"
              @click.stop
            >
              <div class="notification-panel__header">
                <h4>Notifications</h4>
                <button
                  class="notification-panel__mark-all"
                  type="button"
                  @click="handleMarkAllRead"
                  :disabled="isMarkingAll || unreadCount === 0"
                >
                  {{ isMarkingAll ? 'Updating...' : 'Mark all as read' }}
                </button>
              </div>
              <div class="notification-panel__body">
                <div
                  v-if="isLoadingNotifications"
                  class="notification-panel__state"
                >
                  Loading notifications...
                </div>
                <div
                  v-else-if="loadError"
                  class="notification-panel__state state-error"
                >
                  {{ loadError }}
                </div>
                <div
                  v-else-if="notifications.length === 0"
                  class="notification-panel__state"
                >
                  No new notifications
                </div>
                <ul v-else class="notification-list">
                  <li
                    v-for="notification in notifications"
                    :key="notification._id"
                    class="notification-item"
                    :class="{ unread: notification.status !== 'read' }"
                  >
                    <button
                      class="notification-item__button"
                      type="button"
                      @click="openNotificationModal(notification)"
                    >
                      <div class="notification-item__content">
                        <div class="notification-item__title">
                          {{ notification.title }}
                        </div>
                        <div class="notification-item__message">
                          {{ notification.message }}
                        </div>
                        <div class="notification-item__meta">
                          {{ formatNotificationTime(notification) }}
                        </div>
                      </div>
                    </button>
                  </li>
                </ul>
        <transition name="modal-fade">
          <div
            v-if="activeNotification"
            class="notification-modal-overlay"
            @click="closeNotificationModal"
          >
            <div
              class="notification-modal"
              @click.stop
            >
              <div class="notification-modal__header">
                <h3>{{ activeNotification.title }}</h3>
                <button class="modal-close-btn" @click="closeNotificationModal">✕</button>
              </div>
              <div class="notification-modal__body">
                <p class="notification-modal__message">
                  {{ activeNotification.message }}
                </p>
                <dl class="notification-modal__details">
                  <div>
                    <dt>Received</dt>
                    <dd>{{ formatNotificationTime(activeNotification) }}</dd>
                  </div>
                  <div v-if="activeNotification.metadata?.pickupLocation">
                    <dt>Pickup</dt>
                    <dd>{{ activeNotification.metadata.pickupLocation }}</dd>
                  </div>
                  <div v-if="activeNotification.metadata?.availableTime">
                    <dt>Availability</dt>
                    <dd>{{ activeNotification.metadata.availableTime }}</dd>
                  </div>
                  <div v-if="activeNotification.metadata?.contact">
                    <dt>Contact</dt>
                    <dd>{{ activeNotification.metadata.contact }}</dd>
                  </div>
                  <div v-if="activeNotification.metadata?.expiryDate">
                    <dt>Expiry</dt>
                    <dd>{{ formatDateDisplay(activeNotification.metadata.expiryDate) }}</dd>
                  </div>
                  <div v-if="activeNotification.metadata?.notes">
                    <dt>Notes</dt>
                    <dd>{{ activeNotification.metadata.notes }}</dd>
                  </div>
                </dl>
              </div>
              <div class="notification-modal__footer">
                <button
                  class="modal-action-btn"
                  type="button"
                  @click="handleNotificationAction"
                >
                  View related page
                </button>
              </div>
            </div>
          </div>
        </transition>
              </div>
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

          <div class="auth-buttons" v-if="!isLoggedIn">
            <router-link to="/register" class="register-btn" @click="closeMobileMenu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 11H23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Register</span>
            </router-link>
            
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
import { inject, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { isLoggedIn, user } from '../store/auth.js'
import { fetchNotifications, markNotificationAsRead, markAllNotificationsRead } from '../services/notificationService.js'

export default {
  name: 'NavBar',
  setup() {
    const auth = inject('auth')
    const router = useRouter()
    const mobileMenuOpen = ref(false)
    const notificationWrapperRef = ref(null)
    const notificationPanelOpen = ref(false)
    const notifications = ref([])
    const isLoadingNotifications = ref(false)
    const loadError = ref('')
    const isMarkingAll = ref(false)
    const activeNotification = ref(null)

    const unreadCount = computed(() =>
      notifications.value.filter(notification => notification.status !== 'read').length
    )

    const closeNotificationModal = () => {
      activeNotification.value = null
    }

    const closeNotificationPanel = () => {
      notificationPanelOpen.value = false
      closeNotificationModal()
    }

    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
      closeNotificationPanel()
    }
    
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
      if (mobileMenuOpen.value) {
        closeNotificationPanel()
      }
    }
    
    const loadNotifications = async () => {
      loadError.value = ''
      isLoadingNotifications.value = true
      try {
        const result = await fetchNotifications(user.value?.id)
        notifications.value = Array.isArray(result.notifications) ? result.notifications : []
        closeNotificationModal()
      } catch (error) {
        console.error('Failed to load notifications:', error)
        loadError.value = error.message || 'Unable to load notifications'
      } finally {
        isLoadingNotifications.value = false
      }
    }

    const toggleNotificationPanel = async () => {
      if (!isLoggedIn.value) {
        closeNotificationPanel()
        closeMobileMenu()
        router.push('/login')
        return
      }

      if (!notificationPanelOpen.value) {
        notificationPanelOpen.value = true
        await loadNotifications()
      } else {
        closeNotificationPanel()
      }
    }

    const setNotificationRead = async notification => {
      try {
        if (notification.status !== 'read') {
          await markNotificationAsRead(notification._id, user.value?.id)
          notification.status = 'read'
        }
      } catch (error) {
        console.error('Failed to update notification:', error)
        loadError.value = error.message || 'Unable to update notification'
      }
    }

    const openNotificationModal = async notification => {
      await setNotificationRead(notification)
      activeNotification.value = notification
    }

    const handleNotificationAction = () => {
      if (!activeNotification.value) {
        return
      }
      const target = activeNotification.value
      closeNotificationModal()
      closeNotificationPanel()
      closeMobileMenu()
      if (target.link) {
        router.push(target.link)
      }
    }

    const handleMarkAllRead = async () => {
      if (unreadCount.value === 0) {
        return
      }
      isMarkingAll.value = true
      try {
        await markAllNotificationsRead(user.value?.id)
        notifications.value = notifications.value.map(notification => ({
          ...notification,
          status: 'read'
        }))
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
        loadError.value = error.message || 'Unable to update notifications'
      } finally {
        isMarkingAll.value = false
      }
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
      closeNotificationPanel()
      window.location.href = '/profile'
    }

    const handlePlanClick = event => {
      event?.preventDefault?.()
      closeMobileMenu()
      closeNotificationPanel()
      router.push('/meal-planner')
    }

    const handleDocumentClick = event => {
      if (!notificationPanelOpen.value) {
        return
      }
      if (notificationWrapperRef.value && !notificationWrapperRef.value.contains(event.target)) {
        if (activeNotification.value) {
          closeNotificationModal()
        } else {
          closeNotificationPanel()
        }
      }
    }

    const handleKeydown = event => {
      if (event.key === 'Escape') {
        if (activeNotification.value) {
          closeNotificationModal()
          return
        }
        closeNotificationPanel()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleDocumentClick)
      document.addEventListener('keydown', handleKeydown)
      // Load notifications if user is logged in
      if (isLoggedIn.value && user.value?.id) {
        loadNotifications()
      }
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('keydown', handleKeydown)
    })

    const formatNotificationTime = notification => {
      const timestamp = notification.updatedAt || notification.createdAt
      if (!timestamp) {
        return ''
      }
      try {
        return new Date(timestamp).toLocaleString()
      } catch (error) {
        console.error('Failed to format notification time:', error)
        return ''
      }
    }

    const formatDateDisplay = value => {
      if (!value) return ''
      try {
        return new Date(value).toLocaleString()
      } catch (error) {
        console.error('Failed to format date:', error)
        return ''
      }
    }
    
    return {
      isLoggedIn,
      mobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      handleLogout,
      handleProfileClick,
      notificationWrapperRef,
      notificationPanelOpen,
      notifications,
      unreadCount,
      toggleNotificationPanel,
      handleNotificationAction,
      openNotificationModal,
      handleMarkAllRead,
      formatNotificationTime,
      isLoadingNotifications,
      loadError,
      isMarkingAll,
      handlePlanClick,
      activeNotification,
      closeNotificationModal,
      formatDateDisplay
    }
  }
}
</script>

<style scoped>
.navbar {
  background: #576e54;
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
  font-size: 1.05rem;
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
  border: none;
  outline: none;
}

.notification-icon:hover,
.profile-icon:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-icon.active {
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-icon:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.45);
}

.notification-wrapper {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #ff4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(255, 68, 68, 0.5);
  animation: pulse 2s infinite;
  z-index: 10;
}

.notification-panel {
  position: absolute;
  top: 58px;
  right: 0;
  width: 320px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
  color: #2f3e2c;
  overflow: hidden;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.notification-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f3f7f1, #e7efe2);
  border-bottom: 1px solid #e2ebdd;
}

.notification-panel__header h4 {
  margin: 0;
  font-size: 1rem;
  color: #2f3e2c;
  font-weight: 600;
}

.notification-panel__mark-all {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: #4caf50;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.notification-panel__mark-all:disabled {
  color: #aab5a7;
  cursor: not-allowed;
}

.notification-panel__mark-all:not(:disabled):hover {
  color: #2f8f2f;
}

.notification-panel__body {
  max-height: 360px;
  overflow-y: auto;
  background: white;
}

.notification-panel__body::-webkit-scrollbar {
  width: 6px;
}

.notification-panel__body::-webkit-scrollbar-track {
  background: #f3f7f1;
}

.notification-panel__body::-webkit-scrollbar-thumb {
  background: #aab5a7;
  border-radius: 6px;
}

.notification-panel__state {
  padding: 24px 20px;
  text-align: center;
  font-size: 0.9rem;
  color: #54624e;
}

.notification-panel__state.state-error {
  color: #c0392b;
}

.notification-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.notification-modal {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: pop-in 0.25s ease;
}

.notification-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: white;
}

.notification-modal__header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.notification-modal__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-modal__message {
  margin: 0;
  font-size: 0.95rem;
  color: #2f3e2c;
  line-height: 1.5;
}

.notification-modal__details {
  margin: 0;
  display: grid;
  gap: 12px;
}

.notification-modal__details div {
  display: grid;
  gap: 4px;
}

.notification-modal__details dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6d7f6b;
  margin: 0;
}

.notification-modal__details dd {
  margin: 0;
  font-size: 0.9rem;
  color: #2f3e2c;
}

.notification-modal__footer {
  padding: 18px 24px;
  background: #f4faf2;
  display: flex;
  justify-content: flex-end;
}

.modal-action-btn {
  background: linear-gradient(135deg, #4c8cff, #3a72d6);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 20px rgba(76, 140, 255, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.modal-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 26px rgba(76, 140, 255, 0.3);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes pop-in {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.notification-item {
  border-bottom: 1px solid #eef3ea;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item__button {
  width: 100%;
  padding: 14px 18px;
  text-align: left;
  background: transparent;
  border: none;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item__button:hover {
  background: #eff6ea;
}

.notification-item.unread .notification-item__button {
  background: #f5fbe9;
}

.notification-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-item__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2f3e2c;
}

.notification-item.unread .notification-item__title {
  color: #205522;
}

.notification-item__message {
  font-size: 0.85rem;
  color: #4b5a47;
  line-height: 1.4;
}

.notification-item__meta {
  font-size: 0.75rem;
  color: #7a8972;
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
  font-size: 1.05rem;
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

  .notification-wrapper {
    width: 100%;
  }

  .notification-panel {
    position: static;
    width: 100%;
    margin-top: 12px;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  .notification-panel__body {
    max-height: 260px;
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

/* 认证按钮容器 */
.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.register-btn {
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
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.register-btn:hover {
  background: white;
  color: #86b080;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
