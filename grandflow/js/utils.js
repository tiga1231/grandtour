// function klein(u,v, R=1, P=3, epsilon=0.3){
//   x = R * (Math.cos(u/2)*Math.cos(v)-Math.sin(u/2)*Math.sin(2*v));
//   y = R * (Math.sin(u/2)*Math.cos(v)-Math.cos(u/2)*Math.sin(2*v));
//   z = P * Math.cos(u) * (1+epsilon*Math.sin(v));
//   w = P * Math.sin(u) * (1+epsilon*Math.sin(v));
//   return [x,y,z,w]
// }

// function dklein(u,v,R=1, P=3, epsilon=0.3){
//   dxdu = R * (-1/2 * Math.sin(u/2)*Math.cos(v) - 1/2*Math.cos(u/2)*Math.sin(2*v));
//   dxdv = R * (-Math.cos(u/2)*Math.sin(v) - 2*Math.sin(u/2)*Math.cos(2*v));

//   dydu = R * (1/2 * Math.cos(u/2) * Math.cos(v) + 1/2 * Math.sin(u/2)*Math.sin(2*v));
//   dydv = R * (- Math.sin(u/2) * Math.sin(v) - 2* Math.cos(u/2) * Math.cos(2*v));

//   dzdu = -P * Math.sin(u) * (1+ epsilon * Math.sin(v));
//   dzdv = -P * Math.cos(u) * (1+ epsilon * Math.cos(v));

//   dwdu = P * Math.cos(u) * (1+epsilon*Math.sin(v));
//   dwdv = P * Math.sin(u) * (1+epsilon*Math.cos(v));

//   return [
//     [dxdu, dxdv],
//     [dydu, dydv],
//     [dzdu, dzdv],
//     [dwdu, dwdv],
//   ];
// }
// 


function flatten(v){
  return Float32Array.from(v.flat());
}


// Get a file as a string using  AJAX
function loadFileAJAX(name) {
  var xhr = new XMLHttpRequest(),
      okStatus = document.location.protocol === "file:" ? 0 : 200;
  xhr.open('GET', name, false);
  xhr.send(null);
  return xhr.status == okStatus ? xhr.responseText : null;
};


function initShaders(gl, vShaderName, fShaderName) {
    function getShader(gl, shaderName, type) {
        var shader = gl.createShader(type),
            shaderScript = loadFileAJAX(shaderName);
        if (!shaderScript) {
            alert("Could not find shader source: "+shaderName);
        }
        gl.shaderSource(shader, shaderScript);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    var vertexShader = getShader(gl, vShaderName, gl.VERTEX_SHADER),
        fragmentShader = getShader(gl, fShaderName, gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }
    return program;
};


function multiplyRotationMatrix(matrix, i, j, theta){
  if(theta == 0){
    return matrix;
  }
  let sin = Math.sin(theta);
  let cos = Math.cos(theta);
  let columnI = matrix.map((d)=>d[i]);
  let columnJ = matrix.map((d)=>d[j]);
  for (let rowIndex=0; rowIndex<matrix.length; rowIndex++) {
    matrix[rowIndex][i] = columnI[rowIndex]*cos + columnJ[rowIndex]*(-sin);
    matrix[rowIndex][j] = columnI[rowIndex]*sin + columnJ[rowIndex]*cos;
  }
  return matrix;
}