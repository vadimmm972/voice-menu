<!---<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
     <VoiceRecorderWithAssembly />
  </div>
</template>

<script>
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
</style> -->



<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">

<TalkingReply
  :videoSrc="require('./assets/avatar_2.mp4')"
  :posterSrc="require('./assets/avatar.png')"
  lang="en-US"
/>



  </div>
</template>

<script>
import TalkingReply from './views/TalkingReply.vue';

export default {
  name: 'App',
  components: {
    TalkingReply
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
