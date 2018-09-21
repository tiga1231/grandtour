import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';



export default class GrandTourBaseController{

  constructor({
    container, dataTensor, labels, gt,
    epoch=dataTensor.length-1, stepsize=0.00005}){

    this.dataTensor = dataTensor;
    this.container = container;
    this.epoch = epoch;
    this.nepoch = dataTensor.length;
    this.npoint = dataTensor[0].length;
    this.ndim = dataTensor[0][0].length;
    this.stepsize0 = stepsize;

    this.dmax = math.max(dataTensor);
    if(gt === undefined){
      this.gt = new GrandTour({ndim: this.ndim, stepsize: this.stepsize0});
    }else{
      this.gt = gt;
    }
    if(labels === undefined){
      this.labels=_.range(dataTensor[0].length)
    }else{
      this.labels = labels;
    }

    this.range = 1.1*this.dmax;

    this.view = new GrandTourBasicView({
      container: this.container,
      data: this.dataTensor[this.epoch], 
      labels: this.labels,
      gt: this.gt,
      camera: this.camera,
      dpr: window.devicePixelRatio,
      dmax: this.dmax
    });

    //interactions
    window.addEventListener('keypress', (event)=>{
      if(event.key == 'n' || event.key == 'p'){
        if(event.key == 'n'){
          this.epoch += 1;
        }else if(event.key == 'p'){
          this.epoch -= 1;
        }

      }else if(event.key == ' '){
        this.isGrandTourPlaying = !this.isGrandTourPlaying;
        if(this.isGrandTourPlaying){
          this.play();
        }else{
          this.stop();
        }

      }else if(event.key == 'f' || event.key == 's'){
        if(event.key == 'f'){
          this.faster();
        }else{
          this.slower();
        }
      }
    });


  }

  set range(r){
    this._range = r;

    let xRange, yRange;
    if(this.container.width > this.container.height){
      yRange = this._range;
      xRange = yRange * this.container.width / this.container.height;
    }else{
      xRange = this._range;
      yRange = xRange * this.container.height / this.container.width;
    }
    this.camera = glmatrix.mat4.create();
    glmatrix.mat4.ortho(this.camera, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
    this.camera = math.reshape(Array.from(this.camera), [4,4]);

    if(this.view){
      this.view.camera = this.camera;
    }
  }
  
  get range(){
    return this._range;
  }

  set epoch(e){
    if(e >= this.nepoch){
      this._epoch = 0;
    }else if(e < 0){
      this._epoch = this.nepoch-1;
    }else{
      this._epoch = e;
    }
    if(this.view){
      this.view.data = this.dataTensor[this._epoch];
      if(!this.isGrandTourPlaying){
        this.view.render();
      }
    }
  }

  get epoch(){
    return this._epoch;
  }

  play(){
    this.view.play();
    this.isGrandTourPlaying = true;
  }

  stop(){
    this.view.stop();
    this.isGrandTourPlaying = false;
  }

  faster(){
    this.stepsize0 *= 2;
    this.gt.stepsize = this.stepsize0;
  }

  slower(){
    this.stepsize0 /= 3;
    this.gt.stepsize = this.stepsize0;
  }

  
  
}
