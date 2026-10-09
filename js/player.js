
// Tốc độ bay của bóng và giới hạn góc bắn
const SHOT_SPEED = 900;
const MIN_ANGLE = 12 * Math.PI / 180;
const MAX_ANGLE = Math.PI - MIN_ANGLE;

class Player {
    constructor() {
        // Vị trí của súng
        this.x = W / 2;
        this.y = 640;

        // Góc bắn ban đầu: 90 độ, bắn thẳng lên
        this.angle = Math.PI / 2;

        // Màu bóng hiện tại và bóng tiếp theo
        this.current = 0;
        this.next = 0;

        // Bóng đang bay và độ giật của súng
        this.shot = null;
        this.recoil = 0;
    }

    // Điều chỉnh hướng bắn theo vị trí chuột
    aimAt(mx, my) {
        let angle = Math.atan2(
            -(my - this.y),
            mx - this.x
        );

        // Nếu chuột nằm dưới súng, hướng bắn được giới hạn về hai bên
        if (angle < 0) {
            angle = mx < this.x ? Math.PI : 0;
        }

        // Giới hạn góc bắn, không cho bắn xuống dưới
        this.angle = Math.max(
            MIN_ANGLE,
            Math.min(MAX_ANGLE, angle)
        );
    }

    // Bắn bóng theo hướng đã ngắm
    shoot() {
        this.shot = {
            x: this.x,
            y: this.y,
            vx: Math.cos(this.angle),
            vy: -Math.sin(this.angle),
            color: this.current
        };

        // Không còn bóng chờ để bắn
        this.current = -1;

        // Tạo hiệu ứng giật súng
        this.recoil = 12;
    }

    // Cập nhật vị trí bóng và kiểm tra va chạm
    update(dt, grid, onLand) {
        // Giảm dần độ giật của súng
        this.recoil *= Math.max(0, 1 - dt * 12);

        const shot = this.shot;

        // Không có bóng đang bay thì không cần cập nhật
        if (!shot) return;

        // Chia quãng đường thành các bước nhỏ để hạn chế xuyên qua bóng
        const distance = SHOT_SPEED * dt;
        const steps = Math.max(1, Math.ceil(distance / 6));
        const stepDistance = distance / steps;

        for (let i = 0; i < steps; i++) {
            // Di chuyển bóng theo hướng bắn
            shot.x += shot.vx * stepDistance;
            shot.y += shot.vy * stepDistance;

            // Va chạm tường bên trái
            if (shot.x < R) {
                shot.x = R;
                shot.vx = -shot.vx;
            }
            // Va chạm tường bên phải
            else if (shot.x > W - R) {
                shot.x = W - R;
                shot.vx = -shot.vx;
            }

            // Kiểm tra va chạm với các bóng trên lưới
            if (grid.collides(shot.x, shot.y)) {
                this.shot = null;

                // Gọi hàm xử lý khi bóng chạm lưới
                onLand(shot.x, shot.y, shot.color);
                return;
            }
        }
    }

    // Tính các điểm trên đường ngắm và mô phỏng phản xạ tường
    trace(grid) {
        const points = [];

        let x = this.x;
        let y = this.y;

        let vx = Math.cos(this.angle);
        let vy = -Math.sin(this.angle);

        // Mô phỏng đường bay tối đa 300 bước
        for (let i = 0; i < 300; i++) {
            x += vx * 6;
            y += vy * 6;

            // Phản xạ khi chạm tường trái
            if (x < R) {
                x = R;
                vx = -vx;
            }
            // Phản xạ khi chạm tường phải
            else if (x > W - R) {
                x = W - R;
                vx = -vx;
            }

            // Chỉ lấy một số điểm để vẽ đường ngắm
            if (i % 3 === 0 && i > 4) {
                points.push(x, y);
            }

            // Dừng mô phỏng khi chạm lưới bóng
            if (grid.collides(x, y)) {
                break;
            }
        }

        return points;
    }

    // Vẽ đường ngắm, súng và các bóng
    draw(ctx, grid) {
        // Vẽ đường ngắm khi chưa bắn
        if (!this.shot) {
            const points = this.trace(grid);

            ctx.fillStyle = 'rgba(255,255,255,.7)';

            for (let i = 0; i < points.length; i += 2) {
                ctx.beginPath();
                ctx.arc(points[i], points[i + 1], 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Vẽ thân súng theo hướng bắn
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 2 - this.angle);

        // Tạo màu chuyển sắc cho thân súng
        const gradient = ctx.createLinearGradient(-12, 0, 12, 0);

        gradient.addColorStop(0, '#6c5ce7');
        gradient.addColorStop(0.5, '#a29bfe');
        gradient.addColorStop(1, '#4834d4');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#2d1b8f';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(-12, -52 + this.recoil, 24, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Vẽ phần đế súng
        ctx.fillStyle = '#4834d4';
        ctx.strokeStyle = '#2d1b8f';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vẽ bóng hiện tại trong súng
        if (this.current >= 0) {
            drawBubble(ctx, this.x, this.y, this.current);
        }

        // Vẽ bóng đang bay
        if (this.shot) {
            drawBubble(
                ctx,
                this.shot.x,
                this.shot.y,
                this.shot.color
            );
        }

        // Hiển thị chữ NEXT
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Trebuchet MS", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', this.x - 100, this.y - 18);

        // Vẽ bóng tiếp theo
        if (this.next >= 0) {
            drawBubble(
                ctx,
                this.x - 100,
                this.y + 8,
                this.next,
                0.85
            );
        }
    }
}

