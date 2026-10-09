
// Kích thước game và bán kính bóng
const W = 480;
const H = 720;
const R = 20;

// Danh sách màu của các bóng
const COLORS = [
    { light: '#ff9a9a', base: '#e63946', dark: '#8d0a14' }, // Đỏ
    { light: '#8fd8ff', base: '#1d7fe0', dark: '#0a3a8a' }, // Xanh dương
    { light: '#b6f08a', base: '#2eb82e', dark: '#12701c' }, // Xanh lá
    { light: '#fff3a0', base: '#ffc300', dark: '#a87400' }, // Vàng
    { light: '#e0aaff', base: '#9d4edd', dark: '#4a148c' }  // Tím
];

// Hàm vẽ bóng
function drawBubble(ctx, x, y, colorIndex, scale, alpha) {
    // Giá trị mặc định
    if (scale === undefined) scale = 1;
    if (alpha === undefined) alpha = 1;

    const color = COLORS[colorIndex];
    const r = R * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Vẽ bóng đổ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 3, r, 0, Math.PI * 2);
    ctx.fill();

    // Tạo màu chuyển sắc
    const gradient = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.35, r * 0.1,
        x, y, r
    );

    gradient.addColorStop(0, color.light);
    gradient.addColorStop(0.6, color.base);
    gradient.addColorStop(1, color.dark);

    // Vẽ thân bóng
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ viền bóng
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vẽ điểm sáng
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(
        x - r * 0.35, y - r * 0.4,
        r * 0.25, r * 0.15,
        -0.7, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}

