import * as d3 from 'd3';

import * as numeric from 'numeric';
import * as math from 'mathjs';
import * as utils from './utils';
import { GrandTour } from './GrandTour';
import * as webgl_utils from './webgl-utils';

const MAX_DIM = 16;

export class GrandTourInTheShaderView {


    constructor(kwargs){
        //canvas: d3 selection
        //position: list of high dim points
        //color: '#'+hex or list of 4-dim numbers 0-255
        //
        for (let k in kwargs){
            this[k] = kwargs[k];
        }

        //default values
        this.t = this.t || 0;
        this.scaleMode = this.scaleMode || 'center';
        this.handleScale = this.handleScale || 1.1;
        //init values
        this.ndim = this.position[0].length
        this.gt = new GrandTour(this.ndim);
        this.sx = d3.scaleLinear();
        this.sy = d3.scaleLinear();
        this.selected = [];

        this.init();
    }


    init(){
        this.initGL();

        let width = this.canvas.node().width / devicePixelRatio;
        let height = this.canvas.node().height / devicePixelRatio;

        this.svg = d3.select(this.canvas.node().parentNode)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0');

        if(this.brush === true){
            this.initBrush();
            this.initCentroid();
        }

        if(this.handle === true){
            this.initHandle();
        }
    }


    initHandle(){
        this.handleMax = math.max(math.abs(this.position)) * this.handleScale;
        this.handleLines = this.svg.selectAll('.axis-line')
        .data(new Array(this.position[0].length).fill(0))
        .enter()
        .append('line')
        .attr('class', 'axis-line')
        .attr('stroke-width', 0.3)
        .attr('stroke', '#aaaaaa')
        .attr('stroke-linecap','round');

        this.handle = this.svg.selectAll('.axis-handle')
        .data(new Array(this.position[0].length).fill(0))
        .enter()
        .append('circle')
        .attr('class', 'axis-handle')
        .attr('r', 10)
        .attr('fill', '#aaaaaa')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .style('opacity', 0.5)
        .style('cursor', 'grab');

        //drag event handler
        let that = this;
        
        let drag = d3.drag()
        .on('drag', function(d, i){
            if(d3.event.dx==0 && d3.event.dy==0){
                return;
            }

            let sx = that.sx;
            let sy = that.sy;
            let matrix = that.gt.matrix;
            let vmax = that.handleMax;

            let dx = sx.invert(d3.event.dx) - sx.invert(0);
            let dy = sy.invert(d3.event.dy) - sy.invert(0);
            

            matrix[i][0] += dx/vmax;
            matrix[i][1] += dy/vmax;
            matrix = utils.orthogonalize(matrix, i);
        });
        this.handle.call(drag);
    }


    updateHandle(){
        //max data vector
        let max = this.handleMax;
        this.handleLines
        .attr('x1', (d,i)=>this.sx(0))
        .attr('x2', (d,i)=>this.sx(this.handleMax * this.gt.matrix[i][0]))
        .attr('y1', (d,i)=>this.sy(0))
        .attr('y2', (d,i)=>this.sy(this.handleMax * this.gt.matrix[i][1]));
        this.handle
        .attr('cx', (d,i)=>this.sx(this.handleMax * this.gt.matrix[i][0]))
        .attr('cy', (d,i)=>this.sy(this.handleMax * this.gt.matrix[i][1]));
    }



