/**
 * ApexPhysics | High-Performance 3D Rigid Body Engine & Audio Synthesizer
 * ========================================================================
 * Real-time Euler/Verlet integration, Box/Sphere collision detection,
 * impulse resolution, momentum conservation, and physical impact sonification.
 * 
 * Author: Tareq Ali (@Tareq0001)
 */

class PhysicsEngine {
  constructor() {
    this.bodies = [];
    this.gravity = -9.81; // m/s^2 (Earth default)
    this.timeScale = 1.0;
    this.audio = new PhysicsAudioEngine();
    this.totalCollisions = 0;
    this.kineticEnergy = 0;
  }

  setGravity(g) {
    this.gravity = g;
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  clear() {
    this.bodies = [];
    this.totalCollisions = 0;
    this.kineticEnergy = 0;
  }

  step(dt) {
    const effectiveDt = Math.min(dt, 0.05) * this.timeScale;
    let totalKE = 0;

    // 1. Apply Gravity & Numerical Integration
    for (let body of this.bodies) {
      if (body.isStatic) continue;

      // Gravity force
      body.vel.y += this.gravity * effectiveDt;

      // Linear velocity damping (air resistance)
      body.vel.x *= 0.995;
      body.vel.y *= 0.995;
      body.vel.z *= 0.995;

      // Position update
      body.pos.x += body.vel.x * effectiveDt;
      body.pos.y += body.vel.y * effectiveDt;
      body.pos.z += body.vel.z * effectiveDt;

      // Angular rotation
      body.rot.x += body.angVel.x * effectiveDt;
      body.rot.y += body.angVel.y * effectiveDt;
      body.rot.z += body.angVel.z * effectiveDt;

      // Kinetic Energy (1/2 * m * v^2)
      const speedSq = body.vel.x * body.vel.x + body.vel.y * body.vel.y + body.vel.z * body.vel.z;
      totalKE += 0.5 * body.mass * speedSq;

      // Ground Plane Collision (y = 0)
      const minY = body.type === 'sphere' ? body.radius : body.size.y / 2;
      if (body.pos.y <= minY) {
        body.pos.y = minY;
        if (body.vel.y < -0.5) {
          this.audio.playImpact(Math.abs(body.vel.y) * 0.1);
          this.totalCollisions++;
        }
        body.vel.y = -body.vel.y * body.restitution;
        body.vel.x *= 0.85; // Ground friction
        body.vel.z *= 0.85;
      }
    }

    // 2. Pairwise Collision Detection & Resolution
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const b1 = this.bodies[i];
        const b2 = this.bodies[j];
        if (b1.isStatic && b2.isStatic) continue;

        this.resolveCollision(b1, b2);
      }
    }

    this.kineticEnergy = Math.round(totalKE);
  }

  resolveCollision(b1, b2) {
    const dx = b2.pos.x - b1.pos.x;
    const dy = b2.pos.y - b1.pos.y;
    const dz = b2.pos.z - b1.pos.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    // Approximate bounding sphere radius
    const r1 = b1.type === 'sphere' ? b1.radius : Math.max(b1.size.x, b1.size.y, b1.size.z) * 0.6;
    const r2 = b2.type === 'sphere' ? b2.radius : Math.max(b2.size.x, b2.size.y, b2.size.z) * 0.6;
    const minDist = r1 + r2;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;

      // Overlap separation
      const overlap = (minDist - dist) * 0.5;
      if (!b1.isStatic) {
        b1.pos.x -= nx * overlap;
        b1.pos.y -= ny * overlap;
        b1.pos.z -= nz * overlap;
      }
      if (!b2.isStatic) {
        b2.pos.x += nx * overlap;
        b2.pos.y += ny * overlap;
        b2.pos.z += nz * overlap;
      }

      // Relative velocity
      const rvx = b2.vel.x - b1.vel.x;
      const rvy = b2.vel.y - b1.vel.y;
      const rvz = b2.vel.z - b1.vel.z;
      const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

      if (velAlongNormal < 0) {
        const e = Math.min(b1.restitution, b2.restitution);
        const invMass1 = b1.isStatic ? 0 : 1 / b1.mass;
        const invMass2 = b2.isStatic ? 0 : 1 / b2.mass;
        const j = -(1 + e) * velAlongNormal / (invMass1 + invMass2);

        // Apply impulse
        if (!b1.isStatic) {
          b1.vel.x -= j * invMass1 * nx;
          b1.vel.y -= j * invMass1 * ny;
          b1.vel.z -= j * invMass1 * nz;
          b1.angVel.x += (Math.random() - 0.5) * 2;
          b1.angVel.z += (Math.random() - 0.5) * 2;
        }
        if (!b2.isStatic) {
          b2.vel.x += j * invMass2 * nx;
          b2.vel.y += j * invMass2 * ny;
          b2.vel.z += j * invMass2 * nz;
          b2.angVel.x += (Math.random() - 0.5) * 2;
          b2.angVel.z += (Math.random() - 0.5) * 2;
        }

        if (Math.abs(velAlongNormal) > 1.0) {
          this.audio.playImpact(Math.abs(velAlongNormal) * 0.08);
          this.totalCollisions++;
        }
      }
    }
  }

  explode(origin, radius = 8, force = 35) {
    this.audio.playExplosion();
    for (let body of this.bodies) {
      if (body.isStatic) continue;
      const dx = body.pos.x - origin.x;
      const dy = body.pos.y - origin.y;
      const dz = body.pos.z - origin.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < radius && dist > 0.1) {
        const factor = (1 - dist / radius) * force;
        body.vel.x += (dx / dist) * factor;
        body.vel.y += (dy / dist) * factor + 5;
        body.vel.z += (dz / dist) * factor;
        body.angVel.x += (Math.random() - 0.5) * 10;
        body.angVel.y += (Math.random() - 0.5) * 10;
      }
    }
  }
}

/* ==========================================================
   PHYSICS IMPACT & EXPLOSION AUDIO (WEB AUDIO API)
   ========================================================== */
class PhysicsAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playImpact(intensity = 0.5) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Wood/stone pitch thud
    const baseF = 80 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseF, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    const vol = Math.min(0.35, Math.max(0.02, intensity));
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playLaunch() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playExplosion() {
    this.init();
    const now = this.ctx.currentTime;

    // Low rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }
}
