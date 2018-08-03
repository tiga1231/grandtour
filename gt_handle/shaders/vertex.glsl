attribute vec4 aVertexPosition;
attribute vec4 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main(){
  gl_PointSize = 3.0;
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aColor;
}