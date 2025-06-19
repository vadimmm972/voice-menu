<template>
  <div class="voice-recorder">
    <button @click="startRecording" :disabled="recording">🎤 Start recording</button>
    <button @click="stopRecording" :disabled="!recording">■ Stop</button>
    <p v-if="audioUrl">
      <audio :src="audioUrl" controls></audio>
    </p>
    <p v-if="error" style="color: red">{{ error }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recording: false,
      mediaRecorder: null,
      audioChunks: [],
      audioUrl: '',
      error: ''
    }
  },
  methods: {
startRecording() {
  this.error = '';
  this.audioUrl = '';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    this.error = 'getUserMedia is not supported in this browser';
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else {
        mimeType = '';
      }
      this.mediaRecorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = this.onStop;
      this.mediaRecorder.start();
      this.recording = true;
    })
    .catch(err => {
      this.error = 'Microphone access denied or unavailable: ' + err;
    });
},
    stopRecording() {
      if (this.mediaRecorder && this.recording) {
        this.mediaRecorder.stop();
        this.recording = false;
      }
    },
    onStop() {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioUrl = URL.createObjectURL(audioBlob);

      // this.sendToServer(audioBlob);
    },
    // sendToServer(audioBlob) { ... }
  }
}
</script>

<style scoped>
.voice-recorder {
  margin: 20px 0;
}
</style>
