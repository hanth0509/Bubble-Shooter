// Súng bắn bóng: ngắm, bắn, di chuyển bóng, va chạm tường/lưới
const SHOT_SPEED = 900, MIN_ANGLE = 12 * Math.PI / 180, MAX_ANGLE = Math.PI - MIN_ANGLE;

class Player {
  constructor() {
    this.x = W / 2; this.y = 640;
    this.angle = Math.PI / 2;          // 90° = bắn thẳng lên
    this.current = 0; this.next = 0;
    this.shot = null; this.recoil = 0;
  }

  aimAt(mx, my) {
    let a = Math.atan2(-(my - this.y), mx - this.x);
    if (a < 0) a = (mx < this.x) ? Math.PI : 0;                 // chuột dưới súng: kẹp về 2 bên
    this.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, a));   // không bắn xuống/ngang
  }

  shoot() {
    this.shot = { x: this.x, y: this.y, vx: Math.cos(this.angle), vy: -Math.sin(this.angle), color: this.current };
    this.current = -1; this.recoil = 12;
  }

  // Di chuyển theo từng bước nhỏ (<= 6px) để không xuyên qua bóng
  update(dt, grid, onLand) {
    this.recoil *= Math.max(0, 1 - dt * 12);
    const s = this.shot; if (!s) return;
    const dist = SHOT_SPEED * dt, n = Math.max(1, Math.ceil(dist / 6)), d = dist / n;
    for (let i = 0; i < n; i++) {
      s.x += s.vx * d; s.y += s.vy * d;
      if (s.x < R) { s.x = R; s.vx = -s.vx; }                 // phản xạ tường trái
      else if (s.x > W - R) { s.x = W - R; s.vx = -s.vx; }    // phản xạ tường phải
      if (grid.collides(s.x, s.y)) { this.shot = null; onLand(s.x, s.y, s.color); return; }
    }
  }

  // Điểm của đường ngắm (mô phỏng quỹ đạo, có phản xạ tường)
  trace(grid) {
    const pts = []; let x = this.x, y = this.y, vx = Math.cos(this.angle), vy = -Math.sin(this.angle);
    for (let i = 0; i < 300; i++) {
      x += vx * 6; y += vy * 6;
      if (x < R) { x = R; vx = -vx; } else if (x > W - R) { x = W - R; vx = -vx; }
      if (i % 3 === 0 && i > 4) pts.push(x, y);
      if (grid.collides(x, y)) break;
    }
    return pts;
  }

  draw(ctx, grid) {
    // đường ngắm
    if (!this.shot) {
      const pts = this.trace(grid);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < pts.length; i += 2) { ctx.beginPath(); ctx.arc(pts[i], pts[i + 1], 3, 0, Math.PI * 2); ctx.fill(); }
    }
    // thân súng
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.PI / 2 - this.angle);
    const g = ctx.createLinearGradient(-12, 0, 12, 0);
    g.addColorStop(0, '#6c5ce7'); g.addColorStop(.5, '#a29bfe'); g.addColorStop(1, '#4834d4');
    ctx.fillStyle = g; ctx.strokeStyle = '#2d1b8f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-12, -52 + this.recoil, 24, 52, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#4834d4'; ctx.strokeStyle = '#2d1b8f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.x, this.y, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // bóng hiện tại, bóng đang bay, bóng kế tiếp
    if (this.current >= 0) drawBubble(ctx, this.x, this.y, this.current);
    if (this.shot) drawBubble(ctx, this.shot.x, this.shot.y, this.shot.color);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Trebuchet MS", Arial'; ctx.textAlign = 'center';
    ctx.fillText('NEXT', this.x - 100, this.y - 18);
    if (this.next >= 0) drawBubble(ctx, this.x - 100, this.y + 8, this.next, 0.85);
  }
}
