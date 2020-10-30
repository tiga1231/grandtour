import { GrandTourView } from './GrandTourView';
import * as utils from './utils';

import * as d3 from 'd3';
window.d3 = d3;

// import * as p5 from 'p5';
// const P5 = new p5();
// window.P5 = P5;

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
    //     let view = new GrandTourView({
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
    // let view = new GrandTourView({
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
    
    // let url = 'data/presoftmax.json';
    // d3.json(url).then((dataObj)=>{
    //     let sc = d3.scaleOrdinal(d3.schemeCategory10);
    //     let epoch = 99;
    //     let position = dataObj.embeddings[epoch];

    //     //centralize data (optional)
    //     // let center = math.mean(position, 0);
    //     // position = position.map(
    //     //     row=>numeric.sub(row, center)
    //     // );

    //     let color = dataObj.labels.map(l=>{
    //         let hex = sc(l);
    //         let c = utils.hexToRgb(hex);
    //         c[3] = 255; //alpha
    //         return c;
    //     });

    //     // let view = new GrandTourView({
    //     let view = new GrandTourView({
    //         canvas: canvas,
    //         position: position,
    //         color: color,
    //         handle: true,
    //         brush: true,
    //         scaleMode: 'center',
    //         zoom: true,
    //     });
    //     view.play();

    //     window.view = view;
    //     window.dataObj = dataObj;

    //     window.addEventListener("keydown", event => {
    //         console.log(event.key);
    //         if(event.key == 'n' || event.key == 'p'){
    //             if(event.key == 'n'){
    //                 epoch += 1;
    //             }else if (event.key == 'p'){
    //                 epoch -= 1;
    //             }
    //             epoch = (epoch+dataObj.embeddings.length) % dataObj.embeddings.length;
    //             view.position = dataObj.embeddings[epoch];
    //             view.updatePosition(view.position);
    //             // view.handleMax = math.max(math.abs(view.position)) * view.handleScale;
    //         }
    //     });
    // });


    // exanple 4: klein bottle (4-D non-intersecting immersion)
    // https://en.wikipedia.org/wiki/Klein_bottle
    const R = 1.0;
    const P = 2.0;
    let e = 0.01;

    let [M,N] = [100,150];
    let s = d3.range(M).map(d=>d/M * Math.PI*2);
    let t = d3.range(N).map(d=>d/N * Math.PI*2);
    let theta = [];
    let v = [];
    // let color =[];

    for(let si of s){
        for(let ti of t){
            theta.push(si);
            v.push(ti);
            // color.push([
            //     100*P5.noise(si*0, ti),
            //     160*P5.noise(si*1.3, ti*0),
            //     150*P5.noise(si, ti*1.41), 
            //     255,
            // ]);
        }
    }
    let cos_theta = numeric.cos(theta);
    let sin_theta = numeric.sin(theta);

    let cos_v = numeric.cos(v);
    let sin_v = numeric.sin(v);

    let theta_half = numeric.mul(theta, 0.5);
    let cos_theta_half = numeric.cos(theta_half);
    let sin_theta_half = numeric.sin(theta_half);

    let v_double = numeric.mul(v, 2);
    let cos_v_double = numeric.cos(v_double);
    let sin_v_double = numeric.sin(v_double);

    let coscos = numeric.mul(cos_theta_half, cos_v);
    let sinsin = numeric.mul(sin_theta_half, sin_v_double);

    let sincos = numeric.mul(sin_theta_half, cos_v);
    let cossin = numeric.mul(cos_theta_half, sin_v_double);

    let a = numeric.mul(P, numeric.add(1.0, numeric.mul(e, sin_v)));

    let x = numeric.mul(R, numeric.sub(coscos, sinsin));
    let y = numeric.mul(R, numeric.add(sincos, cossin));
    let z = numeric.mul(cos_theta, a);
    let w = numeric.mul(sin_theta, a);

    let position = d3.range(x.length).map(i=>[x[i], y[i], z[i], w[i] ]);



    let view = new GrandTourView({
        canvas: canvas,
        position: position,
        color: '#555555',
        handle: true,
        brush: false,
        zoom: true,
        pointSize: 5,
        mode: 'point',
    });
    view.play();
    window.view = view;
    window.theta = theta;
    window.x = x;
    // 

    //example: csv file
    // d3.csv('data/tplink_test_all.csv')
    // .then(data=>{
    //     //array-of-objects to array-of-array
    //     let columns = data.columns.slice(1, data.columns.length-1);
    //     let features = data.map(row=>columns.map(k=>+row[k]+(Math.random()-0.5)*0.1));
    //     let labels = data.map(row=>row.label);
    //     return {features, labels};
    // })
    // .then((data)=>{
    //     //data pre-processing
    //     let mean = math.mean(data.features, 0);
    //     let std = math.std(data.features, 0);
    //     data.features = data.features.map(row=>numeric.div(row, numeric.add(std, 2)));
    //     return data;
    // })
    // .then((data)=>{
    //     //plot
    //     let sc = d3.scaleOrdinal(d3.schemeCategory10)
    //     .domain(['normal', 'abnormal']);
    //     let color = data.labels.map(l=>[...utils.hexToRgb(sc(l)), 100]);
    //     let view = new GrandTourView({
    //         canvas: canvas,
    //         position: data.features,
    //         color: color,
    //         handle: false,
    //         brush: false,
    //         zoom: true,
    //         pointSize: 3,
    //         mode: 'point',
    //         speed: 0.0001,
    //     });
    //     view.play();
    //     window.view = view;
    // });

    





    let isPlaying = true;
    window.addEventListener("keydown", event => {
        console.log(event.key);
        if(event.key == ' '){
            isPlaying = !isPlaying;
            if(isPlaying){
                view.gt.STEPSIZE = view.gt.STEPSIZE0;
            }else{
                view.gt.STEPSIZE0 = view.gt.STEPSIZE;
                view.gt.STEPSIZE = 0;
            }
        }
    });


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
