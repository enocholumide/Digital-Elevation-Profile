import { Injectable } from '@angular/core';
import {Map} from "leaflet";

@Injectable()
export class MapService {
  public map: Map;
  constructor() { }

    public providers = [
          
          L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
              maxZoom: 20,
              subdomains:['mt0','mt1','mt2','mt3']
          }),

          L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
              maxZoom: 20,
              subdomains:['mt0','mt1','mt2','mt3']
          }),
          
          // Thunderforest Landscape
          L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=ce1b82f48efd47b6bc58e40d7aeec1bb', {
              maxZoom: 20,
          }),

          // ESRI World TopoMap
          L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
              maxZoom: 20,
          }),
          
          // OpenStreetMap
          L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 20,
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }),


          L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
              attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
              subdomains: '1234',
              mapID: 'newest',
              app_id: 'Y8m9dK2brESDPGJPdrvs',
              app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
              base: 'base',
              maxZoom: 20
        }),

          L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/satellite.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
              attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
              subdomains: '1234',
              mapID: 'newest',
              app_id: 'Y8m9dK2brESDPGJPdrvs',
              app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
              base: 'aerial',
              maxZoom: 20
          }),

          L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
              subdomains: 'abcd',
              maxZoom: 19
          }),
        ];

    public providersImages = [ '../../assets/icons/satellitenbild.png',
                          '../../assets/icons/relief_maps4free.png',
                          '../../assets/icons/thunderforest_landscape.png',
                          '../../assets/icons/esri_world_topomap.png',
                          '../../assets/icons/openstreetmap_de.png',
                        ];

    public providersDescription = ['SATTELITE','RELIEF','LANDSCAPE','TOPO MAP','OSM'];  

}


