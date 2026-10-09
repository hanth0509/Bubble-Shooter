
// Khởi tạo game, thay đổi kích thước canvas và xử lý chuột/cảm ứng
(function () {
    const canvas = document.getElementById('game');
    const wrap = document.getElementById('wrap');

    // Tạo đối tượng game
    const game = new Game(canvas);

    // Điều chỉnh kích thước canvas theo màn hình
    function resize() {
        const scale = Math.min(
            window.innerWidth / W,
            window.innerHeight / H
        );

        const dpr = window.devicePixelRatio || 1;

        game.scale = scale;
        game.dpr = dpr;

        // Đặt kích thước thực tế của canvas
        canvas.width = Math.floor(W * scale * dpr);
        canvas.height = Math.floor(H * scale * dpr);

        // Đặt kích thước hiển thị của canvas và khung chứa
        const width = Math.floor(W * scale) + 'px';
        const height = Math.floor(H * scale) + 'px';

        canvas.style.width = width;
        canvas.style.height = height;

        wrap.style.width = width;
        wrap.style.height = height;
    }

    // Chuyển tọa độ chuột/cảm ứng sang tọa độ trong game
    function toLogic(e) {
        const rect = canvas.getBoundingClientRect();

        const x = (e.clientX - rect.left) * (W / rect.width);
        const y = (e.clientY - rect.top) * (H / rect.height);

        return { x, y };
    }

    // Khi di chuyển chuột hoặc ngón tay
    canvas.addEventListener('pointermove', e => {
        const point = toLogic(e);
        game.aim(point.x, point.y);
    });

    // Khi nhấn chuột hoặc chạm vào màn hình
    canvas.addEventListener('pointerdown', e => {
        Sound.init();

        const point = toLogic(e);
        game.aim(point.x, point.y);
    });

    // Khi thả chuột hoặc nhấc ngón tay
    canvas.addEventListener('pointerup', e => {
        const point = toLogic(e);

        game.aim(point.x, point.y);
        game.fire();
    });

    // Xử lý nút hành động trong giao diện
    document.getElementById('btn').addEventListener('click', e => {
        const action = e.target.dataset.action;
        game.handleAction(action);
    });

    // Nhấn P hoặc Escape để tạm dừng/tiếp tục game
    window.addEventListener('keydown', e => {
        if (
            e.key === 'p' ||
            e.key === 'P' ||
            e.key === 'Escape'
        ) {
            if (game.state === STATE.PLAYING) {
                game.pause();
            } else if (game.state === STATE.PAUSED) {
                game.handleAction('resume');
            }
        }
    });

    // Tạm dừng game khi chuyển sang tab khác
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.pause();
        }
    });

    // Cập nhật kích thước khi cửa sổ thay đổi
    window.addEventListener('resize', resize);

    // Thiết lập ban đầu và bắt đầu game
    resize();
    game.start(); // Chỉ tạo một vòng lặp requestAnimationFrame
})();

