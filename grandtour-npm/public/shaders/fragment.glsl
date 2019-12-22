precision mediump float;

uniform int mode;
varying vec4 v_color;


void main() {
  gl_FragColor = v_color;

  if (mode == 0) { //points
    //round points
    float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
    float eps = 0.05;
    float c = 0.5 - eps;
    float g = smoothstep(c+eps, c-eps, dist);
    gl_FragColor.a = v_color.a * g;
    
    vec3 outline_color = mix(vec3(1.0, 1.0, 1.0), gl_FragColor.rgb, 0.1);
    gl_FragColor.rgb = mix(
      outline_color,
      gl_FragColor.rgb,
      smoothstep(0.0, 1.0, (0.5 - dist) * 5.0)
    );
  }else{//lines
    //pass
  }

}

