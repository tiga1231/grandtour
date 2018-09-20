precision mediump float;

uniform float dpr;
uniform mat4 camera;
uniform bool isDrawingAxis;

attribute vec3 position;
attribute vec4 acolor;
varying vec4 color;

void main() {
  if(!isDrawingAxis){
    gl_PointSize = 4.0 * dpr;
  }

  gl_Position = camera * vec4(position, 1.0);
  color = acolor;
}