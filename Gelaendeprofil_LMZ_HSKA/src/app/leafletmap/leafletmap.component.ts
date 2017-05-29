// Platform Dependent Imports
import { Component, Output, OnInit, EventEmitter, Renderer } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import '../shared/menu.js';

import * as L from 'leaflet';
import { Map } from 'leaflet';
import 'leaflet-draw';
import 'leaflet.locatecontrol';
import '../../../node_modules/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.js';

// Turf
import * as turf from 'turf';

@Component({
  selector: 'app-leafletmap',
  templateUrl: './leafletmap.component.html',
  styleUrls: ['./leafletmap.component.css']
})
export class LeafletmapComponent implements OnInit {

  // Outputs
  @Output() layerAdded: EventEmitter<any> = new EventEmitter();
  @Output() layerRemoved: EventEmitter<any> = new EventEmitter();
  @Output() drawstart: EventEmitter<any> = new EventEmitter();
  @Output() created: EventEmitter<any> = new EventEmitter();
  @Output() editstart: EventEmitter<any> = new EventEmitter();
  @Output() edited: EventEmitter<any> = new EventEmitter();
  @Output() deleted: EventEmitter<any> = new EventEmitter();

  private peaksData: GeoJSONFeatureCollection<any>;
  private elevationData: GeoJSONFeatureCollection<any>;
  private peaksDataArray = [];
  private chartData = [];
  private PEAKS: {coord: L.LatLng, name: string }[] = [];
  public totalLength:number;
  public totalVertix:number;

  // BaseMap 
  private providersDescription = ['SATTELITE','RELIEF','LANDSCAPE','TOPO MAP','OSM'];
  private initMap = 4;

  // Elevation profile variables
  public lineLeafletID:number;
  public placesLeafletID:number;
  public storedPoints_LatLng = [];
  public featureVertices = [];
  public drawnItems:L.FeatureGroup;
  public drawnMarkers:L.FeatureGroup;
  public placeMarker:L.Marker;
  public profileIcon:L.Icon;
  public placesIcon:L.Icon;
  public peakIcon:L.Icon;
  public vertexIcon:L.Icon;

  // Elevation request parameters, uses Google API (for now)
  public REQUEST:string;
  public GOOGLE_API_KEY:string='AIzaSyCsc5MNOSnljA4itLgsykY-686fFBn3bag';
  public elevation;
  public POINTS_OF_INTEREST;

  // Leaflet Map and base maps parameters
  public _map: Map;
  public coords = '...loading';
  public currentSelector:number;
  public currentproviderDescription = this.providersDescription[this.initMap];
  public providersImages = [ '../assets/icons/satellitenbild.png',
                              '../assets/icons/relief_maps4free.png',
                              '../assets/icons/thunderforest_landscape.png',
                              '../assets/icons/esri_world_topomap.png',
                              '../assets/icons/openstreetmap_de.png',
                            ]; 
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
  public currentImage = this.providersImages[this.initMap];

  constructor( private _http: Http) { }

  ngOnInit() {

     // Initialize leaflet map and center at karlsruhe
      this._map =  L.map('leaflet-map-component',
                        { center: [49.00, 8.40], 
                          zoom: 12,
                          zoomControl: false,
                        });
                        
      
      // Add tile layer to Map
      this.providers[this.initMap].addTo(this._map);

      // Events captured
      this._map.on('mousemove', this._onMouseMove, this);      
      this._map.on('draw:drawstart', this.__onDrawStart, this);
      this._map.on('draw:created', this.__onDrawCreated, this);
      this._map.on('draw:editstart', this.__onEditStart, this);
      this._map.on('draw:edited', this.__onDrawEdited, this);
      this._map.on('draw:deleted', this.__onDrawDeleted, this);

      // Leaflet plugins; the order is required
      L.control.scale({ position: 'bottomright', metric: true, imperial: false,}).addTo(this._map); //Scale  //Anja
      L.control.zoom({position: 'bottomright'}).addTo(this._map);
      L.control.locate({position: 'bottomright'}).addTo(this._map);
      
      // Drawing Variables, Markers and Icons
      let polyline:any;
      let markers:any;
      this.drawnItems = new L.FeatureGroup(polyline);
      this.drawnMarkers = new L.FeatureGroup(markers);
      this.profileIcon = L.icon({ iconUrl: '../assets/markers/profile.png',iconSize: [15, 15]});
      this.vertexIcon = L.icon({ iconUrl: '../assets/markers/vertex.png', iconSize: [20, 20] });
      this.peakIcon = L.icon({ iconUrl: '../assets/markers/peak.png', iconSize: [25, 25], });
      this.placesIcon = L.icon({ iconUrl: '../assets/markers/peak.png', iconSize: [15, 15], });
  
      // Draw control options
      let drawControl = new L.Control.Draw({
          position:'topright',
          draw: {polygon:false, rectangle:false, circle:false, polyline:true, marker:false},
          edit: {
              featureGroup: this.drawnItems}
      });

      // Add draw control to map
      this._map.addControl(drawControl);

      // Add all layers
      this._map.addLayer(this.drawnItems);
      this._map.addLayer(this.drawnMarkers);
      //TODO: Create Separate layer for peaks shown on the map

      this.refinePoints(); // Test method...
      this._searchedLocation();

  } // On Initialize


