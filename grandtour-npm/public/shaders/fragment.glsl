precision mediump float;

uniform int mode;
varying vec4 v_color;


void main() {
  gl_FragColor = v_color;

  if (mode == 0) { //points
    //round points
    float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
    float eps = 0.1;
    float a = - 1.0 / (2.0*eps);
    float b = 0.5 + 1.0/(4.0*eps);
    float f = a*dist + b;
    float g = smoothstep(0.0, 1.0, f);
    gl_FragColor.a = v_color.a * g;
    float feather = clamp(0.0, gl_FragColor.a, 10.0 * (0.5 - dist));
    vec3 outline_color = mix(vec3(0.0, 0.0, 0.0), gl_FragColor.rgb, 0.9);
    gl_FragColor.rgb = mix(
      outline_color,
      gl_FragColor.rgb,
      smoothstep(0.0, 1.0, (0.5 - dist) * 5.0)
    );
  }else{//lines
    //pass
  }

}