    initBrush(){
        
        let that = this;
        this.brush = d3.brush()
        .on('start', function(){
            that.gBrush
            .style('opacity', 1.0)
            // .style('pointer-events', 'auto');
        })
        .on('brush', function(){
            
            let s = d3.event.selection;
            if(s !== null){
                let x0 = that.sx.invert(s[0][0]);
                let x1 = that.sx.invert(s[1][0]);
                let y0 = that.sy.invert(s[0][1]);
                let y1 = that.sy.invert(s[1][1]);
                if(y0 > y1){
                    let tmp = y1;
                    y1 = y0;
                    y0 = tmp;
                }

                let count = 0;
                let centroid = undefined;
                for(let i=0; i<that.points.length; i++){
                    let x = that.points[i][0];
                    let y = that.points[i][1];
                    let c = that.color[i];
                    let selected = (x0 < x && x < x1 && y0 < y && y < y1);
                    that.selected[i] = selected;
                    c[3] = selected ? 255 : 50; //update color

                    //update centroid
                    if(selected){
                        count += 1;
                        if(centroid === undefined){
                            centroid = that.position[i].slice();
                        }else{
                            centroid = numeric.add(centroid, that.position[i]);
                        }
                    }
                }
                if (count > 0){
                    centroid = numeric.div(centroid, count);
                }else{
                    centroid = null;
                }
                that.count = count;
                that.centroid = centroid;
            }
        })
        .on('end', function(){
            that.gBrush.style('opacity', 0.0)
            // .style('pointer-events', 'none');
            if(d3.event.selection === null || that.count == 0){ //brushed cleared
                for(let i=0; i<that.points.length; i++){
                    let c = that.color[i];
                    c[3] = 255;
                }
            }

        });

        this.gBrush = this.svg.append('g')
        .attr('class', 'brush')
        .call(this.brush);
    }

    initCentroid(){
        let that = this;
        let drag = d3.drag().on('drag', function(){

            if(d3.event.dx==0 && d3.event.dy==0){
                return;
            }

            let dx = that.sx.invert(d3.event.dx) - that.sx.invert(0);
            let dy = that.sy.invert(d3.event.dy) - that.sy.invert(0);
            let z = numeric.norm2(that.centroid); //normalizing constant

            // MSE formulation
            // dx = numeric.mul(that.centroid, dx/z);
            // dy = numeric.mul(that.centroid, dy/z);
            // for(let i=0; i<that.gt.matrix.length; i++){
            //     let row = that.gt.matrix[i];
            //     row[0] += dx[i];
            //     row[1] += dy[i];
            // }
            // that.gt.matrix = utils.orthogonalize(that.gt.matrix, 0);
            
            // Rotation formulation
            let p0 = utils.normalize(that.centroid);
            let p1 = that.centroid.slice();
            p1[0] += dx;
            p1[1] += dy;
            p1 = utils.normalize(p1);
            let theta = math.acos(numeric.dot(p0, p1));
            let Q = that.gt.matrix.map((row,i)=>{
                if(i==0){
                    return p0;
                }else if(i==1){
                    return p1;
                }else{
                    return row;
                }
            });
            Q = utils.orthogonalize(Q);
            //$$\Rho = Q^T R_{0,1})theta) Q$$
            let rho = numeric.transpose(Q);
            rho = numeric.dot(rho, that.gt.getRotationMatrix(0,1,theta));
            rho = numeric.dot(rho, Q);
            that.gt.matrix = numeric.dot(that.gt.matrix, rho);


        });

        this.centroidCircle = this.svg.selectAll('.centroid')
        .data([0])
        .enter()
        .append('circle')
        .attr('class', 'centroid')
        .attr('r', 20)
        .attr('fill', '#aaaaaa')
        .attr('stroke', 'yellow')
        .attr('stroke-width', 0.5)
        .style('opacity', 0.5)
        .call(drag);
    }


    updateCentroid(){
        let position = this.position;
        let selected = this.selected;

        if(this.centroid !== null && this.centroid !== undefined){
            let dt = 0;
            let point = this.gt.project(this.centroid, dt);
            this.centroidCircle
            .attr('cx', this.sx(point[0]))
            .attr('cy', this.sy(point[1]));
        }else{
            this.centroidCircle
            .attr('cx', -100)
            .attr('cy', -100);
        }

    }

    initGL(){
        this.webgl = {};
        [this.webgl.gl, this.webgl.program] = webgl_utils.initGL(
            '#' + this.canvas.attr('id'),
            ['./shaders/gt_vertex.glsl', './shaders/fragment.glsl']
        );

        let gl = this.webgl.gl;
        let program = this.webgl.program;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(...utils.CLEAR_COLOR, 1.0);

        // gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFuncSeparate(
          gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
          gl.ONE, gl.ONE_MINUS_SRC_ALPHA
        );

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        this.webgl.colorBuffer = gl.createBuffer();
        this.webgl.colorLoc = gl.getAttribLocation(program, 'a_color');

        this.webgl.positionBuffer = gl.createBuffer();
        this.webgl.positionLoc = gl.getAttribLocation(program, 'a_position');

