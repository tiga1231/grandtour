let overlay = {};

overlay.init = function(){
  let svg = d3.select('#overlay');
  let width = +svg.attr('width');
  let height = +svg.attr('height');

  let xmax = 2;
  let aspect = width/height;

  svg.sx = d3.scaleLinear()
  .domain([-xmax,xmax])
  .range([0,width]);

  svg.sy = d3.scaleLinear()
  .domain([-xmax/aspect,xmax/aspect])
  .range([height, 0]);

  svg.sc = d3.interpolateGreys;
  this.svg = svg;

  this.drawAxes(m.map(d=>d.slice(0,2)));
  return svg;
};


overlay.drawAxes = function(coordinates){
  let svg = this.svg;
  for(let i=0; i<coordinates.length; i++){
    m[i][0] = coordinates[i][0];
    m[i][1] = coordinates[i][1];
  }

  svg.selectAll('.basis')
  .data(coordinates)
  .enter()
  .append('line')
  .attr('class', 'basis');

  let basis = svg.selectAll('.basis')
  .attr('x1', d=>svg.sx(0))
  .attr('y1', d=>svg.sy(0))
  .attr('x2', d=>svg.sx(d[0]))
  .attr('y2', d=>svg.sy(d[1]))
  .attr('stroke', (_,i)=>svg.sc(i/indim/2))
  .attr('opacity', 0.2);


  svg.selectAll('.anchor')
  .data(coordinates)
  .enter()
  .append('circle')
  .attr('class', 'anchor')
  .attr('opacity', 0.7);


  let archorRadius = 8;
  let anchors = svg.selectAll('.anchor')
  .attr('cx', d=>svg.sx(d[0]))
  .attr('cy', d=>svg.sy(d[1]))
  .attr('r', archorRadius)
  .attr('fill', (_,i)=>svg.sc(i/indim/2))
  .attr('stroke', (_,i)=>'white')
  .style('cursor', 'pointer');

  svg.drag = d3.drag()
  .on('start', function(){
    gt.shouldPlay = false;
  })
  .on('drag', function(d,i){

    let dx = svg.sx.invert(d3.event.dx)-svg.sx.invert(0);
    let dy = svg.sy.invert(d3.event.dy)-svg.sy.invert(0);
    let inv = gt.getMatrixInverse();

    let d1 = numeric.mul(inv[0], dx);
    let d2 = numeric.mul(inv[1], dy);
    m[i] = numeric.add(numeric.add(m[i], d1), d2);
    overlay.redrawAxis(m);
  })
  .on('end', function(){
    gt.shouldPlay = true;
  });
  anchors
  .on('mouseover', (_,i)=>{
    gt.STEPSIZE_ORIG = gt.STEPSIZE;
    gt.STEPSIZE = gt.STEPSIZE * 0.2;
  })
  .on('mouseout', (_,i)=>{
    gt.STEPSIZE = gt.STEPSIZE_ORIG;
  })
  .call(svg.drag);
};

overlay.redrawAxis = function(m){
  let svg = this.svg;
  let handlePos = gt.project(m);
  svg.selectAll('.basis')
  .attr('x2', (_,i) => svg.sx(handlePos[i][0]))
  .attr('y2', (_,i) => svg.sy(handlePos[i][1]));
  svg.selectAll('.anchor')
  .attr('cx', (_,i) => svg.sx(handlePos[i][0]))
  .attr('cy', (_,i) => svg.sy(handlePos[i][1]));
  
};

