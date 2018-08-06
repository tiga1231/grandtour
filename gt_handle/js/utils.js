var utils = {};

utils.CLEAR_COLOR = [0.2,0.2,0.2];

// utils.baseColors = [
//   [166,206,227], [31,120,180],  [178,223,138],
//   [51,160,44],   [251,154,153], [227,26,28],
//   [253,191,111], [255,127,0],   [202,178,214],
//   [106,61,154],  [255,255,153], [177,89,40]
// ];
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
utils.baseColors = d3.schemeCategory10;
utils.baseColors = utils.baseColors.map(d=>(hexToRgb(d)));


utils.loadDataBin = function(url, callback){
  let xhr = new window.XMLHttpRequest();
  let ready = false;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 
    && xhr.status === 200
    && ready !== true) {
      if (xhr.responseType === "arraybuffer"){
        callback(xhr.response, url);
      }else if(xhr.mozResponseArrayBuffer !== null){
        callback(xhr.mozResponseArrayBuffer, url);
      }else if(xhr.responseText !== null){
        let data = String(xhr.responseText);
        let ary = new Array(data.length);
        for (var j = 0; j<data.length; j++) {
            ary[j] = data.charCodeAt(j) & 0xff;
        }
        let uint8ay = new Uint8Array(ary);
        callback(uint8ay.buffer, url);
      }
      ready = true;
    }
  };
  xhr.open("GET", url, true);
  xhr.responseType="arraybuffer";
  xhr.send();
};


utils.reshape = function(array, shape){
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
        utils.reshape(array.slice(i*blocksize,(i+1)*blocksize),  shape.slice(1))
      );
    }
  }
  return res;
};


utils.flatten = function(matrix){
  let res = [];
  for(let i=0; i<matrix.length; i++){
    for(let j=0; j<matrix[0].length; j++){
      res.push(matrix[i][j]);
    }
  }
  return res;
};


utils.makeMeshindices = function(nrow, ncol){
  let res = [];
  for(let i=0; i<nrow-1; i++){
    for(let j=0; j<ncol-1; j++){
      let x = i*ncol+j;
      res.push(
        x, x+1, x+ncol+1, x+ncol
      );
    }
  }
  return res;
};


utils.orthogonalize = function(matrix, priorityRow){
  // make row vectors in matrix pairwise orthogonal;
  
  function proj(u, v){
    return numeric.mul(numeric.dot(u, v)/numeric.dot(v,v), u);
  }

  function normalize(v, unitlength=1){
    if(numeric.norm2(v) <= 0){
      return v;
    }else{
      return numeric.div(v, numeric.norm2(v)/unitlength);
    }
  }
  

  // Gram–Schmidt orthogonalization
  matrix[priorityRow] = normalize(matrix[priorityRow]);
  for(let i=0; i<matrix.length; i++){
    if(i==priorityRow){
      continue;
    }else{
      matrix[i] = numeric.sub(matrix[i], proj(matrix[priorityRow], matrix[i]));
      for(let j=0; j<i; j++){
        matrix[i] = numeric.sub(matrix[i], proj(matrix[j], matrix[i]));
      }
    }
     matrix[i] = normalize(matrix[i]);
   }
   return matrix;
  
};
