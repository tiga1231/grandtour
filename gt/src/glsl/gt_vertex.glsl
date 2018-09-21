precision mediump float;

uniform float dpr;
uniform mat4 camera;
uniform bool isDrawingAxis;
uniform float pointSize;

attribute vec3 position;
attribute vec4 acolor;
varying vec4 color;

void main() {
  if(!isDrawingAxis){
    gl_PointSize = pointSize * dpr;
  }

  gl_Position = camera * vec4(position, 1.0);
  color = acolor;
}