<template>
  <div class="main-page">
    <div class="page-content">
      <div class="welcome-section">
        <h1>Welcome to AiyoWaste</h1>
        <p>This is a brand new page using your specified color scheme</p>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <h3>Inventory Management</h3>
          <p>Easily manage your inventory items</p>
        </div>
        <div class="feature-card">
          <h3>Data Analytics</h3>
          <p>View detailed statistical reports</p>
        </div>
        <div class="feature-card">
          <h3>Smart Notifications</h3>
          <p>Get timely reminders for important matters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage'
}
</script>

<style scoped>
.main-page {
  min-height: calc(100vh - 60px);
  background-color: #DEEDDC;
  padding: 40px 20px;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 60px;
}

.welcome-section h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 20px;
  font-weight: 600;
}

.welcome-section p {
  color: #5a6c5d;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.feature-card p {
  color: #5a6c5d;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .main-page {
    padding: 20px 15px;
  }
  
  .welcome-section h1 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
