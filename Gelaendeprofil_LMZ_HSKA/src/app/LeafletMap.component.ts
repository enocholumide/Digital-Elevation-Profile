/// <reference path="../typings/leaflet-geocoder-mapzen.d.ts"/>

// Platform dependent imports
 import { Component
        , EventEmitter
        , Output
        , Input
        } from '@angular/core';

// Leaflet plug-ins
import * as L from 'leaflet';
import 'leaflet.locatecontrol';

// Untyped leaflet plugins import
import 'leaflet-geocoder-mapzen';



// D3
import * as d3 from 'd3';

import { Map } from 'leaflet';
import { MapNavComponent } from './navigator/navigator.component';

 @Component({
   selector: 'leaflet-map',
   templateUrl: 'leafletmap.component.html',
   styleUrls: ['leafletmap.component.css']
 })

 export class LeafletMap {

   // leaflet map
   protected _map: Map;

   // Outputs
   @Output() layerAdded: EventEmitter<any> = new EventEmitter();
   @Output() layerRemoved: EventEmitter<any> = new EventEmitter();

   constructor() {
     // empty
   }
  /**
   * Initialize the map
   *
   * @param params: Object Map PARAMS recognized by Leaflet
   *
   * @param tileData: Object containing 'URL' and 'attribution' data for the tile layer
   *
   * @return nothing The leaflet map is created, initialized with the supplied parameters,
   * and assigned to the DIV created in the component template.
   * A single tile layer is addressed
   */
   public initialize(params: Object, tileData: Object): void {
     // Guys, we should look into the div id for this compoent with the index divs to make page more responsive
     this._map =  L.map('leaflet-map-component',
                        { center: [49.00, 8.40], // I study in Karlsruhe :)
                          zoom: 10,
                          zoomControl: false,
                        }
                        );
     // events supported in this demo
     this._map.on('layeradd'   , () => {this.__onLayerAdded(); } );
     this._map.on('layerremove', () => {this.__onLayerRemoved(); } );

     // add a single tile layer
      L.tileLayer(tileData['url'], { attribution: tileData['attribution'] }).addTo(this._map);
    
     // Leaflet installed typed plug-ins
      L.control.zoom({position: 'bottomright'}).addTo(this._map);
      L.control.locate({position: 'bottomright'}).addTo(this._map);
  
      this._searchedLocation ();

 
   } 

  /**
   * Move the map to the input location
   *
   * @param lat: number Location latitude in degrees
   *
   * @param long: number Location longitude in degrees
   */
   public toLocation(lat: number, long: number, _address: string ): void {
     this._map.panTo( [lat, long]);

      const searchedAddress = _address.toString();
      const latString = lat.toString();
      const longString = long.toString();

      const redCircleMarker = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Red-circle.svg/1024px-Red-circle.svg.png',
        iconSize: [15, 15], // size of the icon
      });

   //  L.VectorMarkers.icon
     const marker = L.marker([lat, long],
            {icon: redCircleMarker,
            draggable: false,        // Make the icon drag-able
            title: latString + ' ' + longString }
            )

            .bindTooltip(searchedAddress , {permanent: true, direction: 'top', offset: [0, -5, ], })
            .addTo(this._map);
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
    
    // initialize mapzen geocoder
    var geocoder = L.control.geocoder('mapzen-u9qqNQi', 
                        { position: 'bottomright',
                          panToPoint: true,
                          fullwidth: true,
                          expanded: false,
                          focus: true,                        // search nearby
                          placeholder: 'Search nearby',
                          markers: false,                     // disable mapzen markers we just need the details from mapzen
                        }).addTo(this._map);

      // get details from mapzen
      geocoder.on('select', function (e) {
          
          var _lat = e.latlng.lat;
          var _lng = e.latlng.lng;
          var _selectedAddress = e.feature.properties.label;

          console.log('You have selected', _selectedAddress, _lat, _lng); // :)
          
          // create our own markers from mapzen information
          const pointMarker = L.icon({
                                        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Red-circle.svg/1024px-Red-circle.svg.png',
                                        iconSize: [15, 15]
                                    });

          const marker = L.marker([_lat, _lng],
            {
            icon: pointMarker,

            title: _lat + ' ' + _lng }
            )
            .bindTooltip(_selectedAddress , {permanent: true, direction: 'top', offset: [0, -5], })
            .addTo(this._map)
      });
   }
}
