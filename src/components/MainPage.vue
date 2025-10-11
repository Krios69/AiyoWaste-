<template>
  <div class="main-page">
    <div class="page-content">
      <div class="welcome-section">
        <h1>Welcome to AiyoWaste</h1>
        <p>Reduce food waste, make a difference</p>
      </div>
      
      <div class="quick-actions">
        <!-- Quick Add Button -->
        <button class="quick-add-btn" @click="goToAddFood">
          <div class="btn-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="btn-content">
            <h2>Quick Add Food</h2>
            <p>Add a new food item to your inventory</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage',
  methods: {
    goToAddFood() {
      this.$router.push({ path: '/food-inventory', query: { action: 'add' } })
    }
  }
}
</script>

<style scoped>
.main-page {
  min-height: calc(100vh - 90px);
  background-color: #DEEDDC;
  padding: 60px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.welcome-section {
  text-align: center;
  margin-bottom: 60px;
}

.welcome-section h1 {
  color: #2c3e50;
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: 700;
}

.welcome-section p {
  color: #5a6c5d;
  font-size: 1.3rem;
  max-width: 600px;
  margin: 0 auto;
  font-weight: 400;
}

.quick-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Quick Add Button */
.quick-add-btn {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  border: none;
  padding: 25px 30px;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 550px;
}

.quick-add-btn:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, #7b9977 0%, #86b080 100%);
}

.quick-add-btn:hover .btn-icon {
  transform: rotate(90deg);
  color: white;
}

.quick-add-btn:hover .btn-content h2,
.quick-add-btn:hover .btn-content p {
  color: white;
}

.btn-icon {
  flex-shrink: 0;
  color: #7b9977;
  transition: all 0.3s ease;
}

.btn-icon svg {
  width: 38px;
  height: 38px;
}

.btn-content {
  text-align: left;
  flex: 1;
}

.btn-content h2 {
  color: #2c3e50;
  font-size: 1.35rem;
  margin-bottom: 6px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.btn-content p {
  color: #5a6c5d;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 400;
  transition: color 0.3s ease;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-page {
    padding: 40px 20px;
  }
  
  .welcome-section {
    margin-bottom: 40px;
  }
  
  .welcome-section h1 {
    font-size: 2rem;
  }
  
  .welcome-section p {
    font-size: 1rem;
  }
  
  .quick-add-btn {
    flex-direction: column;
    padding: 20px;
    gap: 15px;
  }
  
  .btn-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .btn-content {
    text-align: center;
  }
  
  .btn-content h2 {
    font-size: 1.2rem;
  }
  
  .btn-content p {
    font-size: 0.8rem;
  }
}
</style>
