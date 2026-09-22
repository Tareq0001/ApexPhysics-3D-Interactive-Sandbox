/**
 * ApexPhysics | Application Controller & Preset Builder
 * ======================================================
 * Manages user interactions, projectile launching, preset scenarios,
 * gravity/slow-mo controls, telemetry, and draggable resizers.
 * 
 * Author: Tareq Ali (@Tareq0001)
 */

let physics = null;
let visualizer = null;
let selectedTool = 'cannonball';
let isSlowMo = false;
let lastTime = 0;
let maximizedPanel = null;

/* ==========================================================
   INITIALIZATION
   ========================================================== */
window.addEventListener('DOMContentLoaded', () => {
  physics = new PhysicsEngine();
  visualizer = new Sandbox3DVisualizer('physics-canvas', physics);

  initCanvasClick();
  initSliderControls();
  initPanelResizers();

  loadPreset('tower');

  requestAnimationFrame(gameLoop);
  lucide.createIcons();
});

/* ==========================================================
   PHYSICS GAME LOOP
   ========================================================== */
function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
  lastTime = time;

  physics.step(dt);
  visualizer.render();

  // Telemetry updates
  document.getElementById('stat-bodies').textContent = physics.bodies.length;
  document.getElementById('stat-ke').textContent = physics.kineticEnergy;
  document.getElementById('stat-collisions').textContent = physics.totalCollisions;
}

/* ==========================================================
   INTERACTIVE CLICK & LAUNCHING
   ========================================================== */
function initCanvasClick() {
  const canvas = document.getElementById('physics-canvas');

  canvas.addEventListener('pointerdown', (e) => {
    // If dragging controls or rotating with right-click, ignore
    if (e.button === 2) return; // Right click rotates camera

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    visualizer.raycaster.setFromCamera(new THREE.Vector2(x, y), visualizer.camera);

    // If exploder tool: explode at intersection with ground or body
    if (selectedTool === 'exploder') {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const target = new THREE.Vector3();
      visualizer.raycaster.ray.intersectPlane(plane, target);
      if (target) {
        physics.explode(target, 12, 45);
        visualizer.spawnShockwave(target);
        showToast('💥 Detonated Shockwave Explosion!');
      }
      return;
    }

    // Otherwise launch projectile from camera toward target point
    physics.audio.playLaunch();
    const origin = visualizer.camera.position.clone();
    const dir = visualizer.raycaster.ray.direction.clone().normalize();

    const isBouncy = selectedTool === 'bouncy';
    const body = {
      type: 'sphere',
      radius: isBouncy ? 0.7 : 0.9,
      mass: isBouncy ? 3 : 12,
      restitution: isBouncy ? 0.92 : 0.3,
      pos: { x: origin.x + dir.x * 2, y: origin.y + dir.y * 2, z: origin.z + dir.z * 2 },
      vel: { x: dir.x * 45, y: dir.y * 45, z: dir.z * 45 },
      rot: { x: 0, y: 0, z: 0 },
      angVel: { x: 0, y: 0, z: 0 },
      color: isBouncy ? 0x10b981 : 0x00f0ff,
      isStatic: false
    };

    physics.addBody(body);
    visualizer.createMeshForBody(body);
  });
}

function setTool(tool) {
  selectedTool = tool;
  document.querySelectorAll('.tool-floating-bar .btn-tool').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  if (tool === 'cannonball') showToast('Selected: Heavy Steel Cannonball (قذيفة ثقيلة)');
  else if (tool === 'bouncy') showToast('Selected: Super Bouncy Ball (كرة مطاطية)');
  else if (tool === 'exploder') showToast('Selected: Seismic Exploder (مفجر زلزالي)');
}

function toggleSlowMo() {
  isSlowMo = !isSlowMo;
  const btn = document.getElementById('btn-slowmo');
  physics.setTimeScale(isSlowMo ? 0.25 : 1.0);
  btn.classList.toggle('active', isSlowMo);
  showToast(isSlowMo ? '⏳ Slow Motion 0.25x Active' : '▶ Normal Speed 1.0x');
}

/* ==========================================================
   PRESETS (TOWER, DOMINOES, NEWTON, CHAOS)
   ========================================================== */