    /**
     * EVENTS 
     * */
    
    // Listner for updating user mouse position 
    public _onMouseMove(e): string {
      const lng = e.latlng.lng;
      const lat = e.latlng.lat;
      this.coords = lat + '  ' + lng ;
      return this.coords; // coords variable was interpolated at the input element in the html template
    } // _onMouseMove

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

      // Empty stored points data that would be coming from the on draw edited event - see below
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
      
      // Empty existing stored points and re-populate
      this.storedPoints_LatLng = [];
      this.peaksDataArray = [];
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


    public _getDistance(point1:L.LatLng, point2:L.LatLng):number {
      /**
       * Returns the distance (in meters)  between two points calculated using the Haversine formula
       * This is the same as the leaflet 'distance to' method
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

      this.totalLength = 0;          // 1.
      let partLength = [];          // 2.
      this.totalVertix = 0;          // 3.
      let partVertixRatio = [];     // 4.
      let partVertixNumber = [];    // 5.

      for (let i = 0; i < (this.storedPoints_LatLng.length - 1); i++) {
        // 1.
        this.totalLength += this._getDistance(
                                    this.storedPoints_LatLng[i],
                                    this.storedPoints_LatLng[i+1]);
        // 2.
        partLength[i] = this._getDistance(
                                    this.storedPoints_LatLng[i],
                                    this.storedPoints_LatLng[i+1]);                        
                                   
        if (i === (this.storedPoints_LatLng.length - 2) ) {
          // 3. 
          console.log('Total Length of feature: ' + this.totalLength);
          if (this.totalLength < 1000 * 0.8) {
              this.totalVertix = MAXVERTIX;
              console.log('Total_Vertix: ' + (this.totalVertix));    
          } else if (this.totalLength < 2000) {
              this.totalVertix = Math.round(MAXVERTIX * 0.6);
              console.log('Total_Vertix: ' + (this.totalVertix));     
          } else if (this.totalLength < 4000) {
              this.totalVertix = Math.round(MAXVERTIX * 0.4);
              console.log('Total_Vertix: ' + (this.totalVertix));           
          } else if (this.totalLength < 5000) {
              this.totalVertix = Math.round(MAXVERTIX * 0.2);
              console.log('Total_Vertix: ' + (this.totalVertix));    
          }
          else {
              this.totalVertix = MAXVERTIX;
              console.log('Total_Vertix: ' + (this.totalVertix));    
          }
          // 4.
          for (let j = 0; j < (this.storedPoints_LatLng.length - 1); j++ ){
            partVertixRatio[j] = partLength[j] / this.totalLength;
            // 5.
            if (j === (this.storedPoints_LatLng.length - 2)) {
              console.log('Total number of Paths: ' + partLength.length);
              console.log('Parts Vertix Ratios: ' + partVertixRatio);    
              for (let k = 0; k < (this.storedPoints_LatLng.length - 1); k++ ) {
                  partVertixNumber [k] = Math.round(this.totalVertix * partVertixRatio[k]);
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

        // Here, get the lat and lng for a line part and ...
        tempArray = this._getfractionPoints(this.storedPoints_LatLng[i], this.storedPoints_LatLng[i+1], partVertixNumber[i]);
        for (let j = 0; j < tempArray.length; j++ ) {
            this.featureVertices.push(tempArray[j]);
        }
        // ... push the next node lat and lng
        this.featureVertices.push(this.storedPoints_LatLng[i+1]);

        // Continue in the loop and finish all
      }

      // Here, we have the coords of the nodes and all vertix
      // The vertix coords will be sent for z - values
      console.log('Node Coords'); console.log(this.storedPoints_LatLng);
      console.log('Total Vertices'); console.log(this.featureVertices);

      // Proceed to get elevation for all all vertix
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
         * 
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
       * During development mode, my local host (4200) failed to load the response from the google domaian;
       * keep getting the XMLHttpRequest cannot load error:
       * 
       * Cross-Origin Request Blocked:
       * (Reason: CORS header ‘Access-Control-Allow-Origin’ missing).
       * 
       * After installing the 'Allow-Control-Allow-Origin' plugin to google chrome, it worked. 
       * This is just good/ handy for development purposes, i think because when the extension is turned off, erros comes back :(
       * We should resolve this before production!!!!!
       * 
       * Better still, change to the ESRI Elevation service
       */


      let header:string = 'Access-Control-Allow-Origin: *'; // if the plugin is installed, this header wont be needed
      let address:string = 'https://maps.googleapis.com/maps/api/elevation/json?locations=';
      let separator:string = '|';
      let comma = ',';
      let data = "";

      for (let i = 0; i < this.featureVertices.length; i++) {

          if (i === 0 ) {
            data = address;
          }
          
          data += (String(this.featureVertices[i].lat)) + comma + (String(this.featureVertices[i].lng)) + separator;

          if (i === this.featureVertices.length -1 ) {
              data += (String(this.featureVertices[i].lat)) + comma + (String(this.featureVertices[i].lng)) + '&key=' + this.GOOGLE_API_KEY;
          }
      }
      
      console.log(data);
      console.log('%cElevation Results: ', 'color: green');

      /**
       * I shouldn't do this, this is supposed to be in a method
       * Will work on a better solution
       * 
       */
      
      this._http.get(data)
      .map(res=> res.json())
      .subscribe(results => {
      let response = results;

      let elevationPointsArray = [];
      for (let i = 0; i < response.results.length; i++) {
        let elevationPoint = turf.point([response.results[i].location.lat, response.results[i].location.lng, response.results[i].elevation ]);
        elevationPointsArray[i] = elevationPoint;
      }
      this.elevationData = turf.featureCollection(elevationPointsArray);
      console.log('%cElevation data: ', 'color: white; background: black');
      console.log(this.elevationData);
     
      }, (rej) => {console.error("Could not load lelevation data",rej)});
      
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


    public getNearestPoints(){
        console.log('%cComputing nearest points: ', 'color: blue');
        
        let bufferDistance = 2000; //Meters
        // Create a turf line along the nodes
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
        
        // Store the bounds in leaflet L.LatLng format
        let topRight = L.latLng(Math.max.apply(Math, allLat), Math.max.apply(Math, allLng)); 
        let bottomLeft = L.latLng(Math.min.apply(Math, allLat), Math.min.apply(Math, allLng));

        console.log('Bounds: Top Right: '); console.log(topRight);
        console.log('Bounds: Bottom Left: '); console.log(bottomLeft);

            // I had no option, I had to do this, so crude!!, this will be revisited :(
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

        // Generate a polygon with the leaflet polygon data type, turf is not useful here
        // Note the extent of the coordinates is - 1, this is to ensure that the first and last coordinates are not registered
        // Check leaflet polygon documentatipm for more info
        for (let i = 0; i < buffered.geometry.coordinates[0].length - 1; i++) {
            randomPoint = L.marker([buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]], {icon: this.profileIcon});       
            randomPlaces[i] = randomPoint;
            // let bordercoord:L.LatLng = L.latLng(buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]);
            bufferPolygon[i] =  L.latLng(buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]);
            // this.drawnMarkers.addLayer(randomPlaces[i]);
            // console.log('%cBuffered Object: paths ', 'color: blue'); 
            // console.log(buffered.geometry.coordinates[0][i][0] + ' ' + buffered.geometry.coordinates[0][i][1]);
        }

