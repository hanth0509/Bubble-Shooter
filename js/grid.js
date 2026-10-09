// Lưới bóng dạng lục giác (hàng lẻ lệch nửa ô)
// Mỗi ô: -1 = trống, 0..4 = chỉ số màu
const COLS = 12, ROWH = R * Math.sqrt(3), TOP = 50, LIMIT_ROW = 12;

class Grid {
  constructor() { this.reset(); }
  reset() { this.rows = []; this.shift = 0; }

  isOdd(r) { return (r + this.shift) % 2 === 1; }       // hàng lệch?
  colsIn(r) { return this.isOdd(r) ? COLS - 1 : COLS; }
  cx(r, c) { return R + c * 2 * R + (this.isOdd(r) ? R : 0); }
  cy(r) { return TOP + R + r * ROWH; }

  ensureRow(r) { while (this.rows.length <= r) this.rows.push(new Array(this.colsIn(this.rows.length)).fill(-1)); }
  get(r, c) {                                           // -2 nếu ngoài lưới
    const row = this.rows[r];
    if (!row || c < 0 || c >= row.length) return -2;
    return row[c];
  }
  set(r, c, v) { this.ensureRow(r); this.rows[r][c] = v; }

  neighbors(r, c) {
    const odd = this.isOdd(r), list = [[r, c - 1], [r, c + 1]];
    const cols = odd ? [c, c + 1] : [c - 1, c];
    for (const dr of [-1, 1]) for (const cc of cols) list.push([r + dr, cc]);
    return list.filter(n => n[0] >= 0 && n[0] < this.rows.length && this.get(n[0], n[1]) !== -2);
  }

  // BFS: tìm nhóm bóng cùng màu nối với (r,c)
  findGroup(r, c) {
    const color = this.get(r, c), seen = new Set([r * 100 + c]), queue = [[r, c]], out = [];
    while (queue.length) {
      const cur = queue.shift(); out.push(cur);
      for (const n of this.neighbors(cur[0], cur[1])) {
        const key = n[0] * 100 + n[1];
        if (!seen.has(key) && this.get(n[0], n[1]) === color) { seen.add(key); queue.push(n); }
      }
    }
    return out;
  }

  // BFS từ hàng 0: bóng không nối với trần sẽ bị xoá và trả về danh sách
  removeFloating() {
    const seen = new Set(), queue = [], out = [];
    if (this.rows[0]) this.rows[0].forEach((v, c) => { if (v >= 0) { seen.add(c); queue.push([0, c]); } });
    while (queue.length) {
      const cur = queue.shift();
      for (const n of this.neighbors(cur[0], cur[1])) {
        const key = n[0] * 100 + n[1];
        if (!seen.has(key) && this.get(n[0], n[1]) >= 0) { seen.add(key); queue.push(n); }
      }
    }
    this.rows.forEach((row, r) => row.forEach((v, c) => {
      if (v >= 0 && !seen.has(r * 100 + c)) { out.push({ r, c, color: v, x: this.cx(r, c), y: this.cy(r) }); row[c] = -1; }
    }));
    return out;
  }

  // Thêm một hàng mới ở trên cùng (đẩy lưới xuống), đổi shift để giữ nguyên độ lệch các hàng cũ
  addRow(numColors) {
    this.shift = (this.shift + 1) % 2;
    const row = [];
    for (let c = 0; c < this.colsIn(0); c++) row.push(Math.floor(Math.random() * numColors));
    this.rows.unshift(row);
  }

  // Ô trống gần (x,y) nhất, phải chạm trần hoặc kề một bóng khác
  nearestEmpty(x, y) {
    const r0 = Math.round((y - TOP - R) / ROWH);
    let best = null, bestD = Infinity;
    for (let r = Math.max(0, r0 - 1); r <= r0 + 1; r++) {
      this.ensureRow(r);
      for (let c = 0; c < this.colsIn(r); c++) {
        if (this.get(r, c) !== -1) continue;
        const attached = r === 0 || this.neighbors(r, c).some(n => this.get(n[0], n[1]) >= 0);
        if (!attached) continue;
        const dx = this.cx(r, c) - x, dy = this.cy(r) - y, d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = { r, c }; }
      }
    }
    return best;
  }

  // Va chạm: chạm trần hoặc quá gần một bóng
  collides(x, y) {
    if (y - R <= TOP) return true;
    const r0 = Math.floor((y - TOP - R) / ROWH), lim = (1.8 * R) * (1.8 * R);
    for (let r = Math.max(0, r0 - 1); r <= Math.min(this.rows.length - 1, r0 + 2); r++) {
      const row = this.rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] < 0) continue;
        const dx = this.cx(r, c) - x, dy = this.cy(r) - y;
        if (dx * dx + dy * dy < lim) return true;
      }
    }
    return false;
  }

  colorsPresent() {
    const s = new Set();
    this.rows.forEach(row => row.forEach(v => { if (v >= 0) s.add(v); }));
    return Array.from(s);
  }
  count() { let n = 0; this.rows.forEach(row => row.forEach(v => { if (v >= 0) n++; })); return n; }
  reachedLimit() {
    for (let r = LIMIT_ROW; r < this.rows.length; r++) if (this.rows[r].some(v => v >= 0)) return true;
    return false;
  }

  draw(ctx) {
    this.rows.forEach((row, r) => row.forEach((v, c) => { if (v >= 0) drawBubble(ctx, this.cx(r, c), this.cy(r), v); }));
  }
}
