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
      :videoSrc="currentAvatar.video"
      :posterSrc="currentAvatar.poster"
      lang="en-US"
    />
  </div>
</template>

<script>
import TalkingReply from './views/TalkingReply.vue';

export default {
  name: 'App',
  components: { TalkingReply },
  data() {
    return {
      avatars: [
        {
          video: require("./assets/avatar_1.mp4"),
          poster: require("./assets/avatar.png"),
        },
        {
          video: require("./assets/avatar_1.mp4"),
          poster: require("./assets/avatar.png"),
        },
        {
          video: require("./assets/avatar_2.mp4"),
          poster: require("./assets/avatar.png"),
        },
        {
          video: require("./assets/avatar_3.mp4"),
          poster: require("./assets/avatar.png"),
        },
        {
          video: require("./assets/avatar_4.mp4"),
          poster: require("./assets/avatar.png"),
        },
      ],
      currentAvatar: null,
    };
  },
  created() {
    this.pickRandomAvatar();
  },
  methods: {
    pickRandomAvatar() {
      const index = Math.floor(Math.random() * this.avatars.length);
      this.currentAvatar = this.avatars[index];
    },
  },
};
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

