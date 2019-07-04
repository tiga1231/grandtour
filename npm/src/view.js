import * as d3 from 'd3';
import * as THREE from 'three';
// let THREE = require('three');
// THREE.SSAOPass = require('three.SSAOPass');

import * as numeric from 'numeric';
import {baseColorsInt, reshape, mix} from './utils';
import { GrandTour } from './grandtour';
// import {OrbitControls} from 'three-orbit-controls';
var OrbitControls = require('three-orbit-controls')(THREE);

import { EffectComposer, SSAOEffect, 
    RenderPass, NormalPass, EffectPass } from 'postprocessing';

window.THREE = THREE;
window.SSAOEffect = SSAOEffect;

export class GrandTourView {
    constructor(urls){
        this.data = {};
        this.initScene();
        this.scale_data2world = d3.scaleLinear().range([-1,1]);
        this._epochIndex = 98;
        this.t = 0;
        this.gt = new GrandTour(10);

    }

    initScene(){
        let scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x222222 );
        // scene.fog = new THREE.FogExp2( 0x222222, 0.3 );

        let width = window.innerWidth;
        let height = window.innerHeight;

        let camera = new THREE.PerspectiveCamera( 45, 
            width/height, 
            0.01, 1000);
        camera.position.set(0,2,4);
        camera.lookAt(0,0,0);

        let renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // let composer = new EffectComposer( renderer );

        // let renderPass = new RenderPass(scene, camera);
        // renderPass.renderToScreen = true;
        // composer.addPass( renderPass );
        
        // const normalPass = new NormalPass(scene, camera);
        // window.normalPass = normalPass;
        // composer.addPass( normalPass );

        // let ssao = new SSAOEffect(
        //     camera, 
        //     null,
        //     {
        //         radius: 18, 
        //         distanceThreshold: 0.999,
        //         distanceFalloff: 0.9,
        //         scale: 1,
        //         // samples:50
        //     }
        // );
        // let effectPass = new EffectPass(camera, ssao);
        // effectPass.renderToScreen = true;
        // composer.addPass( effectPass );
        // window.ssao = ssao;
        // window.effectPass = effectPass;

        var orbit = new OrbitControls( camera, renderer.domElement );
        // orbit.enableZoom = false;

        //=============================

        let geometry = new THREE.SphereGeometry(0.01,32,32);

        let objectGroup = new THREE.Group();
        scene.add(objectGroup);

        //=============================

        let ambientLight = new THREE.AmbientLight( 0xffffff, 1.5);
        scene.add( ambientLight );

        // let light1 = new THREE.DirectionalLight( 0xffffff, 0.4);
        // light1.position.set( -50, 50, 80 );
        // scene.add( light1 );

        let pointLight = new THREE.PointLight( 0xffffff, 0.3, 0 );
        pointLight.position.set( 50, 20, 50 );
        scene.add( pointLight );

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.objectGroup = objectGroup;
        this.geometry = geometry;
        // this.composer = composer;
        //=============================
    }

    saveData(dataObj, url){
        this.data[dataObj.name] = dataObj.data;
    }

    isDataReady(){
        // TODO
        return this.data.d11 !== undefined 
        && this.data.labels !== undefined;
    }

    get epochIndex(){
        return this._epochIndex;
    }
    set epochIndex(e){
        this._epochIndex = e;
        this.plot(e);
    }
    

    plot(positions){
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

        for(let i=0; i<positions.length; i++){
            // let meshMaterial = new THREE.MeshPhongMaterial({
            addPoint(positions[i], i);
        }
    }


    show(t=0){
        let dt = t-(this.t||0);
        this.t = t;


        let data = mix(
            this.data.d11[Math.floor(this.epochIndex)], 
            this.data.d11[Math.floor(this.epochIndex)+1],
            this.epochIndex-Math.floor(this.epochIndex)
        );
        let vmax = d3.max(data, row=>d3.max(row, d=>Math.abs(d)));

        let positions = this.gt.project(data, 0);
        this.scale_data2world.domain([-vmax, vmax]);
        this.plot(positions);

        // this.objectGroup.rotation.y += 0.001;
        // this.composer.render();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.show.bind(this));

    }

}