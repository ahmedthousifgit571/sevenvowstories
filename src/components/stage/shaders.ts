// GLSL for the poster ring. The canvas renders with `flat linear`, so texture texels pass straight
// through to the screen: the WebGL posters match the DOM <img> posters pixel-for-pixel at handoff.

export const posterVertex = /* glsl */ `
  uniform float uBend;     // 0 flat .. 1 wrapped on the ring cylinder
  uniform float uRadius;   // cylinder radius
  uniform float uTime;
  uniform float uWave;     // paper flutter while scattering
  uniform float uHover;    // lift toward the viewer
  uniform float uSeed;

  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;
    vec3 p = position;

    // Wrap local x around a cylinder whose axis sits uRadius behind the card.
    float a = p.x / uRadius;
    vec3 curved = vec3(sin(a) * uRadius, p.y, (cos(a) - 1.0) * uRadius);
    p = mix(p, curved, uBend);

    // Paper flutter: two crossing sine waves, strongest mid-flight.
    float w = sin(p.y * 1.7 + uTime * 2.1 + uSeed) * 0.10
            + sin(p.x * 2.3 + uTime * 1.6 + uSeed * 2.0) * 0.07;
    p.z += w * uWave;

    // Hover: the centre of the card bows out of the ring.
    float bow = 1.0 - pow(abs(uv.x * 2.0 - 1.0), 2.0);
    p.z += uHover * (0.08 + 0.1 * bow);

    // Fake lighting from curvature and flutter slope.
    float edge = abs(sin(a)) * uBend;
    vShade = 1.0 - edge * 0.42 - w * uWave * 0.9 + uHover * 0.04;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const posterFragment = /* glsl */ `
  uniform sampler2D uFront;
  uniform sampler2D uBack;
  uniform float uOpacity;
  uniform float uGrain;    // animated print grain
  uniform float uShade;    // how much curvature light to apply (0 at handoff)
  uniform float uDim;      // desaturate + darken (cards turning away)
  uniform float uTime;

  varying vec2 vUv;
  varying float vShade;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec4 c = gl_FrontFacing
      ? texture2D(uFront, vUv)
      : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));

    c.rgb *= mix(1.0, vShade, uShade);
    if (!gl_FrontFacing) c.rgb *= mix(1.0, 0.93, uShade);

    float g = hash(floor(vUv * vec2(900.0, 1200.0)) + floor(uTime * 14.0)) - 0.5;
    c.rgb += g * uGrain;

    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    c.rgb = mix(c.rgb, vec3(l) * 0.96, uDim * 0.4);

    gl_FragColor = vec4(c.rgb, uOpacity);
  }
`;

export const textVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const textFragment = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uMix;      // 0 shows A, 1 shows B
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform float uOpacity;

  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    float a = texture2D(uA, vUv).a;
    float b = texture2D(uB, vUv).a;

    // Ink-bleed wipe, top line first: a noisy front travels down the block.
    float n = noise(vUv * vec2(9.0, 26.0)) * 0.6 + noise(vUv * vec2(40.0, 90.0)) * 0.4;
    float front = (1.0 - vUv.y) * 0.72 + n * 0.28;
    float t = uMix * 1.18 - 0.08;
    float showB = 1.0 - smoothstep(t - 0.05, t + 0.02, front);
    float hideA = 1.0 - smoothstep(t - 0.1, t - 0.02, front);

    float alpha = max(a * (1.0 - hideA), b * showB);
    vec3 col = mix(uColA, uColB, smoothstep(0.0, 1.0, uMix));
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;
