// Khởi tạo game, resize canvas, xử lý input (chuột + cảm ứng qua Pointer Events)
(function () {
  const canvas = document.getElementById('game'), wrap = document.getElementById('wrap');
  const game = new Game(canvas);

  function resize() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    const dpr = window.devicePixelRatio || 1;
    game.scale = scale; game.dpr = dpr;
    canvas.width = Math.floor(W * scale * dpr); canvas.height = Math.floor(H * scale * dpr);
    wrap.style.width = canvas.style.width = Math.floor(W * scale) + 'px';
    wrap.style.height = canvas.style.height = Math.floor(H * scale) + 'px';
  }
  function toLogic(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  }

  canvas.addEventListener('pointermove', e => { const p = toLogic(e); game.aim(p.x, p.y); });
  canvas.addEventListener('pointerdown', e => { Sound.init(); const p = toLogic(e); game.aim(p.x, p.y); });
  canvas.addEventListener('pointerup', e => { const p = toLogic(e); game.aim(p.x, p.y); game.fire(); });
  document.getElementById('btn').addEventListener('click', e => game.handleAction(e.target.dataset.action));
  window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (game.state === STATE.PLAYING) game.pause(); else if (game.state === STATE.PAUSED) game.handleAction('resume');
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) game.pause(); });
  window.addEventListener('resize', resize);

  resize();
  game.start(); // chỉ một vòng lặp requestAnimationFrame
})();
