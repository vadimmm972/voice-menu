<template>
  <div>
    <button @click="startRecording" :disabled="recording">🎤 Start recording</button>
    <button @click="stopRecording" :disabled="!recording">■ Stop</button>
    <audio v-if="audioUrl" :src="audioUrl" controls></audio>
    <div v-if="recognizedText" style="margin-top: 15px; color: green;">
      <b>Recognized text:</b><br>
      {{ recognizedText }}
    </div>
    <div v-if="error" style="color: red; margin-top: 10px">{{ error }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recording: false,
      mediaRecorder: null,
      audioChunks: [],
      audioBlob: null,
      audioUrl: '',
      recognizedText: '',
      error: ''
    }
  },
  methods: {
    startRecording() {
      this.error = '';
      this.audioUrl = '';
      this.recognizedText = '';
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
    async handleStop() {
      try {
        this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/mp4' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        await this.recognizeAudio();
      } catch (e) {
        this.error = 'Error while processing audio: ' + e.message;
      }
    },
    async recognizeAudio() {
      const apiKey = '84dd127a0c52476b8bb4648024f94923';
      try {
        // 1. Upload audio
        const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: { 'authorization': apiKey },
          body: this.audioBlob
        });
        const uploadData = await uploadRes.json();
        const uploadUrl = uploadData.upload_url;

        // 2. Start transcription
        const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ audio_url: uploadUrl })
        });
        const transcriptData = await transcriptRes.json();
        const transcriptId = transcriptData.id;

        // 3. Poll for result
        let done = false, textResult = '', errorResult = '';
        while (!done) {
          await new Promise(r => setTimeout(r, 3000)); // wait 3s
          const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            headers: { 'authorization': apiKey }
          });
          const statusData = await statusRes.json();
          if (statusData.status === 'completed') {
            textResult = statusData.text;
            done = true;
          } else if (statusData.status === 'error') {
            errorResult = statusData.error;
            done = true;
          }
        }
        if (textResult) {
          this.recognizedText = textResult;
        } else if (errorResult) {
          this.error = "Recognition error: " + errorResult;
        } else {
          this.error = "Unknown error.";
        }
      } catch (err) {
        this.error = "Recognition failed: " + err.message;
      }
    }
  }
}
</script>
