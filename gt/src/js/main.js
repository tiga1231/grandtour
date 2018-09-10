import style from "../css/style.css";

import math from 'mathjs';
import numeric from 'numeric';
import * as d3 from 'd3';
// import * as glutil from 'gl-util';
import * as _ from 'underscore';
import * as glmatrix from 'gl-matrix';

import utils from './utils';
import glutil from './glutil';
import GrandTour from './GrandTour';

const vshader = require('../glsl/gt_vertex.glsl');
const fshader = require('../glsl/gt_fragment.glsl');
const dataTensorBuffer = require('../../data/conv2_pca_100_1000_10.bin');
const labelsBuffer = require('../../data/labels.bin');

window.onload = function(){
	let dpr = window.devicePixelRatio;
	
	let canvas = d3.select('div#root')
	.append('canvas')
	.node();

	let gl = glutil.context({
		canvas: canvas,
		width: window.innerWidth,
		height: window.innerHeight,
		dpr: dpr,
		contextAttributes: {
			antialias: true,
			depth: true
		}
	});
	let program = glutil.program(gl, vshader, fshader);
	
	let labels = Array.from(new Uint8Array(labelsBuffer));
	let shape = [100,1000,10];
	let dataTensor = math.reshape(Array.from(new Float32Array(dataTensorBuffer)), shape);
	let data = dataTensor[99];
	let dmax = math.max(data);

	let gt = new GrandTour({ndim: data[0].length, stepsize: 0.00005});

	let ortho = glmatrix.mat4.create();
	let ratio = canvas.width / canvas.height;
	let yRange = dmax*1.5;
	let xRange = yRange * ratio;
	glmatrix.mat4.ortho(ortho, 
		-xRange, xRange, 
		-yRange,yRange,
	-100, 100);
	ortho = math.reshape(Array.from(ortho), [4,4]);
	
	glutil.uniform(gl, {
		name: 'camera',
		type: 'mat',
		data: ortho
	});

	glutil.uniform(gl, {
		name: 'dpr',
		type: 'float',
		data: dpr
	});



	let color = labels.map(i=>utils.baseColor[i]);
	glutil.attribute(gl, {
		name: 'acolor', 
		data: color
	});

	let axisData = math.multiply(dmax, math.identity(data[0].length))._data
	.map((row)=>{
		return [math.zeros(row.length)._data, row];
	})
	.reduce((a, pair)=>{
		return a.concat([pair[0],pair[1]]);
	}, []);

	let axisColor = _.range(data[0].length*2)
	// .map(i=>utils.baseColor[Math.floor(i/2)]);
	.map(i=>[1.0,1.0,1.0]);


	let then = 0;
	function render(now){
		let dt = now - then;
		then = now;
		glutil.clear(gl, [0.1,0.1,0.1,1.0]);
		
		//=================upload data================
		glutil.attribute(gl, {
			name: 'position', 
			data: gt.project(data.concat(axisData), dt)
		});
		glutil.attribute(gl, {
			name: 'acolor', 
			data: color.slice(0,data.length).concat(axisColor)
		});

		//=================draw================
		glutil.uniform(gl, {
			name: 'isDrawingAxis', 
			data: 0
		});
		gl.drawArrays(gl.POINTS, 0, data.length);


		glutil.uniform(gl, {
			name: 'isDrawingAxis', 
			data: 1
		});
		gl.drawArrays(gl.LINES, data.length, data[0].length*2);


	


		requestAnimationFrame(render);
	}
	render(0);

	window.glmatrix = glmatrix;
	window.utils = utils;
	window.program = program;
	window.glutil = glutil;
	window.gl = gl;
	window._ = _;
	window.data = data;
	window.gt = gt;
	window.d3 = d3;
	window.math = math;
};



	


