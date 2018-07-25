let overlay = {};

overlay.init = function(){
  let svg = d3.select('#overlay');
  let width = +svg.attr('width');
  let height = +svg.attr('height');

  let xmax = 5;
  let aspect = width/height;

  svg.sx = d3.scaleLinear()
  .domain([-xmax,xmax])
  .range([0,width]);

  svg.sy = d3.scaleLinear()
  .domain([-xmax/aspect,xmax/aspect])
  .range([height, 0]);

  svg.sc = d3.interpolateGreys;

  drawAxes(svg, m.map(d=>d.slice(0,2)));
  render();
};

function drawAxes(svg, coordinates){
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
    .attr('stroke', (_,i)=>svg.sc(i/ndim));


    svg.selectAll('.anchor')
    .data(coordinates)
    .enter()
    .append('circle')
    .attr('class', 'anchor');


    let archorRadius = 5;
    let anchors = svg.selectAll('.anchor')
    .attr('cx', d=>svg.sx(d[0]))
    .attr('cy', d=>svg.sy(d[1]))
    .attr('r', archorRadius)
    .attr('fill', (_,i)=>svg.sc(i/ndim))
    .style('cursor', 'pointer');

    svg.drag = d3.drag()
    .on('start', function(){
    })
    .on('drag', function(d,i){
      let x = svg.sx.invert(d3.event.x);
      let y = svg.sy.invert(d3.event.y);
      m[i] = [x,y,0];

      d3.selectAll('.basis')
      .filter((_,j)=>i==j)
      .attr('x2', d3.event.x)
      .attr('y2', d3.event.y);

      d3.select(this)
      .attr('cx', d3.event.x)
      .attr('cy', d3.event.y);
      render();
    })
    .on('end', function(){
    });

    anchors.call(svg.drag);
}

