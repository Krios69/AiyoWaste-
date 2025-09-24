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
            <router-link to="/login" class="nav-link">Login</router-link>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Inventory</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Statistics</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Settings</a>
          </li>
        </ul>
        <div class="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="white"/>
            <circle cx="18" cy="5" r="4" fill="#ff4444"/>
          </svg>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar'
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
