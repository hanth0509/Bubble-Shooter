
// Cấu hình 5 màn chơi
// rows: số hàng
// colors: số màu bóng
// hole(r, c): kiểm tra ô (r, c) có phải ô trống không

const Levels = {
    list: [
        { rows: 5, colors: 3, hole: () => false },
        { rows: 7, colors: 3, hole: () => false },
        { rows: 7, colors: 4, hole: () => false },
        { rows: 8, colors: 4, hole: (r, c) => r % 3 === 1 && c % 4 === 2 },
        { rows: 9, colors: 5, hole: (r, c) => r >= 2 && (c + r * 2) % 5 === 0 }
    ],

    // Lấy tổng số màn chơi
    count() {
        return this.list.length;
    },

    // Lấy cấu hình của màn chơi theo số thứ tự
    get(n) {
        return this.list[Math.min(n, this.list.length) - 1];
    },

    // Tạo màn chơi
    build(grid, n) {
        const config = this.get(n);

        // Xóa lưới cũ
        grid.reset();

        // Tạo từng hàng bóng
        for (let row = 0; row < config.rows; row++) {
            grid.ensureRow(row);

            // Tạo bóng trong từng hàng
            for (let col = 0; col < grid.colsIn(row); col++) {

                // Bỏ qua ô được quy định là ô trống
                if (config.hole(row, col)) {
                    continue;
                }

                // Lấy màu của bóng bên trái
                const leftColor = col > 0
                    ? grid.get(row, col - 1)
                    : -1;

                // 45% cơ hội sử dụng màu của bóng bên trái
                let color;

                if (leftColor >= 0 && Math.random() < 0.45) {
                    color = leftColor;
                } else {
                    // Chọn màu ngẫu nhiên
                    color = Math.floor(Math.random() * config.colors);
                }

                // Đặt bóng vào lưới
                grid.set(row, col, color);
            }
        }

        // Loại bỏ các bóng không còn kết nối với cụm bóng phía trên
        grid.removeFloating();
    }
};

