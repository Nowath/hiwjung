"use client";

/**
 * เสียงประกอบหน้าเปิดซอง — สังเคราะห์ด้วย Web Audio API ล้วน ไม่มีไฟล์เสียง (ไม่มีลิขสิทธิ์/ไม่เพิ่ม bundle)
 * เบราว์เซอร์มือถือให้เล่นเสียงได้หลังผู้ใช้แตะจอครั้งแรกเท่านั้น จึงต้องเรียก unlockAudio() จาก pointerdown
 * ปิดเสียงได้ด้วย setMuted (ค่าเก็บใน store ฝั่งผู้ใช้)
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let reverb: GainNode | null = null; // ทางส่งเข้าห้องก้อง ใช้กับเสียง Rare
let paperBufs: { peel: AudioBuffer; rumble: AudioBuffer; shuffle: AudioBuffer } | null = null;
let muted = false;

export function setMuted(v: boolean) {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.55, ctx.currentTime, 0.02);
}

/** เรียกจาก event ที่ผู้ใช้แตะเท่านั้น (นโยบาย autoplay ของ iOS/Android) */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    // white noise 1 วินาที ใช้ร่วมกันทุกเสียงประเภทฉีก/ลม
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    // ห้องก้องสังเคราะห์: impulse เป็น noise ที่จางลงแบบ exponential 2.5 วินาที (stereo)
    const len = Math.floor(ctx.sampleRate * 2.5);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    reverb = ctx.createGain();
    reverb.gain.value = 0.5;
    reverb.connect(conv).connect(master);
    paperBufs = {
      peel: paperBuffer(ctx, 0.07, 4),
      rumble: paperBuffer(ctx, 0.55, 22),
      shuffle: shuffleBuffer(ctx),
    };
  }
  if (ctx.state === "suspended") void ctx.resume();
}

const ready = () => (ctx && master && noise && reverb && !muted && ctx.state === "running" ? { ctx, master, noise, reverb } : null);

/** ลมกรองความถี่ — พื้นฐานของเสียงฉีก/ปัด/วูบ */
function noiseSweep(o: { type: BiquadFilterType; from: number; to: number; dur: number; gain: number; q?: number; at?: number; wet?: boolean; attack?: number }) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + (o.at ?? 0);
  const src = a.ctx.createBufferSource();
  src.buffer = a.noise;
  const f = a.ctx.createBiquadFilter();
  f.type = o.type;
  f.Q.value = o.q ?? 1;
  f.frequency.setValueAtTime(o.from, t);
  f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? Math.min(0.02, o.dur * 0.2)));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g).connect(a.master);
  if (o.wet) g.connect(a.reverb);
  src.start(t, Math.random() * 0.5);
  src.stop(t + o.dur + 0.05);
}

/** โน้ตเดียว (sine/triangle) — ใช้กับเสียงกริ๊ง/ป๊อป */
function tone(o: { freq: number; to?: number; dur: number; gain: number; type?: OscillatorType; at?: number; wet?: boolean; detune?: number; attack?: number }) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + (o.at ?? 0);
  const osc = a.ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t);
  osc.detune.value = o.detune ?? 0;
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(a.master);
  if (o.wet) g.connect(a.reverb);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

/**
 * เสียงกระดาษ: เม็ดเสียงสั้นๆ (2–14ms) ความดัง/ความยาวสุ่ม เรียงถี่บ้างห่างบ้าง — หูได้ยินเป็นเส้นใยกระดาษขาดทีละเส้น
 * คำนวณเป็น AudioBuffer ครั้งเดียวตอนปลดล็อกเสียง เล่นจริงเป็น source เดียว
 * (สร้าง node ทีละเม็ดหลายร้อยตัวตรงจังหวะฉีกทำให้ Android กระตุก)
 */
function paperBuffer(c: AudioContext, dur: number, grains: number) {
  const sr = c.sampleRate;
  const buf = c.createBuffer(1, Math.ceil(dur * sr), sr);
  const d = buf.getChannelData(0);
  for (let g = 0; g < grains; g++) {
    // กระจุกช่วงต้นมากกว่าท้าย (ขาดเร็วแล้วค่อยหลุด)
    const start = Math.floor(Math.pow(Math.random(), 1.4) * (d.length - 1));
    const len = Math.floor((0.002 + Math.random() * 0.012) * sr);
    const amp = 0.35 + Math.random() * 0.65;
    let prev = 0;
    for (let i = 0; i < len && start + i < d.length; i++) {
      const n = Math.random() * 2 - 1;
      // high-pass แบบง่าย (ผลต่างตัวอย่าง) ให้เสียงแหลมกรอบแบบกระดาษ + ซองจางแบบ exponential
      d[start + i] += (n - prev) * amp * Math.exp((-5 * i) / len);
      prev = n;
    }
  }
  // เนื้อกระดาษบางๆ ใต้เม็ดเสียง
  for (let i = 0; i < d.length; i++) d[i] += (Math.random() * 2 - 1) * 0.04 * (1 - i / d.length);
  return buf;
}

