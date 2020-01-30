attribute vec3 a_position;

uniform float width;
uniform float height;
uniform float xDataMin;
uniform float xDataMax;
uniform float yDataMin;
uniform float yDataMax;

uniform float du;
uniform float dv;
uniform mat4 gt;

varying float v_du;
varying float v_dv;
varying vec2 v_uv;
varying vec2 v_uv_end;
varying vec4 v_xyzw;
varying float v_step;
varying float v_alpha_multiplier;


vec4 klein(float u, float v, float R, float P, float epsilon){
// R=1, P=3, epsilon=0.3
  float x = R * (cos(u/2.0)*cos(v)-sin(u/2.0)*sin(2.0*v));
  float y = R * (sin(u/2.0)*cos(v)+cos(u/2.0)*sin(2.0*v));
  float z = P * cos(u) * (1.0+epsilon*sin(v));
  float w = P * sin(u) * (1.0+epsilon*sin(v));
  return vec4(x,y,z,w);
}




mat4 dklein(float u, float v, float R, float P, float epsilon){
  float dxdu = R * (-1.0/2.0 * sin(u/2.0) * cos(v) - 1.0/2.0*cos(u/2.0) * sin(2.0*v));
  float dxdv = R * (-cos(u/2.0) * sin(v) - 2.0*sin(u/2.0) * cos(2.0*v));

  float dydu = R * (1.0/2.0 * cos(u/2.0) * cos(v) + 1.0/2.0*sin(u/2.0) * sin(2.0*v));
  float dydv = R * (-sin(u/2.0) * sin(v) + 2.0*cos(u/2.0) * cos(2.0*v));

  float dzdu = -P * sin(u) * (1.0 + epsilon * sin(v));
  float dzdv = P * cos(u) * epsilon * cos(v);

  float dwdu = P * cos(u) * (1.0 + epsilon * sin(v));
  float dwdv = P * sin(u) * epsilon * cos(v);

  mat4 res;
  res[0].xyzw = vec4(dxdu, dydu, dzdu, dwdu);
  res[1].xyzw = vec4(dxdv, dydv, dzdv, dwdv);
  return res;
}

void main() {
  gl_PointSize = 4.0;
  float R = 1.0;
  float P = 1.618;
  float epsilon = 0.3;

  
  float lr = 0.1;
  vec2 d2 = vec2(
    a_position.x+lr*du*a_position.z, 
    a_position.y+lr*dv*a_position.z
  );
  v_uv_end = d2;
  v_du = du;
  v_dv = dv;

  vec4 pos = klein(d2.x, d2.y, R, P, epsilon);
  v_step = a_position.z;

  // vec4 pos = klein(a_position.x, a_position.y, R, P, epsilon);
  // v_step = a_position.z;
  //integral
  // float lr = 0.03;
  // vec4 d = vec4(0.0,0.0,0.0,0.0);
  // for(int i=0; i<10000; i++){
  //   if (float(i)>=v_step){
  //     break;
  //   }
  //   vec4 d2 = lr * vec4(du, dv, 0.0, 0.0);
  //   mat4 mat = dklein(a_position.x+d.x, a_position.y+d.y, R, P, epsilon);
  //   vec4 d4 = mat * d2;
  //   pos += d4;
  //   d += d2;
  // }


  gl_Position = gt * pos;
  v_xyzw = gl_Position;
  v_alpha_multiplier = 1.0;//(gl_Position.z + 2.0)/2.6;

  float data_wh_ratio = (xDataMax - xDataMin)/(yDataMax - yDataMin);
  float screen_wh_ratio = width/height;

  if (data_wh_ratio < screen_wh_ratio){
    gl_Position.y = (gl_Position.y - yDataMin)/(yDataMax - yDataMin) * 2.0 - 1.0;
    gl_Position.x = (gl_Position.x - yDataMin)/(yDataMax - yDataMin) * 2.0 - 1.0;
    gl_Position.x = gl_Position.x * height/width;
  }else{
    gl_Position.x = (gl_Position.x - xDataMin)/(xDataMax - xDataMin) * 2.0 - 1.0;
    gl_Position.y = (gl_Position.y - xDataMin)/(xDataMax - xDataMin) * 2.0 - 1.0;
    gl_Position.y = gl_Position.y / height * width;
  }

  gl_Position.z = 0.0;
  gl_Position.w = 1.0;


  // gl_Position.z /= 80.0;
  // gl_Position.w = -gl_Position.z;
  // gl_Position.w += 1.0;
  // gl_Position.w /= 1.0;


  v_uv = a_position.xy;

}