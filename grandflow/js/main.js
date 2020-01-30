function initGL(canvasid, shaderPathPair){
  //init shaders
  let canvas = document.getElementById(canvasid.slice(1));
  let gl = canvas.getContext('webgl', {premultipliedAlpha: false});
  let program = initShaders(gl, shaderPathPair[0], shaderPathPair[1]);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(...CLEAR_COLOR, 1.0);

  // gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE, gl.ONE_MINUS_SRC_ALPHA
  );

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  gl.buffers = {};
  gl.locs = {};

  gl.buffers.position = gl.createBuffer();
  gl.locs.position = gl.getAttribLocation(program, 'a_position');

  gl.locs.xDataMin = gl.getUniformLocation(program, 'xDataMin');
  gl.locs.xDataMax = gl.getUniformLocation(program, 'xDataMax');
  gl.locs.yDataMin = gl.getUniformLocation(program, 'yDataMin');
  gl.locs.yDataMax = gl.getUniformLocation(program, 'yDataMax');

  gl.locs.width = gl.getUniformLocation(program, 'width');
  gl.locs.height = gl.getUniformLocation(program, 'height');

  gl.locs.time = gl.getUniformLocation(program, 'time');
  gl.locs.nstep = gl.getUniformLocation(program, 'nstep');

  gl.locs.du = gl.getUniformLocation(program, 'du');
  gl.locs.dv = gl.getUniformLocation(program, 'dv');

  gl.locs.gt = gl.getUniformLocation(program, 'gt');
  gl.locs.mouse = gl.getUniformLocation(program, 'mouse');

  return [gl, program];
}

function linspace3d(
  x0,x1,n, 
  y0,y1,m,
  z0,z1,l,
  randomness = 0.0
  ){
  let dx = (x1-x0)/(n-1);
  let dy = (y1-y0)/(m-1);
  let dz = 1;
  let res = [];
  for(let i=0; i<n; i++){
    for(let j=0; j<m; j++){
      let rx = randomness*((Math.random()-0.5)*dx);
      let ry = randomness*((Math.random()-0.5)*dy);
      for(let k=0; k<l; k++){
        res.push([
          x0 + i*dx + rx, 
          y0 + j*dy + ry, 
          z0 + k*dz
        ]);
      }
    }
  }
  return res;
}


function render(dt, gl, program){

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gt.step(dt);
  gl.uniformMatrix4fv(gl.locs.gt, false, flatten(gt.matrix));

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl.locs.position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl.locs.position);
  // gl.drawArrays(gl.LINES, 0, points.length);

  for (let i=0; i<points.length / nstep - 3; i++){
    gl.drawArrays(gl.LINE_STRIP, i*nstep, nstep);
    // gl.drawArrays(gl.POINTS, 3*i*nstep, nstep);
    // gl.drawArrays(gl.POINTS, i*nstep + (nstep-1), 1);

  }
  // gl.drawArrays(gl.POINTS, 0, points.length);
}

function play(t){
  let dt = performance.now() - time;
  time = performance.now();
  gl.uniform1f(gl.locs.time, time);
  render(dt, gl, program);
  requestAnimationFrame(play.bind(window));
}

window.addEventListener('resize', (e)=>{
  canvas
  .attr('width', window.innerWidth * window.devicePixelRatio)
  .attr('height', window.innerHeight * window.devicePixelRatio);

  gl.uniform1f(gl.locs.width, window.innerWidth);
  gl.uniform1f(gl.locs.height, window.innerHeight);
  render(0, gl, program);
});







//main
//
const CLEAR_COLOR = [0.25, 0.25, 0.25];
let nstep = 100;
let extent = 6;

let gt = {};
gt.matrix = math.eye(4)._data;
gt.matrix = math.qr(math.random([4,4])).Q;
gt.STEPSIZE = 0.002;
gt.thetas = math.random([4,4]);
gt.step = function(){
  for(let i=0; i<4; i++){
    for(let j=i+1; j<4; j++){
      multiplyRotationMatrix(this.matrix, i, j, this.STEPSIZE * this.thetas[i][j]);
    }
  }
  return this.matrix;
};

let points = linspace3d(
  0, 2*Math.PI, 5+1, //big circle
  0, 2*Math.PI, 19+1, //small circle
  0, nstep-1, nstep,
  0.9
);
let [xDataMin, xDataMax] = [-extent, extent];
let [yDataMin, yDataMax] = [-extent, extent];
let time = performance.now();

let canvas = d3.select('#main')
.attr('width', window.innerWidth * window.devicePixelRatio)
.attr('height', window.innerHeight * window.devicePixelRatio)
.style('width', '100%')
.style('height', '100%');

let [gl, program] = initGL('#main', ['shader/vertex.glsl', 'shader/fragment.glsl']);

canvas.on('mousemove', ()=>{
  let [x,y] = [d3.event.clientX, d3.event.clientY];
  x = x - window.innerWidth/2;
  y = y - window.innerHeight/2;

  // gl.uniform2fv(gl.locs.mouse, 
  //   [x/window.innerHeight*2,
  //   y/window.innerHeight*2]);

  let r = Math.sqrt(x*x + y*y);
  [x,y] = [x/r, y/r];
  gl.uniform1f(gl.locs.du, x);
  gl.uniform1f(gl.locs.dv, y);
})

gl.uniform1f(gl.locs.xDataMin, xDataMin);
gl.uniform1f(gl.locs.xDataMax, xDataMax);
gl.uniform1f(gl.locs.yDataMin, yDataMin);
gl.uniform1f(gl.locs.yDataMax, yDataMax);

gl.uniform1f(gl.locs.width, window.innerWidth);
gl.uniform1f(gl.locs.height, window.innerHeight);
gl.uniform1f(gl.locs.nstep, nstep);

gl.uniform1f(gl.locs.du, 1.0);
gl.uniform1f(gl.locs.dv, 1.0);

play(gl, program);