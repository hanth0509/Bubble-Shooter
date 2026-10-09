// Âm thanh và hiệu ứng trong game

const Sound = {
    ctx: null,

    // Khởi tạo âm thanh
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AC = window.AudioContext || window.webkitAudioContext;

            if (AC) {
                this.ctx = new AC();
            }
        } catch (e) {
            this.ctx = null;
        }
    },

    // Tạo âm thanh
    tone(freq, dur, type, vol, slide, delay) {
        if (!this.ctx) return;

        try {
            const t = this.ctx.currentTime + (delay || 0);
            const oscillator = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, t);

            if (slide) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    slide, t + dur
                );
            }

            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

            oscillator.connect(gain);
            gain.connect(this.ctx.destination);

            oscillator.start(t);
            oscillator.stop(t + dur);
        } catch (e) {
            // Bỏ qua nếu âm thanh bị lỗi
        }
    },

    // Phát âm thanh theo sự kiện
    play(name) {
        if (name === 'shoot') {
            this.tone(500, 0.12, 'triangle', 0.2, 900);
        } else if (name === 'pop') {
            this.tone(700, 0.12, 'square', 0.12, 250);
        } else if (name === 'combo') {
            this.tone(600, 0.1, 'triangle', 0.2, null, 0);
            this.tone(900, 0.15, 'triangle', 0.2, null, 0.08);
        } else if (name === 'row') {
            this.tone(150, 0.25, 'sawtooth', 0.15, 80);
        } else if (name === 'win') {
            [523, 659, 784, 1046].forEach((freq, i) => {
                this.tone(freq, 0.2, 'triangle', 0.2, null, i * 0.12);
            });
        } else if (name === 'lose') {
            [400, 330, 260, 180].forEach((freq, i) => {
                this.tone(freq, 0.25, 'sawtooth', 0.15, null, i * 0.15);
            });
        }
    }
};


// Quản lý các hiệu ứng trong game
class Effects {
    constructor() {
        // Tạo sẵn 250 hạt
        this.parts = [];

        for (let i = 0; i < 250; i++) {
            this.parts.push({
                on: false,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                life: 0,
                max: 1,
                size: 3,
                color: '#fff'
            });
        }

        this.texts = [];
        this.falls = [];
        this.rings = [];
    }

    // Xóa tất cả hiệu ứng
    clear() {
        this.parts.forEach(p => p.on = false);

        this.texts.length = 0;
        this.falls.length = 0;
        this.rings.length = 0;
    }

    // Tạo các hạt bay ra
    spawn(x, y, color, n) {
        for (let i = 0; i < this.parts.length && n > 0; i++) {
            const p = this.parts[i];

            if (p.on) continue;

            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 160;

            p.on = true;
            p.x = x;
            p.y = y;

            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 60;

            p.life = 0.4 + Math.random() * 0.3;
            p.max = p.life;

            p.size = 2 + Math.random() * 3;
            p.color = color;

            n--;
        }
    }

    // Tạo hiệu ứng bóng nổ
    pop(x, y, colorIndex) {
        this.rings.push({
            x: x,
            y: y,
            t: 0,
            color: colorIndex
        });

        this.spawn(x, y, COLORS[colorIndex].base, 8);
    }

    // Tạo bóng rơi
    fall(x, y, colorIndex) {
        this.falls.push({
            x: x,
            y: y,
            vy: -150 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 120,
            color: colorIndex
        });
    }

    // Tạo chữ bay
    text(x, y, str, color) {
        this.texts.push({
            x: x,
            y: y,
            str: str,
            color: color || '#fff',
            t: 0
        });
    }

    // Cập nhật hiệu ứng theo thời gian
    update(dt) {
        // Cập nhật các hạt
        for (const p of this.parts) {
            if (!p.on) continue;

            p.life -= dt;

            if (p.life <= 0) {
                p.on = false;
                continue;
            }

            p.vy += 500 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        // Cập nhật vòng tròn nổ
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];

            ring.t += dt;

            if (ring.t > 0.25) {
                this.rings.splice(i, 1);
            }
        }

        // Cập nhật chữ bay
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];

            text.t += dt;
            text.y -= 40 * dt;

            if (text.t > 1) {
                this.texts.splice(i, 1);
            }
        }

        // Cập nhật bóng rơi
        for (let i = this.falls.length - 1; i >= 0; i--) {
            const fall = this.falls[i];

            fall.vy += 1200 * dt;
            fall.y += fall.vy * dt;
            fall.x += fall.vx * dt;

            if (fall.y > H + R) {
                this.falls.splice(i, 1);
            }
        }
    }

    // Vẽ tất cả hiệu ứng
    draw(ctx) {
        // Vẽ các bóng rơi
        for (const fall of this.falls) {
            drawBubble(ctx, fall.x, fall.y, fall.color);
        }

        // Vẽ hiệu ứng vòng tròn nổ
        for (const ring of this.rings) {
            const k = ring.t / 0.25;

            drawBubble(
                ctx, ring.x, ring.y,
                ring.color, 1 + k * 0.4, 1 - k
            );

            ctx.strokeStyle =
                'rgba(255, 255, 255, ' + (0.8 * (1 - k)) + ')';

            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                ring.x, ring.y,
                R * (1 + k * 1.2),
                0, Math.PI * 2
            );
            ctx.stroke();
        }

        // Vẽ các hạt
        for (const p of this.parts) {
            if (!p.on) continue;

            ctx.globalAlpha = p.life / p.max;
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Thiết lập chữ
        ctx.font = 'bold 22px "Trebuchet MS", Arial';
        ctx.textAlign = 'center';

        // Vẽ chữ bay
        for (const text of this.texts) {
            ctx.globalAlpha = 1 - text.t;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';

            ctx.strokeText(text.str, text.x, text.y);

            ctx.fillStyle = text.color;
            ctx.fillText(text.str, text.x, text.y);
        }

        ctx.globalAlpha = 1;
    }
}

