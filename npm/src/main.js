import { GrandTourView } from './view';
import { reshape } from './utils';

import * as d3 from 'd3';
window.d3 = d3;

function parseData(buffer, url){
    let dataRegex = url.match(/(d\d+)\.bin$/);
    let labelRegex = url.match(/(labels).bin$/);
    if (dataRegex !== null){
        let name = dataRegex[1];
        let array = new Float32Array(buffer);
        return {
            name, 
            data:reshape(array, [100,1000,10])
        };
    }else if(labelRegex !== null){
        let name = labelRegex[1];
        let array = new Uint8Array(buffer);
        return {
            name, 
            data: array
        };
    }
}

function saveDataToView(urls, view){
    urls.forEach(url=>{
        fetch(url).then((response)=>{
            response.arrayBuffer().then(value=>{
                let dataObj = parseData(value, url);
                view.saveData(dataObj, url);
            });
        });
    });
}

window.onload = ()=>{
    let view = new GrandTourView();
    let urls = ['/data/d10.bin', '/data/labels.bin'];
    saveDataToView(urls, view);
    // while(view.isDataReady() !== true){
    let hanlderId = setInterval(()=>{
        if(view.isDataReady()){
            view.plot(99);
            view.show();
            clearInterval(hanlderId)
        }
    }, 2000);
    // }
    window.view = view;
}
