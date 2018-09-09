precision mediump float;

uniform float dpr;
uniform mat4 camera;

attribute vec3 position;
attribute vec3 acolor;
varying vec3 color;

void main() {
	gl_PointSize = 6.0 * dpr;
    gl_Position = camera * vec4(position, 1.0);
    color = acolor;
}