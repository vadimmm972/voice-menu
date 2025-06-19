<template>
  <div>
<div class="voice-controls">
  <button
    @click="startRecording"
    :disabled="recording || isTranscribing"
    :class="['btn-record', { active: recording }]"
  >
    <span class="icon-mic"></span> Start recording
  </button>
      <br />    <br />
  <button
    @click="stopRecording"
    :disabled="!recording || isTranscribing"
    :class="['btn-stop', { active: recording }]"
  >
    <span class="icon-stop"></span> Stop
  </button>
</div>
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
    <div v-if="apiResponseSize > 0" class="api-response-size-box">
      <b>API response size:</b>
      <span class="size-item">{{ apiResponseSize }} <span class="size-label">bytes</span></span> /
      <span class="size-item">{{ (apiResponseSize / 1024).toFixed(1) }} <span class="size-label">KB</span></span> /
      <span class="size-item">{{ (apiResponseSize / 1024 / 1024).toFixed(2) }} <span class="size-label">MB</span></span>
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
      isTranscribing: false,
      apiResponseSize: 0
    }
  },
  methods: {
    startRecording() {
      this.apiResponseSize = 0;
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

          const responseJsonStr = JSON.stringify(statusData);
          const responseByteSize = new Blob([responseJsonStr]).size;
          this.apiResponseSize = responseByteSize;

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

.voice-controls {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin-bottom: 22px;
}

.voice-controls button {
  border: none;
  border-radius: 12px;
  padding: 17px 34px 15px 26px;
  font-size: 1.22em;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-weight: 600;
  box-shadow: 0 2px 9px 0 rgba(50,80,140,.07);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.18s;
  outline: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-record {
  background: #f2f7fc;
  color: #187842;
}

.btn-record.active {
  background: #20cb6c;
  color: #fff;
  box-shadow: 0 0 0 2px #28d07b30;
}

.btn-stop {
  background: #f2f3f5;
  color: #ba2828;
}

.btn-stop.active {
  background: #df3d2f;
  color: #fff;
  box-shadow: 0 0 0 2px #e2483040;
}

.voice-controls button:disabled {
  background: #e6e6e6 !important;
  color: #b6b6b6 !important;
  box-shadow: none;
  cursor: default;
  opacity: 0.76;
}

.icon-mic::before {
  content: '🎤';
  font-size: 1.25em;
}
.icon-stop::before {
  content: '■';
  font-size: 1.35em;
  color: inherit;
}

.audio-size-box {
  background: #f7fbf8;
  border-radius: 8px;
  margin: 9px auto 17px auto;
  padding: 8px 19px 8px 19px;
  font-size: 1.15em;
  box-shadow: 0 1px 7px 0 rgba(40,120,60,.06);
  display: flex;
  align-items: center;
  gap: 9px;
  width: max-content;
  color: #246b37;
  border-left: 5px solid #2ab93b;
}
.size-item {
  font-weight: 500;
  color: #11497e;
  margin-left: 2px;
  margin-right: 2px;
}
.size-label {
  font-size: 0.96em;
  color: #3a8f4a;
  font-weight: 400;
  margin-left: 2px;
}
.api-response-size-box {
  background: #f5f7fa;
  border-radius: 8px;
  margin: 14px auto 8px auto;
  padding: 9px 28px 9px 18px;
  font-size: 1.10em;
  box-shadow: 0 1px 6px 0 rgba(50,80,140,.06);
  display: flex;
  align-items: center;
  gap: 7px;
  width: max-content;
  color: #24437a;
  border-left: 5px solid #308dce;
}
.api-response-size-box b {
  font-weight: 600;
  color: #2065a9;
  margin-right: 7px;
}
.size-item {
  font-weight: 500;
  color: #235e9a;
  margin-left: 2px;
  margin-right: 2px;
}
.size-label {
  font-size: 0.97em;
  color: #567fb5;
  font-weight: 400;
  margin-left: 2px;
}


</style>
