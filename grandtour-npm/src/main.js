import { GrandTourView } from './GrandTourView';
import * as utils from './utils';

import * as d3 from 'd3';
window.d3 = d3;


window.onload = ()=>{

    //create canvas
    let canvas = d3.select('#root').append('canvas')
    .attr('id', 'main')
    .attr('width', window.innerWidth * devicePixelRatio)
    .attr('height', window.innerHeight * devicePixelRatio)
    .style('background', '#aaaaaa')
    .style('width', '100%')
    .style('height', '100%');

    // example 1: json data
    // 
    let url = 'data/iris.json';
    d3.json(url).then((dataObj)=>{
        let sc = d3.scaleOrdinal(d3.schemeCategory10);
        let position = dataObj.map(d=>[d.sepalLength, d.sepalWidth, d.petalLength, d.petalWidth]);

        //centralize data (optional)
        let center = math.mean(position, 0);
        position = position.map(
            row=>numeric.sub(row, center)
        );

        let color = dataObj.map(d=>{
            let hex = sc(d.species);
            let c = utils.hexToRgb(hex);
            c[3] = 255; //alpha
            return c;
        });

        let view = new GrandTourView({
            canvas: canvas,
            position: position,
            color: color,
            handle: true,
            brush: true,
            pointSize: 10.0,
            scaleMode: 'center',
        });
        view.play();
        window.view = view;
    });
    


    //example 2: tesseract
    //
    // let basePoints = [
    //   [1, 1, 1, 1], [-1, 1, 1, 1],
    //   [-1, -1, 1, 1], [1, -1, 1, 1],
    //   [1, 1, -1, 1], [-1, 1, -1, 1],
    //   [-1, -1, -1, 1], [1, -1, -1, 1],

    //   [1, 1, 1, -1], [-1, 1, 1, -1],
    //   [-1, -1, 1, -1], [1, -1, 1, -1],
    //   [1, 1, -1, -1], [-1, 1, -1, -1],
    //   [-1, -1, -1, -1], [1, -1, -1, -1],
    // ];
    // let indices = [
    //   0, 1, 1, 2, 2, 3, 3, 0,
    //   4, 5, 5, 6, 6, 7, 7, 4,
    //   0, 4, 1, 5, 2, 6, 3, 7,
    //   8, 9, 9, 10, 10, 11, 11, 8,
    //   12, 13, 13, 14, 14, 15, 15, 12,
    //   8, 12, 9, 13, 10, 14, 11, 15,
    //   0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15
    // ];
    // let tesseract = indices.map((i)=>basePoints[i]);
    // let view = new GrandTourView({
    //     canvas: canvas,
    //     position: tesseract,
    //     color: '#1f78b4',
    //     shouldDrawLines: true,
    //     handle: true,
    //     brush: true,
    // });
    // view.play();
    // window.view = view;




    //resize handler
    window.onresize = ()=>{
        view.isWindowResized = true;
        view.canvas
        .attr('width', window.innerWidth * devicePixelRatio)
        .attr('height', window.innerHeight * devicePixelRatio);
        view.svg
        .attr('width', window.innerWidth)
        .attr('height', window.innerHeight);
        view.plot();
    };

};
