import {Component, ViewChild} from '@angular/core';
import { LeafletMap } from '../LeafletMap.component';
import * as L from 'leaflet';
import { Map } from 'leaflet';


@Component({
  selector: 'sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['sidebar.component.css'],
  
})
export class SideBarComponent { 

    @ViewChild(LeafletMap) profileFunctions: LeafletMap
  
    name = 'Angular'; 
        public map: Map;

    drawStart(){

        var pointx = 9;
        var pointy = 49;


        // this.profileFunctions._drawStart(9, 49);
    }
}