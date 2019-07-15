let canvas, program, gl;
let gt, t, svg;
let data, labels, colors;

let npoint, ndim, dmax, axisLength;
let fn, fn_labels, fn_colors;
let nepoch;
let epoch;
let getMeshIndices = undefined;
let DATA_BOUND_HORIZONTAL = 1.5;

// fn = 'data/digits/data.bin';
// fn_labels = 'data/digits/labels.bin';
// npoint = 1797;
// ndim = 64;

// fn = 'data/klein_bottle/data.bin';
// // fn_colors = 'data/klein_bottle/colors.bin';
// npoint = 100*60;
// ndim = 4;
// getMeshIndices = function(){
//   return utils.makeMeshindices(60,100);
// }

// fn = 'data/rp2/data.bin';
// npoint = 10000;
// ndim = 4;
// getMeshIndices = function(){
//   return utils.makeMeshindices(100,100);
// }

// fn = 'data/mnist5000_30/fc2.bin';
// // fn = 'data/mnist5000_30/softmax.bin'; //a (flattened) 3D tensor (float32) indexed by [epoch, example, dimension];
// fn_labels = 'data/mnist5000_30/labels.bin'; //an  array (uint8) of integers;
// npoint = 5000;
// ndim = 10;
// nepoch = 30;
// epoch = nepoch-1;

// fn = 'data/fashion-mnist/softmax.bin';
// fn_labels = 'data/fashion-mnist/labels.bin'; //an  array (uint8) of integers;
// npoint = 10000;
// ndim = 10;
// nepoch = 101;
// epoch = nepoch - 1;


fn = 'data/mnist/conv2_pca100_10.bin';
fn_labels = 'data/mnist/labels10000.bin';
npoint = 10000;
ndim = 10;
nepoch = 100;
epoch = 0;
dmax = 100;


// fn = 'data/tesseract/data.bin';
// npoint = 16;
// ndim = 4;
// dmax = 1;
// DATA_BOUND_HORIZONTAL = 4;
// getMeshIndices = function(){
//   return [
//   0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
//   0,2,2,6,6,4,4,0, 8,10,10,14,14,12,12,8, 0,8,2,10,6,14,4,12,
//   1,3,3,7,7,5,5,1, 9,11,11,15,15,13,13,9, 1,9,3,11,7,15,5,13
//   ];
// };


// fn = 'data/iris/data.bin';
// fn_labels = 'data/iris/labels.bin';
// npoint = 150;
// ndim=4;

// fn_labels = 'data/wine/labels.bin';
// fn = 'data/wine/data.bin';
// npoint = 178;
// ndim = 13;




window.onkeypress = function(){
    if(event.key == ' '){
        gt.shouldPlay = !gt.shouldPlay;
    }else if(event.key == 'f'){
        gt.STEPSIZE *=1.5;
    }else if(event.key == 's'){
        gt.STEPSIZE /= 5;
    }else if(event.key == 'n'){
      epoch = (epoch+1==nepoch) ? 0:(epoch+1);
      data = dataTensor[epoch];
    }else if(event.key == 'p'){
      epoch = epoch==0 ? nepoch-1 : epoch-1;
      data = dataTensor[epoch];
    }
};


window.onload = function(){
  t = 0;

  initGL();
  

  utils.loadDataBin(fn, (buffer, url)=>{
    let array = new Float32Array(buffer);
    dataTensor = utils.reshape(array, [nepoch, npoint, ndim]);
    data = dataTensor[nepoch-1];

    // //normalize data
    // let min = math.min(data, 0);
    // let std = math.transpose(data).map(col => math.std(col));
    // data = data.map(row=>row.map((d,i)=> (d-min[i])/std[i] ));
    if(dmax === undefined){
      dmax = math.max(data);
    }
    // axisLength = math.max(data);
    updateModelViewMatrix(dmax);

    gt = new GrandTour(ndim);
    gt.shouldPlay = true;
    svg = overlay.init();
    render(0);
  });

  if(fn_labels !== undefined){
    utils.loadDataBin(fn_labels, (buffer, url)=>{
      labels = new Uint8Array(buffer);
      labels = Array.from(labels);
      colors = labels.map(d=>utils.baseColors[d]);
      colors = colors.concat(createAxisColors(ndim));

      program.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
      gl.enableVertexAttribArray(program.colorLoc);
    });
  }else if(fn_colors !== undefined){
    utils.loadDataBin(fn_colors, (buffer, url)=>{
      colors = Array.from(new Uint8Array(buffer));
      colors = utils.reshape(colors, [colors.length/3,3]);
      colors = colors.concat(createAxisColors(ndim));

      program.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
      gl.enableVertexAttribArray(program.colorLoc);
    });
  }
  else{
    program.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, program.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.colorLoc, 3, gl.UNSIGNED_BYTE, true, 0,0);
    gl.enableVertexAttribArray(program.colorLoc);
  }
};






