// WebAudio 合成音效，无外部素材。sfx(name) 在关闭或不可用时静默跳过。
"use strict";

const sfx = (function () {
  let ctx = null;
  let unlocked = false;

  function ensureCtx() {
    if (!unlocked) return null;
    try {
      if (!ctx || ctx.state === "closed") ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  // 首次用户手势时解锁（浏览器自动播放策略）
  document.addEventListener("pointerdown", () => { unlocked = true; ensureCtx(); }, { once: true, capture: true });

  // tone: 频率、起止、波形、音量、包络
  function tone(c, freq, t0, dur, type, vol) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.12, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const lib = {
    ring(c, t) { // 连麦铃声：两组双音
      for (let i = 0; i < 2; i++) {
        const b = t + i * 0.42;
        tone(c, 620, b, 0.16, "sine", 0.10);
        tone(c, 930, b + 0.05, 0.18, "sine", 0.08);
      }
    },
    click(c, t) { tone(c, 1150, t, 0.045, "triangle", 0.08); },
    danger(c, t) { tone(c, 190, t, 0.22, "sawtooth", 0.09); tone(c, 130, t + 0.07, 0.24, "sawtooth", 0.07); },
    good(c, t) { tone(c, 880, t, 0.09, "sine", 0.08); tone(c, 1320, t + 0.07, 0.14, "sine", 0.07); },
    paper(c, t) { // 判决面板：短噪声"唰"
      const len = Math.floor(c.sampleRate * 0.14);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.35;
      const src = c.createBufferSource(); src.buffer = buf;
      const g = c.createGain(); g.gain.value = 0.30;
      const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1400;
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start(t);
    },
    correct(c, t) { tone(c, 523, t, 0.16, "sine", 0.11); tone(c, 784, t + 0.10, 0.20, "sine", 0.11); tone(c, 1047, t + 0.20, 0.30, "sine", 0.10); },
    wrong(c, t) { tone(c, 196, t, 0.34, "sine", 0.14); tone(c, 147, t + 0.06, 0.40, "sine", 0.12); },
    bust(c, t) { // 拆穿：小号式琶音
      [392, 494, 587, 784].forEach((f, i) => tone(c, f, t + i * 0.085, 0.18, "square", 0.06));
      tone(c, 1046, t + 0.34, 0.4, "square", 0.06);
    },
    achv(c, t) { // 成就：闪亮琶音
      [880, 1109, 1319, 1760].forEach((f, i) => tone(c, f, t + i * 0.07, 0.22, "sine", 0.07));
    },
  };

  function play(name) {
    const c = ensureCtx();
    if (!c || !lib[name]) return;
    try { lib[name](c, c.currentTime + 0.01); } catch (e) { /* 静默降级 */ }
  }

  return { play };
})();
