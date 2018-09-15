import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';
import GrandTourBasicOverlay from './GrandTourBasicOverlay';



export default class GrandTourBasicController{

  constructor({
    dataTensor, labels, container,
    gt,
    epoch=dataTensor.length-1, stepsize=0.00005}){

    this.dataTensor = dataTensor;
    this.container = container;
    this.epoch = epoch;
    this.nepoch = dataTensor.length;
    this.npoint = dataTensor[0].length;
    this.ndim = dataTensor[0][0].length;

    this.dmax = math.max(dataTensor);
    if(gt === undefined){
      this.gt = new GrandTour({ndim: this.ndim, stepsize: stepsize});
    }else{
      this.gt = gt;
    }
    if(labels === undefined){
      this.labels=_.range(dataTensor[0].length)
    }else{
      this.labels = labels;
    }

    // let xRange, yRange;
    // if(this.container.width > this.container.height){
    //   yRange = 1.1*this.dmax;
    //   xRange = yRange * this.container.width / this.container.height;
    // }else{
    //   xRange = 1.1*this.dmax;
    //   yRange = xRange * this.container.height / this.container.width;
    // }
    
    // this.camera = glmatrix.mat4.create();
    // glmatrix.mat4.ortho(this.camera, -xRange, xRange, -yRange, yRange, -1000*yRange, 1000*yRange);
    // this.camera = math.reshape(Array.from(this.camera), [4,4]);

    this.range = 1.1*this.dmax;

    this.gtv = new GrandTourBasicView({
      container: this.container,
      data: this.dataTensor[this.epoch], 
      labels: this.labels,
      gt: this.gt,
      camera: this.camera,
      dpr: window.devicePixelRatio,
      dmax: this.dmax
    });

    this.overlay = new GrandTourBasicOverlay({
      controller: this,
      container: this.container, 
      gt: this.gt,
      camera: this.camera,
      axisLength: this.dmax
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

    if(this.gtv){
      this.gtv.camera = this.camera;
    }
    if(this.overlay){
      this.overlay.camera = this.camera;
    }
    // this.overlay.axisLength = this._range;

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
    if(this.gtv){
      this.gtv.data = this.dataTensor[this._epoch];
    }
  }

  get epoch(){
    return this._epoch;
  }
  

  play(){
    this.gtv.play();
    this.overlay.play();
    this.isGrandTourPlaying = true;
  }

  stop(){
    this.gtv.stop();
    this.isGrandTourPlaying = false;
  }

  faster(){
    this.gt.stepsize *= 2;
  }

  slower(){
    this.gt.stepsize /= 3;
  }


  onOverlayMouseover(d,i,event){
    this.stepsizePrev = this.gt.stepsize;
    this.gt.stepsize /= 10;
  }

  onOverlayMouseout(d,i,event){
    this.gt.stepsize = this.stepsizePrev;
  }

  onOverlayDrag(d,i,[dx,dy]){
    this.gtv.stop();
    this.gt.matrix[i][0] += dx;
    this.gt.matrix[i][1] += dy;
    this.gt.matrix = utils.orthogonalize(this.gt.matrix, i);
    this.gtv.render(0);
  }

  onOverlayDragEnd(d,i){
    if(this.isGrandTourPlaying){
      this.gtv.play();
    }
  }

  
  
}