/**
 * เสียงสับไพ่เบาๆ: การ์ดพลิกผ่านนิ้วแค่ไม่กี่ใบ เว้นจังหวะห่างพอฟังออกทีละใบ (แต่ละใบ = เสียงตบสั้นทุ้มกว่ากระดาษ)
 * ปิดท้ายด้วยเสียงไพ่แตะลงกองเบาๆ
 */
function shuffleBuffer(c: AudioContext) {
  const sr = c.sampleRate;
  const dur = 0.4;
  const buf = c.createBuffer(1, Math.ceil(dur * sr), sr);
  const d = buf.getChannelData(0);
  const flap = (at: number, len: number, amp: number, soft: number) => {
    const start = Math.floor(at * sr);
    const n = Math.floor(len * sr);
    let lp = 0;
    for (let i = 0; i < n && start + i < d.length; i++) {
      // low-pass แบบ one-pole: soft มาก = ทุ้มแบบการ์ดแข็ง ไม่แหลมเหมือนกระดาษ
      lp += (Math.random() * 2 - 1 - lp) * soft;
      d[start + i] += lp * amp * Math.exp((-6 * i) / n);
    }
  };
  // แค่ 4 ใบ ห่างกัน ~55–75ms — ไม่รัวจนเป็นเสียงรูดยาว
  let t = 0.01;
  for (let k = 0; k < 4; k++) {
    flap(t, 0.007 + Math.random() * 0.004, 0.5 + Math.random() * 0.3, 0.35);
    t += 0.055 + Math.random() * 0.02;
  }
  flap(t + 0.02, 0.025, 0.6, 0.12); // ไพ่แตะลงกอง
  return buf;
}

function playBuffer(buf: AudioBuffer | undefined, gain: number) {
  const a = ready();
  if (!a || !buf) return;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.9 + Math.random() * 0.2; // ฉีกแต่ละครั้งไม่เหมือนกันเป๊ะ
  const g = a.ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(a.master);
  src.start();
}

/**
 * คอรัส "อาาา~" แบบฉากเฉลยของวิเศษ — formant synthesis:
 * เสียง sawtooth หลายคน (คอร์ด C major, แต่ละโน้ต 2 คนเพี้ยนนิดๆ ให้หนาแบบคณะร้อง) + vibrato
 * ผ่าน bandpass 3 ตัวที่ความถี่ formant ของสระ "อา" (F1≈800, F2≈1150, F3≈2900 Hz) แล้วส่งเข้าห้องก้อง
 */
function choir(at = 0, dur = 2.4) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + at;

  // ซองความดัง: ค่อยๆ พองขึ้นเหมือนคนเริ่มเปล่งเสียง ค้างไว้ แล้วจางลงยาว
  const env = a.ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.32, t + 0.22);
  env.gain.setValueAtTime(0.32, t + dur * 0.45);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  env.connect(a.master);
  env.connect(a.reverb);

  // สระ "อา"
  const formants = [
    { f: 800, q: 9, g: 1 },
    { f: 1150, q: 11, g: 0.55 },
    { f: 2900, q: 14, g: 0.25 },
  ];
  const vowel = a.ctx.createGain();
  formants.forEach(({ f, q, g }) => {
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const fg = a.ctx.createGain();
    fg.gain.value = g;
    vowel.connect(bp).connect(fg).connect(env);
  });

  // vibrato ร่วมกันทั้งคณะ ~5.5Hz ±12 cents (เริ่มหลังเปล่งเสียงนิดหนึ่งแบบนักร้องจริง)
  const lfo = a.ctx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoDepth = a.ctx.createGain();
  lfoDepth.gain.setValueAtTime(0, t);
  lfoDepth.gain.linearRampToValueAtTime(12, t + 0.5);
  lfo.connect(lfoDepth);

  [261.63, 329.63, 392, 523.25].forEach((freq) =>
    [-9, 9].forEach((det) => {
      const osc = a.ctx.createOscillator();
      osc.type = "sawtooth";
      // ไหลขึ้นเข้าโน้ต (scoop) แบบ "ฮ้าาา"
      osc.frequency.setValueAtTime(freq * 0.94, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
      osc.detune.value = det;
      lfoDepth.connect(osc.detune);
      const vg = a.ctx.createGain();
      vg.gain.value = 0.18;
      osc.connect(vg).connect(vowel);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }),
  );
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
}

