precision mediump float;
 
varying vec4 color;
uniform bool isDrawingAxis;
uniform float pointSize;

void main () {
    gl_FragColor = color;

    if(!isDrawingAxis){

      float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
      
      float r = 0.35; //r=0.5;
      float eps = 0.5 / pointSize;
      float a = - 1.0 / (2.0*eps);
      float b = 0.5 + 0.5/eps * r;
      float f = a*dist + b;
      float g = smoothstep(0.0, 1.0, f);
      gl_FragColor.a = color.a * g;      

      vec3 outline_color = mix(vec3(0.0, 0.0, 0.0), color.rgb, 0.85);
      gl_FragColor.rgb = mix(outline_color, color.rgb,
        smoothstep(0.0, 1.0, (r - dist) * 10.0)
      );

    }
}