// Largely inspired by https://github.com/dy/gl-util/


import * as _ from 'underscore';
import * as d3 from 'd3';

export default class glutil{

  static context({
    container, canvas, 
    dpr, contextAttributes}){

    let width = container.width;
    let height = container.height;

    if(dpr === undefined){
      dpr = window.devicePixelRatio || 1;
    }

    if(container && !canvas){
      canvas = d3.select(container)
      .append('canvas')
      .node();
    }

    if(width){
      canvas.width = width * dpr;
      canvas.style.width = width + 'px';
    }
    if(height){
      canvas.height = height * dpr;
      canvas.style.height = height + 'px';
    }
    return canvas.getContext('webgl', contextAttributes);
  }

  
  static program(gl, vSrc, fSrc){
    if (!vSrc && !fSrc) {
      return gl.getParameter(gl.CURRENT_PROGRAM);
    }

    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(fShader, fSrc);
    gl.shaderSource(vShader, vSrc);

    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      throw Error(gl.getShaderInfoLog(fShader));
    }

    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
      throw Error(gl.getShaderInfoLog(vShader))
    }

    var program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw Error(gl.getProgramInfoLog(program))
    }
    gl.useProgram(program);
    // save gl reference
    program.gl = gl;
    return program;

  }
  static isFloat(n){
    return Number(n) === n && n % 1 !== 0;
  }


  static attribute(gl, obj){
    if(Array.isArray(obj)){
      _.each(obj, (o)=>{
        glutil.attribute(gl, o);
      });
    }else{

      let program = gl.getParameter(gl.CURRENT_PROGRAM);
      let name = obj.name;
      let data = obj.data; //expect to be js array;
      let loc =  gl.getAttribLocation(program, name);
      let dim;
      if(obj.dim !== undefined){
        dim = obj.dim;
      }else{
        if(Array.isArray(data[0])){
          dim = data[0].length;
        }else{
          dim = 1;
        }
      }

      data = _.flatten(data);

      let type;
      if(obj.type !== undefined){
        type = obj.type;
      }else{
        if(glutil.isFloat(data[0])){
          type = 'float';
        }else{
          type = 'int';
        }
      }

      if(type === 'float'){
        let buffer;
        if(obj.buffer === undefined){
          buffer = gl.createBuffer();
        }else{
          buffer = obj.buffer;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc, dim, gl.FLOAT, true, 0,0);
        gl.enableVertexAttribArray(loc);
      }else{
        //TODO
      }
    }
    

  }


  static uniform(gl, obj){
    // obj = {name, [type], data}
    // OR
    // obj = [{name, [type], data}...]

    let program = gl.getParameter(gl.CURRENT_PROGRAM);
    let loc = gl.getUniformLocation(program, obj.name);

    if(Array.isArray(obj)){
      _.each(obj, (o)=>{
        glutil.uniform(gl, o);
      });
    }else{
      let type, dim;
      if(obj.type !== undefined){
        type = obj.type;
      }else if(Array.isArray(obj.data)){
        if(Array.isArray(obj.data[0])){
          type = 'mat';
        }else{
          type = 'vec';
        }
      }else{
        if(glutil.isFloat(obj.data)){
          type = 'float';
        }else{
          type = 'int';
        }
      }

      if(obj.dim !== undefined){
        dim = obj.dim;
      }else{
        if(type === 'mat' || type === 'vec'){
          dim = obj.data.length;
        }else{
          dim = 1;
        }
      }

      let data;
      if(type === 'mat' || type === 'vec'){
        data = _.flatten(obj.data);
      }else{
        data = obj.data;
      }

      if(type === 'mat'){
        if(dim == 4){
          gl.uniformMatrix4fv(loc, false, data);
        }else if(dim == 3){
          gl.uniformMatrix3fv(loc, false, data);
        }else if(dim == 2){
          gl.uniformMatrix2fv(loc, false, data);
        }
      }else if(type == 'vec'){
        if(dim == 4){
          gl.uniform4fv(loc, false, data);
        }else if(dim == 3){
          gl.uniform3fv(loc, false, data);
        }else if(dim == 2){
          gl.uniform2fv(loc, false, odata);
        }
      }else if(type === 'float'){
        gl.uniform1f(loc, data);
      }else if(type === 'int'){
        gl.uniform1i(loc, data);
      }
    }
  }
  static texture(){
  }

  static clear(gl, color){
    if(color !== undefined){
      gl.clearColor(...color);
    }
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  }


}