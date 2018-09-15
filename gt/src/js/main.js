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
import GrandTourBasicController from './GrandTourBasicController';


const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');

const dataset = 'fashion-mnist';
// const conv1TensorBuffer = require('../../data/'+dataset+'/conv1_pca_100_1000_20.bin');
// const conv2TensorBuffer = require('../../data/'+dataset+'/conv2_pca_100_1000_20.bin');
const fc1TensorBuffer = require('../../data/'+dataset+'/fc1_pca_100_1000_20.bin');
const fc2TensorBuffer = require('../../data/'+dataset+'/fc2_pca_100_1000_10.bin');
const softmaxTensorBuffer = require('../../data/'+dataset+'/softmax_pca_100_1000_10.bin');
const labelsBuffer = require('../../data/'+dataset+'/labels_1000.bin');



window.onload = function(){



	window.glmatrix = glmatrix;
	window.utils = utils;
	window.glutil = glutil;
	window._ = _;
	window.d3 = d3;
	window.math = math;
  
  demoMultiLayers();
  // demoTwoEyeCamera();
  // demoController();

};



window.clean = ()=>{
  d3.select('div#root').selectAll('div').remove();
}


function demoController(){
  let dataTensor = math.reshape(
    Array.from(new Float32Array(conv2TensorBuffer)), 
    [100,1000,conv2TensorBuffer.byteLength/4/100/1000]
  );
  let labels = Array.from(new Uint8Array(labelsBuffer));
  let container = d3.select('div#root')
  .append('div')
  .attr('class', 'container')
  .node();
  container.width = window.innerWidth;
  container.height = window.innerHeight;

  let c = new GrandTourBasicController({
    dataTensor: dataTensor, 
    labels: labels,
    container: container, 
    stepsize: 0.00005
  });
  c.play();
  window.controller = c;

}


function demoDropFile(){
  //TODO
}


function demoMultiLayers(){
  let dpr = window.devicePixelRatio;
  console.log('dpr:', dpr);
  let divRoot = d3.select('div#root').node();
  let labels = Array.from(new Uint8Array(labelsBuffer));

  let nameBufferPairs = _.zip(
    // ['conv1', 'conv2', 'fc1', 'fc2', 'softmax'],
    // [conv1TensorBuffer, conv2TensorBuffer, fc1TensorBuffer, fc2TensorBuffer, softmaxTensorBuffer]
    ['fc1', 'fc2', 'softmax'],
    [fc1TensorBuffer, fc2TensorBuffer, softmaxTensorBuffer]
    );
  let gt;

  _.each(nameBufferPairs, ([name, buffer], i)=>{
    console.log(name);

    let container = d3.select(divRoot)
    .append('div')
    .style('float', 'left')
    .node();
    container.width = window.innerWidth/nameBufferPairs.length;
    container.height = window.innerHeight/2;

    let ndim = buffer.byteLength/4/100/1000;
    if(i==0 || name == 'fc2'){
      gt = new GrandTour({ndim: ndim});
    }
    let tensor = math.reshape(Array.from(new Float32Array(buffer)), [100,1000,ndim]);
    let data = tensor[99];
    let dmax = math.max(data);
    
    let xRange, yRange;
    if(container.width > container.height){
      yRange = 1.0*dmax;
      xRange = yRange * container.width / container.height;
    }else{
      xRange = 1.0*dmax;
      yRange = xRange * container.height / container.width;
    }
    let ortho = glmatrix.mat4.create();
    glmatrix.mat4.ortho(ortho, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
    ortho = math.reshape(Array.from(ortho), [4,4]);

    //controller
    let c = new GrandTourBasicController({
      dataTensor: tensor, 
      labels: labels,
      container: container, 
      gt: gt
    });
    c.play();

  });
}


function demoTwoEyeCamera(){
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
  let shape = [100,1000,20];
  let dataTensor = math.reshape(Array.from(new Float32Array(conv2TensorBuffer)), shape);
  let data = dataTensor[99];
  let dmax = math.max(dataTensor[99]);
  console.log(dmax);

  let gt = new GrandTour({ndim: 20, stepsize: 0.00015});

  let xRange, yRange;
  if(container.width > container.height){
    yRange = 1.0*dmax;
    xRange = yRange * container.width / container.height;
  }else{
    xRange = 1.0*dmax;
    yRange = xRange * container.height / container.width;
  }
  let ortho = glmatrix.mat4.create();
  glmatrix.mat4.ortho(ortho, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);

  let z = 100*dmax;
  let leftEye = glmatrix.mat4.create();
  glmatrix.mat4.lookAt(leftEye, [-0.5,0,z], [0,0,0], [0,1,0]);
  // glmatrix.mat4.mul(leftEye, ortho, leftEye);
  let rightEye = glmatrix.mat4.create();
  glmatrix.mat4.lookAt(rightEye, [0.5,0,z], [0,0,0], [0,1,0]);
  // glmatrix.mat4.mul(rightEye, ortho, rightEye);
  
  let leftEyeArray = math.reshape(Array.from(glmatrix.mat4.mul(glmatrix.mat4.create(), ortho, leftEye)),[4,4]);
  let rightEyeArray = math.reshape(Array.from(glmatrix.mat4.mul(glmatrix.mat4.create(), ortho, rightEye)),[4,4]);


  let gtv = new GrandTourBasicView({
    container: container,
    data: data, 
    labels: labels,
    gt: gt,
    camera: leftEyeArray,
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
    camera: rightEyeArray,
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

  // simple controller that switch epoch on key press
  let epoch = 0;
  let nepoch = 100;
  gtv.data = dataTensor[epoch];
  gtv2.data = dataTensor[epoch];
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
      gtv2.data = dataTensor[epoch];
    }
  };

  window.onresize = ()=>{
    container.width = window.innerWidth/2;
    container.height = window.innerHeight;
    container2.width = window.innerWidth/2;
    container2.height = window.innerHeight;
    gtv.resize();
    gtv2.resize();

    if(container.width > container.height){
      yRange = 1.1*dmax;
      xRange = yRange * container.width / container.height;
    }else{
      xRange = 1.1*dmax;
      yRange = xRange * container.height / container.width;
    }
    let ortho = glmatrix.mat4.create();
    glmatrix.mat4.ortho(ortho, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
    let leftEyeArray = math.reshape(Array.from(glmatrix.mat4.mul(glmatrix.mat4.create(), ortho, leftEye)),[4,4]);
    let rightEyeArray = math.reshape(Array.from(glmatrix.mat4.mul(glmatrix.mat4.create(), ortho, rightEye)),[4,4]);
    gtv.camera = leftEyeArray;
    gtv2.camera = rightEyeArray;

    glutil.uniform(gtv.gl, {
      name: 'camera',
      type: 'mat',
      data: gtv.camera
    });
    glutil.uniform(gtv2.gl, {
      name: 'camera',
      type: 'mat',
      data: gtv2.camera
    });

  };
}



	


