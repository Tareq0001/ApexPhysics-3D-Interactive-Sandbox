/**
 * ApexPhysics | 3D WebGL Physics Visualizer
 * ==========================================
 * Real-time Three.js rendering, rigid-body mesh synchronization,
 * raycast projectile launching, and dynamic impact effects.
 * 
 * Author: Tareq Ali (@Tareq0001)
 */

class Sandbox3DVisualizer {
  constructor(containerId, physicsEngine) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.physics = physicsEngine;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.meshMap = new Map(); // Body -> Mesh
    this.explosionShockwaves = [];

    this.initScene();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030509);

    const el = document.getElementById(this.containerId);
    if (el && el.tagName === 'CANVAS') {
      this.renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: false });
      this.container = el.parentElement || el;
    } else {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      if (this.container) this.container.appendChild(this.renderer.domElement);
    }

    const width = this.container ? (this.container.clientWidth || 800) : 800;
    const height = this.container ? (this.container.clientHeight || 600) : 600;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    this.camera.position.set(0, 14, 26);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going under floor
    this.controls.minDistance = 6;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 4, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const pLightCyan = new THREE.PointLight(0x00f0ff, 2, 40);
    pLightCyan.position.set(-15, 10, -10);
    this.scene.add(pLightCyan);

    // Ground Plane with Neon Cyber Grid
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x060810,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(80, 40, 0x00f0ff, 0x1e293b);
    grid.position.y = 0.01;
    this.scene.add(grid);
  }

  createMeshForBody(body) {
    let geo, mat;

    if (body.type === 'sphere') {
      geo = new THREE.SphereGeometry(body.radius, 24, 24);
      mat = new THREE.MeshStandardMaterial({
        color: body.color || 0x00f0ff,
        metalness: 0.7,
        roughness: 0.2,
        emissive: body.color || 0x00f0ff,
        emissiveIntensity: 0.25
      });
    } else {
      geo = new THREE.BoxGeometry(body.size.x, body.size.y, body.size.z);
      mat = new THREE.MeshStandardMaterial({
        color: body.color || 0xa855f7,
        metalness: 0.4,
        roughness: 0.4
      });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshMap.set(body, mesh);
    return mesh;
  }

  clearScene() {
    for (let [body, mesh] of this.meshMap.entries()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshMap.clear();
  }

  spawnShockwave(pos) {
    const ringGeo = new THREE.RingGeometry(0.2, 0.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.position.y += 0.05;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    this.explosionShockwaves.push({ mesh: ring, scale: 1, opacity: 1.0 });
  }

  render() {
    this.controls.update();

    // Sync 3D Meshes with Physics Engine
    for (let body of this.physics.bodies) {
      const mesh = this.meshMap.get(body);
      if (mesh) {
        mesh.position.set(body.pos.x, body.pos.y, body.pos.z);
        mesh.rotation.set(body.rot.x, body.rot.y, body.rot.z);
      }
    }

    // Animate Shockwaves
    for (let i = this.explosionShockwaves.length - 1; i >= 0; i--) {
      const sw = this.explosionShockwaves[i];
      sw.scale += 0.4;
      sw.opacity -= 0.035;
      sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.explosionShockwaves.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
