var glutils = {};

glutils.initShaderProgram = function(gl, vUrl, fUrl){
  let vShader, fShader;

  let req = new XMLHttpRequest();
  req.addEventListener('load', function(){
    let source = this.responseText;
    vShader = glutils.loadShader(gl, gl.VERTEX_SHADER, source);
  });
  req.open('GET', vUrl, false);
  req.send();

  req = new XMLHttpRequest();
  req.addEventListener('load', function(){
    let source = this.responseText;
    fShader = glutils.loadShader(gl, gl.FRAGMENT_SHADER, source);
  });
  req.open('GET', fUrl, false);
  req.send();

  let program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
      return null;
  }
  return program;
};


glutils.loadShader = function(gl, type, source){
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
  }
  return shader;
};