function loadPreset(name) {
  physics.clear();
  visualizer.clearScene();

  document.querySelectorAll('.presets-grid .btn-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === name);
  });

  if (name === 'tower') {
    buildTower();
    showToast('🏰 Loaded: Tower Smash (برج الكتل الضخم)');
  } else if (name === 'domino') {
    buildDominoes();
    showToast('🁓 Loaded: Domino Cascade (سلسلة الدومينو)');
  } else if (name === 'newton') {
    buildNewtonCradle();
    showToast('⚖️ Loaded: Newton Cradle (بندول نيوتن)');
  } else if (name === 'chaos') {
    buildChaosField();
    showToast('💥 Loaded: Chaos Exploder (حقل الفوضى)');
  }
}

function buildTower() {
  const layers = 8;
  const blockSize = { x: 1.4, y: 0.9, z: 1.4 };
  const colors = [0x00f0ff, 0xa855f7, 0xf43f5e, 0x10b981];

  for (let l = 0; l < layers; l++) {
    const y = l * blockSize.y + blockSize.y / 2;
    const color = colors[l % colors.length];

    for (let ix = -1; ix <= 1; ix++) {
      for (let iz = -1; iz <= 1; iz++) {
        // Leave hollow center
        if (ix === 0 && iz === 0) continue;

        const body = {
          type: 'box',
          size: { ...blockSize },
          mass: 2.0,
          restitution: 0.2,
          pos: { x: ix * (blockSize.x + 0.05), y, z: iz * (blockSize.z + 0.05) },
          vel: { x: 0, y: 0, z: 0 },
          rot: { x: 0, y: 0, z: 0 },
          angVel: { x: 0, y: 0, z: 0 },
          color,
          isStatic: false
        };
        physics.addBody(body);
        visualizer.createMeshForBody(body);
      }
    }
  }
}

function buildDominoes() {
  const count = 28;
  const radius = 9;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 1.6 - 0.8;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - radius + 2;

    const body = {
      type: 'box',
      size: { x: 0.4, y: 2.2, z: 1.1 },
      mass: 1.5,
      restitution: 0.15,
      pos: { x, y: 1.1, z },
      vel: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: -angle, z: 0 },
      angVel: { x: 0, y: 0, z: 0 },
      color: 0x00f0ff,
      isStatic: false
    };
    physics.addBody(body);
    visualizer.createMeshForBody(body);
  }

  // Add trigger ball at start
  const trigger = {
    type: 'sphere',
    radius: 0.8,
    mass: 5,
    restitution: 0.4,
    pos: { x: Math.sin(-0.8) * radius, y: 2.6, z: Math.cos(-0.8) * radius - radius + 3.5 },
    vel: { x: 0, y: 0, z: -4 },
    rot: { x: 0, y: 0, z: 0 },
    angVel: { x: 0, y: 0, z: 0 },
    color: 0xf43f5e,
    isStatic: false
  };
  physics.addBody(trigger);
  visualizer.createMeshForBody(trigger);
}

function buildNewtonCradle() {
  const numBalls = 5;
  const r = 0.9;
  for (let i = 0; i < numBalls; i++) {
    const x = (i - (numBalls - 1) / 2) * (r * 2 + 0.05);
    const isFirst = i === 0;

    const body = {
      type: 'sphere',
      radius: r,
      mass: 4.0,
      restitution: 0.96, // Highly elastic
      pos: { x: isFirst ? x - 4 : x, y: isFirst ? 4.5 : 1.5, z: 0 },
      vel: { x: isFirst ? 8 : 0, y: isFirst ? -2 : 0, z: 0 },
      rot: { x: 0, y: 0, z: 0 },
      angVel: { x: 0, y: 0, z: 0 },
      color: isFirst ? 0xf43f5e : 0x00f0ff,
      isStatic: false
    };
    physics.addBody(body);
    visualizer.createMeshForBody(body);
  }
}

function buildChaosField() {
  const count = 40;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 16;
    const y = 1.0 + Math.random() * 8;
    const z = (Math.random() - 0.5) * 16;
    const s = 0.8 + Math.random() * 0.8;

    const body = {
      type: 'box',
      size: { x: s, y: s, z: s },
      mass: s * 2,
      restitution: 0.4,
      pos: { x, y, z },
      vel: { x: 0, y: 0, z: 0 },
      rot: { x: Math.random(), y: Math.random(), z: Math.random() },
      angVel: { x: 0, y: 0, z: 0 },
      color: Math.random() > 0.5 ? 0x00f0ff : 0xa855f7,
      isStatic: false
    };
    physics.addBody(body);
    visualizer.createMeshForBody(body);
  }
}

