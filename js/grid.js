
// Lưới bóng dạng lục giác
// -1: ô trống, 0-4: màu bóng

const COLS = 12;
const ROWH = R * Math.sqrt(3);
const TOP = 50;
const LIMIT_ROW = 12;

class Grid {
    constructor() {
        this.reset();
    }

    // Đặt lại lưới
    reset() {
        this.rows = [];
        this.shift = 0;
    }

    // Kiểm tra hàng có bị lệch không
    isOdd(r) {
        return (r + this.shift) % 2 === 1;
    }

    // Số ô trong một hàng
    colsIn(r) {
        return this.isOdd(r) ? COLS - 1 : COLS;
    }

    // Tọa độ X của bóng
    cx(r, c) {
        let x = R + c * 2 * R;

        if (this.isOdd(r)) {
            x += R;
        }

        return x;
    }

    // Tọa độ Y của bóng
    cy(r) {
        return TOP + R + r * ROWH;
    }

    // Tạo thêm hàng nếu chưa có
    ensureRow(r) {
        while (this.rows.length <= r) {
            const cols = this.colsIn(this.rows.length);
            this.rows.push(new Array(cols).fill(-1));
        }
    }

    // Lấy màu bóng, trả về -2 nếu ô không tồn tại
    get(r, c) {
        const row = this.rows[r];

        if (!row || c < 0 || c >= row.length) {
            return -2;
        }

        return row[c];
    }

    // Gán màu cho ô
    set(r, c, v) {
        this.ensureRow(r);
        this.rows[r][c] = v;
    }

    // Tìm các ô lân cận
    neighbors(r, c) {
        const odd = this.isOdd(r);
        const list = [
            [r, c - 1],
            [r, c + 1]
        ];

        let cols;

        if (odd) {
            cols = [c, c + 1];
        } else {
            cols = [c - 1, c];
        }

        for (const dr of [-1, 1]) {
            for (const col of cols) {
                list.push([r + dr, col]);
            }
        }

        return list.filter(cell =>
            cell[0] >= 0 &&
            cell[0] < this.rows.length &&
            this.get(cell[0], cell[1]) !== -2
        );
    }

    // Tìm nhóm bóng cùng màu bằng BFS
    findGroup(r, c) {
        const color = this.get(r, c);
        const seen = new Set([r * 100 + c]);
        const queue = [[r, c]];
        const group = [];

        while (queue.length > 0) {
            const current = queue.shift();

            group.push(current);

            const list = this.neighbors(current[0], current[1]);

            for (const cell of list) {
                const row = cell[0];
                const col = cell[1];
                const key = row * 100 + col;

                if (
                    !seen.has(key) &&
                    this.get(row, col) === color
                ) {
                    seen.add(key);
                    queue.push(cell);
                }
            }
        }

        return group;
    }

    // Xóa các bóng không còn nối với hàng trên cùng
    removeFloating() {
        const seen = new Set();
        const queue = [];
        const floating = [];

        // Bắt đầu tìm từ các bóng ở hàng đầu tiên
        if (this.rows[0]) {
            this.rows[0].forEach((color, col) => {
                if (color >= 0) {
                    seen.add(col);
                    queue.push([0, col]);
                }
            });
        }

        // Tìm tất cả bóng còn kết nối với phía trên
        while (queue.length > 0) {
            const current = queue.shift();
            const list = this.neighbors(current[0], current[1]);

            for (const cell of list) {
                const row = cell[0];
                const col = cell[1];
                const key = row * 100 + col;

                if (
                    !seen.has(key) &&
                    this.get(row, col) >= 0
                ) {
                    seen.add(key);
                    queue.push(cell);
                }
            }
        }

        // Xóa và lưu lại các bóng bị rơi
        this.rows.forEach((row, r) => {
            row.forEach((color, c) => {
                const key = r * 100 + c;

                if (color >= 0 && !seen.has(key)) {
                    floating.push({
                        r: r,
                        c: c,
                        color: color,
                        x: this.cx(r, c),
                        y: this.cy(r)
                    });

                    row[c] = -1;
                }
            });
        });

        return floating;
    }

    // Thêm hàng bóng mới ở phía trên
    addRow(numColors) {
        this.shift = (this.shift + 1) % 2;

        const row = [];

        for (let c = 0; c < this.colsIn(0); c++) {
            const color = Math.floor(Math.random() * numColors);
            row.push(color);
        }

        this.rows.unshift(row);
    }

    // Tìm ô trống gần vị trí bắn nhất
    nearestEmpty(x, y) {
        const startRow = Math.round((y - TOP - R) / ROWH);

        let best = null;
        let bestDistance = Infinity;

        for (
            let r = Math.max(0, startRow - 1);
            r <= startRow + 1;
            r++
        ) {
            this.ensureRow(r);

            for (let c = 0; c < this.colsIn(r); c++) {
                if (this.get(r, c) !== -1) continue;

                // Ô phải chạm hàng trên cùng hoặc bóng khác
                const attached =
                    r === 0 ||
                    this.neighbors(r, c).some(cell =>
                        this.get(cell[0], cell[1]) >= 0
                    );

                if (!attached) continue;

                const dx = this.cx(r, c) - x;
                const dy = this.cy(r) - y;
                const distance = dx * dx + dy * dy;

                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = { r: r, c: c };
                }
            }
        }

        return best;
    }

    // Kiểm tra bóng có va chạm không
    collides(x, y) {
        if (y - R <= TOP) {
            return true;
        }

        const startRow = Math.floor((y - TOP - R) / ROWH);
        const limit = (1.8 * R) * (1.8 * R);

        for (
            let r = Math.max(0, startRow - 1);
            r <= Math.min(this.rows.length - 1, startRow + 2);
            r++
        ) {
            const row = this.rows[r];

            for (let c = 0; c < row.length; c++) {
                if (row[c] < 0) continue;

                const dx = this.cx(r, c) - x;
                const dy = this.cy(r) - y;

                if (dx * dx + dy * dy < limit) {
                    return true;
                }
            }
        }

        return false;
    }

    // Lấy danh sách màu đang có trên lưới
    colorsPresent() {
        const colors = new Set();

        this.rows.forEach(row => {
            row.forEach(color => {
                if (color >= 0) {
                    colors.add(color);
                }
            });
        });

        return Array.from(colors);
    }

    // Đếm số bóng còn lại
    count() {
        let total = 0;

        this.rows.forEach(row => {
            row.forEach(color => {
                if (color >= 0) {
                    total++;
                }
            });
        });

        return total;
    }

    // Kiểm tra bóng đã chạm giới hạn chưa
    reachedLimit() {
        for (let r = LIMIT_ROW; r < this.rows.length; r++) {
            if (this.rows[r].some(color => color >= 0)) {
                return true;
            }
        }

        return false;
    }

    // Vẽ các bóng trên lưới
    draw(ctx) {
        this.rows.forEach((row, r) => {
            row.forEach((color, c) => {
                if (color >= 0) {
                    drawBubble(
                        ctx,
                        this.cx(r, c),
                        this.cy(r),
                        color
                    );
                }
            });
        });
    }
}
