import style from "../css/style.css";

import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
import * as glutil from 'gl-util';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import GrandTour from './GrandTour';

const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');

window.onload = function(){
	let dpr = window.devicePixelRatio;
	
	let canvas = d3.select('div#root')
	.append('canvas')
	.attr('id', 'gt1')
	.attr('width', window.innerWidth * dpr)
	.attr('height', window.innerHeight * dpr)
	.style('width', window.innerWidth+'px')
	.style('height', window.innerHeight+'px');
	canvas = canvas.node();
	let ratio = canvas.width / canvas.height;
	console.log(ratio);

	let gl = glutil.context({
		canvas: canvas,
		antialias: true
	});
	let program = glutil.program(gl, vshader, fshader);

	let data = numeric.random([1000,5]);
	data = numeric.mul(data, 2);
	data = numeric.sub(data, 1);
	data = data.filter((v)=>numeric.norm2(v)<1);
	let gt = new GrandTour({ndim: data[0].length, stepsize: 0.00005});

	let ortho = glmatrix.mat4.create();
	glmatrix.mat4.ortho(ortho, -2*ratio, 2*ratio,-2,2,-2,2);
	
	gl.uniformMatrix4fv(
		gl.getUniformLocation(program, 'camera'), 
		false, ortho);

	glutil.uniform(gl, 'dpr', dpr);

	let color = numeric.random([1000,3]);
	let then = 0;
	function render(now){
		let dt = now - then;
		then = now;
		gl.clear(gl.DEPTH_BUFFER_BIT);
		glutil.attribute(gl, 'position', _.flatten(gt.project(data, dt)));
		glutil.attribute(gl, 'acolor', _.flatten(color));

		gl.drawArrays(gl.POINTS, 0, data.length);
		requestAnimationFrame(render);
	}
	render(0);

	window.glutil = glutil;
	window.gl = gl;
	window._ = _;
	window.data = data;
	window.gt = gt;
	window.d3 = d3;
	window.math = math;
};



	


