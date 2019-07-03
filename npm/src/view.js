import * as d3 from 'd3';
import * as THREE from 'three';
import * as numeric from 'numeric';
import {baseColorsInt, reshape} from './utils';
// import {OrbitControls} from 'three-orbit-controls';
var OrbitControls = require('three-orbit-controls')(THREE);

window.THREE = THREE;

export class GrandTourView {
    constructor(urls){
        this.data = {};
        this.initScene();
        this.scale_data2world = d3.scaleLinear().range([0,1]);
        this._epochIndex = 0;
    }

    initScene(){
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera( 45, 
            window.innerWidth/window.innerHeight, 
            0.01, 1000);
        camera.position.set(0,0,6);
        camera.lookAt(0,0,0);

        let renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        var orbit = new OrbitControls( camera, renderer.domElement );
        // orbit.enableZoom = false;

        //=============================

        let geometry = new THREE.SphereGeometry(0.01,32,32);

        let objectGroup = new THREE.Group();
        scene.add(objectGroup);

        //=============================

        let ambientLight = new THREE.AmbientLight( 0xffffff, 1);
        scene.add( ambientLight );

        // let light1 = new THREE.DirectionalLight( 0xffffff, 0.4);
        // light1.position.set( -50, 50, 80 );
        // scene.add( light1 );

        let pointLight = new THREE.PointLight( 0xffffff, 0.9, 0 );
        pointLight.position.set( 50, 20, 50 );
        scene.add( pointLight );

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.objectGroup = objectGroup;
        this.geometry = geometry;
        //=============================
    }

    saveData(dataObj, url){
        this.data[dataObj.name] = dataObj.data;
    }

    isDataReady(){
        // TODO
        return this.data.d10 !== undefined 
        && this.data.labels !== undefined;
    }

    get epochIndex(){
        return this._epochIndex;
    }
    set epochIndex(e){
        this._epochIndex = e;
        this.plot(e);
    }
    

    plot(e){
        let data = this.data.d10[e];
        let vmax = d3.max(data, row=>d3.max(row, d=>Math.abs(d)));
        this.scale_data2world.domain([0, vmax]);
        console.log(vmax);
        let labels = this.data.labels;

        let addPoint;
        if(this.objectGroup.children.length == 0){
            addPoint = (d, i)=>{
                let meshMaterial = new THREE.MeshPhysicalMaterial({
                    color: baseColorsInt[labels[i]],
                    // flatShading: true,
                    roughness: 0.73,
                    metalness: 0.48,
                    clearCoat: 0.37,
                    clearCoatRoughness: 0.3,
                });
                let point = new THREE.Mesh(this.geometry, meshMaterial);
                point.position.set(
                    ...d.slice(0,3).map(x=>this.scale_data2world(x))
                );

                this.objectGroup.add(point);
            }
        }else{
            addPoint = (d, i)=>{
                this.objectGroup.children[i].position.set(
                    ...d.slice(0,3).map(x=>this.scale_data2world(x))
                );
            }
        }
        for(let i=0; i<data.length; i++){
            // let meshMaterial = new THREE.MeshPhongMaterial({
            addPoint(data[i], i);
        }
    }


    show(){
        requestAnimationFrame(this.show.bind(this));
        this.objectGroup.rotation.y += 0.005;
        this.renderer.render(this.scene, this.camera);
    }

}