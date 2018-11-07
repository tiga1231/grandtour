import * as d3 from 'd3';

export default class utils{
  static baseColor = d3.schemeCategory10.map((c)=>{
    c = d3.color(c);
    return [c.r/255, c.g/255, c.b/255];
  });

  static bgColor = [0.95, 0.95, 0.95, 1.0];
  
  static orthogonalize = function(matrix, priorityRow=0) {
    // make row vectors in matrix pairwise orthogonal;
    function proj(u, v) {
      return numeric.mul(numeric.dot(u, v)/numeric.dot(v, v), u);
    }
    function normalize(v, unitlength=1) {
      if (numeric.norm2(v) <= 0) {
        return v;
      } else {
        return numeric.div(v, numeric.norm2(v)/unitlength);
      }
    }
    // Gram–Schmidt orthogonalization
    matrix[priorityRow] = normalize(matrix[priorityRow]);
    for (let i=0; i<matrix.length; i++) {
      if (i==priorityRow) {
        continue;
      } else {
        matrix[i] = numeric.sub(matrix[i], proj(matrix[priorityRow], matrix[i]));
        for (let j=0; j<i; j++) {
          matrix[i] = numeric.sub(matrix[i], proj(matrix[j], matrix[i]));
        }
      }
      matrix[i] = normalize(matrix[i]);
    }
    return matrix;
  };
}


