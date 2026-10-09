// 5 level demo: rows = số hàng, colors = số màu, hole(r,c) = true nếu ô để trống
const Levels = {
  list: [
    { rows: 5, colors: 3, hole: () => false },
    { rows: 7, colors: 3, hole: () => false },
    { rows: 7, colors: 4, hole: () => false },
    { rows: 8, colors: 4, hole: (r, c) => r % 3 === 1 && c % 4 === 2 },
    { rows: 9, colors: 5, hole: (r, c) => r >= 2 && (c + r * 2) % 5 === 0 }
  ],
  count() { return this.list.length; },
  get(n) { return this.list[Math.min(n, this.list.length) - 1]; },

  build(grid, n) {
    const cfg = this.get(n);
    grid.reset();
    for (let r = 0; r < cfg.rows; r++) {
      grid.ensureRow(r);
      for (let c = 0; c < grid.colsIn(r); c++) {
        if (cfg.hole(r, c)) continue;
        // 45% giống bóng bên trái để tạo cụm màu
        const left = c > 0 ? grid.get(r, c - 1) : -1;
        const color = (left >= 0 && Math.random() < 0.45) ? left : Math.floor(Math.random() * cfg.colors);
        grid.set(r, c, color);
      }
    }
    grid.removeFloating(); // bỏ bóng lơ lửng do ô trống tạo ra
  }
};
