import {    Component
        ,   Injectable
        ,   EventEmitter
        } from '@angular/core';
    
import { LeafletMap } from '../LeafletMap.component';
import * as L from 'leaflet';
import { Map } from 'leaflet';

@Component({
    moduleId: module.id,
    selector: 'basemaps',
    templateUrl: 'basemaps.component.html',
    styleUrls: ['basemaps.component.css']
})

export class BasemapsComponent {

    basemapOption: string;
    constructor(){
        //empty
    }

    mapLayers(layer:string){
        this.basemapOption = layer;
        console.log(layer);
    }

    
 }