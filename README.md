# Bubble Shooter (HTML5 Canvas)

## 1. Giới thiệu
Game bắn bóng màu 2D: bắn bóng lên lưới, nối từ 3 bóng cùng màu trở lên để phá. Có 5 level, combo, hiệu ứng và âm thanh.

## 2. Công nghệ
HTML5 + CSS3 + JavaScript thuần, vẽ bằng Canvas 2D, âm thanh bằng Web Audio API. Không framework, không backend, không asset ngoài.

## 3. Cách chạy
Mở `index.html` bằng trình duyệt (không cần server).

## 4. Cách chơi
- Di chuyển chuột / chạm để ngắm; click hoặc nhấc tay để bắn.
- Phá nhóm >= 3 bóng cùng màu. Bóng mất kết nối với trần sẽ rơi xuống (+20 điểm/bóng).
- Bắn trượt 5 lần: thêm một hàng bóng mới và reset số miss.
- Bóng chạm vạch đỏ: GAME OVER. Phá hết bóng: LEVEL COMPLETE.
- Phím P / Esc: tạm dừng.

## 5. Cấu trúc project
- `js/bubble.js`: hằng số, bảng màu, hàm vẽ bóng
- `js/grid.js`: lưới lục giác, BFS, snapping, va chạm với lưới
- `js/level.js`: dữ liệu 5 level và hàm dựng level
- `js/effects.js`: âm thanh, hạt, chữ bay, bóng rơi/nổ
- `js/player.js`: súng, ngắm, bắn, di chuyển bóng, va chạm tường
- `js/game.js`: game state, điểm, combo, level, game loop
- `js/main.js`: khởi tạo, resize, input

## 6. Các hệ thống chính
Grid, Matching (BFS), Floating (BFS từ hàng trên cùng), Score/Combo/Miss, Level, Effects, Sound.

## 7. Collision detection
Bóng di chuyển theo các bước nhỏ (<= 6px/bước) để không xuyên qua bóng khác. Mỗi bước: phản xạ nếu chạm tường trái/phải; coi là va chạm nếu chạm trần hoặc khoảng cách tới tâm một bóng < 1.8 * bán kính (`Grid.collides`). Chỉ kiểm tra vài hàng gần vị trí bóng để nhanh.

## 8. Grid system
Lưới lục giác: hàng chẵn 12 ô, hàng lẻ 11 ô và lệch nửa ô. Giá trị ô: -1 là trống, 0..4 là màu. Khi bóng va chạm, `nearestEmpty` chọn ô trống gần nhất mà kề một bóng (hoặc ở hàng 0), nên bóng không chồng nhau. Khi thêm hàng mới, biến `shift` đảo để các hàng cũ giữ nguyên độ lệch.

## 9. Matching algorithm
BFS từ bóng mới đặt, duyệt 6 ô lân cận cùng màu. Nhóm >= 3 bị xoá, điểm = số bóng * 10 * hệ số combo (1 + 0.5 * (combo-1)). Sau đó BFS từ hàng 0 qua mọi bóng; bóng không được thăm là bóng lơ lửng và sẽ rơi.

## 10. Game loop
Một vòng `requestAnimationFrame` duy nhất (`Game.frame`), tách `update(dt)` và `draw()`. `dt` được giới hạn 0.05s. Trạng thái: MENU, PLAYING, LEVEL_COMPLETE, GAME_OVER, PAUSED.

## 11. Level system
`Levels.list` mô tả mỗi level bằng số hàng, số màu và hàm `hole(r,c)` tạo ô trống. Muốn thêm level, chỉ cần thêm một phần tử vào mảng. Bóng của người chơi luôn lấy từ các màu còn trên lưới nên màn chơi luôn thắng được.
