
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

// Untyped leaflet plugins import
import 'leaflet-geocoder-mapzen';




// D3
import * as d3 from 'd3';


import { MapNavComponent } from './navigator/navigator.component';
import { BasemapsComponent  } from './basemaps/basemaps.component';

 @Component({
   selector: 'leaflet-map',
   templateUrl: 'leafletmap.component.html',
   styleUrls: ['leafletmap.component.css'],
 })

 export class LeafletMap {

   // leaflet map
   public _map: Map;
   public markersGroup;
   rows: Array<string> = Array();

   public coords = '...loading';
   public currentImage = './assets/icons/cartodb_positron.png';
   public providersImages = [ './assets/icons/cartodb_positron.png',
                              './assets/icons/esri_oceanbasemap.png',
                              './assets/icons/esri_worldterrain.png',
                              './assets/icons/here_normalday.png',
                              './assets/icons/openstreetmap_de.png',
                            ];
   public providers = [
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  }),

            L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }),

            L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),

            L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 20,
                ext: 'png'
            }),

            L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
                maxZoom: 13
            }),

            L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
                attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
                subdomains: '1234',
                mapID: 'newest',
                app_id: 'Y8m9dK2brESDPGJPdrvs',
                app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
                base: 'base',
                maxZoom: 20
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

     this.providers[0].addTo(this._map);


     // add a single tile layer
<<<<<<< HEAD
     // L.tileLayer(tileData['URL'], { attribution: tileData['attribution'] }).addTo(this._map);

=======
     // L.tileLayer(tileData['url'], { attribution: tileData['attribution'] }).addTo(this._map);
    
     //Scale  //Anja
     L.control.scale({
       position: 'bottomright', 
       metric: true,
       imperial: false,
       }).addTo(this._map);
     
>>>>>>> origin/master
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

          let _lat = e.latlng.lat;
          let _lng = e.latlng.lng;
          let _selectedAddress = e.feature.properties.label;

          console.log('You have selected', _selectedAddress, _lat, _lng); // :)

          // create our own markers from MAPZEN information
          const pointMarker = L.icon({
                                        iconUrl: 'http://flyosity.com/images/_blogentries/networkicon/step4a.png',
                                        iconSize: [15, 15]
                                    });
      });

   }

   public _changeBasemapLayer(selector: number) {

      for (let i = 0; i < this.providers.length; i++) {
        this._map.removeLayer(this.providers[i]);
      }
       this.providers[selector].addTo(this._map);
       this.currentImage = this.providersImages[selector];

    }

   public _onMouseMove(e): string {

     const lng = e.latlng.lng;
     const lat = e.latlng.lat;
     this.coords = lng + '  ' + lat ;
     return this.coords;
   }

}
