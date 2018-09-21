import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';
import GrandTourBasicView from './GrandTourBasicView';
import GrandTourBaseController from './GrandTourBaseController';

import GrandTourBrushOverlay from './GrandTourBrushOverlay';



export default class GrandTourBrushController extends GrandTourBaseController{

  constructor({
    container,dataTensor, labels, gt,
    epoch=dataTensor.length-1, stepsize=0.00005}){
    
    super({container,dataTensor, labels, gt, epoch, stepsize});
    
    this.overlay = new GrandTourBrushOverlay({
      controller: this,
      container: this.container, 
      gt: this.gt,
      camera: this.camera,
      axisLength: this.dmax
    });
  }


  onBrush(sel){
    this.overlay.showBrush();

    if(this.brushAnimationId){
      cancelAnimationFrame(this.brushAnimationId);
      this.brushAnimationId = null;
    }

    this.gt.stepsize = this.stepsize0 * 0.1;

    this.points = numeric.dot(
      this.view.points.map(p=>[...p, 1.0]), 
      numeric.transpose(this.camera.slice(0,2))
    );

    this.brushSelected = this.points.map((p)=>{
      if(sel.x0<=p[0] && p[0]<=sel.x1
        && sel.y0<=p[1] && p[1]<=sel.y1
        ){
        return true;
      }else{
        return false;
      }
    });

    this.view.alpha = this.brushSelected.map((i)=>i==true?1.0:0.1);
    
    if(!this.isGrandTourPlaying){
      this.view.render();
    }
  }


  onBrushEnd(event){
    this.gt.stepsize = this.stepsize0;
    if(event.selection == null){
      this.view.alpha = Array.from(Array(this.npoint), ()=>1.0);
      if(!this.isGrandTourPlaying){
        this.view.render();
      }
      this.stopUpdateBox();
    }else{
      this.overlay.hideBrush();
      this.updateBox();
    }
  }

  play(){
    super.play();
    this.overlay.play();
  }

  updateBox(){
    this.points = numeric.dot(
      this.view.points.map(p=>[...p, 1.0]), 
      numeric.transpose(this.camera.slice(0,2))
    );

    let x0 = null;
    let x1 = null;
    let y0 = null;
    let y1 = null;

    for(let i=0; i<this.npoint; i++){
      if(this.brushSelected[i]){
        if(x0===null){
          x0 = this.points[i][0];
          x1 = this.points[i][0];
          y0 = this.points[i][1];
          y1 = this.points[i][1];
        }else{
          x0 = Math.min(this.points[i][0], x0);
          x1 = Math.max(this.points[i][0], x1);
          y0 = Math.min(this.points[i][1], y0);
          y1 = Math.max(this.points[i][1], y1);
        }
      }
    }
    this.overlay.showBoxAt({x0,x1,y0,y1});
    this.brushAnimationId = requestAnimationFrame(this.updateBox.bind(this));
  }

  stopUpdateBox(){
    if(this.brushAnimationId){
        cancelAnimationFrame(this.brushAnimationId);
        this.brushAnimationId = null;
      }
      this.overlay.removeBox();
  }

  stop(){
    this.view.stop();
    this.stopUpdateBox();
  }


  
  
}
