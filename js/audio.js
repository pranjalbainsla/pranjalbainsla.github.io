/*
  All sound is synthesized with WebAudio: no audio files to download.
  Thunder is low-passed brown noise with a slow rumble envelope; rain is a quiet
  filtered noise bed whose volume follows the rain amount.
*/
export class Sound {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    // 4 seconds of brown noise, reused by every sound
    const len = this.ctx.sampleRate * 4;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }

    // Rain bed
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    src.connect(hp).connect(lp).connect(this.rainGain).connect(this.master);
    src.start();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensure();
      this.ctx?.resume();
    } else {
      this.ctx?.suspend();
    }
    return this.enabled;
  }

  setRain(amount) {
    if (!this.ctx || !this.enabled) return;
    this.rainGain.gain.setTargetAtTime(amount * 0.22, this.ctx.currentTime, 0.4);
  }

  thunder(delay, strength = 1) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.55 + Math.random() * 0.2;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t0);
    lp.frequency.exponentialRampToValueAtTime(120, t0 + 3.2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1.6 * strength, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.5 * strength, t0 + 0.9);
    g.gain.linearRampToValueAtTime(0.9 * strength, t0 + 1.3); // second roll
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t0, Math.random() * 2);
    src.stop(t0 + 4.2);
  }

  blip(freq = 660, dur = 0.05) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}
