import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';
import GrandTourAxisHandleOverlay from './GrandTourAxisHandleOverlay';
import GrandTourBaseController from './GrandTourBaseController';



export default class GrandTourAxisHandleController extends GrandTourBaseController{

  constructor({
    container,dataTensor, labels, gt,
    epoch=dataTensor.length-1, stepsize=0.00005}){
    
    super({container,dataTensor, labels, gt, epoch, stepsize});
    
    this.overlay = new GrandTourAxisHandleOverlay({
      controller: this,
      container: this.container, 
      gt: this.gt,
      camera: this.camera,
      axisLength: this.dmax
    });

  }

  set range(r){
    super.range = r;
    if(this.overlay){
      this.overlay.camera = this.camera;
    }
  }
  

  play(){
    super.play();
    this.overlay.play();
  }


  onOverlayMouseover(d,i,event){
    this.stepsizePrev = this.gt.stepsize;
    this.gt.stepsize /= 10;
  }

  onOverlayMouseout(d,i,event){
    this.gt.stepsize = this.stepsizePrev;
  }

  onOverlayDrag(d,i,[dx,dy]){
    this.view.stop();
    this.gt.matrix[i][0] += dx;
    this.gt.matrix[i][1] += dy;
    this.gt.matrix = utils.orthogonalize(this.gt.matrix, i);
    this.view.render(0);
  }

  onOverlayDragEnd(d,i){
    if(this.isGrandTourPlaying){
      this.view.play();
    }
  }

  
  
}
