varying lowp vec4 vColor;

void main(){
  gl_FragColor = vec4(vColor.xyz, 1.0);
}