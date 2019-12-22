import * as d3 from 'd3';

//==== constants ====
export let CLEAR_COLOR = [.1, .1, .1];


export let baseColorsHex = d3.schemeCategory10;
baseColorsHex.push('#444444');
baseColorsHex.push('#444444');

export function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
export let baseColors = baseColorsHex.map((d)=>(hexToRgb(d)));
export let baseColorsInt = baseColorsHex.map((d)=>parseInt(d.slice(1), 16));




//==== functions ====
//
export function flatten(v){
    return Float32Array.from(v.flat());
}

export function normalize(v, unitlength=1) {
  if (numeric.norm2(v) <= 0) {
    return v;
  } else {
    return numeric.div(v, numeric.norm2(v)/unitlength);
  }
}

export function orthogonalize(matrix, priorityRowIndex=0) {
  // make row vectors in matrix pairwise orthogonal;
  
  function proj(u, v) {
    return numeric.mul(numeric.dot(u, v)/numeric.dot(u, u), u);
  }

  

  // Gram–Schmidt orthogonalization
  let priorityRow = matrix[priorityRowIndex];
  let firstRow = matrix[0];
  matrix[0] = priorityRow;
  matrix[priorityRowIndex] = firstRow;

  matrix[0] = normalize(matrix[0]);
  for (let i=1; i<matrix.length; i++) {
    for (let j=0; j<i; j++) {
        matrix[i] = numeric.sub(matrix[i], proj(matrix[j], matrix[i]));
    }
    matrix[i] = normalize(matrix[i]);
  }
  let tempRow = matrix[0];
  matrix[0] = matrix[priorityRowIndex];
  matrix[priorityRowIndex] = tempRow;
  return matrix;
}




export function loadDataBin(url, callback=()=>{}) {
  let xhr = new window.XMLHttpRequest();
  let ready = false;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 
        && xhr.status === 200
        && ready !== true) {
      if (xhr.responseType === 'arraybuffer') {
        callback(xhr.response, url);
      } else if (xhr.mozResponseArrayBuffer !== null) {
        callback(xhr.mozResponseArrayBuffer, url);
      } else if (xhr.responseText !== null) {
        let data = String(xhr.responseText);
        let ary = new Array(data.length);
        for (let j = 0; j<data.length; j++) {
          ary[j] = data.charCodeAt(j) & 0xff;
        }
        let uint8ay = new Uint8Array(ary);
        callback(uint8ay.buffer, url);
      }
      ready = true;
    }
  };
  xhr.open('GET', url, true);
  xhr.responseType='arraybuffer';
  xhr.send();
}


export function reshape(array, shape){
  let res = [];
  if (shape.length == 2) {
    let [nrow, ncol] = shape;
    for (let i=0; i<nrow; i++) {
      res.push(array.slice(i*ncol, (i+1)*ncol));
    }
  } else {
    let blocksize = shape.slice(1).reduce((a,b)=>a*b, 1);
    for (let i=0; i<shape[0]; i++) {
      res.push(
        reshape(array.slice(i*blocksize, (i+1)*blocksize), shape.slice(1))
      );
    }
  }
  return res;
}


export function mix(a,b,p){
  return numeric.add(numeric.mul(a, (1-p)), numeric.mul(b, (p)));
}























