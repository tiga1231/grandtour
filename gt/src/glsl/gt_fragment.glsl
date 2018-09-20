precision mediump float;
 
varying vec4 color;
uniform bool isDrawingAxis;

void main () {
    gl_FragColor = color;

    if(!isDrawingAxis){

      float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
      
      float eps = 0.1;
      float a = - 1.0 / (2.0*eps);
      float b = 0.5 + 1.0/(4.0*eps);
      float f = a*dist + b;
      float g = smoothstep(0.0, 1.0, f);
      gl_FragColor.a = color.a * g;      

      float feather = clamp(0.0, gl_FragColor.a, 10.0 * (0.5 - dist));
      vec3 outline_color = mix(vec3(0.0, 0.0, 0.0), gl_FragColor.rgb, 0.9);
      gl_FragColor.rgb = mix(
        outline_color,
        gl_FragColor.rgb,
        smoothstep(0.0, 1.0, (0.5 - dist) * 5.0)
      );

    }else{
      gl_FragColor.a = 0.5;
    }
}