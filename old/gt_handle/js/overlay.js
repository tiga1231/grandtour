let overlay = {};

overlay.init = function(){
  let svg = d3.select('#overlay');
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;

  svg.attr('width', width)
  .attr('height',height);


  let xmax = DATA_BOUND_HORIZONTAL;
  let aspect = width/height;

  svg.sx = d3.scaleLinear()
  .domain([-xmax,xmax])
  .range([0,width]);

  svg.sy = d3.scaleLinear()
  .domain([-xmax/aspect,xmax/aspect])
  .range([height, 0]);

  svg.sc = d3.interpolateGreys;
  this.svg = svg;

  this.drawAxes();

  svg.append('text')
  .attr('x', 10)
  .attr('y', 20)
  .attr('fill', 'white')
  .text("'f': faster, 's': slower, 'n': next epoch, 'p': prev epoch, 'space': pause, drag white bubble to change view")
  return svg;
};


overlay.drawAxes = function(){
  let svg = this.svg;
  let coordinates = math.eye(ndim)._data;

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
  .attr('stroke', (_,i)=>svg.sc(i/ndim/2))
  .attr('opacity', 0.2);


  svg.selectAll('.anchor')
  .data(coordinates)
  .enter()
  .append('circle')
  .attr('class', 'anchor')
  .attr('opacity', 0.3);


  let archorRadius = 10;
  let anchors = svg.selectAll('.anchor')
  .attr('cx', d=>svg.sx(d[0]))
  .attr('cy', d=>svg.sy(d[1]))
  .attr('r', archorRadius)
  .attr('fill', (_,i)=>'black')
  .attr('stroke', (_,i)=>'white')
  .style('cursor', 'pointer');

  svg.drag = d3.drag()
  .on('start', function(){
    gt.shouldPlayPrev = gt.shouldPlay;
    gt.shouldPlay = false;
  })
  .on('drag', function(d,i){

    let dx = svg.sx.invert(d3.event.dx)-svg.sx.invert(0);
    let dy = svg.sy.invert(d3.event.dy)-svg.sy.invert(0);
    let x = svg.sx.invert(d3.event.x);
    let y = svg.sy.invert(d3.event.y);
    let matrix = gt.getMatrix();

    matrix[i][0] += dx;
    matrix[i][1] += dy;
    // matrix[i][0] = x;
    // matrix[i][1] = y;
    // 
    gt.setMatrix(utils.orthogonalize(matrix, i));

    overlay.redrawAxis();
  })
  .on('end', function(){
    gt.shouldPlay = gt.shouldPlayPrev;
  });
  anchors
  .on('mouseover', (_,i)=>{
    gt.STEPSIZE_PREV = gt.STEPSIZE;
    gt.STEPSIZE = gt.STEPSIZE * 0.2;
  })
  .on('mouseout', (_,i)=>{
    gt.STEPSIZE = gt.STEPSIZE_PREV;
    gt.STEPSIZE_PREV = undefined;
  })
  .call(svg.drag);
};

overlay.redrawAxis = function(){
  let svg = this.svg;
  let handlePos = gt.project(math.eye(ndim)._data);
  svg.selectAll('.basis')
  .attr('x2', (_,i) => svg.sx(handlePos[i][0]))
  .attr('y2', (_,i) => svg.sy(handlePos[i][1]));
  svg.selectAll('.anchor')
  .attr('cx', (_,i) => svg.sx(handlePos[i][0]))
  .attr('cy', (_,i) => svg.sy(handlePos[i][1]));
  
};

