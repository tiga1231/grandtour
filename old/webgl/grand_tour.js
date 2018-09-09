var gt = {};




gt.init = function(ndim){
  this.ndim = ndim;
  this.N = ndim*ndim;
  this.STEPSIZE = Math.PI * Math.PI / 3000;
  this.initThetas(this.N);
};


gt.initThetas = function(N){
  this.thetas = new Array(N);
  for(var i=0; i<N; i++){
    this.thetas[i] = Math.random();
  }
}


gt.setNdim = function(newNdim){
  if(newNdim !== this.ndim){
    this.ndim = newNdim;
    this.N = this.ndim * this.ndim;
    this.initThetas(this.N);
  }
};



// gt.getRotationMatrix = function(dim0, dim1, theta){
//   var res = math.eye(this.ndim)._data;
//   res[dim0][dim0] = Math.cos(theta);
//   res[dim0][dim1] = Math.sin(theta);

//   res[dim1][dim0] = -Math.sin(theta);
//   res[dim1][dim1] = Math.cos(theta);
//   return res;
// }


gt.multiplyRotationMatrix = function(matrix, i,j, theta){
  var sin = Math.sin(theta);
  var cos = Math.cos(theta);
  // var res = matrix.map(d=>d.slice());
  var column_i = matrix.map(d=>d[i]);
  var column_j = matrix.map(d=>d[j]);

  for(rowIndex=0; rowIndex<matrix.length; rowIndex++){
    matrix[rowIndex][i] = column_i[rowIndex]*cos + column_j[rowIndex]*(-sin);
    matrix[rowIndex][j] = column_i[rowIndex]*sin + column_j[rowIndex]*cos;
  }
  return matrix;
}


gt.getMatrix = function(t){
  var angles = this.thetas.map(theta=>t*theta*this.STEPSIZE);
  
  var matrix = math.eye(this.ndim)._data;
  var k = -1;
  
  // for(var i=0; i<this.ndim; i++){
  //   for(var j=0; j<this.ndim; j++){
  //     if(i!==j){
  //       k++;
  //       matrix = this.multiplyRotationMatrix(matrix, i,j, angles[k]);
  //     }
  //   }
  // }

  for(var i=0; i<this.ndim; i++){
    for(var j=0; j<this.ndim; j++){
      if(i!==j && (false || i<=3 || j<=3) ){
        k++;
        matrix = this.multiplyRotationMatrix(matrix, i,j, angles[k]);
      }
    }
  }
  matrix = math.transpose(matrix);
  matrix = matrix.slice(0,3);
  matrix = math.transpose(matrix);
  return matrix;
}

gt.project = function(data, t){
  var res = math.multiply(data, this.getMatrix(t));
  return res;
}