function resetSimulation() {
  const activePreset = document.querySelector('.btn-preset.active')?.dataset.preset || 'tower';
  loadPreset(activePreset);
  showToast('Simulation Reset');
}

/* ==========================================================
   SLIDERS & CONTROLS
   ========================================================== */
function initSliderControls() {
  const gSlider = document.getElementById('slider-gravity');
  const gVal = document.getElementById('val-gravity');
  gSlider?.addEventListener('input', (e) => {
    const g = parseFloat(e.target.value);
    physics.setGravity(-g);
    gVal.textContent = `${g.toFixed(1)} m/s²`;
    document.getElementById('stat-gravity').textContent = `${g.toFixed(1)}`;
  });

  const bSlider = document.getElementById('slider-bounciness');
  const bVal = document.getElementById('val-bounciness');
  bSlider?.addEventListener('input', (e) => {
    const b = parseFloat(e.target.value);
    bVal.textContent = `${Math.round(b * 100)}%`;
    for (let body of physics.bodies) body.restitution = b;
  });
}

/* ==========================================================
   DRAGGABLE RESIZABLE PANELS & FULLSCREEN MAXIMIZE
   ========================================================== */
function toggleMaximize(panel) {
  const grid = document.querySelector('.workspace-grid');
  const iconSand = document.getElementById('max-icon-sandbox');
  const iconCtrl = document.getElementById('max-icon-controls');

  if (maximizedPanel === panel) {
    grid.classList.remove('max-sandbox', 'max-controls');
    maximizedPanel = null;
    iconSand?.setAttribute('data-lucide', 'maximize-2');
    iconCtrl?.setAttribute('data-lucide', 'maximize-2');
    showToast('Restored View');
  } else {
    grid.classList.remove('max-sandbox', 'max-controls');
    grid.classList.add(`max-${panel}`);
    maximizedPanel = panel;

    iconSand?.setAttribute('data-lucide', panel === 'sandbox' ? 'minimize-2' : 'maximize-2');
    iconCtrl?.setAttribute('data-lucide', panel === 'controls' ? 'minimize-2' : 'maximize-2');
    showToast(`Maximized ${panel.toUpperCase()} View`);
  }
  lucide.createIcons();
  setTimeout(() => visualizer.handleResize(), 60);
}

function initPanelResizers() {
  const colSand = document.getElementById('view-sandbox');
  const colCtrl = document.getElementById('view-controls');
  const resizer = document.getElementById('resizer-col');

  // Load saved width
  const savedW = localStorage.getItem('apex_phys_ctrl_w');
  if (savedW && window.innerWidth > 900) colCtrl.style.width = `${savedW}px`;

  let isDragging = false;
  let startX = 0;
  let startW = 0;

  resizer.addEventListener('pointerdown', (e) => {
    if (window.innerWidth <= 900 || maximizedPanel) return;
    isDragging = true;
    startX = e.clientX;
    startW = colCtrl.getBoundingClientRect().width;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    resizer.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const delta = startX - e.clientX; // dragging left increases controls width
    const newW = Math.max(260, Math.min(window.innerWidth * 0.55, startW + delta));
    colCtrl.style.width = `${newW}px`;
    visualizer.handleResize();
  });

  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    resizer.classList.remove('dragging');
    localStorage.setItem('apex_phys_ctrl_w', Math.round(colCtrl.getBoundingClientRect().width));
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    visualizer.handleResize();
  };

  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);

  resizer.addEventListener('dblclick', () => {
    colCtrl.style.width = '380px';
    localStorage.removeItem('apex_phys_ctrl_w');
    visualizer.handleResize();
    showToast('Controls Width Reset');
  });
}

/* ==========================================================
   MOBILE TABS & TOAST
   ========================================================== */
function switchMobileTab(tab) {
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-btn-${tab}`).classList.add('active');

  document.getElementById('view-sandbox').classList.toggle('mobile-active', tab === 'sandbox');
  document.getElementById('view-controls').classList.toggle('mobile-active', tab === 'controls');

  if (tab === 'sandbox') setTimeout(() => visualizer.handleResize(), 50);
}

function showToast(msg) {
  const toast = document.getElementById('toast-banner');
  const text = document.getElementById('toast-text');
  text.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

window.addEventListener('resize', () => {
  if (visualizer) visualizer.handleResize();
});
