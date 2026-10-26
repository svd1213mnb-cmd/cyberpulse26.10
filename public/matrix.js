// matrix.js
window.initMatrix = function () {
  // 2. ВОЗВРАЩАЕМ МАТРИЦУ (ФОН)
  const canvas = document.getElementById("matrixCanvas");
  let ctx, columns, drops;
  if (canvas) {
    ctx = canvas.getContext("2d");
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / 14);
      drops = Array(columns).fill(1);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZЯЖФΨΩ░▒▓█";
    setInterval(() => {
      if (!window.matrixActive || !ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.fillStyle = "rgba(5, 6, 10, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Цвет берем из текущей темы
      ctx.fillStyle = "#00ff41";
      ctx.font = `14px 'Fira Code', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 14, drops[i] * 14);
        if (drops[i] * 14 > canvas.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
    }, 45);
  }
}; // <--- Закрываем функцию initMatrix