        this.webgl.pointSizeLoc = gl.getUniformLocation(program, 'point_size');

        this.webgl.canvasWidthLoc = gl.getUniformLocation(program, 'canvasWidth');
        this.webgl.canvasHeightLoc = gl.getUniformLocation(program, 'canvasHeight');

        this.webgl.xDataMinLoc = gl.getUniformLocation(program, 'xDataMin');
        this.webgl.xDataMaxLoc = gl.getUniformLocation(program, 'xDataMax');
        this.webgl.yDataMinLoc = gl.getUniformLocation(program, 'yDataMin');
        this.webgl.yDataMaxLoc = gl.getUniformLocation(program, 'yDataMax');
        this.webgl.zDataMinLoc = gl.getUniformLocation(program, 'zDataMin');
        this.webgl.zDataMaxLoc = gl.getUniformLocation(program, 'zDataMax');

        this.webgl.pointSizeLoc = gl.getUniformLocation(program, 'point_size');
        this.webgl.modeLoc = gl.getUniformLocation(program, 'mode');

        this.webgl.grandTourMatrixLocs = d3.range(Math.ceil(MAX_DIM/4))
        .map(i=>{
            return gl.getUniformLocation(program, `gt_matrix[${i}]`);
        });

        this.webgl.positionLocs = d3.range(Math.ceil(MAX_DIM/4))
        .map(i=>{
            return gl.getUniformLocation(program, `position[${i}]`);
        });


