
// Quản lý trạng thái, điểm số, level và vòng lặp game

const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    GAME_OVER: 'GAME_OVER',
    PAUSED: 'PAUSED'
};

const MISS_LIMIT = 5;

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Khởi tạo các đối tượng trong game
        this.grid = new Grid();
        this.fx = new Effects();
        this.player = new Player();

        // Trạng thái và thông tin game
        this.state = STATE.MENU;
        this.score = 0;
        this.level = 1;
        this.misses = 0;
        this.combo = 0;

        // Các biến điều khiển game
        this.locked = false;
        this.shake = 0;
        this.timers = [];
        this.last = 0;
        this.looping = false;
        this.bgT = 0;

        // Tỷ lệ hiển thị
        this.scale = 1;
        this.dpr = 1;

        // Lấy các thành phần giao diện HTML
        this.ui = {
            box: document.getElementById('overlay'),
            title: document.getElementById('title'),
            text: document.getElementById('text'),
            btn: document.getElementById('btn')
        };

        // Hiển thị màn hình bắt đầu
        this.showScreen(
            'BUBBLE SHOOTER',
            'Ngắm bằng chuột / chạm màn hình\nClick hoặc thả tay để bắn\nPhím P: tạm dừng',
            'START',
            'start'
        );
    }

    // Hiển thị giao diện
    showScreen(title, text, btnText, action) {
        this.ui.title.textContent = title;
        this.ui.text.textContent = text;
        this.ui.btn.textContent = btnText;
        this.ui.btn.dataset.action = action;

        this.ui.box.classList.remove('hidden');
    }

    // Ẩn giao diện
    hideScreen() {
        this.ui.box.classList.add('hidden');
    }

    // Xử lý sự kiện nút bấm
    handleAction(action) {
        Sound.init();

        if (action === 'start' || action === 'restart') {
            this.score = 0;
            this.level = 1;
            this.loadLevel();
        } else if (action === 'next') {
            this.level++;
            this.loadLevel();
        } else if (action === 'resume') {
            this.state = STATE.PLAYING;
            this.hideScreen();
        }
    }

    // Tạm dừng game
    pause() {
        if (this.state !== STATE.PLAYING) return;

        this.state = STATE.PAUSED;

        this.showScreen(
            'PAUSED',
            'Game đang tạm dừng',
            'RESUME',
            'resume'
        );
    }

    // Tải level
    loadLevel() {
        this.timers.length = 0;
        this.fx.clear();

        this.misses = 0;
        this.combo = 0;
        this.locked = false;
        this.shake = 0;

        Levels.build(this.grid, this.level);

        this.player.shot = null;
        this.player.next = -1;

        this.reloadPlayer();

        this.state = STATE.PLAYING;
        this.hideScreen();
    }

    // Thực hiện một hành động sau khoảng thời gian
    later(sec, fn) {
        this.timers.push({
            t: sec,
            fn: fn
        });
    }

    // Chọn màu bóng còn xuất hiện trên lưới
    reloadPlayer() {
        const present = this.grid.colorsPresent();
        const player = this.player;

        if (!present.length) return;

        const randomColor = () => {
            const index = Math.floor(Math.random() * present.length);
            return present[index];
        };

        if (present.includes(player.next)) {
            player.current = player.next;
        } else {
            player.current = randomColor();
        }

        player.next = randomColor();
    }

    // Điều khiển hướng ngắm
    aim(x, y) {
        if (this.state === STATE.PLAYING) {
            this.player.aimAt(x, y);
        }
    }

    // Bắn bóng
    fire() {
        if (this.state !== STATE.PLAYING) return;
        if (this.locked || this.player.shot) return;
        if (this.player.current < 0) return;

        this.player.shoot();
        Sound.play('shoot');
    }

    // Xử lý khi bóng chạm lưới
    onLand(x, y, color) {
        const grid = this.grid;
        const cell = grid.nearestEmpty(x, y);

        if (!cell) {
            this.endGame();
            return;
        }

        grid.set(cell.r, cell.c, color);

        const group = grid.findGroup(cell.r, cell.c);

        // Nếu có ít nhất 3 bóng cùng màu
        if (group.length >= 3) {
            this.combo++;

            let centerX = 0;
            let centerY = 0;

            // Xóa nhóm bóng và tạo hiệu ứng nổ
            for (const ball of group) {
                const ballX = grid.cx(ball[0], ball[1]);
                const ballY = grid.cy(ball[0]);

                this.fx.pop(ballX, ballY, color);
                grid.set(ball[0], ball[1], -1);

                centerX += ballX;
                centerY += ballY;
            }

            // Xóa các bóng không còn kết nối với phía trên
            const floating = grid.removeFloating();

            for (const ball of floating) {
                this.fx.fall(ball.x, ball.y, ball.color);
            }

            // Tính điểm theo combo
            const multiplier = 1 + 0.5 * (this.combo - 1);

            const points = Math.round(
                (group.length * 10 + floating.length * 20) * multiplier
            );

            this.score += points;

            // Hiển thị điểm nhận được
            this.fx.text(
                centerX / group.length,
                centerY / group.length,
                '+' + points,
                '#ffe66d'
            );

            // Hiển thị combo và phát âm thanh
            if (this.combo >= 2) {
                this.fx.text(
                    W / 2,
                    600,
                    'COMBO x' + this.combo,
                    '#ff9ff3'
                );

                Sound.play('combo');
            } else {
                Sound.play('pop');
            }

            // Rung màn hình khi phá được nhiều bóng
            if (group.length + floating.length >= 6) {
                this.shake = 8;
            }
        } else {
            // Không phá được nhóm bóng
            this.combo = 0;
            this.misses++;

            // Thêm hàng bóng mới khi đạt giới hạn
            if (this.misses >= MISS_LIMIT) {
                this.misses = 0;

                grid.addRow(Levels.get(this.level).colors);

                this.fx.text(
                    W / 2,
                    80,
                    'NEW ROW!',
                    '#ff6b6b'
                );

                Sound.play('row');
                this.shake = 5;
            }
        }

        // Nạp bóng tiếp theo
        this.reloadPlayer();

        // Kiểm tra thắng hoặc thua
        if (grid.count() === 0) {
            this.locked = true;
            this.later(0.9, () => this.completeLevel());
        } else if (grid.reachedLimit()) {
            this.endGame();
        }
    }

    // Hoàn thành level
    completeLevel() {
        Sound.play('win');
        this.state = STATE.LEVEL_COMPLETE;

        if (this.level >= Levels.count()) {
            this.showScreen(
                'YOU WIN!',
                'Đã hoàn thành tất cả level\nScore: ' + this.score,
                'PLAY AGAIN',
                'restart'
            );
        } else {
            this.showScreen(
                'LEVEL COMPLETE',
                'Score: ' + this.score,
                'NEXT LEVEL',
                'next'
            );
        }
    }

    // Kết thúc game
    endGame() {
        this.locked = true;
        Sound.play('lose');

        this.later(0.6, () => {
            this.state = STATE.GAME_OVER;

            this.showScreen(
                'GAME OVER',
                'Score: ' + this.score + '\nLevel: ' + this.level,
                'PLAY AGAIN',
                'restart'
            );
        });
    }

    // Bắt đầu vòng lặp game
    start() {
        if (this.looping) return;

        this.looping = true;

        requestAnimationFrame(time => this.frame(time));
    }

    // Cập nhật và vẽ game mỗi frame
    frame(time) {
        if (!this.last) {
            this.last = time;
        }

        const dt = Math.min((time - this.last) / 1000, 0.05);
        this.last = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame(nextTime => this.frame(nextTime));
    }

    // Cập nhật trạng thái game
    update(dt) {
        this.bgT += dt;

        if (this.state === STATE.PAUSED) return;

        this.fx.update(dt);

        this.shake = Math.max(0, this.shake - 30 * dt);

        // Cập nhật các bộ đếm thời gian
        for (let i = this.timers.length - 1; i >= 0; i--) {
            const timer = this.timers[i];

            timer.t -= dt;

            if (timer.t <= 0) {
                this.timers.splice(i, 1);
                timer.fn();
            }
        }

        // Cập nhật người chơi khi đang chơi
        if (this.state === STATE.PLAYING) {
            this.player.update(
                dt,
                this.grid,
                (x, y, color) => this.onLand(x, y, color)
            );
        }
    }

    // Vẽ màn hình game
    draw() {
        const ctx = this.ctx;
        const scale = this.scale * this.dpr;

        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // Vẽ nền chuyển màu
        const background = ctx.createLinearGradient(0, 0, 0, H);

        background.addColorStop(0, '#1b1464');
        background.addColorStop(1, '#6a2c91');

        ctx.fillStyle = background;
        ctx.fillRect(0, 0, W, H);

        // Vẽ các hình tròn trang trí
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';

        for (let i = 0; i < 6; i++) {
            const x = (i * 97 + 40) % W;
            const y = 120 + i * 100 + Math.sin(this.bgT + i) * 15;
            const radius = 30 + i * 6;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();

        // Tạo hiệu ứng rung màn hình
        if (this.shake > 0) {
            const x = (Math.random() - 0.5) * this.shake;
            const y = (Math.random() - 0.5) * this.shake;

            ctx.translate(x, y);
        }

        // Vẽ vạch giới hạn nguy hiểm
        ctx.strokeStyle = 'rgba(255, 90, 90, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);

        const lineY = TOP + LIMIT_ROW * ROWH;

        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(W, lineY);
        ctx.stroke();

        ctx.setLineDash([]);

        // Vẽ các thành phần trong game
        if (this.state !== STATE.MENU) {
            this.grid.draw(ctx);
            this.player.draw(ctx, this.grid);
            this.fx.draw(ctx);
        }

        ctx.restore();

        // Vẽ bảng điểm
        this.drawHud(ctx);
    }

    // Vẽ giao diện điểm số và số lần bắn trượt
    drawHud(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, W, TOP);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px "Trebuchet MS", Arial';

        // Điểm số
        ctx.textAlign = 'left';
        ctx.fillText('SCORE: ' + this.score, 14, 33);

        // Level hiện tại
        ctx.textAlign = 'right';
        ctx.fillText('LEVEL: ' + this.level, W - 14, 33);

        // Số lần bắn trượt
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "Trebuchet MS", Arial';
        ctx.fillText('MISS', 14, 690);

        for (let i = 0; i < MISS_LIMIT; i++) {
            if (i < this.misses) {
                ctx.fillStyle = '#ff6b6b';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            }

            ctx.beginPath();
            ctx.arc(70 + i * 22, 685, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

