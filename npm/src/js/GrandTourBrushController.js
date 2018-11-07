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

  onBrushStart(){
    this.stopUpdateBox();
    this.isAnyPointSelected = false;
    this.gt.stepsize = this.stepsize0 * 0.1;
  }

  onBrush(sel){
    this.overlay.showBrush();
    this.points = numeric.dot(
      this.view.points.map(p=>[...p, 1.0]), 
      numeric.transpose(this.camera.slice(0,2))
    );


    this.brushSelected = this.points.map((p)=>{
      if(sel.x0<=p[0] && p[0]<=sel.x1
        && sel.y0<=p[1] && p[1]<=sel.y1){
        this.isAnyPointSelected = true;
        return true;
      }else{
        return false;
      }
    });
    this.view.alpha = this.brushSelected.map((i)=>i==true?1.0:0.05);
    
    if(!this.isGrandTourPlaying){
      this.view.render();
    }
  }

  onBrushEnd(event){
    this.gt.stepsize = this.stepsize0;
    if(event.selection == null || !this.isAnyPointSelected){
      this.view.alpha = Array.from(Array(this.npoint), ()=>1.0);
      if(!this.isGrandTourPlaying){
        this.view.render();
      }
      this.stopUpdateBox();
      this.overlay.hideBox();
    }else{
      this.updateBox();
    }
    this.overlay.hideBrush();

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
  }


  onBoxDragStart(event){
    //average point as ref
    let dataSelected = this.view.data.filter((p,i)=>{
      return this.brushSelected[i];
    });
    this.ref = dataSelected.reduce(
      (a,b)=>{
        return a.map((c,i)=>c+b[i]/dataSelected.length);
      },
      Array.from(Array(dataSelected[0].length), ()=>0)
    ); 

    this.argmax = -1;
    this.vmax = 0;
    for(let i=0; i<this.ref.length; i++){
      if(Math.abs(this.ref[i])>=this.vmax){
        this.vmax = Math.abs(this.ref[i]);
        this.argmax = i;
      }
    }

  }

  onBoxDrag(event){
    let dx = event.dx;
    let dy = event.dy;
  
    this.gt.matrix[this.argmax][0] += dx*this.dmax/this.ref[this.argmax];
    this.gt.matrix[this.argmax][1] += dy*this.dmax/this.ref[this.argmax];
    this.gt.matrix = utils.orthogonalize(this.gt.matrix, this.argmax);
    // this.view.alpha = this.brushSelected.map((i)=>i==true?1.0:0.1);

    if(!this.isGrandTourPlaying){
      this.view.render();
    }


  }

  onBoxDragEnd(event){
    // this.stopUpdateBox();
    // this.overlay.hideBox();
    // this.view.alpha = Array.from(Array(this.npoint), ()=>1.0);
    // if(!this.isGrandTourPlaying){
    //   this.view.render();
    // }
  }

  play(){
    super.play();
    this.overlay.play();
  }
  stop(){
    this.view.stop();
    this.stopUpdateBox();
  }


  
  
}
