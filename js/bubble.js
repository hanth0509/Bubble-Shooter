// Hằng số chung và hàm vẽ bóng
const W = 480, H = 720;          // kích thước "logic" của game
const R = 20;                    // bán kính bóng
const COLORS = [                 // 5 màu: sáng / chính / tối
  { light: '#ff9a9a', base: '#e63946', dark: '#8d0a14' }, // đỏ
  { light: '#8fd8ff', base: '#1d7fe0', dark: '#0a3a8a' }, // xanh dương
  { light: '#b6f08a', base: '#2eb82e', dark: '#12701c' }, // xanh lá
  { light: '#fff3a0', base: '#ffc300', dark: '#a87400' }, // vàng
  { light: '#e0aaff', base: '#9d4edd', dark: '#4a148c' }  // tím
];

function drawBubble(ctx, x, y, colorIndex, scale, alpha) {
  scale = scale === undefined ? 1 : scale;
  alpha = alpha === undefined ? 1 : alpha;
  const c = COLORS[colorIndex], r = R * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,.25)';             // bóng đổ
  ctx.beginPath(); ctx.arc(x + 1, y + 3, r, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
  g.addColorStop(0, c.light); g.addColorStop(.6, c.base); g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)';       // điểm sáng
  ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .25, r * .15, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
