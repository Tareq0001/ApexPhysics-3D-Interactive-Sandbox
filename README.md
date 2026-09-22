# ApexPhysics-3D-Interactive-Sandbox ⚛️💥

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f0ff?style=for-the-badge&logo=github)](https://tareq0001.github.io/ApexPhysics-3D-Interactive-Sandbox/)
[![Language](https://img.shields.io/badge/Languages-JS%20|%20Python%20|%20GLSL%20|%20TS-a855f7?style=for-the-badge)](https://github.com/Tareq0001/ApexPhysics-3D-Interactive-Sandbox)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

An ultra-responsive, highly engaging, and visceral **3D Interactive Physics Laboratory & Destruction Sandbox** running directly in the browser with zero installation. Built with Three.js, a custom rigid-body physics engine, procedural Web Audio sound synthesis, Runge-Kutta 4th Order ballistics solvers in Python, GLSL impact shaders, and TypeScript type declarations.

---

## 🌟 Key Highlights & User-Friendly Features

1. **One-Tap Destruction & Playability:**
   - Click anywhere in the 3D viewport to launch heavy steel cannonballs or super-bouncy kinetic spheres directly at structures.
   - Detonate seismic shockwaves on the ground or within structures to watch them collapse dynamically.
2. **Interactive 1-Click Presets:**
   - 🏰 **Tower Smash:** A tall, balanced multi-tiered skyscraper ready for demolition.
   - 🁓 **Domino Cascade:** 28 curved dominoes with an automated kinetic trigger sphere.
   - ⚖️ **Newton's Cradle:** Demonstrates conservation of momentum and energy with high-restitution spheres.
   - 💥 **Chaos Exploder:** 40 randomized geometric blocks under high-stress explosive forces.
3. **Environment & Time Manipulation:**
   - ⏳ **Slow-Motion 0.25x Toggle:** Smoothly decelerates physics time for cinematic collapse observations.
   - 🪐 **Gravity Slider:** Dynamically shift from Zero-G (0 m/s²), Moon (1.6 m/s²), Earth (9.8 m/s²), up to Jupiter (24.8 m/s²).
   - 🔘 **Bounciness / Restitution Control:** Adjust restitution coefficient from 0% (clay) to 100% (super-elastic).
4. **Draggable & Resizable Cyberpunk HUD:**
   - Drag the vertical splitter to adjust the 3D sandbox vs. controls width in real time.
   - One-click Maximize/Restore buttons for an immersive full-screen 3D experience.
   - Mobile-first bottom navigation tabs with responsive layouts.
5. **Procedural Web Audio FX:**
   - Real-time synthesized impact sounds tuned by collision impulse magnitude (no external audio assets needed).

---

## 🏗️ Multi-Language Architecture

ApexPhysics incorporates a multi-tiered engineering design across multiple languages:

```
ApexPhysics-3D-Interactive-Sandbox/
├── index.html                  # Semantic, responsive HTML5 layout with mobile tabs
├── css/
│   └── styles.css              # Cyberpunk glassmorphic HUD, draggable splitter & animations
├── js/
│   ├── physics-engine.js       # Custom 3D rigid-body engine (Euler/Verlet integration, impulses, Web Audio)
│   ├── sandbox-3d.js           # Three.js WebGL scene, lighting, shadow maps & shockwaves
│   └── app.js                  # User interaction controller, raycasting, presets & telemetry
├── python/
│   ├── ballistics_solver.py    # 4th Order Runge-Kutta (RK4) projectile flight dynamics & aerodynamic drag
│   └── rigid_body_dynamics.py  # 3D Moment of inertia tensors & momentum conservation
├── shaders/
│   ├── impact_dust.vert        # GLSL vertex shader for particle shockwave dispersion
│   └── impact_glow.frag        # GLSL fragment shader for radial energy falloff
└── types/
    └── physics.d.ts            # TypeScript definitions for rigid bodies, collisions & telemetry
```

---

## 🔬 Mathematical & Physical Modeling

### 1. Impulse-Based Collision Resolution
When two rigid bodies $A$ and $B$ collide with normal $\vec{n}$, the impulse scalar $J$ is calculated via:

$$J = \frac{-(1 + e)(\vec{v}_A - \vec{v}_B) \cdot \vec{n}}{\frac{1}{m_A} + \frac{1}{m_B}}$$

Where:
- $e$ is the restitution coefficient ($0 \le e \le 1$).
- $m_A, m_B$ are body masses.
- Post-collision velocities are updated via $\vec{v}'_A = \vec{v}_A + \frac{J \vec{n}}{m_A}$ and $\vec{v}'_B = \vec{v}_B - \frac{J \vec{n}}{m_B}$.

### 2. Numerical Integration
Linear equations of motion are integrated using semi-implicit Euler integration:

$$\vec{v}_{t + \Delta t} = \vec{v}_t + \vec{a} \cdot \Delta t$$
$$\vec{x}_{t + \Delta t} = \vec{x}_t + \vec{v}_{t + \Delta t} \cdot \Delta t$$

For advanced trajectory and aerodynamic simulations, the Python module uses **Runge-Kutta 4th Order (RK4)** numerical integration incorporating quadratic drag $F_d = \frac{1}{2} \rho v^2 C_d A$.

---

## 🚀 Getting Started

### Browser Direct Run
Simply open `index.html` in any modern web browser with WebGL support (Chrome, Edge, Firefox, Safari).

### Python Trajectory Simulation
```bash
python python/ballistics_solver.py
python python/rigid_body_dynamics.py
```

---

## 👨‍💻 Author & Credits
Developed by **Tareq Ali** ([@Tareq0001](https://github.com/Tareq0001))
Designed for interactive science, physics education, and web-based 3D simulation.