const buzz = (ms: number | number[]) => navigator.vibrate?.(ms);

export const sfx = {
  /** กรอบแกรบเล็กๆ ระหว่างลากลอกซีล */
  peel: () => playBuffer(paperBufs?.peel, 0.5),
  /** ซองสั่นก่อนขาด — กระดาษตึงเสียดสีเบาๆ */
  rumble: () => playBuffer(paperBufs?.rumble, 0.2),
  /** การ์ดถูกดึงออกจากซอง: เสียงรูดไพ่ */
  shuffle: () => playBuffer(paperBufs?.shuffle, 0.6),
  /** ปัดการ์ดทิ้ง */
  swipe: () => noiseSweep({ type: "bandpass", from: 2200, to: 600, dur: 0.2, gain: 0.5, q: 1.2 }),
  /** การ์ดธรรมดาขึ้นมา */
  pop: () => tone({ freq: 520, to: 780, dur: 0.12, gain: 0.25, type: "triangle" }),
  /** ลุ้น Rare: เสียงไต่ขึ้น (ลม + โทนเสียงสูงขึ้น) ระหว่างการ์ดสั่น ~1 วินาที */
  rareRise: () => {
    noiseSweep({ type: "bandpass", from: 300, to: 6000, dur: 1.0, gain: 0.35, q: 2, attack: 0.9 });
    tone({ freq: 220, to: 880, dur: 1.0, gain: 0.12, type: "sawtooth", attack: 0.9, detune: 6 });
    tone({ freq: 221, to: 884, dur: 1.0, gain: 0.12, type: "sawtooth", attack: 0.9, detune: -6 });
  },
  /** เฉลย Rare: บูมต่ำ + คอร์ดใหญ่ก้อง + ประกายไล่โน้ต + ฉาบ */
  rare: () => {
    // บูม
    tone({ freq: 95, to: 32, dur: 1.2, gain: 0.9 });
    noiseSweep({ type: "lowpass", from: 1800, to: 120, dur: 0.5, gain: 0.6 });
    // คอร์ด C major หลายอ็อกเทฟ ซ้อนเสียงเพี้ยนนิดๆ ให้หนา แล้วส่งเข้าห้องก้อง
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f) =>
      [-8, 8].forEach((det) => tone({ freq: f, dur: 2.2, gain: 0.07, type: "triangle", detune: det, wet: true, attack: 0.02 })),
    );
    tone({ freq: 261.63, dur: 2.2, gain: 0.18, wet: true, attack: 0.02 });
    // ประกายไล่ขึ้นเร็ว
    [1568, 2093, 2349, 2637, 3136, 3520, 4186].forEach((f, i) => tone({ freq: f, dur: 0.6, gain: 0.1, type: "sine", at: 0.05 + i * 0.05, wet: true }));
    // ฉาบ
    noiseSweep({ type: "highpass", from: 7000, to: 9000, dur: 1.6, gain: 0.3, wet: true, attack: 0.005 });
    // คอรัส "ฮาาาา~" เข้าพร้อมจังหวะเฉลย
    choir(0.02);
    buzz([40, 30, 80]);
  },
  /** แตะเลือกการ์ดใน gallery */
  tick: () => tone({ freq: 1400, dur: 0.05, gain: 0.12 }),
  /** เก็บเข้าคอลเลกชัน: กริ๊งสองโน้ต + ตราประทับ */
  save: () => {
    tone({ freq: 784, dur: 0.25, gain: 0.25, type: "triangle" });
    tone({ freq: 1175, dur: 0.45, gain: 0.25, type: "triangle", at: 0.1 });
  },
  stamp: () => {
    tone({ freq: 110, to: 50, dur: 0.18, gain: 0.55 });
    noiseSweep({ type: "lowpass", from: 1200, to: 200, dur: 0.12, gain: 0.35 });
    buzz(25);
  },
};
