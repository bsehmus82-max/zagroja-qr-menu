import { SoundPresetKey } from '../types';

export interface SoundPreset {
  id: SoundPresetKey;
  name: string;
  description: string;
  tag: string;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'classic',
    name: 'Klasik Restoran Çanı',
    description: 'Geleneksel çift vuruşlu akustik mutfak sipariş çanı',
    tag: 'Varsayılan',
  },
  {
    id: 'crystal',
    name: 'Zarif Kristal Tını',
    description: 'Yüksek frekanslı, pürüzsüz ve berrak kristal zil tınısı',
    tag: 'Şık & Premium',
  },
  {
    id: 'digital',
    name: 'Modern Dijital Uyarı',
    description: 'Temiz, dikkat çekici ve hızlı elektronik çift ton',
    tag: 'Dinamik',
  },
  {
    id: 'woodblock',
    name: 'Tok Ahşap Tokmak & Gong',
    description: 'Sıcak, akustik rezonanslı bariton ahşap tokmak vuruşu',
    tag: 'Akustik & Sıcak',
  },
  {
    id: 'melodic',
    name: 'Melodik Akor (Arpej)',
    description: 'Yükselen 4 notalı zarif majör piyano arpeji',
    tag: 'Melodik',
  },
];

/**
 * Zero-dependency Web Audio API Sound Synthesizer
 * Generates 5 distinct rich acoustic bell and notification chime effects
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentPreference: SoundPresetKey = 'classic';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('restiva_sound_preference') as SoundPresetKey;
      if (saved && ['classic', 'crystal', 'digital', 'woodblock', 'melodic'].includes(saved)) {
        this.currentPreference = saved;
      }
    }
  }

  public setPreferredSound(preset: SoundPresetKey) {
    this.currentPreference = preset;
    if (typeof window !== 'undefined') {
      localStorage.setItem('restiva_sound_preference', preset);
    }
  }

  public getPreferredSound(): SoundPresetKey {
    return this.currentPreference;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play Kitchen Order Bell using specified or active preset
   */
  public playOrderBell(preset?: SoundPresetKey) {
    const key = preset || this.currentPreference;
    this.playSoundPreset(key);
  }

  /**
   * Play Waiter Call Chime
   */
  public playWaiterCall(preset?: SoundPresetKey) {
    const key = preset || this.currentPreference;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (key === 'classic') {
      this.createTone(ctx, 587.33, now, 0.3, 0.25, 'sine');
      this.createTone(ctx, 880, now + 0.12, 0.5, 0.3, 'sine');
    } else if (key === 'crystal') {
      this.createTone(ctx, 1174.66, now, 0.25, 0.2, 'sine');
      this.createTone(ctx, 1760.00, now + 0.1, 0.45, 0.25, 'sine');
    } else if (key === 'digital') {
      this.createTone(ctx, 880, now, 0.15, 0.25, 'triangle');
      this.createTone(ctx, 1318.5, now + 0.08, 0.25, 0.3, 'sine');
    } else if (key === 'woodblock') {
      this.createTone(ctx, 440, now, 0.25, 0.35, 'triangle');
      this.createTone(ctx, 587.33, now + 0.1, 0.4, 0.3, 'triangle');
    } else if (key === 'melodic') {
      this.createTone(ctx, 659.25, now, 0.2, 0.25, 'sine');
      this.createTone(ctx, 783.99, now + 0.09, 0.2, 0.25, 'sine');
      this.createTone(ctx, 1046.50, now + 0.18, 0.4, 0.3, 'sine');
    }
  }

  /**
   * Play Message Tone
   */
  public playMessageTone() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.createTone(ctx, 523.25, now, 0.2, 0.2, 'sine');
    this.createTone(ctx, 659.25, now + 0.08, 0.25, 0.2, 'sine');
    this.createTone(ctx, 783.99, now + 0.16, 0.35, 0.25, 'sine');
  }

  /**
   * Play AI / System Success Chime
   */
  public playSuccessTone() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.createTone(ctx, 587.33, now, 0.15, 0.25, 'sine');
    this.createTone(ctx, 880.00, now + 0.1, 0.2, 0.3, 'sine');
    this.createTone(ctx, 1174.66, now + 0.2, 0.4, 0.35, 'sine');
  }

  /**
   * Directly test/play any sound preset
   */
  public playSoundPreset(key: SoundPresetKey) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (key) {
      case 'classic': {
        // Classic Double Ding (880Hz -> 1318.5Hz / 2637Hz)
        this.createTone(ctx, 880, now, 0.35, 0.3, 'sine');
        this.createTone(ctx, 1760, now, 0.35, 0.15, 'sine');
        this.createTone(ctx, 1318.5, now + 0.16, 0.6, 0.35, 'sine');
        this.createTone(ctx, 2637, now + 0.16, 0.6, 0.15, 'sine');
        break;
      }

      case 'crystal': {
        // Crystalline High Harmonics (1046Hz -> 1318Hz -> 1567Hz)
        this.createTone(ctx, 1046.50, now, 0.25, 0.2, 'sine');
        this.createTone(ctx, 2093.00, now, 0.25, 0.1, 'sine');
        this.createTone(ctx, 1318.51, now + 0.09, 0.3, 0.25, 'sine');
        this.createTone(ctx, 1567.98, now + 0.18, 0.7, 0.35, 'sine');
        this.createTone(ctx, 3135.96, now + 0.18, 0.7, 0.15, 'sine');
        break;
      }

      case 'digital': {
        // Modern Crisp High Two-Tone Pulse (659Hz -> 987Hz -> 1318Hz)
        this.createTone(ctx, 659.25, now, 0.12, 0.25, 'triangle');
        this.createTone(ctx, 987.77, now + 0.08, 0.12, 0.3, 'sine');
        this.createTone(ctx, 1318.51, now + 0.16, 0.45, 0.35, 'sine');
        this.createTone(ctx, 1975.53, now + 0.16, 0.45, 0.15, 'triangle');
        break;
      }

      case 'woodblock': {
        // Deep Warm Resonant Woodblock Gong (330Hz -> 440Hz -> 587Hz)
        this.createTone(ctx, 329.63, now, 0.25, 0.4, 'triangle');
        this.createTone(ctx, 440.00, now + 0.1, 0.3, 0.4, 'sine');
        this.createTone(ctx, 587.33, now + 0.2, 0.55, 0.45, 'triangle');
        this.createTone(ctx, 1174.66, now + 0.2, 0.3, 0.1, 'sine');
        break;
      }

      case 'melodic': {
        // Ascending 4-Note Major Arpeggio (C5 -> E5 -> G5 -> C6)
        this.createTone(ctx, 523.25, now, 0.2, 0.25, 'sine');
        this.createTone(ctx, 659.25, now + 0.09, 0.2, 0.25, 'sine');
        this.createTone(ctx, 783.99, now + 0.18, 0.25, 0.25, 'sine');
        this.createTone(ctx, 1046.50, now + 0.27, 0.65, 0.35, 'sine');
        this.createTone(ctx, 2093.00, now + 0.27, 0.65, 0.15, 'sine');
        break;
      }
    }
  }

  private createTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number,
    waveType: OscillatorType = 'sine'
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const sound = new SoundEngine();
