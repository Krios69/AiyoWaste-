<template>
  <div id="app">
    <NavBar v-if="!hideNavBar" />
    <router-view />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'

export default {
  name: 'App',
  components: {
    NavBar
  },
  computed: {
    isLoginPage() {
      return this.$route.path === '/login'
    },
    isRegisterPage() {
      return this.$route.path === '/register'
    },
    hideNavBar() {
      return this.isLoginPage || this.isRegisterPage
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #DEEDDC;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  background-color: #DEEDDC;
}
</style>
