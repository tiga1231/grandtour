import * as d3 from 'd3';
import * as THREE from 'three';
// let THREE = require('three');
// THREE.SSAOPass = require('three.SSAOPass');

import * as numeric from 'numeric';
import {baseColorsInt, reshape, mix} from './utils';
import { GrandTour } from './grandtour';
import { SelectionBox, SelectionHelper } from 'three-full';

let OrbitControls = require('three-orbit-controls')(THREE);

import { EffectComposer, SSAOEffect, 
    RenderPass, NormalPass, EffectPass } from 'postprocessing';

window.THREE = THREE;

export class GrandTourView {
    constructor(kwargs){

        this.data = {};
        this.scale_data2world = d3.scaleLinear().range([-1,1]);
        this.t = 0;
        for (let k in kwargs){
            this[k] = kwargs[k];
        }
        this.gt = new GrandTour(this.ndim);
        this._epochIndex = this.nepoch - 2;

        document.addEventListener('keypress', this.onKeyPress.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.initScene();
        this.initOverlay();
    }

    onKeyDown(event){
        if (event.key === 'Control'){
            this.orbit.enabled = false;
            this.selectionHelper.enabled = true;
        }
    }

    onKeyUp(event){
        if (event.key === 'Control'){
            this.orbit.enabled = true;
            this.selectionHelper.enabled = false;
        }
    }

    initOverlay(){
        this.selectionBox = new SelectionBox(this.camera, this.scene);
        this.selectionHelper = new SelectionHelper(this.selectionBox, this.renderer, 'selectBox');
        this.selectionHelper.enabled = false;

        document.addEventListener('mousedown', ()=>{
            if(this.selectionHelper.enabled){
                for ( let item of this.selectionBox.collection ) {
                    item.material.emissive = new THREE.Color( 0x000000 );
                }
                this.selectionBox.startPoint.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5 );
            }
            
        });

        document.addEventListener( 'mousemove', (event)=>{
            if (this.selectionHelper.enabled && this.selectionHelper.isDown) {
                for ( let i = 0; i < this.selectionBox.collection.length; i ++ ) {
                    this.selectionBox.collection[i].material.emissive = new THREE.Color( 0x000000 );
                }
                this.selectionBox.endPoint.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5 );
                let selected = this.selectionBox.select();
                for (let i=0; i<selected.length; i++) {
                    selected[i].material.emissive = new THREE.Color( 0xffffff );
                }
            }
        });
        // this.overlay = d3.select('body').insert('svg', 'canvas');

        // let width = window.innerWidth;
        // let height = window.innerHeight;

        // this.overlay
        // .attr('width', width)
        // .attr('height', height)
        // .style('position', 'absolute');

        // this.brush = d3.brush()
        // .on('brush', ()=>{});

        // this.gBrush = this.overlay.append('g')
        // .attr('class', 'brush')
        // .call(this.brush);

        // let orbit = new OrbitControls( this.camera, this.overlay.node() );
        this.orbit = new OrbitControls( this.camera, this.renderer.domElement );

    }

    onKeyPress(event){
        if(event.key === 'n'){
            this.epochIndex = (this.epochIndex+1)%this.nepoch;
        }else if(event.key === 'b'){
            this.epochIndex = (this.epochIndex-1)%this.nepoch;
        }
    }

    onMouseMove(event){
        // event.preventDefault();
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    initScene(){
        let scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x222222 );
        // scene.fog = new THREE.Fog( 0x222222, 0, 5);

        let width = window.innerWidth;
        let height = window.innerHeight;

        let camera = new THREE.PerspectiveCamera( 45, 
            width/height, 
            0.01, 1000);
        camera.position.set(1,2,2);
        camera.lookAt(0,0,0);

        let renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // let orbit = new OrbitControls( camera, renderer.domElement );
        // orbit.enableZoom = false;

        //=============================
        let objectGroup = new THREE.Group();
        scene.add(objectGroup);

        //=============================
        let ambientLight = new THREE.AmbientLight( 0xffffff, 1.5);
        scene.add( ambientLight );

        let pointLight = new THREE.PointLight( 0xffffff, 0.3, 0 );
        pointLight.position.set( 50, 20, 50 );
        scene.add( pointLight );
        //=============================

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.objectGroup = objectGroup;
        this.geometry = new THREE.SphereGeometry(0.01,32,32);
        this.materials = d3.range(10).map(i=>{
            return new THREE.MeshPhysicalMaterial({
                color: baseColorsInt[i],
                // flatShading: true,
                roughness: 0.73,
                metalness: 0.48,
                clearCoat: 0.37,
                clearCoatRoughness: 0.3,
            });
        });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
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
    }
    

    addPoint(d, i, label, replace=false){
        let position = d.slice(0,3).map(x=>this.scale_data2world(x));
        if (replace){
            this.objectGroup.children[i].position.set(...position);
        }else{
            let point = new THREE.Mesh(this.geometry, new THREE.MeshPhysicalMaterial().copy(this.materials[label]));
            point.position.set(...position);
            this.objectGroup.add(point);
        }
    }


    plot(positions){
        let labels = this.data.labels;
        let replace = false;
        if(this.objectGroup.children.length > 0){
            replace = true;
        }
        for(let i=0; i<positions.length; i++){
            this.addPoint(positions[i], i, this.data.labels[i], replace);
        }
    }


    show(t=0){
        let dt = t-(this.t||0);
        this.t = t;

        let data = mix(
            this.data.d11[Math.floor(this.epochIndex)], 
            this.data.d11[(Math.floor(this.epochIndex)+1) % this.nepoch],
            this.epochIndex - Math.floor(this.epochIndex)
        );
        
        let vmax = d3.max(data, row=>d3.max(row, d=>Math.abs(d)));

        let positions = this.gt.project(data, 0);
        this.scale_data2world.domain([-vmax, vmax]);
        this.plot(positions);

        // this.objectGroup.rotation.y += 0.005;
        // this.composer.render();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.show.bind(this));

    }

}