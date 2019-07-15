function GrandTour(ndim){

  this.ndim = ndim;
  this.N = ndim*ndim;
  this.STEPSIZE = 0.00007;

  this.initThetas = function(N){
    this.thetas = new Array(N);
    for(var i=0; i<N; i++){
      this.thetas[i] = (Math.random()-0.5) * Math.PI;
    }
  };
  this.initThetas(this.N);


  this.setNdim = function(newNdim){
    if(newNdim !== this.ndim){
      this.ndim = newNdim;
      this.N = this.ndim * this.ndim;
      this.initThetas(this.N);
    }
  };



  // this.getRotationMatrix = function(dim0, dim1, theta){
  //   var res = math.eye(this.ndim)._data;
  //   res[dim0][dim0] = Math.cos(theta);
  //   res[dim0][dim1] = Math.sin(theta);
  //   res[dim1][dim0] = -Math.sin(theta);
  //   res[dim1][dim1] = Math.cos(theta);
  //   return res;
  // };



  this.multiplyRotationMatrix = function(matrix, i,j, theta){
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
  };



  this.getMatrix = function(dt){
    if(dt !== undefined){
      if(this.angles === undefined){
        // torus method
        // this.angles = this.thetas.map(theta=>0);
        
        // random walk method
        this.angles = this.thetas;

        this.matrix = math.identity(this.ndim)._data;
      }else{
        // torus method
        // this.angles = this.angles.map((a,i)=>a+dt*this.STEPSIZE*this.thetas[i]);
        
        // random walk method
        this.angles = this.thetas.map( theta => theta * dt * this.STEPSIZE );

      }
      // torus method
      // this.matrix = math.eye(this.ndim)._data;

      
      var k = -1;
      for(var i=0; i<this.ndim; i++){
        for(var j=0; j<this.ndim; j++){
          if(i!==j && (true || i<=3 || j<=3) ){
            k++;
            this.matrix = this.multiplyRotationMatrix(this.matrix, i,j, this.angles[k]);
          }
        }
      }

    }
    return this.matrix;
  };


  this.setMatrix = function(m){
    this.matrix = m;
  };


  this.getMatrixInverse = function(t){
    // return numeric.inv(this.getMatrix(t));
    return math.transpose(this.getMatrix(t));
  };


  this.project = function(data, dt){
    var matrix = this.getMatrix(dt);
    matrix = math.transpose(matrix);
    matrix = matrix.slice(0,3);
    matrix = math.transpose(matrix);
    var res = math.multiply(data, matrix);

    return res;
  };



}