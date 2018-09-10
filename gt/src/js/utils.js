import * as d3 from 'd3';

export default class utils{
  static baseColor = d3.schemeCategory10.map((c)=>{
    c = d3.color(c);
    return [c.r/255, c.g/255, c.b/255];
  });
  
}


