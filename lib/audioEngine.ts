import { Platform } from 'react-native';

// Howler는 웹 전용으로 동적 import
let Howl: any = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try { Howl = require('howler').Howl; } catch {}
}

type ProgressCallback = (posMs: number, durMs: number) => void;
type EndCallback = () => void;

// ─── Vinyl Crackle (Web Audio API 절차적 생성) ─────────────────────────
class VinylCrackle {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;

  start(volume = 0.22) {
    if (Platform.OS !== 'web') return;
    const AC: typeof AudioContext =
      (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;

    try {
      this.ctx = new AC();
      const sr = this.ctx.sampleRate;
      const len = sr * 5; // 5초 루프 버퍼
      const buf = this.ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);

      for (let i = 0; i < len; i++) {
        // 저레벨 hiss
        let s = (Math.random() * 2 - 1) * 0.016;
        // 중간 틱
        if (Math.random() > 0.9993) s += (Math.random() * 2 - 1) * 0.22;
        // 강한 크랙클 팝
        if (Math.random() > 0.9998) s += (Math.random() * 2 - 1) * 0.45;
        // 간헐적 rumble (저주파)
        s += Math.sin(i * 0.003 + Math.random()) * 0.003;
        data[i] = s;
      }

      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(this.ctx.destination);
      // 페이드인
      this.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0);

      this.source = this.ctx.createBufferSource();
      this.source.buffer = buf;
      this.source.loop = true;
      this.source.connect(this.gain);
      this.source.start();
    } catch {}
  }

  stop() {
    if (this.gain && this.ctx) {
      this.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    }
    setTimeout(() => {
      try { this.source?.stop(); this.ctx?.close(); } catch {}
      this.source = null; this.ctx = null; this.gain = null;
    }, 700);
  }

  setVolume(v: number) {
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.15);
    }
  }
}

const PREVIEW_PEAK = 0.88;
const CRACKLE_PEAK = 0.22;

// ─── AudioEngine (메인 플레이어) ────────────────────────────────────────
class AudioEngine {
  private howl: any = null;
  private crackle = new VinylCrackle();
  private currentUrl: string | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  /** 0~1 — useMusicPlayer / 설정과 동기화 */
  private masterVol = 0.85;

  setMasterVolume(v: number) {
    this.masterVol = Math.max(0, Math.min(1, v));
    if (Platform.OS === 'web' && this.howl) {
      this.howl.volume(PREVIEW_PEAK * this.masterVol);
    }
    const av = (this as any)._avSound as { setVolumeAsync?: (n: number) => Promise<void> } | null;
    if (av?.setVolumeAsync) {
      void av.setVolumeAsync(this.masterVol);
    }
    this.crackle.setVolume(CRACKLE_PEAK * this.masterVol);
  }

  getMasterVolume() {
    return this.masterVol;
  }

  play(
    url: string,
    callbacks: { onEnd?: EndCallback; onProgress?: ProgressCallback } = {}
  ) {
    if (this.currentUrl === url && this.howl) {
      this.howl.play();
      this.howl.fade(0, PREVIEW_PEAK * this.masterVol, 500);
      this.crackle.start(CRACKLE_PEAK * this.masterVol);
      return;
    }

    this.stop();
    this.currentUrl = url;

    if (Platform.OS === 'web' && Howl) {
      this.howl = new Howl({
        src: [url],
        html5: true,
        volume: 0,
        format: ['mp3', 'm4a', 'aac'],
        onend: () => {
          this.crackle.stop();
          callbacks.onEnd?.();
        },
        onload: () => {
          this.howl?.fade(0, PREVIEW_PEAK * this.masterVol, 700);
          this.crackle.start(CRACKLE_PEAK * this.masterVol);
          this._startProgress(callbacks.onProgress);
        },
        onloaderror: (_: any, e: any) => {
          console.warn('[AudioEngine] load error:', e);
          callbacks.onEnd?.();
        },
      });
      this.howl.play();
    } else {
      // 모바일 — expo-av fallback
      this._playWithExpoAV(url, callbacks);
    }
  }

  private _startProgress(cb?: ProgressCallback) {
    if (this.progressTimer) clearInterval(this.progressTimer);
    if (!cb) return;
    this.progressTimer = setInterval(() => {
      if (!this.howl?.playing()) return;
      const pos = (this.howl.seek() as number) * 1000;
      const dur = this.howl.duration() * 1000;
      cb(pos, dur);
    }, 400);
  }

  private async _playWithExpoAV(
    url: string,
    callbacks: { onEnd?: EndCallback; onProgress?: ProgressCallback }
  ) {
    try {
      const { Audio } = require('expo-av');
      if ((this as any)._avSound) {
        await (this as any)._avSound.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: this.masterVol }
      );
      (this as any)._avSound = sound;
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status.isLoaded) return;
        callbacks.onProgress?.(status.positionMillis, status.durationMillis ?? 30000);
        if (status.didJustFinish) callbacks.onEnd?.();
      });
    } catch (e) {
      console.warn('[AudioEngine] expo-av error:', e);
    }
  }

  pause() {
    if (Platform.OS === 'web' && this.howl) {
      this.howl.fade(this.howl.volume(), 0, 350);
      setTimeout(() => this.howl?.pause(), 370);
    } else if ((this as any)._avSound) {
      (this as any)._avSound.pauseAsync();
    }
    this.crackle.stop();
  }

  resume() {
    if (Platform.OS === 'web' && this.howl) {
      this.howl.play();
      this.howl.fade(0, PREVIEW_PEAK * this.masterVol, 500);
      this.crackle.start(CRACKLE_PEAK * this.masterVol);
    } else if ((this as any)._avSound) {
      (this as any)._avSound.playAsync();
    }
  }

  stop() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (Platform.OS === 'web' && this.howl) {
      const v = this.howl.volume();
      if (v > 0) this.howl.fade(v, 0, 300);
      setTimeout(() => {
        try { this.howl?.stop(); this.howl?.unload(); } catch {}
        this.howl = null;
      }, 320);
    } else if ((this as any)._avSound) {
      (this as any)._avSound.stopAsync();
      (this as any)._avSound.unloadAsync();
      (this as any)._avSound = null;
    }
    this.crackle.stop();
    this.currentUrl = null;
  }

  isPlaying(): boolean {
    if (Platform.OS === 'web') return this.howl?.playing() ?? false;
    return false; // expo-av 상태는 스토어에서 관리
  }

  getCurrentUrl() { return this.currentUrl; }
}

export const audioEngine = new AudioEngine();
