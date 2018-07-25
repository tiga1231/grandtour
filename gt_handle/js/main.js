let canvas, program, gl;
let data, labels, colors;

let npoint = 150;
let ndim = 4;
let fn, fn_labels, fn_colors;

// fn = 'data/klein_bottle/data.bin';
// fn_colors = 'data/klein_bottle/colors.bin';

fn = 'data/iris/data.bin';
fn_labels = 'data/iris/labels.bin';
npoint = 150;

// fn_labels = 'data/wine/labels.bin';
// fn = 'data/wine/data.bin';
// npoint = 178;
// ndim = 13;


let m = d3.range(ndim).map(d=>[Math.random()-0.5, 
  Math.random()-0.5, Math.random()-0.5]);


window.onload = function(){

  initGL();
  overlay.init();

  utils.loadDataBin(fn, (buffer, url)=>{
    data = utils.reshape(new Float32Array(buffer), [npoint, ndim]);
    render();
  });

  if(fn_labels !== undefined){
    utils.loadDataBin(fn_labels, (buffer, url)=>{
      labels = new Uint8Array(buffer);
      labels = Array.from(labels);
      colors = labels.map(d=>utils.baseColors[d]);

      program.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
      gl.enableVertexAttribArray(program.colorLoc);
      render();
    });
  }else if(fn_colors !== undefined){
    utils.loadDataBin(fn_colors, (buffer, url)=>{
      colors = new Uint8Array(buffer);
      program.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
      gl.enableVertexAttribArray(program.colorLoc);
      render();
    });
  }
  else{
    program.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
    gl.enableVertexAttribArray(program.colorLoc);
    render();
  }
  

  
} 


function initGL(){
  colors = d3.range(npoint).map(d=>utils.baseColors[0]); //color placeholder
  data = d3.range(npoint).map(d=>d3.range(ndim)); //data placeholder

  canvas = document.querySelector('#myCanvas');
  gl = canvas.getContext('webgl');
  gl.clearColor(...utils.CLEAR_COLOR, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  program = glutils.initShaderProgram(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');
  program.vertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition');
  program.colorLoc = gl.getAttribLocation(program, 'aColor');
  program.projectionMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');
  program.modelViewMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');

  program.projectionMatrix = mat4.create();
  // let fov = 90 * Math.PI / 180;
  let aspect = canvas.clientWidth / canvas.clientHeight;
  // let zNear = 0.1;
  // let zFar = 100.0;
  // mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);
  let left = -20;
  let right = -left;
  let bottom = left / aspect;
  let top = -bottom;
  let near = -1000;
  let far = -near;
  mat4.ortho(program.projectionMatrix, left, right, bottom, top, near, far);


  program.modelViewMatrix = mat4.create();
  // mat4.scale(modelViewMatrix, modelViewMatrix, [1, 1, 1]);
  // mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, -0.0, -0.0]);
  // mat4.rotate(modelViewMatrix, modelViewMatrix, 0, [0.0, 0.0, 0.0]);

  gl.useProgram(program);

  let positionBuffer = gl.createBuffer();
  program.positionBuffer = positionBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(program.vertexPositionLoc, 3, gl.FLOAT, false, 0,0);
  gl.enableVertexAttribArray(program.vertexPositionLoc);

  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(utils.makeMeshindices(100,100)), gl.STATIC_DRAW);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(d3.range(npoint)), gl.STATIC_DRAW);

  gl.uniformMatrix4fv(program.modelViewMatrixLoc, false, program.modelViewMatrix);
  gl.uniformMatrix4fv(program.projectionMatrixLoc, false, program.projectionMatrix);
}


function render(){
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    
  // mat4.rotate(program.modelViewMatrix, program.modelViewMatrix, 0, [0.0, 1.0, 0.0]);
  // gl.uniformMatrix4fv(program.modelViewMatrixLoc, false, program.modelViewMatrix);

  let d = math.multiply(data, m);
  gl.bindBuffer(gl.ARRAY_BUFFER, program.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(utils.flatten(d)), gl.STATIC_DRAW);

  // gl.drawArrays(gl.POINTS, 0, npoint);
  gl.drawElements(gl.POINTS, npoint, gl.UNSIGNED_SHORT, 0);
  // gl.drawElements(gl.LINE_STRIP, 39204, gl.UNSIGNED_SHORT, 0);
}
