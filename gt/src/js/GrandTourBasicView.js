import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
// import * as glutil from 'gl-util';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import glutil from './glutil';
import GrandTour from './GrandTour';
import utils from './utils';

const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');


export default class GrandTourBasicView{
  constructor({ dataTensor, labels, shape, gt,
    container, 
    dpr=1, camera=math.reshape(Array.from(glmatrix.mat4.create()), [4,4]), 
    contextAttributes}){
    this.dataTensor = dataTensor;
    this.data = dataTensor[shape[0]-1];
    this.ndim = this.data[0].length;
    this.shape = shape;
    this.labels = labels;


    this.gl = glutil.context({
      container, dpr, contextAttributes});
    this.canvas = this.gl.canvas;
    this.program = glutil.program(this.gl, vshader, fshader);
    
    if(gt === undefined){
      this.gt = new GrandTour({ndim: this.ndim, stepsize: 0.00005});
    }else{
      this.gt = gt;
    }

    this.camera = camera;
    this.dmax = math.max(this.dataTensor);

    let ratio = this.canvas.width / this.canvas.height;
    let yRange = this.dmax*1.5;
    let xRange = yRange * ratio;
    

    glutil.uniform(this.gl, {
      name: 'camera',
      type: 'mat',
      data: this.camera
    });

    glutil.uniform(this.gl, {
      name: 'dpr',
      type: 'float',
      data: dpr
    });

    this.color = this.labels.map(i=>utils.baseColor[i]);
    glutil.attribute(this.gl, {
      name: 'acolor', 
      data: this.color
    });

    this.axisData = math.multiply(this.dmax, math.identity(this.ndim))._data
    .map((row)=>{
      return [math.zeros(row.length)._data, row];
    })
    .reduce((a, pair)=>{
      return a.concat([pair[0],pair[1]]);
    }, []);

    this.axisColor = _.range(this.ndim*2)
    // .map(i=>utils.baseColor[Math.floor(i/2)]);
    .map(i=>[1.0,1.0,1.0]);//white axis line
    // 
    this.then = 0;
  }

  play(){
    this.amimate();
  }

  amimate(now=0){
    let dt = now - this.then;
    this.then = now;
    this.render(dt);
    window.requestAnimationFrame(this.amimate.bind(this));
  }

  render(dt=0){
    glutil.clear(this.gl, [0.1,0.1,0.1,1.0]);
    //=================upload data================
    glutil.attribute(this.gl, {
      name: 'position', 
      data: this.gt.project(this.data.concat(this.axisData), dt)
    });
    glutil.attribute(this.gl, {
      name: 'acolor', 
      data: this.color.slice(0,this.data.length).concat(this.axisColor)
    });

    //=================draw================
    glutil.uniform(this.gl, {
      name: 'isDrawingAxis', 
      data: 0
    });
    this.gl.drawArrays(this.gl.POINTS, 0, this.data.length);

    glutil.uniform(this.gl, {
      name: 'isDrawingAxis', 
      data: 1
    });
    this.gl.drawArrays(this.gl.LINES, this.data.length, this.ndim*2);
  }

}