        let bufferLayer:L.Polygon = L.polygon(bufferPolygon); bufferLayer.setStyle({fillColor:'orange', fillOpacity: 0.2, stroke:false });
        let rectangleBound:L.Rectangle = L.rectangle(drawnBounds); rectangleBound.setStyle({fillColor:'orange', fillOpacity: 0.5,stroke:false });
        this.drawnMarkers.addLayer(bufferLayer);
        // this.drawnItems.addLayer(rectangleBound); 
        // moving forward, perhaps the best way is to intersect the rectangle bound and the buffer layer, 
        // since we need points that are within the bounds and also within th buffer distance and display on map
 
        //console.log('Buffered Polygon LatLng Array: ');console.log(bufferPolygon);
        
        /**
         * TO Get points of interest from OverPass API within the bounding box
         */

        let point_of_interest:string = 'node["natural"="peak"]'; // request for peak points
        let bbox:string = '('+ (String(bottomLeft.lat)) + ',' + (String(bottomLeft.lng)) + ',' + (String(topRight.lat)) + ',' + (String(topRight.lng)) + ')' + ';out;';
        let request:string = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];' + encodeURIComponent(point_of_interest) +  encodeURIComponent(bbox);

        console.log ('%cRequest passed to OverPass API, click to view: ' , 'background:green; color:white'); console.log (request);
        this.overPass(request, buffered);
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
      let poi:any;
      poi = res.json();
      console.log('%c All Points of Interest', 'color: blue');
      console.log(poi);
      
      let counter = 0;
      if (poi.elements.length > 0) {
         console.log('%cPEAKS: ', 'color:blue');
        let allpoilabels = [];
        for (let i = 0; i < poi.elements.length; i++) {
          counter++;
          let position:L.LatLng = L.latLng (poi.elements[i].lat, poi.elements[i].lon, poi.elements[i].tags.ele);
          let peakname:string = poi.elements[i].tags.name;
          allpoilabels.push(peakname);
          this.PEAKS [i]=  { "coord": position, "name": peakname } ;
        }  
      console.log((counter) + ' Peak(s) were found within the bounding box, this should be refined to elements within the buffer distance');    
      console.log('Peaks within bounding box: '+ allpoilabels); console.log(this.PEAKS);

      // Removing items not inside the buffer radius
      counter = 0;
        let notInside = [];
        let peakInsideArray = [];
        let features = [];
        let peakInsideBuffer = [];
        let peakInside:L.Marker;
        for (let i = 0; i < poi.elements.length; i++){
          let pointname:string = poi.elements[i].tags.name;
          let point = turf.point([poi.elements[i].lat, poi.elements[i].lon], {name: pointname});
          features[i] = point;
          var isInside = turf.inside(point, buffered);
          if (isInside) {
            counter++
            notInside.push(i);
            let peakLatLng:L.LatLng = L.latLng (
                                      poi.elements[i].lat,
                                      poi.elements[i].lon
                                      );
                                      
            peakInside = L.marker( peakLatLng, 
            {
            icon: this.peakIcon,
            title: poi.elements[i].lat + ' ' + poi.elements[i].lat
            }).bindTooltip(poi.elements[i].tags.name , {permanent: true, direction: 'top', offset: [0, -5], });

            peakInsideArray[i] = peakInside;
            peakInsideBuffer.push(poi.elements[i].tags.name);
            
            this.drawnMarkers.addLayer(peakInsideArray[i]);
            this.peaksDataArray [i] = point;
          }
        }
      
      this.peaksData = turf.featureCollection(features);
      console.log('%cOnly ' + ( counter )  + ' out of ' + (poi.elements.length) + ' peaks were found within the buffer distance; this will be shown on the profile', 'color: white; background: green');
      console.log('List: ' + peakInsideBuffer);
      console.log('%cThe elevation data and the peak information will be sent to the profile component', 'background:black; color:white');

    // Test code - ignore
    this.chartData = [];
    for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
      this.chartData.push([
        `Index ${i}`,
        Math.floor(Math.random() * 100)
      ]);
    }

    console.log('Chart Data');
    console.log(this.chartData);
  

  } else console.log('%cNo Peaks were found within bounding box ', 'color: white ; background: red');

    }, (rej) => {console.error("Could not get required information at this time",rej)})
 
  } // Over Pass method


   public _searchedLocation (): void {

    let geocoder = L.control.geocoder('mapzen-u9qqNQi',
                        { position: 'topright',
                          panToPoint: true,
                          fullwidth: true,
                          expanded: false,
                          focus: true,                        // search nearby
                          placeholder: 'Search nearby',
                          markers: false,                     // disable MAPZEN markers we just need the details from MAPZEN
                          params: {
                              layers: 'locality'}            //search only towns, hamlets, cities
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

public barcharttest(){
        // give everything a chance to get loaded before starting the animation to reduce choppiness
    setTimeout(() => {
      this.generateData();

      // change the data periodically
      setInterval(() => this.generateData(), 3000);
    }, 1000);
}

// test code - ignore
public  generateData() {
    this.chartData = [];
    for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
      this.chartData.push([
        `Index ${i}`,
        Math.floor(Math.random() * 100)
      ]);
    }
  }

public refinePoints(){
  //let zero = this.featureVertices[0].lat;
  this.chartData = [];
    for (let i = 0; i < this.featureVertices.length; i++) {
      this.chartData.push([
        //i*this.totalLength/this.totalVertix,
        `Index ${i}`,
        this.elevationData[i].geometry.coordinates[2]
      ]);
    }

    //console.log("Chartdata"+this.chartData); console.log('feature vertices'); console.log(this.featureVertices);
}

} // Leaflet map class
