import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
// import * as glutil from 'gl-util';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import glutil from './glutil';
import utils from './utils';



export default class GrandTourAxisHandleOverlay{
  constructor({
    container, 
    gt,
    camera,
    controller,
    axisLength=10
  }){
    this.controller = controller;
    this.container = container;
    this.svg = d3.select(this.container)
    .insert('svg', ':first-child')
    .attr('width', this.container.width)
    .attr('height', this.container.height)
    .attr('class', 'overlay');
    this.camera = camera; //a 4x4 matrix
    this.gt = gt;

    this.sx = d3.scaleLinear().domain([-1,1]).range([0, this.container.width]);
    this.sy = d3.scaleLinear().domain([-1,1]).range([this.container.height, 0]);

    this.axisData = math.multiply(math.identity(this.gt.ndim), axisLength)._data;
    this.handles;

    this.drag = d3.drag()
    .on('drag', (d, i)=>{
      // console.log(d, i, d3.event);
      let dx = this.sx.invert(d3.event.dx) - this.sx.invert(0);
      let dy = this.sy.invert(d3.event.dy) - this.sy.invert(0);
      this.controller.onOverlayDrag(d, i, [dx, dy]);
    })
    .on('end', (d,i)=>{
      this.controller.onOverlayDragEnd(d, i);
    })
  }


  drawHandles(){
    //update
    this.handles = this.svg.selectAll('.handle')
    .data(this.gt.project(this.axisData, 0));

    this.handles = this.handles
    .enter()
    .append('circle')
    .attr('class', 'handle')
    .attr('stroke', 'black')
    .attr('opacity', 0.1)
    .attr('r', Math.min(this.container.width,this.container.height)/50)
    .merge(this.handles)
    .attr('fill', (_,i)=>{return d3.rgb(...utils.baseColor[i%utils.baseColor.length].map(d=>d*255))})
    .attr('cx', (d)=>{return this.sx(numeric.dot(this.camera[0], [...d, 1.0]))})
    .attr('cy', (d)=>{return this.sy(numeric.dot(this.camera[1], [...d, 1.0]))})
    .on('mouseover', (d,i)=>{
      this.controller.onOverlayMouseover(d, i, d3.event);
    })
    .on('mouseout', (d,i)=>{
      this.controller.onOverlayMouseout(d, i, d3.event);
    })
    .call(this.drag);
  }

  play(){
    this.drawHandles();
    this.animationId = requestAnimationFrame(this.play.bind(this));
  }

  stop(){
    cancelAnimationFrame(this.animationId);
  }
}
