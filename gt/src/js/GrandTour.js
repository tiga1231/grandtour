import math from 'mathjs';
// import numeric from 'numeric';

export default class GrandTour{
	constructor({ndim, stepsize=0.00007}){
		this.ndim = ndim;
 		this.stepsize0 = stepsize;
 		this.stepsize = stepsize;
	}

	get ndim(){
		return this._ndim;
	}
	set ndim(newNdim){
    	if(newNdim !== this.ndim){
	      	this._ndim = newNdim;
	      	this.N = this._ndim * this._ndim;
	      	this.initThetas(this.N);
    	}
	}


	initThetas(N){
		this._thetas = new Array(N);
		for(var i=0; i<N; i++){
			this._thetas[i] = (Math.random()-0.5) * Math.PI;
		}
		this._matrix = math.identity(this.ndim)._data;
	}


	get thetas(){
		return this._thetas;
	}


	rotateMatrix(matrix, i,j, theta){
		var sin = Math.sin(theta);
		var cos = Math.cos(theta);
		// var res = matrix.map(d=>d.slice());
		var column_i = matrix.map(d=>d[i]);
		var column_j = matrix.map(d=>d[j]);

		for(let rowIndex=0; rowIndex<matrix.length; rowIndex++){
			matrix[rowIndex][i] = column_i[rowIndex]*cos + column_j[rowIndex]*(-sin);
			matrix[rowIndex][j] = column_i[rowIndex]*sin + column_j[rowIndex]*cos;
		}
		return matrix;
	};


	tick(dt=0){
		let angles = this.thetas.map( theta => theta * dt * this.stepsize );
		var k = -1;
		for(var i=0; i<this.ndim; i++){
			for(var j=0; j<this.ndim; j++){
				if(i!==j && (true || i<=3 || j<=3) ){
					k++;
					this._matrix = this.rotateMatrix(this._matrix, i,j, angles[k]);
				}
			}
		}
		return this._matrix;
	}


	get matrix(){
		return this._matrix;
	}

	set matrix(newMatrix){
		this._matrix = newMatrix;
	}


	project(data, dt=0){
		this.tick(dt);
		var matrix = this._matrix;
		matrix = matrix.map((row)=>row.slice(0,3));
		var res = math.multiply(data, matrix);
		return res;
	};

}

