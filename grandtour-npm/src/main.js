import { GrandTourView } from './GrandTourView';
import * as utils from './utils';

import * as d3 from 'd3';
window.d3 = d3;


window.onload = ()=>{

    //create canvas
    let canvas = d3.select('body').append('canvas')
    .attr('id', 'main')
    .attr('width', window.innerWidth * devicePixelRatio)
    .attr('height', window.innerHeight * devicePixelRatio)
    .style('background', '#aaaaaa')
    .style('width', '100%')
    .style('height', '100%');

    // example 1: json data
    // 
    // let url = 'data/embedding-10k-4d.json';
    // let nSample = 1000;
    // d3.json(url).then((dataObj)=>{
    //     dataObj.embedding = dataObj.embedding.slice(0, nSample);
    //     dataObj.accuracy = dataObj.accuracy.slice(0, nSample);

    //     let centroid = math.mean(dataObj.embedding, 0);
    //     let sc = d3.scaleLinear()
    //     .domain([0.7,1.0])
    //     .range([0,1]);

    //     //Centralize data
    //     let position = dataObj.embedding.map(d=>numeric.sub(d, centroid));
    //     //Map an attribute to color [[255,255,255,255], ...];
    //     let color = dataObj.accuracy.map(d=>{
    //         let c = utils.hexToRgb(d3.interpolateViridis(sc(d)));
    //         c[3] = 255;
    //         return c;
    //     });
    //     let view = new GrandTourView({
    //         canvas: canvas,
    //         position: position,
    //         color: color,
    //     });
    //     view.play();
    //     window.view = view;
    // });
    


    //example 2: tesseract
    //
    let basePoints = [
      [1, 1, 1, 1], [-1, 1, 1, 1],
      [-1, -1, 1, 1], [1, -1, 1, 1],
      [1, 1, -1, 1], [-1, 1, -1, 1],
      [-1, -1, -1, 1], [1, -1, -1, 1],

      [1, 1, 1, -1], [-1, 1, 1, -1],
      [-1, -1, 1, -1], [1, -1, 1, -1],
      [1, 1, -1, -1], [-1, 1, -1, -1],
      [-1, -1, -1, -1], [1, -1, -1, -1],
    ];
    let indices = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      0, 4, 1, 5, 2, 6, 3, 7,
      8, 9, 9, 10, 10, 11, 11, 8,
      12, 13, 13, 14, 14, 15, 15, 12,
      8, 12, 9, 13, 10, 14, 11, 15,
      0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15
    ];
    let tesseract = indices.map((i)=>basePoints[i]);
    let view = new GrandTourView({
        canvas: canvas,
        position: tesseract,
        color: '#1f78b4',
        shouldDrawLines: true,
    });
    view.play();
    window.view = view;




    //resize handler
    window.onresize = ()=>{
        view.isWindowResized = true;
        canvas
        .attr('width', window.innerWidth * devicePixelRatio)
        .attr('height', window.innerHeight * devicePixelRatio);
        view.plot();
    };

};
