/* Animated full-bleed warping grid for the site background.
   A regular grid is laid over the whole viewport (extended a couple of
   cells past every edge so it never reveals a gap), then every vertex is
   pushed around by layered sine/cosine fields. The layers run at
   unrelated speeds, so crests drift across each other and the sheet
   reads as folding over itself rather than pulsing in place.
   Nothing is pre-rendered and no cycle repeats visibly, so there's no
   loop seam to hide. */
document.addEventListener("DOMContentLoaded", function () {
  var canvas = document.querySelector(".site-mesh");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CELL = 62;      // target spacing between grid lines, in CSS px
  var OVER = 3;       // extra cells drawn past each edge
  var AMP = 46;       // how far a vertex can travel from its rest spot

  var W = 0, H = 0, DPR = 1, COLS = 0, ROWS = 0, raf = null, start = null;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    // Fall back to the viewport if the element measures 0 — happens when
    // layout isn't settled yet (e.g. a backgrounded tab). CSS already
    // sizes the canvas, so only the backing store is set here.
    W = rect.width || window.innerWidth;
    H = rect.height || window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    COLS = Math.ceil(W / CELL) + OVER * 2;
    ROWS = Math.ceil(H / CELL) + OVER * 2;
  }

  // Returns the displaced position of one vertex plus an "energy" value
  // used to brighten the crests of each fold.
  function vertex(bx, by, t) {
    var u = bx / Math.max(W, 1);
    var v = by / Math.max(H, 1);

    var a = Math.sin(u * 3.0 + t * 0.40) * Math.cos(v * 2.2 - t * 0.29);
    var b = Math.sin((u + v) * 2.7 - t * 0.23);
    var c = Math.cos(v * 3.9 + t * 0.17);
    var d = Math.sin(u * 1.6 - v * 2.9 + t * 0.13);

    var dy = (a * 0.62 + b * 0.30 + c * 0.34) * AMP;
    var dx = (Math.sin(v * 3.2 + t * 0.25) * 0.55 + b * 0.28 + d * 0.22) * AMP;

    return { x: bx + dx, y: by + dy, e: a * 0.62 + b * 0.30 };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var stepX = W / (COLS - OVER * 2);
    var stepY = H / (ROWS - OVER * 2);
    var originX = -stepX * OVER;
    var originY = -stepY * OVER;

    var pts = [];
    var i, j;
    for (j = 0; j <= ROWS; j++) {
      var row = [];
      for (i = 0; i <= COLS; i++) {
        row.push(vertex(originX + i * stepX, originY + j * stepY, t));
      }
      pts.push(row);
    }

    ctx.lineWidth = 1;

    // Rows, then columns — together they read as one continuous sheet.
    for (j = 0; j <= ROWS; j++) {
      ctx.beginPath();
      var rowE = 0;
      for (i = 0; i <= COLS; i++) {
        var p = pts[j][i];
        rowE += p.e;
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      var ra = 0.075 + Math.abs(rowE / (COLS + 1)) * 0.30;
      ctx.strokeStyle = "rgba(255,255,255," + ra.toFixed(3) + ")";
      ctx.stroke();
    }

    for (i = 0; i <= COLS; i++) {
      ctx.beginPath();
      var colE = 0;
      for (j = 0; j <= ROWS; j++) {
        var q = pts[j][i];
        colE += q.e;
        if (j === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      var ca = 0.06 + Math.abs(colE / (ROWS + 1)) * 0.24;
      ctx.strokeStyle = "rgba(255,255,255," + ca.toFixed(3) + ")";
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
