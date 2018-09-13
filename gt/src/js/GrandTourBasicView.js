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
  constructor({ data, labels, gt,
    container, 
    dpr=1, 
    camera=math.reshape(Array.from(glmatrix.mat4.create()), [4,4]), 
    contextAttributes}){
    this.data = data;
    this.ndim = this.data[0].length;
    if(labels === undefined){
      this.labels = this.data.map(()=>0);
    }else{
      this.labels = labels;
    }
    this.color = this.labels.map(i=>utils.baseColor[i]);
    this.container = container;
    this.gl = glutil.context({
      container, dpr, contextAttributes});
    this.canvas = this.gl.canvas;
    this.program = glutil.program(this.gl, vshader, fshader);
    this.dpr = dpr;
    if(gt === undefined){
      this.gt = new GrandTour({ndim: this.ndim, stepsize: 0.00005});
    }else{
      this.gt = gt;
    }

    this.camera = camera;
    this.dmax = math.max(this.data);
    
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

    glutil.attribute(this.gl, {
      name: 'acolor', 
      type: 'float',
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

    glutil.attribute(this.gl, {
      name: 'acolor', 
      type: 'float',
      data: this.color.slice(0,this.data.length).concat(this.axisColor)
    });

    this.then = 0;
  }

  resize(){
    let width = this.container.width;
    let height = this.container.height;
    this.canvas.width = width * this.dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.height = height * this.dpr;
    this.canvas.style.height = height + 'px';
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
  }


  set data(d){
    this._data = d;
  }
  get data(){
    return this._data;
  }


  play(now=0){
    let dt;

    if(now!=0 && this.then==0){ //resume from stop()
      dt = 0;
      this.then = now;
    }else if(now==0){ //beginning of time
      dt = 0;
    }else{ //normal case
      dt = now - this.then;
      this.then = now;
    }

    this.render(dt);
    this.animationId = window.requestAnimationFrame(this.play.bind(this));
  }

  stop(){
    window.cancelAnimationFrame(this.animationId);
    this.animationId = undefined;
    this.then = 0;
  }


  render(dt=0){
    glutil.clear(this.gl, [0.15,0.15,0.15,1.0]);
    //=================upload data================
    glutil.attribute(this.gl, {
      name: 'position', 
      type: 'float',
      data: this.gt.project(this.data.concat(this.axisData), dt)
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
