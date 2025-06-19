<template>
  <div>
    <button @click="startRecording" :disabled="recording || isTranscribing">🎤 Start recording</button>
    <br />
    <br />
    <button @click="stopRecording" :disabled="!recording || isTranscribing">■ Stop</button>
    <br />
    <audio v-if="audioUrl" :src="audioUrl" controls></audio>
    <br />
    <div v-if="isTranscribing" style="margin:15px 0; color:#2d7fff">
      <span class="loader"></span> Processing audio, please wait...
    </div>
    <br />
    <br />
    <div v-if="recognizedText && !isTranscribing" style="margin-top: 15px; color: green;">
      <b>Recognized text:</b><br>
      {{ recognizedText }}
    </div>
    <br />
    <br />
    <div v-if="audioBlob" class="audio-size-box">
      <b>Audio file size:</b>
      <span class="size-item">{{ audioBlob.size }} <span class="size-label">bytes</span></span> /
      <span class="size-item">{{ (audioBlob.size / 1024).toFixed(1) }} <span class="size-label">KB</span></span> /
      <span class="size-item">{{ (audioBlob.size / 1024 / 1024).toFixed(2) }} <span class="size-label">MB</span></span>
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
      error: '',
      isTranscribing: false
    }
  },
  methods: {
    startRecording() {
      this.audioBlob = null;
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
      this.isTranscribing = true;
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
      } finally {
        this.isTranscribing = false;
      }
    }
  }
}
</script>

<style>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2d7fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: inline-block;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}

.audio-size-box {
  background: #f8fafb;
  border-radius: 7px;
  margin: 16px auto 8px auto;
  padding: 9px 17px 9px 17px;
  font-size: 1.09em;
  box-shadow: 0 1px 6px 0 rgba(50,80,140,.07);
  display: flex;
  align-items: center;
  gap: 7px;
  width: max-content;
  color: #24437a;
}
.size-item {
  font-weight: 500;
  color: #11497e;
  margin-left: 2px;
  margin-right: 2px;
}
.size-label {
  font-size: 0.96em;
  color: #5377a8;
  font-weight: 400;
  margin-left: 2px;
}
</style>
