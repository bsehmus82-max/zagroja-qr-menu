/**
 * Zero-dependency Web Audio API Sound Synthesizer
 * Generates crystal clear acoustic bell and notification chime effects
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

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
   * Classic Double Ding Kitchen Order Bell (880Hz -> 1760Hz harmonic)
   */
  public playOrderBell() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Ding 1
    this.createTone(ctx, 880, now, 0.4, 0.3);
    this.createTone(ctx, 1760, now, 0.4, 0.15);

    // Ding 2 (High pleasant ring)
    this.createTone(ctx, 1318.5, now + 0.18, 0.6, 0.35);
    this.createTone(ctx, 2637, now + 0.18, 0.6, 0.15);
  }

  /**
   * Waiter Call Table Chime
   */
  public playWaiterCall() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.createTone(ctx, 587.33, now, 0.3, 0.25); // D5
    this.createTone(ctx, 880, now + 0.12, 0.5, 0.3); // A5
  }

  /**
   * Support message ping
   */
  public playMessageTone() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.createTone(ctx, 523.25, now, 0.2, 0.2); // C5
    this.createTone(ctx, 659.25, now + 0.08, 0.25, 0.2); // E5
    this.createTone(ctx, 783.99, now + 0.16, 0.35, 0.25); // G5
  }

  private createTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
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
