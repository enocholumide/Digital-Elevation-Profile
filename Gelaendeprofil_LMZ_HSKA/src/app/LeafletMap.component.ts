// Platform dependent imports
 import { Component
        , EventEmitter
        , Output
        , Input
        , Injectable
        , ViewChild
        , Renderer
        } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { PopUPComponent  } from './popup/popup.component';
import {Observable} from 'rxjs/Rx';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

// Leaflet plug-ins
import * as L from 'leaflet';
import { Map } from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet-geocoder-mapzen';
import 'leaflet-draw';
import 'leaflet-overpass-layer';

// Turf
import * as turf from 'turf';

// D3
import * as d3 from 'd3';

 @Component({
   selector: 'leaflet-map',
   templateUrl: 'leafletmap.component.html',
   styleUrls: ['leafletmap.component.css'],
 })

 export class LeafletMap {
    
    // Child components
    @ViewChild(PopUPComponent) popupHTML: PopUPComponent;
    
    // Outputs
    @Output() layerAdded: EventEmitter<any> = new EventEmitter();
    @Output() layerRemoved: EventEmitter<any> = new EventEmitter();

    @Output() drawstart: EventEmitter<any> = new EventEmitter();
    @Output() created: EventEmitter<any> = new EventEmitter();
    @Output() editstart: EventEmitter<any> = new EventEmitter();
    @Output() edited: EventEmitter<any> = new EventEmitter();
    @Output() deleted: EventEmitter<any> = new EventEmitter();

    constructor( private _http: Http) {
      // empty

    }

    // BaseMap 
    providersDescription = ['SATTELITE','RELIEF','LANDSCAPE','TOPO MAP','OSM'];
    initMap = 4;

    // method called from app module, passed to the selector of the leaflet map, @important
    protected __onLayerAdded(): void {
      // perform additional logic on layer added here
      this.layerAdded.emit();
    }

    protected __onLayerRemoved(): void {
      // perform additional logic on layer removed here
      this.layerRemoved.emit();
    }

    protected __onDrawStart(e): void {
      this.drawnItems.clearLayers();
      this.drawnMarkers.clearLayers();

      this.drawstart.emit();
    } 
    
    protected __onDrawCreated(e): void {
      console.log('%cEvent: draw:created: ', 'color: grey');

      let totalDistance = [];
      let profileVertex = [];
      let vertex:L.Marker;
      let layer = e.layer;
      
      this.drawnItems.addLayer(layer);
      
      // Stored leaflet ID for the line, this will be called when Edited - important
      this.lineLeafletID = 0;
      this.lineLeafletID = layer._leaflet_id;
      console.log('LineLeaflet - ID: ' + this.lineLeafletID);

      // Empty stored points data on draw created and repopulate
      this.storedPoints_LatLng = [];
      for (let i = 0; i < layer._latlngs.length; i++) {
          this.storedPoints_LatLng[i] = L.latLng (
                                    layer._latlngs[i].lat, 
                                    layer._latlngs[i].lng
                                    );
                                   
          vertex = L.marker( layer._latlngs[i], 
                      {
                      icon: this.profileIcon,
                      title: this.storedPoints_LatLng[i].lat + ' ' + this.storedPoints_LatLng[i].lng
                      }).bindTooltip(this.getMarkerLabel(i) , {permanent: true, direction: 'top', offset: [0, -5], });
          
          profileVertex[i] = vertex;
          this.drawnMarkers.addLayer(profileVertex[i]);
          
      }

      console.log('%cNew Created Points: ',  'color: red'); console.log(this.storedPoints_LatLng);
      console.log('%cNew Created Feature Parameters:  ', 'color: blue');
      
      this._getAllVertix();
      
      // this.drawIntermediateVertix(); - Might be needed, but won't spend much time on this for now;
    } // Draw Created Event

    protected __onEditStart(e): void {
		
		this.drawnMarkers.clearLayers();
        this.editstart.emit();
    }

    protected __onDrawEdited(e): void {
      console.log('%cEvent: draw:edited ', 'color: grey');

      this.__onupdateView('draw:edited');

      let profileVertex = [];
      let vertex:L.Marker;
      let elayers:any;
      elayers = e.layers; 
      
      // Empty stored points and re-populate
      this.storedPoints_LatLng = [];
      for (let i = 0; i < elayers._layers[this.lineLeafletID]._latlngs.length; i++) {
          this.storedPoints_LatLng[i] = L.latLng (
                                          elayers._layers[this.lineLeafletID]._latlngs[i].lat, 
                                          elayers._layers[this.lineLeafletID]._latlngs[i].lng
                                    );
          // Refuse to draw markers when the nodes are more than 6 - the maximum                           
          if (i <= 5) {  
          vertex = L.marker( elayers._layers[this.lineLeafletID]._latlngs[i], 
                      {
                      icon: this.profileIcon,
                      title: this.storedPoints_LatLng[i].lat + ' ' + this.storedPoints_LatLng[i].lng
                      }).bindTooltip(this.getMarkerLabel(i) , {permanent: true, direction: 'top', offset: [0, -5], }); 
          
          profileVertex[i] = vertex;
          this.drawnMarkers.addLayer(profileVertex[i]);
        }
        
        // At the end of the loop, check if the stored items are more than 6, then slice the stored points
        if (i === (elayers._layers[this.lineLeafletID]._latlngs.length - 1)) {
            if ( this.storedPoints_LatLng.length > 5) {
              console.log('%c NOTE: Edited Item have been sliced, only first 6 nodes retained. ', 'background: #000000; color: #ffffff');
              this.storedPoints_LatLng = this.storedPoints_LatLng.slice(0, 6)
            }
        }
      }

      console.log('%cEdited Points: ', 'color: red'); console.log( this.storedPoints_LatLng );
      console.log('%cEDITED Feature Parameters: ', 'color: blue');

      this._getAllVertix();

      this.edited.emit();
    }

    protected __onDrawDeleted(e): void {
          this.drawnMarkers.clearLayers();

          this.deleted.emit();    
    }

    // Elevation profile variables
    public lineLeafletID:number;
    public storedPoints_LatLng = [];
    public featureVertices = [];
    public drawnItems:L.FeatureGroup;
    public drawnMarkers:L.FeatureGroup;
    public profileIcon:L.Icon;
    public peakIcon:L.Icon;
    public vertexIcon:L.Icon;

    // Elevation request parameters, uses Google API (for now)
    public REQUEST:string;
    public GOOGLE_API_KEY:string='AIzaSyCsc5MNOSnljA4itLgsykY-686fFBn3bag';
    public elevation;
    // Points of interest; uses OverPASS API
    public POINTS_OF_INTEREST;
    public PEAKS: {coord: L.LatLng, name: string }[] = [];

    // Leaflet Map and base maps parameters
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



    public initialize(params: Object, tileData: Object): void {

     // Initialize leaflet map and center at karlsruhe
      this._map =  L.map('leaflet-map-component',
                        { center: [49.00, 8.40], 
                          zoom: 12,
                          zoomControl: false,
                          scrollWheelZoom: true,
                          //drawControl: true,

                       }                     
                        );
      


      // Add tile layer to Map
      this.providers[this.initMap].addTo(this._map);

      // All events captured
      this._map.on('layeradd'   , () => {this.__onLayerAdded(); } );
      this._map.on('layerremove', () => {this.__onLayerRemoved(); } );
      
      this._map.on('draw:drawstart', this.__onDrawStart, this);
      this._map.on('draw:created', this.__onDrawCreated, this);
      this._map.on('draw:editstart', this.__onEditStart, this);
      this._map.on('draw:edited', this.__onDrawEdited, this);
      this._map.on('draw:deleted', this.__onDrawDeleted, this);

      this._map.on('mousemove', this._onMouseMove, this);

      // Drawing Variables, Markers and Icons
      let polyline:any;
      let markers:any;
      this.drawnItems = new L.FeatureGroup(polyline);
      this.drawnMarkers = new L.FeatureGroup(markers);
      this.profileIcon = L.icon({
            iconUrl: '../assets/markers/profile.png',
            iconSize: [15, 15]
      });

      this.vertexIcon = L.icon({
            iconUrl: '../assets/markers/vertex.png',
            iconSize: [20, 20]
      });

      this.peakIcon = L.icon({
            iconUrl: '../assets/markers/peak.png',
            iconSize: [25, 25],
      });

      
      // Leaflet plugins; the order is required
      L.control.scale({ position: 'bottomright', metric: true, imperial: false,}).addTo(this._map);
      L.control.zoom({position: 'bottomright'}).addTo(this._map);
      L.control.locate({position: 'bottomright'}).addTo(this._map);

      // Add Leaflet Draw
      var drawControl = new L.Control.Draw({
          position:'topright',
          draw: {polygon:false, rectangle:false, circle:false, polyline:true, marker:false},
          edit: {
              featureGroup: this.drawnItems, // important for the editor options to be active and finsih draw
          }
      });

      // Add draw control to map
      this._map.addControl(drawControl);

      // Add all layers
      this._map.addLayer(this.drawnItems);
      this._map.addLayer(this.drawnMarkers);
      //TODO: Create Separate layer for peaks shown on the map

      // Proceed to method that handles gelocation after finished iniializing map
      this._searchedLocation ();

   } // initialize

   // method is depreciated, inherited from the template, it might still be useful
   public toLocation(e): void { 
     this._map.panTo( e.lat, e.lng );
   } // toLocation

   // geloocator method
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
                                    }); // point marker
                     
          // create popup contents
          var customPopup = document.createElement('a');
          customPopup.innerHTML = ` <div class="markersdetails">
                                <div class="info" id="info1">marker address</div>
                                <div class="info" id="info2"><i class="fa fa fa-plus-circle"></i> show in profile</div>
                                <div class="info" id="info3" click="_onRemoveMarker()"><i class="fa fa fa-times-circle"></i> delete</div>
                              </div>
                            `;

                // Add marker to leaflet map                       
                this.marker = L.marker([_lat, _lng],
                {
                  icon: pointMarker,
                  title: _lat + ' ' + _lng }
                )
                .bindTooltip(_selectedAddress , {permanent: true, direction: 'top', offset: [0, -5], })
                .bindPopup(customPopup, { offset: [80, 175], })
                .addTo(this._map)
                
                console.log( 'searched markers: ');
                console.log(this.marker);

                this.marker.on('click', function(){
                console.log('yay'); // test, note @Anja
                })
                /** // not working yet :(
                document.getElementById('a').onclick = function(e) {
                  if(e.target.addEventListener("confirm-button")){
                      alert("Click Event Fired !")
                      // do something
                  }  
                }

                */               
            }); // geocoder
        } // _searchedLocation

   // method called from the html template on select of icons on the map
   public _changeBasemapLayer(selector: number) {

      // remove all previous basemap
      for (let i = 0; i < this.providers.length; i++) {
        this._map.removeLayer(this.providers[i]); 
      }

      // proceed to add basemap selected by user, change icon image and label of the icon toggle
       this.providers[selector].addTo(this._map);
       this.currentImage = this.providersImages[selector];
       this.currentproviderDescription = this.providersDescription[selector];
       this.currentSelector= selector;
       
    } // _changeBasemapLayer
 

    // Listner for updating user mouse position 
    public _onMouseMove(e): string {
      const lng = e.latlng.lng;
      const lat = e.latlng.lat;
      this.coords = lat + '  ' + lng ;
      return this.coords; // coords variable was interpolated at the input element in the html template
    } // _onMouseMove

    // test method; useless
    _drawStart(x:number, y:number) {
      console.log('test - side bar component was here');
    }

    public _getDistance(point1:L.LatLng, point2:L.LatLng):number {
      /**
       * Returns the distance (in meters)  between two points calculated using the Haversine formula
       * This is the same os the leaflet 'distance to' method
       * Ref 1: http://leafletjs.com/reference.html#latlng - LEAFLET DOCUMENTATION
       * Ref 2: http://www.movable-type.co.uk/scripts/latlong.html - by Chris Veness
       * Ref 3: https://github.com/soichih/node-sgeo - Soichi Hayashi", "email": "soichih@gmail.com
       * 
       * For Ref 2, the page presents a variety of calculations for lati­tude/longi­tude points, 
       * with the formulæ and js code fragments for implementing them.
       * 
       * Thus, we will assume the earth is spherical, for now (ignoring ellipsoidal effects) 
       * – which is more accurate, well, we may not need so much accurracy for now.
       * Perhaps, this can be an improvement moving forward; 
       * Especially if the user wants elevation profile betwen Karlsruhe and Moscow :-)
       * 
       * For longer distances, this is purely a SECOND GEODETIC MAJOR TASK problem
       * Perhaps, this can be an improvement moving forward. :-) this.more_work :-) 
       */       
      const RAD = 0.01745329252;
      const DEG = 57.295779513;

        var R = 6371e3; // metres
        var φ1 = point1.lat * RAD;
        var φ2 = point2.lat * RAD;
        var Δφ = (point2.lat-point1.lat) * RAD;
        var Δλ = (point2.lng-point1.lng) * RAD;

        var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;

        return d;
    } // function _getDistance


    public _getAllVertix() {

      /**
      * The distrubtion of the vertex based on the distance have to be discussed
      * This is just a test scenerio
      */

      const MAXVERTIX = 200;

      let totalLength = 0;          // 1.
      let partLength = [];          // 2.
      let totalVertix = 0;          // 3.
      let partVertixRatio = [];     // 4.
      let partVertixNumber = [];    // 5.
      let partVertixCoords = [];
      let featureVertixCoords = []; // 6.

      for (let i = 0; i < (this.storedPoints_LatLng.length - 1); i++) {
        // 1.
        totalLength += this._getDistance(
                                    this.storedPoints_LatLng[i],
                                    this.storedPoints_LatLng[i+1]);
        // 2.
        partLength[i] = this._getDistance(
                                    this.storedPoints_LatLng[i],
                                    this.storedPoints_LatLng[i+1]);                        
                                   
        if (i === (this.storedPoints_LatLng.length - 2) ) {
          // 3. 
          console.log('Total Length of feature: ' + totalLength);
          if (totalLength < 1000) {
              totalVertix = MAXVERTIX;
              console.log('Total_Vertix: ' + (totalVertix));    
          } else if (totalLength < 2000) {
              totalVertix = Math.round(MAXVERTIX * 0.8);
              console.log('Total_Vertix: ' + (totalVertix));     
          } else if (totalLength < 4000) {
              totalVertix = Math.round(MAXVERTIX * 0.6);
              console.log('Total_Vertix: ' + (totalVertix));           
          } else if (totalLength < 5000) {
              totalVertix = Math.round(MAXVERTIX * 0.4);
              console.log('Total_Vertix: ' + (totalVertix));    
          }
          else {
              totalVertix = MAXVERTIX * 0.2;
              console.log('Total_Vertix: ' + (totalVertix));    
          }
          // 4.
          for (let j = 0; j < (this.storedPoints_LatLng.length - 1); j++ ){
            partVertixRatio[j] = partLength[j] / totalLength;
            // 5.
            if (j === (this.storedPoints_LatLng.length - 2)) {
              console.log('Total number of Paths: ' + partLength.length);
              console.log('Parts Vertix Ratios: ' + partVertixRatio);    
              for (let k = 0; k < (this.storedPoints_LatLng.length - 1); k++ ) {
                  partVertixNumber [k] = Math.round(totalVertix * partVertixRatio[k]);
              } console.log('Parts Vertix Numbers: ' + partVertixNumber);    
            } // 5. @j
          } // 4. @j
        } // 3. @i                               
      } // 1, 2 @i


      // Empty all incoming arrays
      this.featureVertices = [];
      let tempArray = [];

      // Push the first lat and lng
      this.featureVertices.push(this.storedPoints_LatLng[0]);

      // Push all parts lat and lng
      for (let i = 0; i < partLength.length; i++ ) {
        tempArray = [];

        // Here, get the lat and lng for a line path and ...
        tempArray = this._getfractionPoints(this.storedPoints_LatLng[i], this.storedPoints_LatLng[i+1], partVertixNumber[i]);
        for (let j = 0; j < tempArray.length; j++ ) {
            this.featureVertices.push(tempArray[j]);
        }
        // ... push the next node lat and lng
        this.featureVertices.push(this.storedPoints_LatLng[i+1]);
      }

      // Continue in the loop and finish all

      console.log('Node Coords'); console.log(this.storedPoints_LatLng);
      console.log('Total Vertices'); console.log(this.featureVertices);

      // Proceed to get elevation for all points
      this.getElevation();

    } // Get All Vertix method

  public _getfractionPoints(point1:L.LatLng, point2:L.LatLng, allvertexNos:number ):number[] {
      
      /** An intermediate point at any fraction along the great circle path between two points can also be calculated
       * Code adapted from Chris Veness at http://www.movable-type.co.uk/scripts/latlong.html
       * Check Intermediate point section.
       */
      
      const RAD = 0.01745329252;
      const DEG = 57.295779513;

      let n = allvertexNos;
      let df = n - 1;
      let rep = df - 1;
      let startfraction = 1 / df;
      let end = startfraction * rep;
      let partcoords = [];

      let counter = 0;
      let fraction = startfraction;

      for (let i = 0; i < rep; i++) {
        counter++;
        fraction = startfraction * counter;

      let φ1 = point1.lat * RAD, λ1 = point1.lng * RAD;
      let φ2 = point2.lat * RAD, λ2 = point2.lng * RAD;

      let sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), sinλ1 = Math.sin(λ1), cosλ1 = Math.cos(λ1);
      let sinφ2 = Math.sin(φ2), cosφ2 = Math.cos(φ2), sinλ2 = Math.sin(λ2), cosλ2 = Math.cos(λ2);

      // distance between points
      let Δφ = φ2 - φ1;
      let Δλ = λ2 - λ1;
      let a = Math.sin(Δφ/2) * Math.sin(Δφ/2)
          + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      let δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      let A = Math.sin((1-fraction)*δ) / Math.sin(δ);
      let B = Math.sin(fraction*δ) / Math.sin(δ);

      let x = A * cosφ1 * cosλ1 + B * cosφ2 * cosλ2;
      let y = A * cosφ1 * sinλ1 + B * cosφ2 * sinλ2;
      let z = A * sinφ1 + B * sinφ2;

      let φ3 = Math.atan2(z, Math.sqrt(x*x + y*y));
      let λ3 = Math.atan2(y, x);

      let fractionPoint = new L.LatLng(φ3 * DEG, ((λ3 * DEG)+540)%360-180); // normalise lon to −180..+180°

      partcoords[i] = new L.LatLng(φ3 * DEG, ((λ3 * DEG)+540)%360-180); // normalise lon to −180..+180°
      
      }  

      return partcoords;
      
    }
  
    public drawIntermediateVertix():void {
        /**
         * Code Not yet concluded, might not be need.
         */
        let smallVertex = [];
        let vertexInt:L.Marker;
        
        for (let i = 0; i < this.featureVertices.length; i++) {

            if (this.featureVertices[i] === this.storedPoints_LatLng[i]) {
              console.log('Equals! ');
            } else {
              vertexInt = L.marker( this.featureVertices[i], {icon: this.vertexIcon});
              smallVertex[i] = vertexInt;
              this.drawnMarkers.addLayer(smallVertex[i]);
            }
      }
    }

    public getElevation(): void {
      /**
       * Elevation service from Google.
       * We can also use ESRI API
       * For now, this is just a test.
       * For any changes, just change the http address down below and maybe your API Key, 
       * All should work.
       * If not, take a coffee. :-)
       * 
       * I have commented the results, it seems there is a limit or something.
       * Still in developing mode.
       * To view the results, just uncomment the console log.
       */
      let address:string = 'https://maps.googleapis.com/maps/api/elevation/json?locations=';
      let separator:string = '|';
      let comma = ',';
      let data = "";

      for (let i = 0; i < this.featureVertices.length; i++) {

          if (i === 0 ) {
            data += address;
          }
          
          data += (String(this.featureVertices[i].lat)) + comma + (String(this.featureVertices[i].lng)) + separator;

          if (i === this.featureVertices.length -1 ) {
              data += (String(this.featureVertices[i].lat)) + comma + (String(this.featureVertices[i].lng)) + '&key=' + this.GOOGLE_API_KEY;
          }
      }

      
      console.log('%cElevation Results: ', 'color: green');
      console.log(data);

      this.getNearestPoints();
    }

    public getMarkerLabel(i:number):string{

      /**
       * Moving forward - this method has to be improved to listen to changes on the label marker 
       */
        let label = ['A', 'B', 'C', 'D', 'E', 'F'];
        return label[i];
    } // getMarkerLabel

    public __onupdateView(signal:string) { // Still needs work

      if (signal = 'editstart' ) {
          this.drawnMarkers.clearLayers();
      } else if (signal = 'draw:edited') {
          this.drawnMarkers.clearLayers();
      }
      
      else if (signal = 'drawstart' ) {
        this.drawnItems.clearLayers();
        this.drawnMarkers.clearLayers();
      }
    } // __onupdateView