        this.setPointSize(this.pointSize || 6.0);
        this.setScale(-1,1, -1,1);
    }

    setScale(xmin, xmax, ymin, ymax){
        let gl = this.webgl.gl;
        let xDataMinLoc = this.webgl.xDataMinLoc;
        let xDataMaxLoc = this.webgl.xDataMaxLoc;
        let yDataMinLoc = this.webgl.yDataMinLoc;
        let yDataMaxLoc = this.webgl.yDataMaxLoc;

        gl.uniform1f(xDataMinLoc, xmin);
        gl.uniform1f(xDataMaxLoc, xmax);
        gl.uniform1f(yDataMinLoc, ymin);
        gl.uniform1f(yDataMaxLoc, ymax);

        this.sx
        .domain([xmin, xmax])
        .range([0, this.canvas.attr('width')/devicePixelRatio]);
        this.sy
        .domain([ymin, ymax])
        .range([this.canvas.attr('height')/devicePixelRatio, 0]);

    }

    setPointSize(s){
        let gl = this.webgl.gl;
        let pointSizeLoc = this.webgl.pointSizeLoc;
        gl.uniform1f(pointSizeLoc, s * devicePixelRatio);
    }


    updateScale(points){
        let gl = this.webgl.gl;
        if (this.scaleMode === 'span'){
            this.xmin = d3.min(points, d=>d[0]);
            this.xmax = d3.max(points, d=>d[0]);
            this.ymin = d3.min(points, d=>d[1]);
            this.ymax = d3.max(points, d=>d[1]);
        }else if(this.scaleMode === 'center'){
            if (this.isWindowResized===undefined || this.isWindowResized){
                this.xmin = d3.min(points, d=>d[0]);
                this.xmax = d3.max(points, d=>d[0]);
                this.ymin = d3.min(points, d=>d[1]);
                this.ymax = d3.max(points, d=>d[1]);
                this.isWindowResized = false;
            }else{
                this.xmin = Math.min(this.xmin, d3.min(points, d=>d[0]));
            this.xmax = Math.max(this.xmax, d3.max(points, d=>d[0]));
            this.ymin = Math.min(this.ymin, d3.min(points, d=>d[1]));
            this.ymax = Math.max(this.ymax, d3.max(points, d=>d[1]));
            }
        }

        if(this.scaleMode == 'center' && this.handleMax !== undefined){
            this.xmax = Math.max(this.xmax, this.handleMax);
            this.ymax = Math.max(this.ymax, this.handleMax);
        }

        let xrange = this.xmax-this.xmin;
        let yrange = this.ymax-this.ymin;

        if(this.scaleMode == 'span'){
            if (gl.canvas.width/gl.canvas.height > xrange/yrange){
                let xmiddle = (this.xmin + this.xmax)/2;
                this.xmin = xmiddle - yrange/2/gl.canvas.height*gl.canvas.width;
                this.xmax = xmiddle + yrange/2/gl.canvas.height*gl.canvas.width;
            }else{
                let ymiddle = (this.ymin + this.ymax)/2;
                this.ymin = ymiddle - xrange/2/gl.canvas.width*gl.canvas.height;
                this.ymax = ymiddle + xrange/2/gl.canvas.width*gl.canvas.height;
            }
        }else if(this.scaleMode == 'center'){
            let xmax = Math.max(Math.abs(this.xmin), Math.abs(this.xmax));
            let ymax = Math.max(Math.abs(this.ymin), Math.abs(this.ymax));
            if(gl.canvas.width/gl.canvas.height > xrange/yrange){
                xmax = ymax / gl.canvas.height*gl.canvas.width;
            }else{
                ymax = xmax / gl.canvas.width*gl.canvas.height;
            }
            this.xmin = -xmax;
            this.xmax = xmax;
            this.ymin = -ymax;
            this.ymax = ymax;
        }
        this.setScale(this.xmin, this.xmax, this.ymin, this.ymax);
    }


    normalizeDepth(points){
        let gl = this.webgl.gl;
        let zDataMinLoc = this.webgl.zDataMinLoc;
        let zDataMaxLoc = this.webgl.zDataMaxLoc;

        let zmin = d3.min(points, d=>d[2]);
        let zmax = d3.max(points, d=>d[2]);
        let zrange = zmax-zmin;
        gl.uniform1f(zDataMinLoc, zmin);
        gl.uniform1f(zDataMaxLoc, zmax);
    }


    

    plot(dt){

        let gl = this.webgl.gl;
        let positionBuffer = this.webgl.positionBuffer;
        let positionLoc = this.webgl.positionLoc;
        let colorBuffer = this.webgl.colorBuffer;
        let colorLoc = this.webgl.colorLoc;
        let grandTourMatrixLocs = this.webgl.grandTourMatrixLocs;
        let positionLocs = this.webgl.positionLocs;

        gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(...utils.CLEAR_COLOR, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //point location
        let points = this.position.map(d=>[d[0], d[1], d[2]]);
        this.gt.step(dt);
        for(let i=0; i<Math.ceil(this.ndim/4)-1; i++){//TODO remove the -1, how to send matrix partially
            let matrix_i = this.gt.matrix.slice(i*4,i*4+4).map(row=>row.slice(0,4));
            gl.uniformMatrix4fv(grandTourMatrixLocs[i], false, Float32Array.from(matrix_i.flat()));
        }

        for(let i=0; i<Math.ceil(this.ndim/4)-1; i++){//TODO remove the -1, how to send matrix partially
            let position_i = this.position.slice(i*4,i*4+4);
            gl.uniform4fv(positionLocs[i], Float32Array.from(position_i));
        }




        // let points = this.gt.project(this.position, dt);
        this.points = points;

        this.updateScale(points);
        this.normalizeDepth(points);
        if(this.handle !== undefined && this.handle !== false){
            this.updateHandle(this.position);
        }
        if(this.brush !== undefined && this.brush !== false){
            this.updateCentroid(this.position);
        }
        
        
        // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, utils.flatten(points), gl.STATIC_DRAW);
        // gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(positionLoc);

        let colors;
        if (Array.isArray(this.color)){
            colors = this.color;
        }else{ //hex string
            let color = [...utils.hexToRgb(this.color), 255];
            colors = d3.range(points.length).map(d=>color);
            this.color = colors;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
                      new Uint8Array(utils.flatten(colors)), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.enableVertexAttribArray(colorLoc);


        this.setMode('point');
        gl.drawArrays(gl.POINTS, 0, points.length);

        if(this.shouldDrawLines){
            this.setMode('line');
            gl.drawArrays(gl.LINES, 0, points.length);
        }
    }

    setMode(m){
        let gl = this.webgl.gl;
        let modeLoc = this.webgl.modeLoc;
        if(m == 'point'){
            gl.uniform1i(modeLoc, 0);
        }else if(m == 'line'){
            gl.uniform1i(modeLoc, 1);
        }
    }


    play(t=0){
        let dt = t - this.t;
        this.t = t;
        this.plot(dt);
        requestAnimationFrame(this.play.bind(this));
    }
}




