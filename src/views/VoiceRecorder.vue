<template>
  <div>
    <button @click="startRecording" :disabled="recording">Start recording</button>
    <button @click="stopRecording" :disabled="!recording">Stop</button>
    <audio v-if="audioUrl" :src="audioUrl" controls></audio>
    <div v-if="error" style="color: red">{{ error }}</div>
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
          if (window.MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (window.MediaRecorder.isTypeSupported('audio/aac')) {
            mimeType = 'audio/aac';
          } else {
            mimeType = '';
          }
          this.mediaRecorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          this.audioChunks = [];
          this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
          this.mediaRecorder.onstop = this.handleStop;
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
    handleStop() {
      try {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/mp4' });
        this.audioUrl = URL.createObjectURL(audioBlob);
      } catch (e) {
        this.error = 'Error while processing audio: ' + e.message;
      }
    }
  }
}
</script>