function initGL(){
  colors = d3.range(npoint).map(d=>[120, 150, 255]); //color placeholder
  colors = colors.concat(createAxisColors(100));

  data = numeric.random([npoint, ndim]); //data placeholder

  canvas = document.querySelector('#myCanvas');

  utils.resizeCanvas(canvas,  window.innerWidth, window.innerHeight);

  gl = canvas.getContext('webgl');
  gl.clearColor(...utils.CLEAR_COLOR, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0,0, canvas.width, canvas.height);

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
  let left = -DATA_BOUND_HORIZONTAL;
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
  if(getMeshIndices !== undefined){
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getMeshIndices()), gl.STATIC_DRAW);  
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(utils.makeMeshindices(60,100)), gl.STATIC_DRAW);
  }else{
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(d3.range(npoint+2*ndim)), gl.STATIC_DRAW);
  }


  gl.uniformMatrix4fv(program.modelViewMatrixLoc, false, program.modelViewMatrix);
  gl.uniformMatrix4fv(program.projectionMatrixLoc, false, program.projectionMatrix);
}



function updateModelViewMatrix(dmax){
  let modelViewMatrix = mat4.create();
  mat4.scale(modelViewMatrix, modelViewMatrix, [1/dmax, 1/dmax, 1/dmax]);
  program.modelViewMatrix = modelViewMatrix;
  gl.uniformMatrix4fv(program.modelViewMatrixLoc, false, program.modelViewMatrix);
}


function createAxisPoints(ndim, axisLength){
    if(axisLength===undefined){
        axisLength = 1;
    }
    var res = math.multiply(math.eye(ndim), axisLength)._data;
    for(var i=ndim-1; i>=0; i--){
        res.splice(i, 0, math.zeros(ndim)._data);
    }
    return res;
}


function createAxisColors(ndim){
    var res = d3.range(ndim*2).map((d,i)=>utils.baseColors[Math.floor(i/2) % utils.baseColors.length]);
    return res;
}


let then = 0;

function render(now){
  let dt = now - then;
  then = now;
  if(!gt.shouldPlay){
    dt = 0;
  }

  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    
  // mat4.rotate(program.modelViewMatrix, program.modelViewMatrix, 0, [0.0, 1.0, 0.0]);
  // gl.uniformMatrix4fv(program.modelViewMatrixLoc, false, program.modelViewMatrix);
  
  
  let d = data.slice(0, npoint);
  d = d.concat(createAxisPoints(d[0].length, axisLength));
  d = gt.project(d, dt);

  gl.bindBuffer(gl.ARRAY_BUFFER, program.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(utils.flatten(d)), gl.STATIC_DRAW);

  
  if(getMeshIndices !== undefined){
    gl.drawElements(gl.LINE_STRIP, getMeshIndices().length, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.LINES, ndim*2, gl.UNSIGNED_SHORT, npoint*2);
  }else{
    gl.drawArrays(gl.POINTS, 0, npoint);
    gl.drawArrays(gl.LINES, npoint, ndim*2);
  }

  // gl.drawElements(gl.LINE_STRIP, 23364, gl.UNSIGNED_SHORT, 0);
  // gl.drawElements(gl.LINES, ndim*2, gl.UNSIGNED_SHORT, 23364);

  overlay.redrawAxis(t);
  requestAnimationFrame(render);

}