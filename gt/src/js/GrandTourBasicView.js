import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import glutil from './glutil';
import GrandTour from './GrandTour';
import utils from './utils';

const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');


export default class GrandTourBasicView{
  constructor({
    container, data, labels, gt=undefined, dpr=1, dmax,
    pointSize=6,
    stepsize=0.0005,
    camera=math.reshape(Array.from(glmatrix.mat4.create()), [4,4]), 
    contextAttributes}){

    this.data = data;
    this.ndim = this.data[0].length;
    this.npoint = this.data.length;


    if(labels === undefined){
      this.labels = this.data.map(()=>0);
    }else{
      this.labels = labels;
    }

    this.alpha = Array.from(Array(this.npoint), ()=>1);
    this.container = container;
    
    this.gl = glutil.context({
      container, dpr, contextAttributes});
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.blendFuncSeparate(
      this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA,
      this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA
    );


    this.canvas = this.gl.canvas;
    this.program = glutil.program(this.gl, vshader, fshader);
    this.dpr = dpr;
    if(gt === undefined){
      this.gt = new GrandTour({ndim: this.ndim, stepsize: stepsize});
    }else{
      this.gt = gt;
    }

    this.camera = camera;
    if(dmax === undefined){
      this.dmax = math.max(this.data);
    }else{
      this.dmax = dmax;
    }
    
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
    this.pointSize = pointSize;

    this.axisData = math.multiply(this.dmax, math.identity(this.ndim))._data
    .map((row)=>{
      return [math.zeros(row.length)._data, row];
    })
    .reduce((a, pair)=>{
      return a.concat([pair[0],pair[1]]);
    }, []);

    this.axisColor = _.range(this.ndim*2)
    .map(i=>[1.0,1.0,1.0, 0.5]);//white axis line

    this.color = this.labels.map(i=>[...utils.baseColor[i], this.alpha[i]]);

    this.then = 0;
  }

  set pointSize(s){
    this._pointSize = s;
    glutil.uniform(this.gl, {
      name: 'pointSize',
      type: 'float',
      data: this._pointSize
    });
  }

  get pointSize(){
    return this._pointSize;
  }


  set camera(c){
    this._camera = c;
    glutil.uniform(this.gl, {
      name: 'camera',
      type: 'mat',
      data: this._camera
    });
  }

  get camera(){
    return this._camera;
  }


  set color(c){
    this._color = c;
    if(this.gl){
      glutil.attribute(this.gl, {
        name: 'acolor', 
        type: 'float',
        data: this.color.concat(this.axisColor)
      });
    }
  }

  get color(){
    return this._color;
  }


  set alpha(a){
    this._alpha = a;
    this.color = this.labels.map((l,i)=>[...utils.baseColor[l], this.alpha[i]]);
  }

  get alpha(){
    return this._alpha;
  }


  onResize(){
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
    glutil.clear(this.gl, utils.bgColor);
    this.points = this.gt.project(this.data, dt);
    this.axisPoint = this.gt.project(this.axisData, 0);
    //=================upload data================
    glutil.attribute(this.gl, {
      name: 'position', 
      type: 'float',
      data: this.points.concat(this.axisPoint)
    });
    //=================draw================
    glutil.uniform(this.gl, {
      name: 'isDrawingAxis', 
      type: 'int',
      data: 0
    });
    this.gl.drawArrays(this.gl.POINTS, 0, this.npoint);

    glutil.uniform(this.gl, {
      name: 'isDrawingAxis', 
      type: 'int',
      data: 1
    });
    this.gl.drawArrays(this.gl.LINES , this.npoint, this.ndim*2);
  }

}