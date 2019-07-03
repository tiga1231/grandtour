import * as d3 from 'd3';

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



export let baseColorsHex = d3.schemeCategory10;
baseColorsHex.push('#444444');
baseColorsHex.push('#444444');

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
export let baseColors = baseColorsHex.map((d)=>(hexToRgb(d)));
export let baseColorsInt = baseColorsHex.map((d)=>parseInt(d.slice(1), 16));