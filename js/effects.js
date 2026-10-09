// Âm thanh (Web Audio) và hiệu ứng (hạt, chữ bay, bóng rơi, bóng nổ)
const Sound = {
  ctx: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type, vol, slide, delay) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + (delay || 0), o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* bỏ qua nếu audio lỗi */ }
  },
  play(name) {
    if (name === 'shoot') this.tone(500, 0.12, 'triangle', 0.2, 900);
    else if (name === 'pop') this.tone(700, 0.12, 'square', 0.12, 250);
    else if (name === 'combo') { this.tone(600, 0.1, 'triangle', 0.2, null, 0); this.tone(900, 0.15, 'triangle', 0.2, null, 0.08); }
    else if (name === 'row') this.tone(150, 0.25, 'sawtooth', 0.15, 80);
    else if (name === 'win') [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.2, null, i * 0.12));
    else if (name === 'lose') [400, 330, 260, 180].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.15, null, i * 0.15));
  }
};

class Effects {
  constructor() {
    this.parts = [];                       // pool cố định 250 hạt, không tạo mới mỗi frame
    for (let i = 0; i < 250; i++) this.parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#fff' });
    this.texts = []; this.falls = []; this.rings = [];
  }
  clear() { this.parts.forEach(p => p.on = false); this.texts.length = 0; this.falls.length = 0; this.rings.length = 0; }

  spawn(x, y, color, n) {
    for (let i = 0; i < this.parts.length && n > 0; i++) {
      const p = this.parts[i]; if (p.on) continue;
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 160;
      p.on = true; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 60;
      p.life = p.max = 0.4 + Math.random() * 0.3; p.size = 2 + Math.random() * 3; p.color = color; n--;
    }
  }
  pop(x, y, colorIndex) { this.rings.push({ x, y, t: 0, color: colorIndex }); this.spawn(x, y, COLORS[colorIndex].base, 8); }
  fall(x, y, colorIndex) { this.falls.push({ x, y, vy: -150 - Math.random() * 100, vx: (Math.random() - .5) * 120, color: colorIndex }); }
  text(x, y, str, color) { this.texts.push({ x, y, str, color: color || '#fff', t: 0 }); }

  update(dt) {
    for (const p of this.parts) {
      if (!p.on) continue;
      p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
      p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) { this.rings[i].t += dt; if (this.rings[i].t > 0.25) this.rings.splice(i, 1); }
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y -= 40 * dt; if (t.t > 1) this.texts.splice(i, 1); }
    for (let i = this.falls.length - 1; i >= 0; i--) {
      const f = this.falls[i]; f.vy += 1200 * dt; f.y += f.vy * dt; f.x += f.vx * dt;
      if (f.y > H + R) this.falls.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const f of this.falls) drawBubble(ctx, f.x, f.y, f.color);
    for (const r of this.rings) {
      const k = r.t / 0.25;
      drawBubble(ctx, r.x, r.y, r.color, 1 + k * 0.4, 1 - k);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - k)) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, R * (1 + k * 1.2), 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of this.parts) {
      if (!p.on) continue;
      ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 22px "Trebuchet MS", Arial'; ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = 1 - t.t; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.strokeText(t.str, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
