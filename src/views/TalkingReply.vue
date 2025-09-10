<template>
  <div class="talking-reply">
    <!-- Відео-аватар -->
    <div class="avatar">
      <video
        ref="avatarVideo"
        :src="videoSrc"
        playsinline
        muted
        loop
        preload="auto"
        :poster="posterSrc"
      ></video>
    </div>

    <!-- Ввід тексту -->
    <div class="reply-text">
      <input
        v-model="inputText"
        type="text"
        placeholder="Type your text here..."
        @keyup.enter="speakNow"
      />
    </div>

    <!-- Кнопки -->
    <div class="controls">
      <button @click="speakNow" :disabled="speaking">▶️ Play</button>
      <button @click="stopSpeaking" :disabled="!speaking">⏹ Stop</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "TalkingReply",
  props: {
    // шлях до вашого короткого mp4 з жестами/рухами (3–8 секунд)
    videoSrc: { type: String, required: true },
    // необов’язково: статичний кадр, коли мовчимо
    posterSrc: { type: String, default: "" },
    // мова озвучки
    lang: { type: String, default: "en-US" },
    // зовнішній TTS (необов'язково)
    externalTTS: { type: Function, default: null },
    rate: { type: Number, default: 1.0 },
    pitch: { type: Number, default: 1.0 },
    volume: { type: Number, default: 1.0 }
  },
  data() {
    return {
      speaking: false,
      audioEl: null,
      voices: [],
      inputText: "" // тепер текст зберігається тут
    };
  },
  methods: {
    async speakNow() {
      const text = this.inputText?.trim();
      if (!text) return;

      this.playAvatar();

      if (this.externalTTS) {
        try {
          const audioSrcOrBlob = await this.externalTTS(text);
          await this.playExternalAudio(audioSrcOrBlob);
        } catch (e) {
          console.error("External TTS failed, fallback", e);
          this.speakWithWebSpeech(text);
        }
        return;
      }

      this.speakWithWebSpeech(text);
    },

    speakWithWebSpeech(text) {
      if (!("speechSynthesis" in window)) {
        console.warn("speechSynthesis is not supported in this browser.");
        this.stopAvatar();
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this.lang;
      utter.rate = this.rate;
      utter.pitch = this.pitch;
      utter.volume = this.volume;

      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        let v = voices.find(v => v.lang === this.lang);
        if (!v) {
          const base = this.lang.split("-")[0];
          v = voices.find(v => v.lang && v.lang.startsWith(base));
        }
        if (v) utter.voice = v;
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => pickVoice();
      } else {
        pickVoice();
      }

      utter.onstart = () => { this.speaking = true; };
      utter.onend   = () => { this.speaking = false; this.stopAvatar(); };
      utter.onerror = (e) => { console.error(e); this.speaking = false; this.stopAvatar(); };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    },

    async playExternalAudio(audioSrcOrBlob) {
      let src = audioSrcOrBlob;
      if (audioSrcOrBlob instanceof Blob) {
        src = URL.createObjectURL(audioSrcOrBlob);
      }

      if (!this.audioEl) {
        this.audioEl = new Audio();
        this.audioEl.addEventListener("ended", () => {
          this.speaking = false;
          this.stopAvatar();
        });
        this.audioEl.addEventListener("error", () => {
          this.speaking = false;
          this.stopAvatar();
        });
      }

      this.audioEl.src = src;
      this.audioEl.volume = this.volume;
      this.speaking = true;

      try {
        await this.audioEl.play();
      } catch (e) {
        console.error("Autoplay blocked:", e);
        this.speaking = false;
        this.stopAvatar();
      }
    },

    playAvatar() {
      const v = this.$refs.avatarVideo;
      if (!v) return;
      v.currentTime = 0;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    },

    stopAvatar() {
      const v = this.$refs.avatarVideo;
      if (!v) return;
      v.pause();
      v.currentTime = 0;
    },

    async stopSpeaking() {
      if (this.externalTTS && this.audioEl) {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      this.speaking = false;
      this.stopAvatar();
    },

    loadVoices() {
      this.voices = window.speechSynthesis.getVoices();
      console.log("voices", this.voices);
    }
  },
  mounted() {
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = this.loadVoices;
  }
};
</script>

<style scoped>
.talking-reply {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
}

.avatar {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #eee;
  margin-bottom: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border: 2px solid #ddd;
}

.avatar video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-text input {
  width: 300px;
  padding: 8px;
  margin: 8px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.controls button {
  font-size: 14px;
  padding: 6px 12px;
}
</style>
