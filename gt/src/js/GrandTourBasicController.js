import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';



export default class GrandTourBasicController{

  constructor({dataTensor, labels, container,
    epoch=dataTensor.length-1, stepsize=0.00005}){

    this.dataTensor = dataTensor;
    this.container = container;
    this.epoch = epoch;
    this.nepoch = dataTensor.length;
    this.npoint = dataTensor[0].length;
    this.ndim = dataTensor[0][0].length;

    this.dmax = math.max(dataTensor);
    this.gt = new GrandTour({ndim: this.ndim, stepsize: 0.00005});
    if(labels === undefined){
      this.labels=_.range(dataTensor[0].length)
    }else{
      this.labels = labels;
    }

    let xRange, yRange;
    if(this.container.width > this.container.height){
      yRange = 1.1*this.dmax;
      xRange = yRange * this.container.width / this.container.height;
    }else{
      xRange = 1.1*this.dmax;
      yRange = xRange * this.container.height / this.container.width;
    }
    this.camera = glmatrix.mat4.create();
    glmatrix.mat4.ortho(this.camera, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
    this.camera = math.reshape(Array.from(this.camera), [4,4]);

    this.gtv = new GrandTourBasicView({
      container: this.container,
      data: this.dataTensor[this.epoch], 
      labels: this.labels,
      gt: this.gt,
      camera: this.camera,
      dpr: window.devicePixelRatio,
    });

    window.onkeypress = (event)=>{
      if(event.key == 'n' || event.key == 'p'){
        if(event.key == 'n'){
          this.epoch += 1;
        }else if(event.key == 'p'){
          this.epoch -= 1;
        }
      }
    }
  }


  set epoch(e){
    if(e >= this.nepoch){
      this._epoch = 0;
    }else if(e < 0){
      this._epoch = this.nepoch-1;
    }else{
      this._epoch = e;
    }
    if(this.gtv){
      this.gtv.data = this.dataTensor[this._epoch];
    }
  }

  get epoch(){
    return this._epoch;
  }
  

  play(){
    this.gtv.play();
  }

  stop(){
    this.gtv.stop();
  }


  
  
}
