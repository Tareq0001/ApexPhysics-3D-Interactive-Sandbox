// ApexPhysics - Impact Glow & Shockwave Fragment Shader
// Generates circular neon radial gradients with intense energy falloff

precision mediump float;

uniform vec3 uCoreColor;
uniform vec3 uRimColor;
uniform float uIntensity;

varying float vAlpha;
varying vec3 vColor;

void main() {
    // Distance from center of point sprite [0, 0.5]
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) {
        discard;
    }

    // Soft Gaussian-like circular falloff
    float core = smoothstep(0.5, 0.0, dist);
    float glow = pow(core, 2.2);

    vec3 finalColor = mix(vColor, uCoreColor, core * 0.7) * uIntensity;
    gl_FragColor = vec4(finalColor, vAlpha * glow);
}
