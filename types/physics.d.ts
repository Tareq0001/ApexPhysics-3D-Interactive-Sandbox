/**
 * ApexPhysics - TypeScript Definitions for 3D Physics Sandbox
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type BodyShape = 'sphere' | 'box' | 'plane';

export interface RigidBodyConfig {
  id: string;
  shape: BodyShape;
  mass: number;
  position: Vector3D;
  velocity?: Vector3D;
  radius?: number;
  dimensions?: Vector3D;
  restitution?: number;
  friction?: number;
  isStatic?: boolean;
}

export interface CollisionRecord {
  bodyA: string;
  bodyB: string;
  contactPoint: Vector3D;
  normal: Vector3D;
  penetrationDepth: number;
  impulseMagnitude: number;
  timestamp: number;
}

export interface PhysicsTelemetry {
  bodyCount: number;
  fps: number;
  stepTimeMs: number;
  totalKineticEnergy: number;
  activeCollisions: number;
}

export interface PresetScene {
  id: 'tower' | 'dominoes' | 'cradle' | 'chaos';
  name: string;
  description: string;
  objectCount: number;
  build: () => void;
}
