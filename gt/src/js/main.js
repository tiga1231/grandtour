import style from "../css/style.css";

import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
// import * as glutil from 'gl-util';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';

const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');
// const dataTensorBuffer = require('../../data/conv2_pca_100_1000_10.bin');
const dataTensorBuffer = require('../../data/softmax.bin');
const labelsBuffer = require('../../data/labels.bin');

window.onload = function(){
  demo2();

	window.glmatrix = glmatrix;
	window.utils = utils;
	window.glutil = glutil;
	window._ = _;
	window.d3 = d3;
	window.math = math;
};


window.clean = ()=>{
  d3.select('div#root').selectAll('div').remove();
}


function demo2(){
  //single view that supports next epoch
  let dpr = window.devicePixelRatio;
  console.log('dpr:', dpr);
  let divRoot = d3.select('div#root').node();

  let container = d3.select(divRoot)
  .append('div')
  .style('float', 'left')
  .node();
  container.width = window.innerWidth;
  container.height = window.innerHeight;

  let labels = Array.from(new Uint8Array(labelsBuffer));
  let shape = [100,1000,10];
  let dataTensor = math.reshape(Array.from(new Float32Array(dataTensorBuffer)), shape);
  let data = dataTensor[99];
  let dmax = math.max(dataTensor[99]);
  console.log(dmax);

  let gt = new GrandTour({ndim: 10, stepsize: 0.00005});

  let xRange, yRange;
  if(container.width > container.height){
    yRange = 1.1*dmax;
    xRange = yRange * container.width / container.height;
  }else{
    xRange = 1.1*dmax;
    yRange = xRange * container.height / container.width;
  }
  let ortho = glmatrix.mat4.create();
  glmatrix.mat4.ortho(ortho, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
  ortho = math.reshape(Array.from(ortho), [4,4]);
  
  let gtv = new GrandTourBasicView({
    container: container,
    data: data, 
    labels: labels,
    gt: gt,
    camera: ortho,
    dpr: dpr,
  });

  // simple controller that switch epoch on key press
  let epoch = 0;
  let nepoch = 100;
  gtv.data = dataTensor[epoch];
  window.onkeypress = function(event){
    if(event.key == 'n' || event.key == 'p'){
      if(event.key == 'n'){
        epoch += 1;
        epoch = epoch==nepoch ? 0 : epoch;

      }else if(event.key == 'p'){
        epoch -= 1;
        epoch = epoch<0 ? nepoch-1 : epoch;
      }
      gtv.data = dataTensor[epoch];
    }
  }
  gtv.animate();
}


function demo1(){
  //two-eye camera
  let dpr = window.devicePixelRatio;
  console.log('dpr:', dpr);
  let divRoot = d3.select('div#root').node();

  let container = d3.select(divRoot)
  .append('div')
  .style('float', 'left')
  .node();
  container.width = window.innerWidth / 2;
  container.height = window.innerHeight;

  let container2 = d3.select(divRoot).append('div')
  .style('float', 'right')
  .node();
  container2.width = window.innerWidth / 2;
  container2.height = window.innerHeight;

  let labels = Array.from(new Uint8Array(labelsBuffer));
  let shape = [100,1000,10];
  let dataTensor = math.reshape(Array.from(new Float32Array(dataTensorBuffer)), shape);
  let data = dataTensor[99];
  let dmax = math.max(dataTensor[99]);
  console.log(dmax);

  let gt = new GrandTour({ndim: 10, stepsize: 0.00005});

  let xRange, yRange;
  if(container1.width > container1.height){
    yRange = 1.1*dmax;
    xRange = yRange * container1.width / container1.height;
  }else{
    xRange = 1.1*dmax;
    yRange = xRange * container1.height / container1.width;
  }

  let ortho = glmatrix.mat4.create();
  glmatrix.mat4.ortho(ortho, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);


  let z = 100*dmax;
  let leftEye = glmatrix.mat4.create();
  glmatrix.mat4.lookAt(leftEye, [-0.5,0,z], [0,0,0], [0,1,0]);
  glmatrix.mat4.mul(leftEye, ortho, leftEye);
  leftEye = math.reshape(Array.from(leftEye),[4,4]);
  let rightEye = glmatrix.mat4.create();
  glmatrix.mat4.lookAt(rightEye, [0.5,0,z], [0,0,0], [0,1,0]);
  glmatrix.mat4.mul(rightEye, ortho, rightEye);
  rightEye = math.reshape(Array.from(rightEye),[4,4]);

  let gtv = new GrandTourBasicView({
    container: container,
    data: data, 
    labels: labels,
    gt: gt,
    camera: leftEye,
    dpr: dpr,
    contextAttributes: {
      antialias: true,
      depth: true
    }
  });

  let gtv2 = new GrandTourBasicView({
    container: container2,
    data: data, 
    labels: labels,
    gt: gt,
    camera: rightEye,
    dpr: dpr,
    contextAttributes: {
      antialias: true,
      depth: true
    }
  });

  let then = 0;
  let play = (now=0)=>{
    let dt = now - then;
    gt.tick(dt);
    then = now;
    gtv.render(0);
    gtv2.render(0);
    window.requestAnimationFrame(play);
  };
  play();
}



	


