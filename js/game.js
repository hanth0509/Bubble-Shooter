// Quản lý trạng thái, điểm số, level và vòng lặp game
const STATE = { MENU: 'MENU', PLAYING: 'PLAYING', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAME_OVER: 'GAME_OVER', PAUSED: 'PAUSED' };
const MISS_LIMIT = 5;

class Game {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.grid = new Grid(); this.fx = new Effects(); this.player = new Player();
    this.state = STATE.MENU; this.score = 0; this.level = 1; this.misses = 0; this.combo = 0;
    this.locked = false; this.shake = 0; this.timers = []; this.last = 0; this.looping = false; this.bgT = 0;
    this.scale = 1; this.dpr = 1;
    this.ui = { box: document.getElementById('overlay'), title: document.getElementById('title'),
                text: document.getElementById('text'), btn: document.getElementById('btn') };
    this.showScreen('BUBBLE SHOOTER', 'Ngắm bằng chuột / chạm màn hình\nClick hoặc thả tay để bắn\nPhím P: tạm dừng', 'START', 'start');
  }

  // ---------- Giao diện (HTML overlay) ----------
  showScreen(title, text, btnText, action) {
    this.ui.title.textContent = title; this.ui.text.textContent = text;
    this.ui.btn.textContent = btnText; this.ui.btn.dataset.action = action;
    this.ui.box.classList.remove('hidden');
  }
  hideScreen() { this.ui.box.classList.add('hidden'); }

  handleAction(action) {
    Sound.init();
    if (action === 'start' || action === 'restart') { this.score = 0; this.level = 1; this.loadLevel(); }
    else if (action === 'next') { this.level++; this.loadLevel(); }
    else if (action === 'resume') { this.state = STATE.PLAYING; this.hideScreen(); }
  }
  pause() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.PAUSED; this.showScreen('PAUSED', 'Game đang tạm dừng', 'RESUME', 'resume');
  }

  // ---------- Level ----------
  loadLevel() {
    this.timers.length = 0; this.fx.clear();
    this.misses = 0; this.combo = 0; this.locked = false; this.shake = 0;
    Levels.build(this.grid, this.level);
    this.player.shot = null; this.player.next = -1; this.reloadPlayer();
    this.state = STATE.PLAYING; this.hideScreen();
  }
  later(sec, fn) { this.timers.push({ t: sec, fn }); }

  // Chỉ phát ra các màu còn trên lưới để màn chơi luôn thắng được
  reloadPlayer() {
    const present = this.grid.colorsPresent(), p = this.player;
    if (!present.length) return;
    const rand = () => present[Math.floor(Math.random() * present.length)];
    p.current = present.includes(p.next) ? p.next : rand();
    p.next = rand();
  }

  // ---------- Input ----------
  aim(x, y) { if (this.state === STATE.PLAYING) this.player.aimAt(x, y); }
  fire() {
    if (this.state !== STATE.PLAYING || this.locked || this.player.shot || this.player.current < 0) return;
    this.player.shoot(); Sound.play('shoot');
  }

  // ---------- Logic khi bóng chạm lưới ----------
  onLand(x, y, color) {
    const g = this.grid, cell = g.nearestEmpty(x, y);
    if (!cell) { this.endGame(); return; }
    g.set(cell.r, cell.c, color);
    const group = g.findGroup(cell.r, cell.c);
    if (group.length >= 3) {
      this.combo++;
      let cx = 0, cy = 0;
      for (const n of group) {
        const px = g.cx(n[0], n[1]), py = g.cy(n[0]);
        this.fx.pop(px, py, color); g.set(n[0], n[1], -1); cx += px; cy += py;
      }
      const floating = g.removeFloating();
      for (const f of floating) this.fx.fall(f.x, f.y, f.color);
      const mult = 1 + 0.5 * (this.combo - 1);
      const pts = Math.round((group.length * 10 + floating.length * 20) * mult);
      this.score += pts;
      this.fx.text(cx / group.length, cy / group.length, '+' + pts, '#ffe66d');
      if (this.combo >= 2) { this.fx.text(W / 2, 600, 'COMBO x' + this.combo, '#ff9ff3'); Sound.play('combo'); }
      else Sound.play('pop');
      if (group.length + floating.length >= 6) this.shake = 8;
    } else {
      this.combo = 0; this.misses++;
      if (this.misses >= MISS_LIMIT) {
        this.misses = 0; g.addRow(Levels.get(this.level).colors);
        this.fx.text(W / 2, 80, 'NEW ROW!', '#ff6b6b'); Sound.play('row'); this.shake = 5;
      }
    }
    this.reloadPlayer();
    if (g.count() === 0) {
      this.locked = true;
      this.later(0.9, () => this.completeLevel());
    } else if (g.reachedLimit()) this.endGame();
  }

  completeLevel() {
    Sound.play('win');
    this.state = STATE.LEVEL_COMPLETE;
    if (this.level >= Levels.count()) this.showScreen('YOU WIN!', 'Đã hoàn thành tất cả level\nScore: ' + this.score, 'PLAY AGAIN', 'restart');
    else this.showScreen('LEVEL COMPLETE', 'Score: ' + this.score, 'NEXT LEVEL', 'next');
  }
  endGame() {
    this.locked = true; Sound.play('lose');
    this.later(0.6, () => {
      this.state = STATE.GAME_OVER;
      this.showScreen('GAME OVER', 'Score: ' + this.score + '\nLevel: ' + this.level, 'PLAY AGAIN', 'restart');
    });
  }

  // ---------- Game loop ----------
  start() { if (this.looping) return; this.looping = true; requestAnimationFrame(t => this.frame(t)); }
  frame(t) {
    if (!this.last) this.last = t;
    const dt = Math.min((t - this.last) / 1000, 0.05); this.last = t;
    this.update(dt); this.draw();
    requestAnimationFrame(t2 => this.frame(t2));
  }
  update(dt) {
    this.bgT += dt;
    if (this.state === STATE.PAUSED) return;
    this.fx.update(dt);
    this.shake = Math.max(0, this.shake - 30 * dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i]; tm.t -= dt;
      if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); }
    }
    if (this.state === STATE.PLAYING) this.player.update(dt, this.grid, (x, y, c) => this.onLand(x, y, c));
  }

  draw() {
    const ctx = this.ctx, s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1b1464'); bg.addColorStop(1, '#6a2c91');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc((i * 97 + 40) % W, 120 + i * 100 + Math.sin(this.bgT + i) * 15, 30 + i * 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    // vạch nguy hiểm
    ctx.strokeStyle = 'rgba(255,90,90,.7)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
    const ly = TOP + LIMIT_ROW * ROWH;
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke(); ctx.setLineDash([]);
    if (this.state !== STATE.MENU) {
      this.grid.draw(ctx); this.player.draw(ctx, this.grid); this.fx.draw(ctx);
    }
    ctx.restore();
    this.drawHud(ctx);
  }

  drawHud(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, TOP);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Trebuchet MS", Arial';
    ctx.textAlign = 'left'; ctx.fillText('SCORE: ' + this.score, 14, 33);
    ctx.textAlign = 'right'; ctx.fillText('LEVEL: ' + this.level, W - 14, 33);
    ctx.textAlign = 'left'; ctx.font = 'bold 14px "Trebuchet MS", Arial'; ctx.fillText('MISS', 14, 690);
    for (let i = 0; i < MISS_LIMIT; i++) {
      ctx.fillStyle = i < this.misses ? '#ff6b6b' : 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(70 + i * 22, 685, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
}
