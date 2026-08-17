/* Animated perspective wave-mesh for the hero background.
   A grid of points is displaced by layered sine waves and projected
   with a simple perspective transform, then drawn as a wireframe.
   Because every displacement is a sum of periodic functions of time,
   the motion is continuous and never repeats visibly — no loop seam,
   and nothing is pre-rendered, so it can't read as "a video". */
document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.querySelector(".hero-mesh");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLS = 46;
  var ROWS = 30;
  var W = 0, H = 0, DPR = 1, raf = null, start = null;

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

  // Layered waves at incommensurate frequencies, so crests drift past
  // each other instead of pulsing in lockstep.
  function height(x, z, t) {
    return Math.sin(x * 0.62 + t * 0.75) * 0.42
         + Math.sin(x * 0.27 - z * 0.48 + t * 0.53) * 0.72
         + Math.cos(z * 0.55 + t * 0.39) * 0.46
         + Math.sin((x + z) * 0.19 + t * 0.28) * 0.34;
  }

  function project(x, z, y) {
    var depth = z + 2.35;
    var p = 2.15 / depth;
    return {
      x: W * 0.5 + x * p * W * 0.40,
      y: H * 0.60 - (y - 0.6) * p * H * 0.34,
      p: p
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var pts = [];
    var i, j;
    for (j = 0; j < ROWS; j++) {
      var row = [];
      var z = j * 0.44;
      for (i = 0; i < COLS; i++) {
        var x = (i / (COLS - 1) - 0.5) * 9.2;
        row.push(project(x, z, height(x, z, t)));
      }
      pts.push(row);
    }

    ctx.lineWidth = 1;

    // Rows first (the dominant "contour" reading), then columns.
    for (j = 0; j < ROWS; j++) {
      var fade = 1 - j / (ROWS - 1);
      var alpha = 0.05 + Math.pow(fade, 1.7) * 0.42;
      ctx.strokeStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      for (i = 0; i < COLS; i++) {
        var pt = pts[j][i];
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    for (i = 0; i < COLS; i += 1) {
      ctx.beginPath();
      for (j = 0; j < ROWS; j++) {
        var q = pts[j][i];
        if (j === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.stroke();
    }
  }

  function frame(now) {
    if (start == null) start = now;
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }

  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  function play() {
    if (reduce) { draw(0); return; }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduce) draw(0); }, 150);
  });

  // Don't burn frames while the tab is in the background.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else { start = null; play(); }
  });

  resize();
  play();
});
