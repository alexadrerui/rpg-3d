// ─────────────────────────────────────────────────────────────────────────────
// SHADERS DE TRANSIÇÃO CINEMATOGRÁFICA
// Todos os fragment shaders recebem:
//   uniform sampler2D uVideo  — frame atual do vídeo
//   uniform float uProgress   — 0 = preto/transparente, 1 = vídeo cheio
//   uniform float uTime       — tempo acumulado em segundos
//   varying vec2 vUv          — coordenada UV [0,1]
// ─────────────────────────────────────────────────────────────────────────────

export const VERTEX_SHADER = /* glsl */ `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// ── Simplex Noise 2D (incluído nos shaders que precisam) ─────────────────────
const SIMPLEX_NOISE = /* glsl */ `
  vec3 _mod289v3(vec3 x) { return x - floor(x*(1.0/289.0))*289.0; }
  vec2 _mod289v2(vec2 x) { return x - floor(x*(1.0/289.0))*289.0; }
  vec3 _perm(vec3 x)     { return _mod289v3(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = _mod289v2(i);
    vec3 p = _perm(_perm(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)), 0.0);
    m = m*m*m*m;
    vec3 xv  = 2.0*fract(p*C.www) - 1.0;
    vec3 h   = abs(xv) - 0.5;
    vec3 ox  = floor(xv + 0.5);
    vec3 a0  = xv - ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x *x0.x  + h.x *x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// FRAGMENT SHADERS
// ─────────────────────────────────────────────────────────────────────────────

const HEADER = /* glsl */ `
  precision mediump float;
  uniform sampler2D uVideo;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;
`

export const FRAGMENT_SHADERS: Record<string, string> = {

  // ── none: corte instantâneo ─────────────────────────────────────────────────
  none: HEADER + /* glsl */ `
    void main() {
      gl_FragColor = texture2D(uVideo, vUv);
    }
  `,

  // ── fade: dissolução de opacidade simples ───────────────────────────────────
  fade: HEADER + /* glsl */ `
    void main() {
      vec4 v = texture2D(uVideo, vUv);
      float eased = uProgress * uProgress * (3.0 - 2.0 * uProgress); // smoothstep
      gl_FragColor = vec4(v.rgb, v.a * eased);
    }
  `,

  // ── dissolve: noise dissolve com faíscas de partícula ──────────────────────
  dissolve: HEADER + SIMPLEX_NOISE + /* glsl */ `
    void main() {
      vec4 v = texture2D(uVideo, vUv);
      float n = snoise(vUv * 5.5 + vec2(uTime * 0.04, 0.0));
      float threshold = uProgress * 1.15 - 0.075;
      float edge = 0.07;
      float alpha = smoothstep(threshold - edge, threshold + edge, n * 0.5 + 0.5);

      // faíscas na borda de dissolução
      float dist = abs(n * 0.5 + 0.5 - threshold);
      float spark = exp(-dist * dist * 180.0) * 2.5;
      vec3 sparkCol = mix(vec3(0.35, 0.65, 1.0), vec3(1.0, 0.85, 0.4), uProgress);
      vec3 finalRgb = v.rgb + sparkCol * spark * alpha;

      gl_FragColor = vec4(finalRgb, (alpha + spark * 0.25) * v.a);
    }
  `,

  // ── melt: colunas líquidas derretendo para baixo ────────────────────────────
  melt: HEADER + SIMPLEX_NOISE + /* glsl */ `
    void main() {
      // perturbação por coluna
      float n1 = snoise(vec2(vUv.x * 5.5, uTime * 0.25));
      float n2 = snoise(vec2(vUv.x * 11.0, uTime * 0.45));
      float drip = (n1 * 0.65 + n2 * 0.35) * 0.28;

      // frente de derretimento por coluna
      float colFront = uProgress + drip * 0.5;
      float mask = smoothstep(colFront - 0.14, colFront + 0.04, vUv.y);

      // UV warpeada para dar sensação de estiramento
      float warpX = snoise(vec2(vUv.y * 2.5, uTime * 0.2)) * 0.018 * uProgress;
      vec2 warpedUv = vec2(vUv.x + warpX, vUv.y - drip * uProgress * 0.18);
      warpedUv = clamp(warpedUv, 0.0, 1.0);
      vec4 v = texture2D(uVideo, warpedUv);

      // brilho na frente de derretimento
      float edgeDist = abs(vUv.y - colFront);
      float glow = exp(-edgeDist * edgeDist * 300.0);
      vec3 glowCol = mix(vec3(0.5, 0.1, 0.8), vec3(0.1, 0.4, 1.0), n1 * 0.5 + 0.5);
      vec3 rgb = v.rgb + glowCol * glow * 1.2;

      gl_FragColor = vec4(rgb, mask * v.a);
    }
  `,

  // ── ripple: ondas radiais de água expandindo do centro ──────────────────────
  ripple: HEADER + /* glsl */ `
    void main() {
      vec2 center = vec2(0.5);
      vec2 d = vUv - center;
      float dist = length(d);
      vec2 dn = normalize(d + 0.0001);

      // onda expansiva que perde amplitude conforme avança
      float ripplePhase = dist * 28.0 - uProgress * 18.0;
      float amp = (1.0 - uProgress) * 0.045 / (dist + 0.25);
      float wave = sin(ripplePhase) * amp;
      vec2 warpedUv = clamp(vUv + dn * wave, 0.0, 1.0);

      // revelação circular do centro para fora
      float reveal = 1.0 - smoothstep(uProgress * 0.85 - 0.05, uProgress * 0.85 + 0.2, dist);

      vec4 v = texture2D(uVideo, warpedUv);

      // anéis de cáustica
      float ring = exp(-abs(dist - uProgress * 0.65) * 45.0);
      vec3 caustic = vec3(0.3, 0.75, 1.0) * ring * 1.8;

      gl_FragColor = vec4(v.rgb + caustic * (1.0 - uProgress * 0.8), reveal * v.a);
    }
  `,

  // ── wipe_right: varredura esquerda→direita com borda luminosa ──────────────
  wipe_right: HEADER + /* glsl */ `
    void main() {
      vec4 v = texture2D(uVideo, vUv);
      float eased = uProgress * uProgress * (3.0 - 2.0 * uProgress);
      float alpha = 1.0 - smoothstep(eased - 0.04, eased + 0.04, vUv.x);
      float glow  = exp(-abs(vUv.x - eased) * 55.0);
      vec3 glowCol = vec3(0.45, 0.75, 1.0) * glow * 2.5;
      gl_FragColor = vec4(v.rgb + glowCol, alpha * v.a);
    }
  `,

  // ── wipe_down: varredura cima→baixo com borda luminosa ─────────────────────
  wipe_down: HEADER + /* glsl */ `
    void main() {
      vec4 v = texture2D(uVideo, vUv);
      float eased = uProgress * uProgress * (3.0 - 2.0 * uProgress);
      float alpha = 1.0 - smoothstep(eased - 0.04, eased + 0.04, vUv.y);
      float glow  = exp(-abs(vUv.y - eased) * 55.0);
      vec3 glowCol = vec3(0.45, 0.75, 1.0) * glow * 2.5;
      gl_FragColor = vec4(v.rgb + glowCol, alpha * v.a);
    }
  `,

  // ── zoom_in: zoom do centro expandindo para preencher tela ─────────────────
  zoom_in: HEADER + /* glsl */ `
    void main() {
      vec2 center = vec2(0.5);
      // no início está muito ampliado (zoom=5), vai diminuindo até 1
      float zoom = mix(5.0, 1.0, uProgress * uProgress);
      vec2 zoomedUv = center + (vUv - center) * zoom;

      float inBounds = step(0.0, zoomedUv.x) * step(zoomedUv.x, 1.0)
                     * step(0.0, zoomedUv.y) * step(zoomedUv.y, 1.0);
      vec4 v = texture2D(uVideo, clamp(zoomedUv, 0.0, 1.0));
      float alpha = smoothstep(0.0, 0.35, uProgress) * inBounds;
      gl_FragColor = vec4(v.rgb, v.a * alpha);
    }
  `,

  // ── burn: queima diagonal com fogo — fogo avança da esquerda inferior ───────
  burn: HEADER + SIMPLEX_NOISE + /* glsl */ `
    void main() {
      vec4 v = texture2D(uVideo, vUv);

      // diagonal de queima bottom-left → top-right
      float diagonal = (vUv.x + (1.0 - vUv.y)) * 0.5;
      float n = snoise(vUv * 5.0 + vec2(uTime * 0.35, uTime * 0.2)) * 0.18;
      float burnFront = uProgress + n;

      float burned = smoothstep(burnFront - 0.025, burnFront + 0.025, diagonal);

      // fogo na borda: ember → laranja → amarelo
      float edgeDist = abs(diagonal - burnFront);
      float fire = exp(-edgeDist * edgeDist * 600.0);
      float fire2 = exp(-edgeDist * edgeDist * 120.0);
      vec3 ember  = vec3(1.0, 0.15, 0.0);
      vec3 orange = vec3(1.0, 0.55, 0.05);
      vec3 yellow = vec3(1.0, 0.95, 0.5);
      vec3 fireCol = mix(mix(ember, orange, fire2), yellow, fire * fire);

      vec3 rgb = v.rgb + fireCol * fire * 3.5;
      gl_FragColor = vec4(rgb, (burned + fire * 0.6) * v.a);
    }
  `,

  // ── dream: aberração cromática + ondas sinusoidais + vinheta expansiva ──────
  dream: HEADER + /* glsl */ `
    void main() {
      // ondas horizontais que diminuem conforme o progresso sobe
      float waveAmp = (1.0 - uProgress) * (1.0 - uProgress) * 0.022;
      float wave = sin(vUv.y * 18.0 + uTime * 2.2) * waveAmp;
      vec2 warpUv = vUv + vec2(wave, 0.0);

      // aberração cromática radial
      vec2 center = vec2(0.5);
      vec2 dir = warpUv - center;
      float aberr = (1.0 - uProgress) * 0.035;
      float r = texture2D(uVideo, clamp(warpUv + dir * aberr,        0.0, 1.0)).r;
      float g = texture2D(uVideo, clamp(warpUv,                      0.0, 1.0)).g;
      float b = texture2D(uVideo, clamp(warpUv - dir * aberr,        0.0, 1.0)).b;

      // vinheta que se abre do centro
      float dist = length(dir);
      float vig = 1.0 - smoothstep(0.0, 0.5 + uProgress * 0.5, dist * (2.0 - uProgress * 1.5));
      vig = clamp(vig, 0.0, 1.0);

      // pulso de brilho inicial
      float pulse = exp(-uProgress * 4.0) * 0.6;

      float alpha = smoothstep(0.0, 0.45, uProgress) * vig;
      gl_FragColor = vec4((vec3(r, g, b) + pulse) * vig, alpha);
    }
  `,
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS de compilação WebGL2
// ─────────────────────────────────────────────────────────────────────────────

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`[transition shader] compile error:\n${info}`)
  }
  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog)
    gl.deleteProgram(prog)
    throw new Error(`[transition shader] link error:\n${info}`)
  }
  return prog
}

/** Nomes legíveis dos efeitos para a UI */
export const EFFECT_LABELS = {
  none:       "Corte",
  fade:       "Fade",
  dissolve:   "Dissolução",
  melt:       "Derretimento",
  ripple:     "Ondas",
  wipe_right: "Varredura →",
  wipe_down:  "Varredura ↓",
  zoom_in:    "Zoom",
  burn:       "Fogo",
  dream:      "Sonho",
}
