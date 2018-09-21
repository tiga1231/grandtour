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
    .on('start', ()=>{
      this.controller.onBrushStart();
    })
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

    this.box = this.svg.selectAll('.brush')
    .selectAll('.selectBox')
    .data([0])
    .enter()
    .append('rect')
    .attr('class', 'selectBox')
    .attr('fill', '#777')
    .attr('fill-opacity', 0.1)
    .attr('stroke', 'orange')
    .call(
      d3.drag()
      .on('start', ()=>{
        this.controller.onBoxDragStart(d3.event);
      })
      .on('drag', ()=>{
        let [dx,dy] = [d3.event.dx, d3.event.dy];
        dx = this.sx.invert(dx)-this.sx.invert(0);
        dy = this.sy.invert(dy)-this.sy.invert(0);
        this.controller.onBoxDrag({dx,dy});
      })
      .on('end', ()=>{
        this.controller.onBoxDragEnd(d3.event);
      })
    );

  }


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
    this.showBox();
    this.box 
    .attr('x', Math.min(this.sx(box.x0), this.sx(box.x1))-10 )
    .attr('y', Math.min(this.sy(box.y0), this.sy(box.y1))-10 )
    .attr('width', Math.abs(this.sx(box.x0)-this.sx(box.x1))+20 )
    .attr('height', Math.abs(this.sy(box.y0)-this.sy(box.y1))+20 );
    // if(+this.box.attr('width') < 20){
    //   this.box
    //   .attr('x', this.box.attr('x')-10)
    //   .attr('width', this.box.attr('width')+20);
    // }
    // if(+this.box.attr('height') < 20){
    //   this.box
    //   .attr('y', this.box.attr('y')-10)
    //   .attr('height', this.box.attr('height')+20);
    // }

  }

  hideBox(){
    this.box 
    .attr('display', 'none');
  }

  showBox(){
    this.box 
    .attr('display', '');
  }


  play(){
    this.animationId = requestAnimationFrame(this.play.bind(this));
  }

  stop(){
    cancelAnimationFrame(this.animationId);
  }
}
