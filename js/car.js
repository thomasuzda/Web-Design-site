/* Ford Mustang Shelby GT500 on a slow turntable, rendered with three.js.
   The model ships as a Draco-compressed GLB (models/mustang.glb, ~2.5MB
   down from a 17.5MB uncompressed export) and is fetched lazily — nothing
   downloads until the section is close to the viewport, since it lives
   near the bottom of the page.
   Renders only while on screen, and holds a single static frame when the
   visitor prefers reduced motion. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

var mount = document.querySelector(".car-canvas");
if (mount) {
  var stage = mount.closest(".car-stage") || mount.parentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer = new THREE.WebGLRenderer({ canvas: mount, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  var scene = new THREE.Scene();

  // A neutral studio environment is what makes car paint and chrome read
  // as metal at all — without it, metallic materials render near-black.
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  var key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(5, 8, 5);
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(-6, 4, -6);
  scene.add(rim);

  var turntable = new THREE.Group();
  scene.add(turntable);

  // Soft contact shadow so the car doesn't look like it's floating.
  var shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  var sctx = shadowCanvas.getContext("2d");
  var grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, "rgba(0,0,0,0.6)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);

  var shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  turntable.add(shadow);

  var loaded = false;
  var radius = 3, halfHeight = 0.7, focusY = 0.7;

  /* The FBX->glTF conversion kept the material *names* but not their
     colours, so everything arrives pure white. Re-dress them by name, in
     the site's monochrome palette: silver bodywork, near-black rubber and
     trim, smoked glass, chrome brightwork. */
  var LOOKS = {
    carpaint:    { color: 0xd8dade, metalness: 0.85, roughness: 0.28 },
    white_gloss: { color: 0xe8e8e8, metalness: 0.35, roughness: 0.25 },
    glossblack:  { color: 0x0e0e10, metalness: 0.55, roughness: 0.20 },
    tire:        { color: 0x0b0b0c, metalness: 0.00, roughness: 0.95 },
    roll:        { color: 0x1a1a1c, metalness: 0.70, roughness: 0.35 },
    brake:       { color: 0x2a2a2d, metalness: 0.85, roughness: 0.30 },
    mirror:      { color: 0xf0f0f0, metalness: 1.00, roughness: 0.06 },
    leather:     { color: 0x141416, metalness: 0.00, roughness: 0.85 },
    seat:        { color: 0x141416, metalness: 0.00, roughness: 0.85 },
    plate:       { color: 0xdedede, metalness: 0.20, roughness: 0.55 },
    orange:      { color: 0x9a9a9e, metalness: 0.60, roughness: 0.40 },
    lambert1:    { color: 0x3a3a3e, metalness: 0.40, roughness: 0.55 },
    light:       { color: 0xf4f4f4, metalness: 0.25, roughness: 0.10, opacity: 0.65 },
    rearlight:   { color: 0x2a2023, metalness: 0.40, roughness: 0.18, opacity: 0.80 },
    tinted_glass:{ color: 0x0a0c10, metalness: 0.15, roughness: 0.06, opacity: 0.42 }
  };

  function dressMaterials(model) {
    model.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        var look = LOOKS[(m.name || "").toLowerCase()];
        if (!look) return;
        if (m.color) m.color.setHex(look.color);
        if ("metalness" in m) m.metalness = look.metalness;
        if ("roughness" in m) m.roughness = look.roughness;
        if (look.opacity != null) {
          m.transparent = true;
          m.opacity = look.opacity;
        }
        m.needsUpdate = true;
      });
    });
  }

  function frameModel(model) {
    // Normalise whatever scale the model was authored at: fit its longest
    // axis to a known size, centre it on the turntable, and sit it on y=0.
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var longest = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(4.4 / longest);

    box = new THREE.Box3().setFromObject(model);
    var centre = box.getCenter(new THREE.Vector3());
    model.position.x -= centre.x;
    model.position.z -= centre.z;
    model.position.y -= box.min.y;

    box = new THREE.Box3().setFromObject(model);
    var s = box.getSize(new THREE.Vector3());
    shadow.scale.set(s.x * 1.3, s.z * 1.55, 1);
    shadow.position.y = 0.004;

    // Turntable radius: the model spins, so fit the circle it sweeps, not
    // just its resting box — otherwise it clips as it turns side-on.
    radius = 0.5 * Math.sqrt(s.x * s.x + s.z * s.z);
    halfHeight = s.y * 0.5;
    focusY = s.y * 0.45;
  }

  /* Fit each axis against the field of view that actually constrains it:
     the turntable's sweep circle against the horizontal FOV (so the car
     never clips as it turns side-on), and the car's height against the
     vertical FOV. Measuring the sweep circle against the vertical FOV
     instead would push the camera far too far back on a wide stage. */
  function fitCamera() {
    var vFov = THREE.MathUtils.degToRad(camera.fov);
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    var dist = Math.max(
      (radius * 1.06) / Math.sin(hFov / 2),
      (halfHeight * 1.5) / Math.sin(vFov / 2)
    );
    var dir = new THREE.Vector3(1, 0.30, 1).normalize();
    camera.position.copy(dir.multiplyScalar(dist));
    camera.position.y += focusY * 0.5;
    camera.lookAt(0, focusY, 0);
  }

  var loader = new GLTFLoader();
  var draco = new DRACOLoader();
  draco.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/");
  loader.setDRACOLoader(draco);

  function load() {
    if (loaded) return;
    loaded = true;
    loader.load(
      "models/mustang.glb",
      function (gltf) {
        turntable.add(gltf.scene);
        dressMaterials(gltf.scene);
        frameModel(gltf.scene);
        // Start on a front three-quarter view rather than the tail.
        turntable.rotation.y = Math.PI + 0.5;
        draco.dispose();
        if (stage) stage.classList.add("is-ready");
        resize();
        render();
        start();
      },
      undefined,
      function () {
        // Model failed to load — collapse the stage rather than leaving a
        // blank hole in the page.
        if (stage) stage.classList.add("is-failed");
      }
    );
  }

  function resize() {
    var r = mount.getBoundingClientRect();
    var w = r.width || (stage && stage.clientWidth) || 640;
    var h = r.height || 360;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera();
  }

  var raf = null;
  function render() { renderer.render(scene, camera); }
  function loop() {
    turntable.rotation.y += 0.0032;
    render();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduce && loaded) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); render(); }, 150);
  });

  resize();

  if ("IntersectionObserver" in window) {
    // Wide margin on the loader so the model is already downloading by the
    // time the section scrolls into view.
    new IntersectionObserver(function (entries, obs) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        load();
        obs.disconnect();
      }
    }, { rootMargin: "600px" }).observe(mount);

    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.05 }).observe(mount);
  } else {
    load();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });
}
