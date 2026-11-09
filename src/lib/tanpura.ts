'use client';

// A procedural tanpura drone in WebAudio: four strings plucked in the classic Pa–Sa'–Sa'–Sa cycle,
// each a bright buzzing tone (jawari) through a soft waveshaper, into a generated hall reverb.
// No audio files are loaded.

const SA = 130.81; // C3
const CYCLE = [SA * 1.5, SA * 2, SA * 2, SA]; // Pa (G3), Sa', Sa', Sa
const GAP = 1.15; // seconds between plucks

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | undefined;
let nextTime = 0;
let step = 0;

function impulse(c: AudioContext, seconds = 3.2) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function jawariCurve() {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 2.2) + 0.12 * Math.sin(x * 9);
  }
  return curve;
}

function pluck(c: AudioContext, out: AudioNode, freq: number, at: number) {
  const body = c.createGain();
  body.gain.setValueAtTime(0, at);
  body.gain.linearRampToValueAtTime(0.22, at + 0.012);
  body.gain.exponentialRampToValueAtTime(0.06, at + 1.4);
  body.gain.exponentialRampToValueAtTime(0.0008, at + 4.6);

  const shaper = c.createWaveShaper();
  shaper.curve = jawariCurve();
  const tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.setValueAtTime(3200, at);
  tone.frequency.exponentialRampToValueAtTime(900, at + 3.5);
  tone.Q.value = 0.8;

  // A few slightly detuned partials make the string shimmer.
  const partials = [1, 2, 3, 4.01, 5.02];
  partials.forEach((h, k) => {
    const o = c.createOscillator();
    o.type = k === 0 ? 'triangle' : 'sine';
    o.frequency.value = freq * h * (1 + (Math.random() - 0.5) * 0.0015);
    const g = c.createGain();
    g.gain.value = 0.55 / (k + 1);
    o.connect(g).connect(shaper);
    o.start(at);
    o.stop(at + 4.8);
  });
  shaper.connect(tone).connect(body).connect(out);
}

function schedule() {
  if (!ctx || !master) return;
  while (nextTime < ctx.currentTime + 0.6) {
    pluck(ctx, master, CYCLE[step % CYCLE.length], nextTime);
    nextTime += step % CYCLE.length === CYCLE.length - 1 ? GAP * 1.6 : GAP;
    step++;
  }
}

export async function startTanpura() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.45;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    master.connect(dry).connect(comp);
    master.connect(verb).connect(wet).connect(comp);
    comp.connect(ctx.destination);
  }
  await ctx.resume();
  nextTime = ctx.currentTime + 0.1;
  window.clearInterval(timer);
  timer = window.setInterval(schedule, 200);
  schedule();
  master!.gain.cancelScheduledValues(ctx.currentTime);
  master!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
}

export function stopTanpura() {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
  window.clearInterval(timer);
  timer = undefined;
  window.setTimeout(() => {
    if (!timer) ctx?.suspend();
  }, 2200);
}
