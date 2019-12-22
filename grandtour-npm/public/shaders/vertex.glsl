attribute vec4 a_position;
attribute vec4 a_color;

uniform float point_size;

uniform float xDataMin;
uniform float xDataMax;
uniform float yDataMin;
uniform float yDataMax;
uniform float zDataMin;
uniform float zDataMax;

varying vec4 v_color;


void main() {
  gl_PointSize = point_size;
  gl_Position.x = (a_position.x - xDataMin) / (xDataMax - xDataMin) * 2.0 - 1.0;
  gl_Position.y = (a_position.y - yDataMin) / (yDataMax - yDataMin) * 2.0 - 1.0;
  gl_Position.z = (a_position.z - zDataMin) / (zDataMax - zDataMin);
  // gl_Position.xyz *= 0.95; //margin
  gl_Position.w = 1.0;
  
  v_color = vec4(a_color);
}
