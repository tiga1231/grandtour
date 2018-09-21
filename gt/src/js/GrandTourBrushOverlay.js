import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import glutil from './glutil';
import utils from './utils';



export default class GrandTourBrushOverlay{
  constructor({
    container, gt, camera, controller, axisLength=10
  }){
    this.controller = controller;
    this.container = container;
    this.camera = camera; //a 4x4 matrix
    this.gt = gt;

    this.initSvg();
  }

  initSvg(){
    this.svg = d3.select(this.container)
    .insert('svg', ':first-child')
    .attr('width', this.container.width)
    .attr('height', this.container.height)
    .attr('class', 'overlay brush-overlay');
    this.sx = d3.scaleLinear().domain([-1,1]).range([0, this.container.width]);
    this.sy = d3.scaleLinear().domain([-1,1]).range([this.container.height, 0]);
    
    this.brush = d3.brush()
    .on('brush', ()=>{
      if(d3.event.selection){
        let [x0, y0] = d3.event.selection[0];
        let [x1, y1] = d3.event.selection[1];
        x0 = this.sx.invert(x0);
        x1 = this.sx.invert(x1);
        y0 = this.sy.invert(y0);
        y1 = this.sy.invert(y1);
        [x0,x1] = [Math.min(x0,x1), Math.max(x0,x1)];
        [y0,y1] = [Math.min(y0,y1), Math.max(y0,y1)];
        this.controller.onBrush({x0,x1,y0,y1});
      }
    })
    .on('end', ()=>{
      this.controller.onBrushEnd(d3.event);
    })

    this.svg.append('g')
    .attr('class', 'brush')
    .call(this.brush);
  }

  // hideBrush0(){
  //   this.svg.selectAll('.brush')
  //   .selectAll('rect.handle, rect.selection')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('width', 0)
  //   .attr('height', 0);
  // }

  hideBrush(){
    this.svg.select('.brush')
    .selectAll('rect.handle, rect.selection')
    .attr('display', 'none');
    // .call(this.brush.move, [[0,0],[0,0]]);
  }

  showBrush(){
    this.svg.select('.brush')
    .selectAll('rect.handle, rect.selection')
    .attr('display', '');
  }


  showBoxAt(box){
    if(this.box === undefined){
      this.box = this.svg.selectAll('.brush')
      .selectAll('.selectBox')
      .data([0])
      .enter()
      .append('rect')
      .attr('class', 'selectBox')
      .attr('fill', '#777')
      .attr('fill-opacity', 0.3)
      .attr('stroke', 'orange');
    }
    this.box 
    .attr('x', Math.min(this.sx(box.x0), this.sx(box.x1)) )
    .attr('y', Math.min(this.sy(box.y0), this.sy(box.y1)) )
    .attr('width', Math.abs(this.sx(box.x0)-this.sx(box.x1)))
    .attr('height', Math.abs(this.sy(box.y0)-this.sy(box.y1)));
  }

  removeBox(){
    this.box 
    .attr('width', 0)
    .attr('height', 0);
  }


  play(){
    this.animationId = requestAnimationFrame(this.play.bind(this));
  }

  stop(){
    cancelAnimationFrame(this.animationId);
  }
}
