<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
     <!-- <Version2 /> -->
     <VoiceRecorderWithAssembly />
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
//import Version2 from './components/Version2.vue'
//import VoiceRecorder from './views/VoiceRecorder.vue';
import VoiceRecorderWithAssembly from './views/VoiceRecorderWithAssembly.vue';
export default {
  name: 'App',
  components: {
    VoiceRecorderWithAssembly
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
