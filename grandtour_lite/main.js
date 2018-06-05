"use strict";

var canvas;
var gl;

var baseColors;

var theta, thetaLoc;
var ctm;
var rotateAngles;
var modelViewMatrixLoc;

var data, labels;
var points, colors;
var dmax;
var t = 0;

// var layer = 'fc3';
// var modelid = 1;
// var epoch = 1;
// var fn = constructFileName(modelid, layer, epoch);

var fn = 'mc1.csv';
var fn_labels = './labels.csv';
var shouldAnimate = true;

function constructFileName(modelid, layer, epoch){
    fn = 'fc3/net'+modelid+'_fc3.csv';
    return fn;
}


function preprocess(row){

    //// take element-wise exponential
    // row = row.map(d=>Math.exp(+d));
    // return row;

    //// take softmax of a row
    // row = row.map(d=>Math.exp(+d));
    // var sum = numeric.sum(row);
    // row = row.map(d=>d/sum);
    // return row;

    //// identity map
    return row.map(d=>+d);
}


window.onkeypress = function(){
    if(event.key == ' '){
        pauseOrPlay();
    }else if(event.key == 'l'){
        var legend = document.getElementById('legend');
        legend.style.display = legend.style.display=='none'? '':'none';
    }
}




function pauseOrPlay(){
    var bAnimationControl = document.getElementById('bAnimationControl');
    shouldAnimate = !shouldAnimate;
    if(shouldAnimate){
        bAnimationControl.innerText = 'Pause';
    }else{
        bAnimationControl.innerText = 'Play';
    }
}


function loadData(fn, shouldUpdateDmax=false){
    d3.text(fn)
    .then(function(data_text){
        data = d3.dsvFormat(',').parseRows(data_text);
        var ndim = data[0].length;
        if(preprocess !== null){
            data = data.map(row => preprocess(row));
        }
        data = data.concat(createAxisPoints(ndim));

        gt.setNdim(data[0].length);
        if(shouldUpdateDmax){
            updateDmax();
        }
    });
}

function updateDmax(){
    dmax = 1.414*math.max(math.abs(data));
}



function createAxisPoints(ndim){
    var res = math.eye(ndim)._data;
    for(var i=ndim-1; i>=0; i--){
        res.splice(i, 0, math.zeros(ndim)._data);
    }
    return res;
}


function createAxisColors(ndim){
    var res = d3.range(ndim*2).map((d,i)=>baseColors[Math.floor(i/2) % baseColors.length]);
    return res;
}


window.onload = function main(){

    baseColors = [
        [166,206,227], [31,120,180],  [178,223,138],
        [51,160,44],   [251,154,153], [227,26,28],
        [253,191,111], [255,127,0],   [202,178,214],
        [106,61,154],  [255,255,153], [177,89,40]
    ];
    
    baseColors = numeric.div(baseColors, 255);
    rotateAngles = {x:0, y:0, z:0};
    ctm = getCtm();

    var p1 = d3.text(fn);
    var p2 = d3.text(fn_labels);
    
    Promise.all([p1,p2])
    .then(function(data_and_labels){
        console.log('preprocessing data...');

        data = data_and_labels[0];
        labels = data_and_labels[1];

        data = d3.dsvFormat(',').parseRows(data);
        data = data.map(row=>{
            return preprocess(row);
        });
        var ndim = data[0].length;
        data = data.concat(createAxisPoints(ndim));

        labels = d3.dsvFormat(',').parseRows(labels);
        labels = labels.map(function(row){
            return +row[0];
        });

        dmax = 1.414*math.max(math.abs(data));

        gt.init(ndim);

        points = gt.project(data, t);
        colors = labels.map(d=>baseColors[d]);
        colors = colors.concat(createAxisColors(ndim));
        welgl_init();
    });    
};


function getCtm(){
    ctm = mat4();
    var S = scalem(1/dmax, 1/dmax, 1/dmax );
    var R = rotateX(rotateAngles.x);
    R = mult(rotateY(rotateAngles.y), R);
    R = mult(rotateZ(rotateAngles.z), R);
    // R = mult(rotateY(-rotateAngles.y), R);
    // R = mult(rotateX(-rotateAngles.x), R);
    var T = translate(0,0,0);
    ctm = mult(S, ctm);
    ctm = mult(R, ctm);
    ctm = mult(T, ctm);
    return ctm;
}


function welgl_init() {
    console.log('init');

    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.2, 0.2, 0.2, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    //------------------------------
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    //------------------------------
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    //------------------------------
    thetaLoc = gl.getUniformLocation(program, 'theta');
    gl.uniform1f(thetaLoc, theta);
    //------------------------------

    modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewMatrixLoc, false , flatten(ctm));

    render();
};


function render(){
    console.log('rendering...');
    setTimeout( function(){
        if(shouldAnimate){
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            rotateAngles.x += 0;
            rotateAngles.y += 3.0;
            rotateAngles.z += 0;
            ctm = getCtm();
            gl.uniformMatrix4fv(modelViewMatrixLoc, false , flatten(ctm));

            t+=1;
            points = gt.project(data, t);
            gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

            var ndim = data[0].length;
            gl.drawArrays( gl.POINTS, 0, points.length-ndim*2 );
            
            // draw axis lines
            // gl.drawArrays( gl.POINTS, points.length-ndim*2, ndim*2);
            gl.drawArrays( gl.LINES, points.length-ndim*2, ndim*2);
        }
        requestAnimFrame(render);
    }, 1000/120);
    
    // shouldAnimate = false;
}
