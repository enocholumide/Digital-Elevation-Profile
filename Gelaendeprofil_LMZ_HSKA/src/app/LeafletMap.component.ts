// Platform dependent imports
 import { Component
        , EventEmitter
        , Output
        , Input
        , Injectable
        , ViewChild
        } from '@angular/core';

// Leaflet plug-ins
import * as L from 'leaflet';
import { Map } from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet-geocoder-mapzen';

// D3
import * as d3 from 'd3';

 @Component({
   selector: 'leaflet-map',
   templateUrl: 'leafletmap.component.html',
   styleUrls: ['leafletmap.component.css'],
 })

 export class LeafletMap {
    
    // global 
    providersDescription = ['SATTELITE','RELIEF','LANDSCAPE','TOPO MAP','OSM'];
    initMap = 4;
    
    // leaflet map
    public _map: Map;
    public coords = '...loading';
    public currentSelector:number;
    public currentproviderDescription = this.providersDescription[this.initMap];
    public providersImages = [ './assets/icons/satellitenbild.png',
                                './assets/icons/relief_maps4free.png',
                                './assets/icons/thunderforest_landscape.png',
                                './assets/icons/esri_world_topomap.png',
                                './assets/icons/openstreetmap_de.png',
                              ];
                            
    public currentImage = this.providersImages[this.initMap];
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

    // Outputs
    @Output() layerAdded: EventEmitter<any> = new EventEmitter();
    @Output() layerRemoved: EventEmitter<any> = new EventEmitter();

   constructor() {
     // empty
   }

   public initialize(params: Object, tileData: Object): void {

     this._map =  L.map('leaflet-map-component',
                        { center: [49.00, 8.40], // I study in Karlsruhe :)
                          zoom: 10,
                          zoomControl: false,
                        }
                        );
     // events supported in this demo
     this._map.on('layeradd'   , () => {this.__onLayerAdded(); } );
     this._map.on('layerremove', () => {this.__onLayerRemoved(); } );

     this.providers[this.initMap].addTo(this._map);

     // try
     
     
     //Scale  //Anja
     L.control.scale({
       position: 'bottomright', 
       metric: true,
       imperial: false,
       }).addTo(this._map);
     
     // Leaflet installed typed plug-ins
      L.control.zoom({position: 'bottomright'}).addTo(this._map);
      L.control.locate({position: 'bottomright'}).addTo(this._map);

      this._map.on('mousemove', this._onMouseMove, this);
      this._searchedLocation ();
   }

   public toLocation(e): void { 
     this._map.panTo( e.lat, e.lng );
   }

   protected __onLayerAdded(): void {
     // perform additional logic on layer added here
     this.layerAdded.emit();
   }

   protected __onLayerRemoved(): void {
     // perform additional logic on layer removed here

     this.layerRemoved.emit();
   }

   public _searchedLocation (): void {

    // initialize MAPZEN Geocoder
    let geocoder = L.control.geocoder('mapzen-u9qqNQi',
                        { position: 'bottomright',
                          panToPoint: true,
                          fullwidth: true,
                          expanded: false,
                          focus: true,                        // search nearby
                          placeholder: 'Search nearby',
                          markers: false,                     // disable MAPZEN markers we just need the details from MAPZEN
                        }).addTo(this._map);
           
      // get details from MAPZEN
      geocoder.on('select', function (e) {

          let _lat = Number(e.latlng.lat);
          let _lng = Number(e.latlng.lng);
          var _selectedAddress = e.feature.properties.label;

          console.log('You have selected', _selectedAddress, _lat, _lng); // :)

          // create markers from MAPZEN information
          const pointMarker = L.icon({
                                        iconUrl: 'http://flyosity.com/images/_blogentries/networkicon/step4a.png',
                                        iconSize: [15, 15]
                                    });
                     
          // create popup contents
          var customPopup = document.createElement('a');
          customPopup.innerHTML = ` <div class="markersdetails">
                                <div class="info" id="info1">marker address</div>
                                <div class="info" id="info2"><i class="fa fa fa-plus-circle"></i> show in profile</div>
                                <div class="info" id="info3" click="_onRemoveMarker()"><i class="fa fa fa-times-circle"></i> delete</div>
                              </div>
                            `;

                // Add marker to leaflet map                       
                const marker = L.marker([_lat, _lng],
                {
                  icon: pointMarker,
                  title: _lat + ' ' + _lng }
                )
                .bindTooltip(_selectedAddress , {permanent: true, direction: 'top', offset: [0, -5], })
                .bindPopup(customPopup, { offset: [80, 175], })
                .addTo(this._map) 

                /** // not working yet :(
                document.getElementById('a').onclick = function(e) {
                  if(e.target.addEventListener("confirm-button")){
                      alert("Click Event Fired !")
                      // do something
                  }  
                }
                */
            });
        }

   public _changeBasemapLayer(selector: number) {

      for (let i = 0; i < this.providers.length; i++) {
        this._map.removeLayer(this.providers[i]); 
      }
       this.providers[selector].addTo(this._map);
       this.currentImage = this.providersImages[selector];
       this.currentproviderDescription = this.providersDescription[selector];
       this.currentSelector= selector;
       
    }

   public _onMouseMove(e): string {

     const lng = e.latlng.lng;
     const lat = e.latlng.lat;
     this.coords = lng + '  ' + lat ;
     return this.coords;
   }

  public _onRemoveMarker():void {
    console.log('test');
  }

}