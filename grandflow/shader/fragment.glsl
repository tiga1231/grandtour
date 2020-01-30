precision mediump float;
varying vec2 v_uv;
varying vec2 v_uv_end;
varying vec4 v_xyzw;
varying float v_du;
varying float v_dv;
varying float v_step;
varying float v_alpha_multiplier;
uniform float time;
uniform float nstep;
uniform vec2 mouse;


void main() {
  float t = time/4000.0;
  float nwave = 3.6;

  float phase = v_step/(nstep-1.0)*nwave - (t-floor(t));
  phase = phase - floor(phase);
  float a = smoothstep(0.0, 1.0, phase);

  float global_envelope = cos((v_step/(nstep-1.0) - 1.57)/2.0);
  // a = a * global_envelope;
  a = a * global_envelope * v_alpha_multiplier;

  float r = v_xyzw.w;
  float g = (1.0-cos(6.28 * v_uv_end.x/3.14/2.0)) / 2.0;
  float b = (1.0-cos(6.28 * v_uv_end.y/3.14/2.0)) / 2.0;
  r = 0.8;
  g = 0.8 + 0.2*g;
  b = 1.0;

  // mouse in [-1,1]
  vec2 highlight_center = vec2(
    (mouse.x+1.0)/2.0, 
    (mouse.y+1.0)/2.0
  );
  highlight_center.x *= 3.14 * 4.0;
  highlight_center.y *= 3.14 * 2.0;



  // t = time/9000.0;
  // vec2 highlight_center = vec2(
  //   v_du * t, 
  //   v_dv * t * 10.0
  // );
  // highlight_center.x -= floor(highlight_center.x);
  // highlight_center.x *= 3.14 * 4.0;
  // highlight_center.y = (cos(highlight_center.y) + 1.0)/2.0;
  // highlight_center.y *= 3.14 * 2.0;

  vec2 c1 = highlight_center;
  vec2 c2 = highlight_center;
  vec2 c3 = highlight_center;
  vec2 c4 = highlight_center;
  c1.x += 3.14 * 4.0;
  c2.x -= 3.14 * 4.0;
  c3.y += 3.14 * 2.0;
  c4.y -= 3.14 * 2.0;
  float dist = distance(v_uv_end, highlight_center);
  dist = min(dist, distance(v_uv_end, c1));
  dist = min(dist, distance(v_uv_end, c2));
  dist = min(dist, distance(v_uv_end, c2));
  dist = min(dist, distance(v_uv_end, c4));
  float radius = 0.1 * 2.0;
  float intensity = smoothstep(radius, 0.0, dist);
  // r = r*clamp(intensity, 0.4, 1.0);
  // g = g*clamp(intensity, 0.4, 1.0);
  // b = b*clamp(intensity, 0.4, 1.0);
  a = a * clamp(intensity, 0.9, 1.0);

  gl_FragColor = vec4(r,g,b,a);
}