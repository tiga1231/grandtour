precision mediump float;

uniform int mode;
varying vec4 v_color;


void main() {
  gl_FragColor = v_color;

  if (mode == 0) { //points
    //round points
    float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
    float eps = 0.1;
    float g = 1.0 - smoothstep(0.5-eps, 0.5, dist);
    gl_FragColor.a = v_color.a * g;
    
    vec3 outline_color = mix(vec3(1.0, 1.0, 1.0), gl_FragColor.rgb, 0.1);

    eps = 0.10;
    g = smoothstep(0.5-eps, 0.5, dist);
    gl_FragColor.rgb = mix(
      gl_FragColor.rgb,
      outline_color,
      g
    );
  }else{//lines
    //pass
  }

}