// buffer

    public getNearestPoints(){
        console.log('%cComputing nearest points: ', 'color: blue');
        let bufferDistance = 5000; //Meters
	
		
        let multiLine = turf.lineString([this.storedPoints_LatLng]);
        let randomPoint:L.Marker;
        let bufferedPolyline:L.Polyline;
        let randomPointMarkers = [];
        let randomPlaces = [];
        let buffered: GeoJSONFeature<any>;

                // Get bounding box from points
        let allLat = [];
        let allLng = [];

        for (let i = 0; i < this.storedPoints_LatLng.length; i++) {
          allLat.push(this.storedPoints_LatLng[i].lat);
          allLng.push(this.storedPoints_LatLng[i].lng);
        }
        
        let topRight = L.latLng(Math.max.apply(Math, allLat), Math.max.apply(Math, allLng)); 
        let bottomLeft = L.latLng(Math.min.apply(Math, allLat), Math.min.apply(Math, allLng));

        console.log('Bounds: Top Right: '); console.log(topRight);
        console.log('Bounds: Bottom Left: '); console.log(bottomLeft);


            if (this.storedPoints_LatLng.length === 2) {
              buffered = turf.buffer(
                            {
                              "type": "Feature", "geometry": { "type": "LineString",
                                "coordinates": [
                                    [ this.storedPoints_LatLng[0].lat, this.storedPoints_LatLng[0].lng],
                                    [ this.storedPoints_LatLng[1].lat, this.storedPoints_LatLng[1].lng],
                                  ],
                              },"properties": { "name": "Dinagat Islands" }
                            }, bufferDistance, 'meters');} // if
            if (this.storedPoints_LatLng.length === 3) {
                buffered = turf.buffer(
                            {
                              "type": "Feature", "geometry": { "type": "LineString",
                                "coordinates": [
                                    [ this.storedPoints_LatLng[0].lat, this.storedPoints_LatLng[0].lng],
                                    [ this.storedPoints_LatLng[1].lat, this.storedPoints_LatLng[1].lng],
                                    [ this.storedPoints_LatLng[2].lat, this.storedPoints_LatLng[2].lng],
                                  ],
                              },"properties": { "name": "Dinagat Islands" }
                            }, bufferDistance, "meters");} // if
            if (this.storedPoints_LatLng.length === 4) {
                buffered = turf.buffer(
                            {
                              "type": "Feature", "geometry": { "type": "LineString",
                                "coordinates": [
                                    [ this.storedPoints_LatLng[0].lat, this.storedPoints_LatLng[0].lng],
                                    [ this.storedPoints_LatLng[1].lat, this.storedPoints_LatLng[1].lng],
                                    [ this.storedPoints_LatLng[2].lat, this.storedPoints_LatLng[2].lng],
                                    [ this.storedPoints_LatLng[3].lat, this.storedPoints_LatLng[3].lng],
                                  ],
                              },"properties": { "name": "Dinagat Islands" }
                            }, bufferDistance, "meters");} // if
            if (this.storedPoints_LatLng.length === 5) {
                buffered = turf.buffer(
                            {
                              "type": "Feature", "geometry": { "type": "LineString",
                                "coordinates": [
                                    [ this.storedPoints_LatLng[0].lat, this.storedPoints_LatLng[0].lng],
                                    [ this.storedPoints_LatLng[1].lat, this.storedPoints_LatLng[1].lng],
                                    [ this.storedPoints_LatLng[2].lat, this.storedPoints_LatLng[2].lng],
                                    [ this.storedPoints_LatLng[3].lat, this.storedPoints_LatLng[3].lng],
                                    [ this.storedPoints_LatLng[4].lat, this.storedPoints_LatLng[4].lng],
                                  ],
                              },"properties": { "name": "Dinagat Islands" }
                            }, bufferDistance, "meters");} // if

            if (this.storedPoints_LatLng.length === 6) {
                buffered = turf.buffer(
                          {
                            "type": "Feature", "geometry": { "type": "LineString",
                              "coordinates": [
                                  [ this.storedPoints_LatLng[0].lat, this.storedPoints_LatLng[0].lng],
                                  [ this.storedPoints_LatLng[1].lat, this.storedPoints_LatLng[1].lng],
                                  [ this.storedPoints_LatLng[2].lat, this.storedPoints_LatLng[2].lng],
                                  [ this.storedPoints_LatLng[3].lat, this.storedPoints_LatLng[3].lng],
                                  [ this.storedPoints_LatLng[4].lat, this.storedPoints_LatLng[4].lng],
                                  [ this.storedPoints_LatLng[5].lat, this.storedPoints_LatLng[5].lng],
                                ],
                            },"properties": { "name": "Dinagat Islands" }
                          }, bufferDistance, "meters");} // if


        console.log('Buffered Radius polygon: '); console.log(buffered);                   

        let bufferPolygon:L.LatLng[] = [];
        let drawnBounds:L.LatLngBounds = L.latLngBounds(bottomLeft, topRight);
        for (let i = 0; i < buffered.geometry.coordinates[0].length - 1; i++) {
            randomPoint = L.marker([buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]], {icon: this.profileIcon});       
            randomPlaces[i] = randomPoint;
            //let bordercoord:L.LatLng = L.latLng(buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]);
            bufferPolygon[i] =  L.latLng(buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]);
            //this.drawnMarkers.addLayer(randomPlaces[i]);
            // console.log('%cBuffered Object: paths ', 'color: blue'); 
            // console.log(buffered.geometry.coordinates[0][i][0] + ' ' + buffered.geometry.coordinates[0][i][1]);
        }

        let bufferLayer:L.Polygon = L.polygon(bufferPolygon); bufferLayer.setStyle({fillColor:'orange', fillOpacity: 0.2, stroke:false });
        let rectangleBound:L.Rectangle = L.rectangle(drawnBounds); rectangleBound.setStyle({fillColor:'orange', fillOpacity: 0.5,stroke:false });
        this.drawnMarkers.addLayer(bufferLayer);
        // this.drawnItems.addLayer(rectangleBound); 
 

        console.log('Buffered Polygon LatLng Array: ');console.log(bufferPolygon);
        //let p:L.LatLng = L.la
    
        // TO Create random points inside the bounding box



        // Get points of interest from OverPass
        let point_of_interest:string = 'node["natural"="peak"]';
        let bbox:string = '('+ (String(bottomLeft.lat)) + ',' + (String(bottomLeft.lng)) + ',' + (String(topRight.lat)) + ',' + (String(topRight.lng)) + ')' + ';out;'

        // Get points of interest from OverPass
        
        let request:string = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];' + encodeURIComponent(point_of_interest) +  encodeURIComponent(bbox);

        console.log ('%cRequest passed to OverPass API, click to view: ' , 'background:green; color:white'); console.log (request);
        this.overPass(request, buffered);
  }  


  public heightsTOJSON(data:string){
      this._http.get(data)
      .map((res) => res.json())
      .subscribe(results => {
      this.elevation = results;
      console.log(this.elevation);
      }, (rej) => {console.error("Could not load local data",rej)});

  }


  public overPass(address:string, buffered: GeoJSONFeature<any>):any {
      /**
       * Over-pass json response have decided not to have headers,
       * So, I am forced to use two different methods for getting the json requests
       * For google and mapzen api responses are with headers, do not use this method
       * Just map and subscribe directly 
       */
      return this._http.get(address)
      .subscribe((res) => {
      this.POINTS_OF_INTEREST = res.json();
      //console.log(this.POINTS_OF_INTEREST);
      
      let counter = 0;
      if (this.POINTS_OF_INTEREST.elements.length > 0) {
         console.log('%cPEAKS: ', 'color:blue');
         let allpeaklabels:string;
        for (let i = 0; i < this.POINTS_OF_INTEREST.elements.length; i++) {
          counter++;
          let position:L.LatLng = L.latLng (this.POINTS_OF_INTEREST.elements[i].lat, this.POINTS_OF_INTEREST.elements[i].lon, this.POINTS_OF_INTEREST.elements[i].tags.ele);
          let peakname:string = this.POINTS_OF_INTEREST.elements[i].tags.name;
          this.PEAKS [i]=  { "coord": position, "name": peakname } ;
          let name = this.PEAKS[i].name;
          allpeaklabels += peakname + ', ';
          
        }  
      console.log(counter + ' Peak(s) were found within the bounding box, this should be refined to elements within the buffer distance');    
      console.log(allpeaklabels); console.log(this.PEAKS);

      // Removing items not inside the buffer radius
      counter = 0;
        let notInside = [];
        let peakInsideArray = [];
        let peakInside:L.Marker
        for (let i = 0; i < this.PEAKS.length; i++){

          let point = turf.point([this.POINTS_OF_INTEREST.elements[i].lat, this.POINTS_OF_INTEREST.elements[i].lon]);
          //let pointArray = [this.POINTS_OF_INTEREST.elements[i].lat, this.POINTS_OF_INTEREST.elements[i].lon]
          var isInside = turf.inside(point, buffered);
          if (isInside) {
            counter++
            notInside.push(i);
            let peakLatLng:L.LatLng = L.latLng (
                                      this.POINTS_OF_INTEREST.elements[i].lat,
                                      this.POINTS_OF_INTEREST.elements[i].lon
                                      );
          
            peakInside = L.marker( peakLatLng, 
            {
            icon: this.peakIcon,
            title: this.POINTS_OF_INTEREST.elements[i].lat + ' ' + this.POINTS_OF_INTEREST.elements[i].lat
            }).bindTooltip(this.POINTS_OF_INTEREST.elements[i].tags.name , {permanent: true, direction: 'top', offset: [0, -5], });

            peakInsideArray[i] = peakInside;
            this.drawnMarkers.addLayer(peakInsideArray[i]);
          }
        }
      console.log('%cOnly ' + ( counter )  + ' out of ' + (this.POINTS_OF_INTEREST.elements.length) + ' peaks were found within the buffer distance; this will be shown on the profile', 'color: white; background: blue');

  } else console.log('%cNo Peaks were found within bounding box ', 'color: white ; background: red');

    }, (rej) => {console.error("Could not get required information at this time",rej)})
 
  } // Over Pass method
    
} // Leaflet map class
