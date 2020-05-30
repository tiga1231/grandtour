import { GrandTourView } from './GrandTourView';
import { GrandTourInTheShaderView } from './GrandTourInTheShaderView';
import * as utils from './utils';

import * as d3 from 'd3';
window.d3 = d3;


window.onload = ()=>{

    //1. create canvas
    let canvas = d3.select('#root').append('canvas')
    .attr('id', 'main')
    .attr('width', window.innerWidth * devicePixelRatio)
    .attr('height', window.innerHeight * devicePixelRatio)
    .style('background', '#aaaaaa')
    .style('width', '100%')
    .style('height', '100%');

    // example 1: json data
    // let url = 'data/iris.json';
    // d3.json(url).then((dataObj)=>{
    //     let sc = d3.scaleOrdinal(d3.schemeCategory10);

    //     //2. Define positions
    //     let position = dataObj.map(d=>[d.sepalLength, d.sepalWidth, d.petalLength, d.petalWidth]);

    //     //centralize data (optional)
    //     let center = math.mean(position, 0);
    //     position = position.map(
    //         row=>numeric.sub(row, center)
    //     );

    //     //3. Define colors
    //     let color = dataObj.map(d=>{
    //         let hex = sc(d.species);
    //         let c = utils.hexToRgb(hex);
    //         // let c = [255,255,255];
    //         c[3] = 255; //alpha
    //         return c;
    //     });

    //     //4. Create view
    //     let view = new GrandTourInTheShaderView({
    //     // let view = new GrandTourView({
    //         canvas: canvas,
    //         position: position,
    //         color: color,
    //         handle: true,
    //         brush: true,
    //         pointSize: 10.0,
    //         scaleMode: 'center',
    //     });

    //     //5. play
    //     view.play();

    //     // global variables for debugging
    //     window.view = view;
    // });
    


    //example 2: tesseract
    
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
    // // let view = new GrandTourView({
    // let view = new GrandTourInTheShaderView({
    //     canvas: canvas,
    //     position: tesseract,
    //     color: '#1f78b4',
    //     shouldDrawLines: true,
    //     handle: true,
    //     brush: true,
    //     pointSize: 10.0,
    // });
    // view.play();
    // window.view = view;


    // example 3: pre-softmax data, where dataObj = {embeddings: [[[epoch x example x dimension]]], labels: [8,2,0,...]};
    
    let url = 'data/presoftmax.json';
    d3.json(url).then((dataObj)=>{
        let sc = d3.scaleOrdinal(d3.schemeCategory10);
        let position = dataObj.embeddings[0];

        // //centralize data (optional)
        // let center = math.mean(position, 0);
        // position = position.map(
        //     row=>numeric.sub(row, center)
        // );

        let color = dataObj.labels.map(l=>{
            let hex = sc(l);
            let c = utils.hexToRgb(hex);
            c[3] = 255; //alpha
            return c;
        });

        // position = position.concat(
        //     dataObj.embeddings[5],
        //     dataObj.embeddings[99],
        // );
        // color = color.concat(
        //     color.map(d=>d.slice()),
        //     color.map(d=>d.slice()),
        // );

        // let view = new GrandTourView({
        let view = new GrandTourInTheShaderView({
            canvas: canvas,
            position: position,
            color: color,
            handle: true,
            brush: true,
            scaleMode: 'center',
            zoom: true,
        });
        view.play();

        window.view = view;
        window.dataObj = dataObj;

        let epoch = 0;
        let isPlaying = true;
        window.addEventListener("keydown", event => {
            console.log(event.key);
            if(event.key == 'n' || event.key == 'p'){
                if(event.key == 'n'){
                    epoch += 1;
                }else if (event.key == 'p'){
                    epoch -= 1;
                }
                epoch = (epoch+dataObj.embeddings.length) % dataObj.embeddings.length;
                view.position = dataObj.embeddings[epoch];
                view.updatePosition(view.position);
                


                // view.handleMax = math.max(math.abs(view.position)) * view.handleScale;
            }else if(event.key == ' '){
                isPlaying = !isPlaying;
                if(isPlaying){
                    view.gt.STEPSIZE = view.gt.STEPSIZE0;
                }else{
                    view.gt.STEPSIZE0 = view.gt.STEPSIZE;
                    view.gt.STEPSIZE = 0;
                }
                

            }
        });
    });



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
