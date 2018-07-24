var canvas;
var gl, program;

var baseColors;

var theta, thetaLoc;
var ctm;
var rotateAngles;
var modelViewMatrixLoc;

var dataTensor, data, labels;
var points, colors;
var t = 0;

var dmax = 5;
var ndim;//ndim = 5;
var npoint = 178;
var nepoch = 1;


var fn, fn_labels, fn_colors;


fn =  'data.bin';
fn_labels = 'labels.bin';
// fn_colors = 'colors.bin';

// var fn_json = 'projected.json';

var epoch = 0;
var shouldAnimate = true;

function constructFileName(modelid, layer, epoch){
    fn = 'data/cifar10_pred/activation_softmax_epoch'+epoch+'.bin';
    return fn;
}


function setEpoch(e){
    epoch = e;
    data = dataTensor[epoch];
    data = data.concat(createAxisPoints(ndim));

}

function nextEpoch(){
    epoch = (epoch+1)%nepoch;
    setEpoch(epoch);
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
        console.log(gt.getMatrix(t));
    }
}


function loadData(urls, mode, callback){
    if(typeof(urls) === 'string'){
        urls = [urls, ];
    }

    if(mode == 'text'){
        var promises = urls.map(url=>d3.text(url));
        Promise.all(promises)
        .then((data_texts) => {
            callback(data_texts, urls);
        });
        return;
    }else{
        for(let i=0; i<urls.length; i++){
            let url = urls[i];
            if(mode == 'bin'){    
                let xhr = new window.XMLHttpRequest();
                let ready = false;
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 
                    && xhr.status === 200
                    && ready !== true) {
                        if (xhr.responseType === "arraybuffer"){
                            callback(xhr.response, url, i);
                        }else if(xhr.mozResponseArrayBuffer !== null){
                            callback(xhr.mozResponseArrayBuffer, url, i);
                        }else if(xhr.responseText !== null){
                            let data = String(xhr.responseText);
                            let ary = new Array(data.length);
                            for (var j = 0; j<data.length; j++) {
                                ary[j] = data.charCodeAt(j) & 0xff;
                            }
                            let uint8ay = new Uint8Array(ary);
                            callback(uint8ay.buffer, url, i);
                        }
                        ready = true;
                    }
                };
                xhr.open("GET", url, true);
                xhr.responseType="arraybuffer";
                xhr.send();
            }else if(mode=='json'){
                d3.json(url)
                .then((data) =>
                    callback(data, url, i));
            }
        }
    }
}


function updateDmax(){
    dmax = math.max(math.abs(data));
}


function createAxisPoints(ndim, r){
    if(r===undefined){
        r = 1;
    }

    var res = math.multiply(math.eye(ndim), r)._data;
    for(var i=ndim-1; i>=0; i--){
        res.splice(i, 0, math.zeros(ndim)._data);
    }
    return res;
}


function createAxisColors(ndim){
    var res = d3.range(ndim*2).map((d,i)=>baseColors[Math.floor(i/2) % baseColors.length]);
    return res;
}


function changeSuffx(fn, newSuffix){
    let newFn = fn.split('.');
    newFn[newFn.length-1] = newSuffix;
    newFn = newFn.join('.');
    return newFn;
}


function reshape(array, shape){
  var res = [];
  if(shape.length == 2){
    for(let row=0; row<shape[0]; row++){
      res.push([]);
      for(let col=0; col<shape[1]; col++){
        res[res.length-1].push(array[shape[1] * row + col]);
      }
    }
  }else{
    let blocksize = math.prod(shape.slice(1));
    for(let i=0; i<shape[0]; i++){
      res.push(
        reshape(array.slice(i*blocksize,(i+1)*blocksize),  shape.slice(1))
      );
    }
  }
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

    loadData(fn, 'bin',
        function(buffer, url, i){
            // let fn_json = changeSuffx(url, 'json');

            //// load a json with 'shape':[1000, ndim]

            // loadData(fn_json, 'json', (jsonObj)=>{
            // let array = new Float64Array(buffer);
            let array = new Float32Array(buffer);

            if (ndim===undefined){
                ndim = Math.floor(array.length/npoint/nepoch);
            }
            let shape = [nepoch, npoint, ndim];
            dataTensor = reshape(array, shape);
            data = dataTensor[epoch];
            if(dmax===undefined){
                dmax = math.max(math.abs(data[data.length-1])); 
            }
            data = data.concat(createAxisPoints(ndim));

            gt.init(ndim);
            points = gt.project(data, t);
            if(ndim){
                colors = colors.concat(createAxisColors(ndim));
            }
            if(points && colors){
                welgl_init();
            }
        
            // });
        }
    );

    if(fn_labels !== undefined){
        loadData(fn_labels, 'bin', 
            function(buffer, url, i){
                labels = Array.from(new Uint8Array(buffer));
                // labels = labels.map(d=>d==9?2:1);

                colors = labels.map(d=>baseColors[d]);
                if(ndim){
                    colors = colors.concat(createAxisColors(ndim));
                }
                if(points && colors){
                    welgl_init();
                }
            }
        );
    }else if(fn_colors !== undefined){
        loadData(fn_colors, 'bin', 
            function(buffer, url, i){
                colors = Array.from(new Uint8Array(buffer));
                colors = reshape(colors, [npoint, 3]);
                colors = math.divide(colors, 255);
                if(ndim){
                    colors = colors.concat(createAxisColors(ndim));
                }
                if(points && colors){
                    welgl_init();
                }
            }
        );
    }
    else{
        labels = d3.range(npoint).map((d,i)=>i>=npoint/2?0:0);
        colors = labels.map(d=>baseColors[d]);
        if(ndim){
            colors = colors.concat(createAxisColors(ndim));
        }
        if(points && colors){
            welgl_init();
        }
    }


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

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
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

    render(0);
};

let then = 0;
function render(now){
    delta = now-then;
    then = now;

    if(shouldAnimate){
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        rotateAngles.x += 0;
        rotateAngles.y += 0.0;
        rotateAngles.z += 0;
        ctm = getCtm();
        gl.uniformMatrix4fv(modelViewMatrixLoc, false , flatten(ctm));

        t+=delta*0.1;
        points = gt.project(data, t);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
        var ndim = data[0].length;
        // gl.drawArrays( gl.LINES, 0, points.length-ndim*2 );
        
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.POINTS, 0, npoint );

        // draw axis lines
        // gl.drawArrays( gl.POINTS, points.length-ndim*2, ndim*2);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.LINES, npoint, ndim*2);
    }
    requestAnimFrame(render);
    
    // shouldAnimate = false;
}
