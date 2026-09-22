// ApexPhysics - Impact Dust Particle Vertex Shader
// Transforms shockwave particle vertices with velocity falloff and turbulence

uniform float uTime;
uniform float uLifetime;
uniform vec3 uImpactCenter;

attribute float aParticleSize;
attribute vec3 aVelocity;
attribute float aStartTime;

varying float vAlpha;
varying vec3 vColor;

void main() {
    float age = uTime - aStartTime;
    float progress = clamp(age / uLifetime, 0.0, 1.0);

    // Quadratic deceleration
    vec3 currentPos = position + aVelocity * progress * (1.0 - 0.5 * progress);
    
    // Add subtle upward thermal buoyancy
    currentPos.y += 0.8 * progress * progress;

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective point attenuation
    gl_PointSize = aParticleSize * (1.0 - progress) * (300.0 / -mvPosition.z);

    // Fade out smoothly toward end of life
    vAlpha = (1.0 - progress) * (1.0 - progress);
    vColor = mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 0.4, 0.0), progress);
}
