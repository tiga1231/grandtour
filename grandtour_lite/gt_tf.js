var tmp;

gt.getMatrix = function(t){
  var angles = this.thetas.map(theta=>t*theta*this.STEPSIZE);
  var matrix = tf.tidy(()=>{
    var res = tf.eye(this.ndim);
    var k=0;
    for(var i=0; i<this.ndim; i++){
      for(var j=0; j<this.ndim; j++){
        if(i!==j && (true || i<=3 && j<=3) ){
          res = tf.matMul(res, tf.tensor(this.getRotationMatrix(i,j, angles[k])) );
          k++;
        }
      }
    }
    res = res.slice([0,0], [this.ndim, 3]);
    return res;
  });
  
  // matrix = reshape(matrix.dataSync(),[this.ndim, 3]);
  return matrix;
};

gt.data;
gt.project = function(data, t){
  if(this.data !== data){
    this.data = data;
    this.tfdata = tf.tensor(data);
  }

  var projection = tf.matMul(this.tfdata, this.getMatrix(t));

  return reshape(projection.dataSync(), projection.shape);
  //TODO: use tf,gpu
}
