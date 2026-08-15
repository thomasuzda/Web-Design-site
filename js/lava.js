document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.querySelector(".hero-lava");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORS = ["#3d0f05", "#8f1f0a", "#c9601f", "#e88a2e", "#f6c265"];
  var W = 0, H = 0, DPR = 1, blobs = [], lastT = null, raf = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function makeBlobs(count) {
    blobs = [];
    for (var i = 0; i < count; i++) {
      blobs.push({
        x: rand(-0.15, 1.15) * W,
        yBase: rand(0.3, 1.0) * H,
        r: rand(0.16, 0.32) * Math.max(W, 420),
        speed: rand(16, 34),
        bobAmp: rand(10, 42),
        bobSpeed: rand(0.15, 0.42),
        phase: rand(0, Math.PI * 2),
        color: COLORS[Math.floor(rand(0, COLORS.length))]
      });
    }
  }

  function render(t) {
    if (lastT == null) lastT = t;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    blobs.forEach(function (b) {
      if (!reduceMotion) {
        b.x += b.speed * dt;
        if (b.x - b.r > W) b.x = -b.r;
      }
      var y = reduceMotion ? b.yBase : b.yBase + Math.sin(t / 1000 * b.bobSpeed + b.phase) * b.bobAmp;
      var g = ctx.createRadialGradient(b.x, y, 0, b.x, y, b.r);
      g.addColorStop(0, b.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
  }

  function loop(t) {
    render(t);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    makeBlobs(7);
    render(performance.now());
    if (!reduceMotion) {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  start();
});
