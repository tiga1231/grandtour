// attribute vec4 a_position;
attribute vec4 a_color;

uniform float point_size;

uniform float xDataMin;
uniform float xDataMax;
uniform float yDataMin;
uniform float yDataMax;
uniform float zDataMin;
uniform float zDataMax;

attribute vec4 position_0;
attribute vec4 position_1;
attribute vec4 position_2;
attribute vec4 position_3;

uniform mat4 gt_matrix[4];

varying vec4 v_color;


void main() {
  gl_PointSize = point_size;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position += gt_matrix[0] * position_0;
  gl_Position += gt_matrix[1] * position_1;
  gl_Position += gt_matrix[2] * position_2;
  gl_Position += gt_matrix[3] * position_3;

  gl_Position.x = (gl_Position.x - xDataMin) / (xDataMax - xDataMin) * 2.0 - 1.0;
  gl_Position.y = (gl_Position.y - yDataMin) / (yDataMax - yDataMin) * 2.0 - 1.0;
  gl_Position.z = (gl_Position.z - zDataMin) / (zDataMax - zDataMin);
  // gl_Position.z *= 0.99;

  // gl_Position.xyz *= 0.95; //margin
  gl_Position.w = 1.0;
  
  v_color = vec4(a_color);
}
