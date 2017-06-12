// Platform Dependent Imports
import { Component, Output, OnInit, EventEmitter, HostListener, Renderer, ViewChild, ElementRef, ViewContainerRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { GeneralHttpService } from '../shared/general-http.service';
import { EmitterService } from '../shared/emitter.service';

import { Overlay } from 'angular2-modal';
import { Modal } from 'angular2-modal/plugins/bootstrap';

import * as $ from 'jquery';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import '../../assets/js/menu.js';
//import '../../assets/js/leaflet-draw/dist/leaflet.draw.js';

import * as L from 'leaflet';
import { Map } from 'leaflet';
import 'leaflet-draw';
import 'leaflet.locatecontrol';
import '../../../node_modules/leaflet-geocoder-mapzen/dist/leaflet-geocoder-mapzen.js';

// Turf
import * as turf from '@turf/turf';
import * as lineIntersect from '@turf/line-intersect';

@Component({
  selector: 'app-leafletmap',
  templateUrl: './leafletmap.component.html',
  styleUrls: ['./leafletmap.component.css'],
  providers: [GeneralHttpService]
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


  public lineGraphData = [];
  public peaksGraphData = [];
  public riverGraphData = [];
  public peaksCurrentData = [];
  public newTest:string;
  public markerLabel = ['A', 'B', 'C', 'D', 'E', 'F'];

  private peaksData: GeoJSONFeatureCollection<any>;
  private elevationData;
  private peaksDataArray = [];
  private chartData = [];
  public totalLength:number;
  public totalVertix:number;
  public majorNodeIndex = [];
  public fullSinglePart = [];
  public storedPoints_LatLng = [];
  public featureVertices = [];

  // BaseMap 
  private providersDescription = ['Satellit','Relief','Landschaft','Topographie','OSM'];
  private initMap = 4;

  // Elevation profile variables
  public lineLeafletID:number;
  public placesLeafletID:number;
  public drawnLine:L.Polyline;
  public drawnItems:L.FeatureGroup;
  public drawnMarkers:L.FeatureGroup;
  public drawnMajorNodes:L.FeatureGroup;
  public geocodedPlaces:L.FeatureGroup;
  public placesMarker:L.Marker;
  public placesPopUp:HTMLAnchorElement;
  
  // Icons
  public redSphereIcon:L.Icon;
  public greenSphereIcon:L.Icon;
  public yellowSphereIcon:L.Icon;
  public greySphereIcon:L.Icon;
  public peakIcon:L.Icon;
  public allPeaks:any;

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
  public providersImages = [ '../../assets/icons/satellitenbild.png',
                              '../../assets/icons/relief_maps4free.png',
                              '../../assets/icons/thunderforest_landscape.png',
                              '../../assets/icons/esri_world_topomap.png',
                              '../../assets/icons/openstreetmap_de.png',
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

  constructor( 
    private _http: Http, 
    private _elevationRequest: GeneralHttpService,
    private _pointsOfInterestRequest: GeneralHttpService,
    private _emitterService: EmitterService,
    overlay: Overlay, vcRef: ViewContainerRef, public modal: Modal,
    private el: ElementRef
    ) { overlay.defaultViewContainer = vcRef; }

  @HostListener('document:click', ['$event']) onClick(e) {
    
    // For profile markers
    if (e.target.id === 'labelEdit') {
      let id = e.path[2].attributes[0].value
      let newLabel = String($('.form-control').val());
      this.drawnMajorNodes.getLayer(id).setTooltipContent(newLabel);
    }

    // For markers delete;
    if (e.target.id === 'deleteMarker') {
      let leafletid = e.path[2].attributes[0].value;
      console.log(leafletid);
      this.geocodedPlaces.removeLayer(leafletid);
    } 
      
  } // Host Listener

  ngOnInit() {
      
      // Initialize leaflet map and center at karlsruhe
      this._map =  L.map('leaflet-map-component', { center: [49.00, 8.40],zoom: 12, zoomControl: false });
      
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
      L.control.zoom({position: 'bottomright', zoomInTitle: 'hinein zoomen', zoomOutTitle: 'heraus zoomen'}).addTo(this._map);
      L.control.locate({position: 'bottomright',  keepCurrentZoomLevel: true, strings: {title: 'Zeige mir wo ich bin',} }).addTo(this._map);
      
      // Drawing Variables, Markers and Icons
      let polyline:any;
      let markers:any;
      this.drawnItems = new L.FeatureGroup(polyline);
      this.drawnMarkers = new L.FeatureGroup(markers);
      this.geocodedPlaces = new L.FeatureGroup(markers);
      this.drawnMajorNodes = new L.FeatureGroup(markers);
      this.redSphereIcon = L.icon({ iconUrl: 'http://www.newdesignfile.com/postpic/2014/08/red-circle-x-icon_366416.png',iconSize: [15, 15]});
      this.greenSphereIcon = L.icon({iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Green_sphere.svg/768px-Green_sphere.svg.png', iconSize: [15,15]});
      this.yellowSphereIcon = L.icon({iconUrl: 'https://images.vexels.com/media/users/3/143296/isolated/preview/65e481f9924c73dec1035884e544f284-yellow-marble-ball-by-vexels.png', iconSize: [15,15]});
      this.greySphereIcon = L.icon({ iconUrl: 'https://www.iconfinder.com/data/icons/ball/256/transparent.png', iconSize: [10, 10] });
      this.peakIcon = L.icon({ iconUrl: 'http://www.clker.com/cliparts/K/9/z/s/N/Q/mountain-peak-hi.png', iconSize: [25, 25], });
      
      // Draw control options
      let drawControl = new L.Control.Draw({
          position:'topright',
          draw: {polygon:false, rectangle:false, circle:false, polyline:true, marker:false},
          edit: {featureGroup: this.drawnItems}
      });

      // Add draw control to map
      this._map.addControl(drawControl);

      // Add all layers
      this._map.addLayer(this.drawnItems);
      this._map.addLayer(this.drawnMarkers);
      this._map.addLayer(this.geocodedPlaces);
      this._map.addLayer(this.drawnMajorNodes);
      
      //TODO: Create Separate layer for peaks shown on the map

      this._searchedLocation();
      this.barcharttest()

    } // On Initialize

    
    /**
     * Listener for updating user mouse position 
     * @param e 
     */
    protected _onMouseMove(e): string {
      const lng = e.latlng.lng;
      const lat = e.latlng.lat;
      this.coords = lat + '  ' + lng ;
      return this.coords; // coords variable was interpolated at the input element in the html template
    } // _onMouseMove
    
    /**
     * Listens for when draw starts on the map and clear all layers
     * @param e 
     */
    protected __onDrawStart(e): void {
      this.drawnMajorNodes.clearLayers();
      this.drawnItems.clearLayers();
      this.drawnMarkers.clearLayers();

      this.drawstart.emit();
    } 
    
    /**
     * Listens for when draw finishes on the map..
     * @param e 
     */
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
      let infoBox = document.createElement('a');
      infoBox.innerHTML = 
      `   <form id="edit_labels" role="form">
                  <span type="button" class="input-group-addon btn btn-primary active" id="labelEdit">Label bearbeiten</span>
                  <input id="edit_labels" type="text" class="form-control" placeholder="z.B. Punkt A">     
          </form>  
      `
      for (let i = 0; i < layer._latlngs.length; i++) {
          this.storedPoints_LatLng[i] = L.latLng (
                                    layer._latlngs[i].lat, 
                                    layer._latlngs[i].lng
                                    );
                       
          vertex = L.marker( layer._latlngs[i], 
                      {
                      icon: this.redSphereIcon,
                      title: this.storedPoints_LatLng[i].lat + ' ' + this.storedPoints_LatLng[i].lng
                      }).bindTooltip(this.getMarkerLabel(i) , {interactive:true, permanent: true, direction: 'top', offset: [0, -5], });
          
          this.drawnMajorNodes.addLayer(vertex);

          vertex.on('click', e =>
            infoBox.setAttribute('leafletid', String(e.target._leaflet_id)),
            vertex.bindPopup(infoBox, { offset: [0, 115], }),
          ) 
          profileVertex[i] = vertex;
      }

      //console.log('%cNew Created Points: ',  'color: red'); console.log(this.storedPoints_LatLng);
      //console.log('%cNew Created Feature Parameters:  ', 'color: blue');
      
      this._getAllVertix();
      
    } // Draw Created Event

    protected __onEditStart(e): void {
		
		this.drawnMarkers.clearLayers();
    this.drawnMajorNodes.clearLayers();
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
            let infoBox = document.createElement('a');
      infoBox.innerHTML = 
      `   <form id="edit_labels" role="form">
                  <span type="button" class="input-group-addon btn btn-primary active" id="labelEdit">Edit label</span>
                  <input id="edit_labels" type="text" class="form-control" placeholder="e.g Point A">     
       `
      for (let i = 0; i < elayers._layers[this.lineLeafletID]._latlngs.length; i++) {
          this.storedPoints_LatLng[i] = L.latLng (
                                          elayers._layers[this.lineLeafletID]._latlngs[i].lat, 
                                          elayers._layers[this.lineLeafletID]._latlngs[i].lng
                                    );
          // Refuse to draw markers when the nodes are more than 6 - the maximum                           
          if (i <= 5) {  
          vertex = L.marker( elayers._layers[this.lineLeafletID]._latlngs[i], 
                      {
                      icon: this.redSphereIcon,
                      title: this.storedPoints_LatLng[i].lat + ' ' + this.storedPoints_LatLng[i].lng
                      }).bindTooltip(this.getMarkerLabel(i) , {permanent: true, direction: 'top', offset: [0, -5], }); 
          
          

          this.drawnMajorNodes.addLayer(vertex);

            vertex.on('click', e =>
            infoBox.setAttribute('leafletid', String(e.target._leaflet_id)),
            vertex.bindPopup(infoBox, { offset: [0, 115], }),
          ) 
          profileVertex[i] = vertex;
        }
        
        // At the end of the loop, check if the stored items are more than 6, then slice the stored points
        if (i === (elayers._layers[this.lineLeafletID]._latlngs.length - 1)) {
            if ( this.storedPoints_LatLng.length > 5) {
              console.log('%c NOTE: Edited Item have been sliced, only first 6 nodes retained. ', 'background: red; color: white');
              this.storedPoints_LatLng = this.storedPoints_LatLng.slice(0, 6)
            }
        }
      }

      //console.log('%cEdited Points: ', 'color: red'); console.log( this.storedPoints_LatLng );
      //console.log('%cEDITED Feature Parameters: ', 'color: blue');

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

    /**
    * The distrubtion of the vertex based on the distance have to be discussed
    * This is just a test scenerio
    */
    public _getAllVertix() {

      const MAXVERTIX = 20;

      this.totalLength = 0;           // 1.
      let partLength = [];            // 2.
      this.totalVertix = 0;           // 3.
      let partVertixRatio = [];       // 4.
      let partVertixNumber = [];      // 5.

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
          if (this.totalLength < 1000 * 0.8) { this.totalVertix = MAXVERTIX;
              //console.log('Total_Vertix: ' + (this.totalVertix));    
          } else if (this.totalLength < 2000) { this.totalVertix = Math.round(MAXVERTIX * 0.6);
              //console.log('Total_Vertix: ' + (this.totalVertix));     
          } else if (this.totalLength < 4000) { this.totalVertix = Math.round(MAXVERTIX * 0.4);
              //console.log('Total_Vertix: ' + (this.totalVertix));           
          } else if (this.totalLength < 5000) { this.totalVertix = Math.round(MAXVERTIX * 0.2);
              //console.log('Total_Vertix: ' + (this.totalVertix));    
          } else { this.totalVertix = MAXVERTIX;
              //console.log('Total_Vertix: ' + (this.totalVertix));  
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
      let partBuffer = [];
    
      // Push the first lat and lng
      this.featureVertices.push(this.storedPoints_LatLng[0]);

      let featurePoints = [];
      this.majorNodeIndex = []; // The new index position of the main nodes

      let sum = 0;
      for (let i = 0; i < partLength.length; i++ ) {
        let tempArray = [];
        let tempPart = [];

          if (i === 0) {this.majorNodeIndex.push(0)};
          let value = partVertixNumber[i];
          sum = sum + (value - 1)
          this.majorNodeIndex.push(sum);
        

        // Here, get the lat and lng for a line part and ...
        tempArray = this._getfractionPoints(this.storedPoints_LatLng[i], this.storedPoints_LatLng[i+1], partVertixNumber[i]);

        // create a bounding buffer for each part
        tempPart = tempArray.slice(0);
        let n = tempPart.length;
        tempPart.splice(0, 0, this.storedPoints_LatLng[i]);
        tempPart.push( this.storedPoints_LatLng[i+1]);

        //console.log('%cTEMP FULL PARTS', 'color:white; background:red'); console.log(tempPart);
        this.fullSinglePart[i]= tempPart;

        for (let j = 0; j < tempArray.length; j++ ) {
            this.featureVertices.push(tempArray[j]);
            
            let vertex:L.Marker =L.marker(tempArray[j],{
                      icon: this.greySphereIcon,
                      title: tempArray[j].lat + ' ' + tempArray[j].lng
            });
            this.drawnMarkers.addLayer(vertex);
            featurePoints.push(tempArray[j]);

        }
        //console.log('%cTEMP ARRAYS', 'color:white; background:red');console.log(tempArray);

        // ... push the next node lat and lng
        this.featureVertices.push(this.storedPoints_LatLng[i+1]);

        // Continue in the loop and finish all
      }

        let n = this.majorNodeIndex[this.majorNodeIndex.length-1];
        // console.log(n);
        let counter = 0;
  
        for (let i = 0; i < this.majorNodeIndex.length; i++) {
          
          //console.log(arrayConfig[i]);
          featurePoints.splice(this.majorNodeIndex[i], 0, this.storedPoints_LatLng[counter]);
          counter++;
        }
        
      this.drawnLine = L.polyline(this.featureVertices, {color: 'black'});
      this.drawnMarkers.addLayer(this.drawnLine);

      // Here, we have the coords of the nodes and all vertix
      // The vertix coords will be sent for z - values
      //console.log('Node Coords'); console.log(this.storedPoints_LatLng);console.log('Total Vertices'); console.log(this.featureVertices);

      // Proceed to get elevation for all all vertix
      this.getElevation(featurePoints);

    } // Get All Vertix method



    public getElevation(featurePoints:Array<any>): void {

      let request = this.formatToGoogleElevationRequest(featurePoints, this.GOOGLE_API_KEY);

      let temp = this._elevationRequest.getRequest(request).subscribe(  data => { this.sendElevationToProfile(data); },
                                                                        err => console.error(err));
      console.log('%cService Elevation Data', 'background:red; color:white'); console.log(this.elevationData);

      this.getNearestPoints();
    }

    /**
     * 
     * Enoch
     * @param elevation 
     */
    public sendElevationToProfile(elevation:any):void {
      console.log('%cRaw data for the line graph', 'background:red; color:white');console.log(elevation);

      this.elevationData = elevation;
      let n = elevation.results.length;
      
      let sumLength = 0;
      let label = "";
      let labelIndex = false;

      for (let i = 0; i < n; i++) {
        this.lineGraphData[0] = [sumLength, elevation.results[i].elevation|0, this.getMarkerLabel(0)];
        //this.lineGraphData[0] = {x: sumLength, y:(elevation.results[i].elevation)|0, name:this.getMarkerLabel(0)};
        if (i > 0) {
          let fromPoint = turf.point([elevation.results[i-1].location.lng, elevation.results[i-1].location.lat]);
          let toPoint = turf.point([elevation.results[i].location.lng, elevation.results[i].location.lat]);
          for (let j = 0; j < this.majorNodeIndex.length; j++){
            if (i === this.majorNodeIndex[j]){ label = this.getMarkerLabel(j) }
          }
          let temp = turf.distance(fromPoint, toPoint, 'meters'); sumLength = sumLength + temp;
          this.lineGraphData[i] = [sumLength|0, elevation.results[i].elevation|0, label];
          //this.lineGraphData[i] = {x: sumLength|0, y:(elevation.results[i].elevation)|0, name:label};
        }
      }

      console.log('%cLine Graph Data will be send to the profile component', 'background:purple; color:white'); console.log(this.lineGraphData);
      
    } // sendElevationToProfile

  /**
   * Moving forward - this method has to be improved to listen to changes on the label marker 
   */
    public getMarkerLabel(i:number):string{
        return this.markerLabel[i];
    } // getMarkerLabel

    public __onupdateView(signal:string) { // Still needs work

      if (signal = 'editstart' ) {
          this.drawnMarkers.clearLayers();
          this.drawnMajorNodes.clearLayers();
      } else if (signal = 'draw:edited') {
          this.drawnMarkers.clearLayers();
          this.drawnMajorNodes.clearLayers();
      }
      
      else if (signal = 'drawstart' ) {
        this.drawnItems.clearLayers();
        this.drawnMarkers.clearLayers();
        this.drawnMajorNodes.clearLayers();
      }
    } // __onupdateView


    public getNearestPoints(){
        
        // Create a turf line along the nodes
        //let multiLine = turf.lineString([this.storedPoints_LatLng]);
        let randomPoint:L.Marker;
        let bufferedPolyline:L.Polyline;
        let randomPointMarkers = [];
        let randomPlaces = [];
        let buffered;

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
        let drawnBounds:L.LatLngBounds = L.latLngBounds(bottomLeft, topRight);

        //console.log('Bounds: Top Right: '); console.log(topRight); console.log('Bounds: Bottom Left: '); console.log(bottomLeft);
        
        let bufferDistance = 5000; //Meters
        let line = this.drawnLine.toGeoJSON();
        buffered = turf.buffer(line, bufferDistance, 'meters');                   

        /**
         * TO Get points of interest from OverPass API within the bounding box
         */

        let nearestPeaks:string = 'node["natural"="peak"]'; // request for peak points
        let nearestRivers:string = 'way["waterway"="river"]'; // request for peak points
        let bbox:string = '('+ (String(bottomLeft.lat)) + ',' + (String(bottomLeft.lng)) + ',' + (String(topRight.lat)) + ',' + (String(topRight.lng)) + ')' + ';out;';
        let bboxRivers:string = '('+ (String(bottomLeft.lat)) + ',' + (String(bottomLeft.lng)) + ',' + (String(topRight.lat)) + ',' + (String(topRight.lng)) + ')' + ';out geom;';

        nearestPeaks = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];' + encodeURIComponent(nearestPeaks) +  encodeURIComponent(bbox);
        nearestRivers = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];' + encodeURIComponent(nearestRivers) +  encodeURIComponent(bboxRivers);    
  
        this._pointsOfInterestRequest.getRequest(nearestPeaks).subscribe(   data => { this.processPeaks(data, buffered); },
                                                                                        err => console.error(err));

        this._pointsOfInterestRequest.getRequest(nearestRivers).subscribe(  data => { this.processRivers(data); },
                                                                                        err => console.error(err));      
        
        //this.pointsOfInterest(nearestPeaks, buffered);
  }  


  /**
   * Method will process peaks to be shown on the profile.
   * 
   * It first finds the closest vertix a peak makes with the drawn line,
   * Thereafter, solve for the peaks snapped to the major nodes which are liable to be disregarded
   * based on its angle it makes with such node and determine if a perpendicular point can be found or not.
   * It then deals with other peaks and get a perpedicular point to the line
   * 
   * For peaks to be considered, it then requests for the elevation of the peaks (http),
   * for some reason, not all peaks from OverPass API have a proper elevation tag.
   * 
   * Enoch
   *  
   * @param peak Raw data from OverPass API
   * @param buffered Buffered polygon from Turf
   *  
   */
  
  private processPeaks(peak:any, buffered:GeoJSONFeature<GeoJSONPolygon>):void{
        
        if (peak.elements.length > 0) {

         
        console.log ('%cRaw peak data: ' , 'background:black; color:white'); console.log(peak);

        this.allPeaks = peak;
        let turfPoly = this.addTurfBufferToMap(buffered, false, 'blue');

        let peakInformation = [];
        let counter = 0;
        let notInside = [];
        let peakInsideArray = [];
        let features = [];
        let peakInsideBuffer = [];
        let peakInside:L.Marker;
        this.peaksDataArray = [];
        let peakLatLng:L.LatLng;

        for (let i = 0; i < peak.elements.length; i++) {

          if(peak.elements[i].tags.hasOwnProperty("name")) {

          let pointname:string = peak.elements[i].tags.name;
          let turfPoint = turf.point([peak.elements[i].lon, peak.elements[i].lat]);
          features.push(turfPoint);
          let isInside = turf.inside(turfPoint, turfPoly);
          //console.log(isInside);
             
          if (isInside) {
            counter++
            notInside.push(i);
            let peakName = peak.elements[i].tags.name;
            peakLatLng = L.latLng ( peak.elements[i].lat, peak.elements[i].lon,
                                      // peak.elements.elements[i].tags.ele, // < -- Unfortunately, not all items from OverPass have this information                                
                                  );
                                      
            peakInside = L.marker( peakLatLng, 
            {
            icon: this.peakIcon,
            title: peak.elements[i].lat + ' ' + peak.elements[i].lon
            }).bindTooltip(peak.elements[i].tags.name , {permanent: true, direction: 'top', offset: [0, -5], });
            
            let peakData = {position: peakLatLng, name: peakName};
            peakInsideArray.push(peakInside);
            peakInsideBuffer.push(peak.elements[i].tags.name);
            
            this.drawnMarkers.addLayer(peakInside);

            this.peaksDataArray.push(peakData);
            peakInformation.push(peakData);
          } 
        }

        }
        
      this.peaksData = turf.featureCollection(features);
      console.log('%cOnly ' + ( counter )  + ' out of ' + (peak.elements.length) + ' peaks were found within the buffer distance; this will be shown on the profile', 'color: white; background: green');
      console.log('List: ' + peakInsideBuffer);
      //console.log('%cThe elevation data and the peak information will be sent to the profile component', 'background:black; color:white');

      // Compute distance of each peak to each vertix
      let baseDist = 0;
      let lowestIndex = 0;
      let isLower = false;
      let lowestValue = 0;
      let lineDist = 0;
      let distArray = [];
      counter = 0;

      //console.log(this.peaksDataArray);
      //console.log('%cPEAKS INFO', 'background:green; color:white');
      //console.log(peakInformation);

      this.peaksCurrentData = [];

      for (let i = 0; i < this.peaksDataArray.length; i++) {
        
          let peakPoint:L.LatLng = L.latLng(this.peaksDataArray[i].position.lat, this.peaksDataArray[i].position.lng, 0);
          let peakName = this.peaksDataArray[i].name;
          let drawSketch = true;
          let onNode = false;

          // Compute the distance of each peak to all feature vertices and get the lowest
          distArray = [];
          for (let j = 0; j < this.featureVertices.length; j++) {

                distArray[j] = (peakPoint.distanceTo(this.featureVertices[j]));

                if (j === this.featureVertices.length - 1) {
                      //console.log(distArray);
                      lowestValue = Math.min(...distArray);
                      //console.log('Distance is : ' + lowestValue);

                      for (let p = 0; p < distArray.length; p++) {
                        if (lowestValue === distArray[p]){
                          lowestIndex = p;
                        }
                      }
                        //console.log('This peak lowest distance is at : ' + lowestIndex);
                        //console.log('Distance is : ' + lowestValue)
                      let n = this.featureVertices.length;
                      if ((lowestIndex === n - 1) && peakPoint.lng < this.featureVertices[n-1].lng) {
                        counter++;
                        //drawSketch = true;
                      }
                }
        } // conclude distance to all feature vertix
        
        if (drawSketch) {

          //console.log('Peak Point: ' + peakName);
          let lines = L.polyline([peakPoint, this.featureVertices[lowestIndex]]);
          this.drawnMarkers.addLayer(lines);

          // Deal with peaks snapped to nodes
          for (let nn = 0; nn < this.storedPoints_LatLng.length ; nn++) {

              // Deal with peaks snapped to major nodes
              if (this.featureVertices[lowestIndex] === this.storedPoints_LatLng[nn]) {
                  //console.log('%cTrue, item on Node', 'color:white; background:green');
                  onNode = true;
                  if (peakPoint.lng < this.storedPoints_LatLng[nn].lng) {
                    //console.log('%cWEST SIDE', 'color:white; background:purple');
                    this.plotPerpendicular(peakName, peakPoint, lowestIndex, -1, true, 'notforced', 'send');
                    
                    } else {
                    //console.log('%cEAST SIDE', 'color:white; background:darkred');
                    this.plotPerpendicular(peakName, peakPoint, lowestIndex, +1, true, 'notforced', 'send');
                  } 
              } 
          
          } // Peaks snapped to nodes
        
        
          if(!(onNode)){
              //console.log('%cFalse, item NOT on Node', 'color:white; background:red');
              let distanceForward = this.getShortestDistanceOnLine(peakPoint, this.featureVertices[lowestIndex], this.featureVertices[lowestIndex + 1]);
              let distanceBack = this.getShortestDistanceOnLine(peakPoint, this.featureVertices[lowestIndex], this.featureVertices[lowestIndex - 1]);
              
              //console.log('Distance Forward: ' + distanceForward);
              //console.log('Distance Backward: ' + distanceBack);

              if (distanceForward > distanceBack) {
                  this.plotPerpendicular(peakName, peakPoint, lowestIndex, -1, true, 'plot', 'send');
              } else {
                  this.plotPerpendicular(peakName, peakPoint, lowestIndex, +1, true, 'plot', 'send');
              }
          } // Peaks not snapped to main nodes

      } // If draw sketch is true

    } // For each peak item


    //console.log(this.peaksCurrentData, this.peaksCurrentData.length);
    let allPoints = [];
    for (let i = 0; i < this.peaksCurrentData.length; i++) {
      allPoints.push(L.latLng(this.peaksCurrentData[i].peak.lat, this.peaksCurrentData[i].peak.lng));
      this.peaksCurrentData[i].id = i;
    }

    if (!(allPoints.length === 0)) {

    let request = this.formatToGoogleElevationRequest(allPoints, this.GOOGLE_API_KEY);
    
    this._elevationRequest.getRequest(request).subscribe(  data => { this.sendPeaksToProfile(data); },
                                                                        err => console.error(err));
    }
  } else {console.log ('%cNo Peaks(s) Found: ' , 'background:red; color:white');}
                                                                        
} // process peaks

/**
 * Method sorts and prepare the PEAK data to be sent to profile component.
 * 
 * It first snaps the peak to the drawn line (perpendicular) and interpolates the snapped point elevation 
 * between the two nodes the snapped point falls into;
 * thereafer, it removes the peaks that its snapped point elevation is higher than the original peak point height
 * At the last stages, it sorts the remaining peaks appropriately and compute the x, y , name values for the peaks
 * 
 * Enoch.
 * @param data Raw peak data from OverPass API (OSM)
 */
  private sendPeaksToProfile(data:any){

    // console.log(data);

    let lowerPeak = false;
    let counter = 0;
    for (let i = 0; i < data.results.length; i++) {
      this.peaksCurrentData[i].peak.alt = data.results[i].elevation;
    }
    
    // 1. Remove peaks that the snapped point is higher than the real altitude of the peak
    // ---------------------------------------------------------------------------------
    let removedPeaksName = [];
    for (let i = 0; i < this.peaksCurrentData.length; i++) {
      if(this.peaksCurrentData[i].snapped.alt > this.peaksCurrentData[i].peak.alt){
        let peakname = "";
        lowerPeak = true;
        if(this.peaksCurrentData[i].name === undefined){
          peakname = 'noName';
        } else {peakname = this.peaksCurrentData[i].name}
        removedPeaksName.push(peakname);
        counter++;
        this.peaksCurrentData.splice(i, 1);
      }
    }
    if(lowerPeak) {
    console.log('%cNew Peak Data for Graph ', 'color:white; background: red', lowerPeak ? counter  + ' removed: ' + removedPeaksName : 'All are above snapped point');
    }
    // 2. Then Sort the Array with the snapped point index value which is the index of the closest feature vertix
    // ----------------------------------------------------------------------------------------------------------

    this.peaksCurrentData.sort(function(a, b) { return a.index - b.index});
    //console.log('Sorted first with index'); console.log(this.peaksCurrentData);
  
    let indexArray = [];
    for (let i = 0; i < this.peaksCurrentData.length; i++){ indexArray.push(this.peaksCurrentData[i].index) }

    indexArray.sort(function (a, b){return a - b});
    //console.log ('%cIndex Array', 'color:white; background:purple'); console.log(indexArray);


    // 3. Let's loop through the indexArray and check if there is more than one occurence of an index
    // -----------------------------------------------------------------------------------------------
    let sameIndex = [];
    for (let i = 0; i < indexArray.length; i++) {
      let counter = 0;
      for(let j = 0; j < indexArray.length; j++){
          if (!(i===j)){
            if(indexArray[i] === indexArray[j]){ counter++ }
        }
      }  
      if (counter > 0){ sameIndex.push(indexArray[i]) }
    }

    // 4. If there are same indexes, time to sort the items of same index and put back to the peaks data array
    // -------------------------------------------------------------------------------------------------------

    if (!(sameIndex.length === 0)) {

      console.log ('%cThere are more than one peaks snapped to be same node', 'color:white; background:red');
      sameIndex = sameIndex.filter(function(elem, index, self) {return index == self.indexOf(elem)});
      sameIndex.sort(function (a, b){return a - b});
      // console.log ('%cSame Indexes to be sorted', 'color:white; background:violet'); console.log(sameIndex);
      
      let allGroupedSort = [];
      for (let i = 0; i < sameIndex.length; i++){ // !!!!
          let grouped = this.peaksCurrentData.filter(function( a ) {
            return a.index === sameIndex[i];
          });
          let groupedSort = this.sortPeaksWithSameIndex(grouped);
          // Clone the array, needed to dereference from the main peaks data
          let groupedSortCloned = JSON.parse(JSON.stringify(groupedSort));
          for (let j = 0; j < groupedSortCloned.length; j++){
            groupedSortCloned[j].sorted = true;
          }
          // Combine the sorted items in categories, it will be replace the original items in the main data
          allGroupedSort.push(groupedSortCloned);
      }

      console.log ('%cInitial Item', 'color:white; background:blue'); console.log(allGroupedSort);
      
      // Replace here:
      for (let i = 0; i < allGroupedSort.length; i++){
        let itemIndex = allGroupedSort[i][0].index;
        // Find the right index to start replacing the sorted items
        let insertingIndex = this.peaksCurrentData.findIndex(x => x.index==itemIndex);
        for (let j = 0; j < allGroupedSort[i].length; j++){
          this.peaksCurrentData[insertingIndex + j] = JSON.parse(JSON.stringify(allGroupedSort[i][j]));
        }
      } 
      console.log ('%cAfter Inserting Item', 'color:white; background:green'); console.log(this.peaksCurrentData);
      
  } // If sameIndex.length is not === 0.

  // 5. After all is done: format the peaks data to be used in the profile component
  // ---------------------------------------------------------------------------------

    // 5.1 Separate, peaks to individual parts of the drawn item
    let eachPartSnappedPeaks = [];
    let partPeaks = [];
    for (let i = 0; i < this.fullSinglePart.length; i++ ) { 
        let partTurfLine = [];
        let turfLine = [];
        for (let j = 0; j < this.fullSinglePart[i].length; j++) {
          let point = turf.point([this.fullSinglePart[i][j].lng, this.fullSinglePart[i][j].lat]);
          turfLine.push(point.geometry.coordinates);
        }
        partPeaks = [];
        partTurfLine[i] = turfLine;
        let partLine = turf.lineString(partTurfLine[i]);
        let partBuffer = turf.buffer(partLine, 0.5, 'meters');
        for (let k = 0; k < this.peaksCurrentData.length; k++){
            let peakTurfPoint = turf.point([this.peaksCurrentData[k].geometry.lng, this.peaksCurrentData[k].geometry.lat]);
            let isInside = turf.inside(peakTurfPoint, partBuffer);
            if (isInside){
              //console.log(riversIntersectedPoints[k]);
              partPeaks.push(this.peaksCurrentData[k]);
            }
        }
        eachPartSnappedPeaks.push(partPeaks);
    }
    
    // 5.2 Add with feature points and sort
    let sortedPeaksWithFeaturePoints = [];
    for (let i = 0; i < eachPartSnappedPeaks.length; i++) {
        let sorted = this.addFeaturePoints(eachPartSnappedPeaks[i], i);
        for (let j = 0; j < sorted.length; j++) {
          sortedPeaksWithFeaturePoints.push(sorted[j]);
        }
    }
    console.log('%cSorted Peaks with feature points', 'color:white; background:red'); console.log(sortedPeaksWithFeaturePoints);

    // 5.3 Compute accu. distances of all points starting from point A
    let n = sortedPeaksWithFeaturePoints.length;
    let sumLength = 0;
    for (let i = 0; i < n - 1; i++) {
      sortedPeaksWithFeaturePoints[0].distance = 0;
      if (i > 0) {
      let fromPoint = turf.point([sortedPeaksWithFeaturePoints[i-1].geometry.lng, sortedPeaksWithFeaturePoints[i-1].geometry.lat]);
      let toPoint = turf.point([sortedPeaksWithFeaturePoints[i].geometry.lng, sortedPeaksWithFeaturePoints[i].geometry.lat]);
      let temp = turf.distance(fromPoint, toPoint, 'meters');
      sumLength = sumLength + temp;
      sortedPeaksWithFeaturePoints[i].distance = sumLength|0;
      }
    }

    // 5.4 Remove feature vertex from the data
    let sortedSnappedPeakPoints = sortedPeaksWithFeaturePoints.filter(a => !(a.vertex));

    // 5.5 Format filtered items to x and y for profile component
    this.peaksGraphData = [];
    for (let i = 0; i < sortedSnappedPeakPoints.length; i++) {
      this.peaksGraphData[i] = {x:sortedSnappedPeakPoints[i].distance|0, y:sortedSnappedPeakPoints[i].geometry.alt|0, name:sortedSnappedPeakPoints[i].name}
    }
    console.log ('%cPeaks Graph Data ' , 'background:purple; color:white'); console.log(this.peaksGraphData);   
    
} // Process Peaks


  /**
   * Method sorts and prepare the RIVER data to be sent to profile component.
   * 
   * It finds the intersection of the rivers on the drawnline and compute the x, (y) & name values for the river intersections.
   * 
   * Enoch.
   * @param river Raw river data from OverPass API (OSM)
   */
  private processRivers(river:any){

    // 1. First check if rivers were found
    // --------------------------------------
    if (!(river.elements.length === 0)) {


      console.log ('%cRaw river data: ' , 'background:green; color:white'); console.log(river);
      
      let eachRiver = [];
      let turfRiverLines = []; 
      for (let i = 0; i < river.elements.length; i++){
        let riverCoords = [];
        let riverLine:L.Polyline;
        let riverName: string;
        let turfLine = [];

        if(river.elements[i].tags.hasOwnProperty("name")) {
          let riverName = river.elements[i].tags.name;
          for (let j = 0; j < river.elements[i].geometry.length; j++){
            let coords = L.latLng(river.elements[i].geometry[j].lat, river.elements[i].geometry[j].lon);
            let turfPoint = turf.point([river.elements[i].geometry[j].lon, river.elements[i].geometry[j].lat]);
            riverCoords.push(coords);
            turfLine.push(turfPoint.geometry.coordinates);
            // Some rivers might not have tag names;

          }
          eachRiver.push({geom:riverCoords, name:riverName});
          turfRiverLines.push(turfLine);
          riverLine = L.polyline(riverCoords, {color: 'darkblue'});
          this.drawnMarkers.addLayer(riverLine);
        }
      }

      //console.log('Each River information'); console.log(eachRiver);

      // 1.1 Find if there is an intersection on the drawn line and store the intersected points
      // ---------------------------------------------------------------------------------------
      let featureTurfPoints = [];
      //console.log(this.featureVertices);
      for (let i = 0; i < this.featureVertices.length; i++){
        let point = turf.point([this.featureVertices[i].lng, this.featureVertices[i].lat]);
        featureTurfPoints[i] = point.geometry.coordinates;
      }
      let featureTurfLine = turf.lineString(featureTurfPoints);
      console.log(featureTurfLine);
      let riversIntersectedPoints = [];
      for (let i = 0; i < eachRiver.length; i++){
          let riverTurfLine = turf.lineString(turfRiverLines[i]);
          let intersect = lineIntersect(featureTurfLine, riverTurfLine);
          //console.log('%cIntersected Point', 'color:white; background:violet');
          //console.log(intersect);
          if (intersect.features.length === 1) {
            let coordinates = L.latLng(intersect.features[0].geometry.coordinates[1], intersect.features[0].geometry.coordinates[0]);
            let info = {geometry:coordinates, name:eachRiver[i].name, index:0};
            riversIntersectedPoints.push(info);}
          // If there are more than one intersected points, store each item
          if (intersect.features.length > 1){
            for (let k = 0; k < intersect.features.length; k++){
              let coordinates = L.latLng(intersect.features[k].geometry.coordinates[1], intersect.features[k].geometry.coordinates[0]);
              let info = {geometry:coordinates, name:eachRiver[i].name, distance:0};
              riversIntersectedPoints.push(info);
            }
          }
      }

      // 1.2  For each part of the drawn line, find river points within the line, and sort them (with distace)
      //-------------------------------------------------------------------------------------------------------
      if(!(riversIntersectedPoints.length === 0)) {
        //console.log('Points of Intersections : Line/ Rivers'); console.log(riversIntersectedPoints);
        let indexArray = [];
        // Show points of intersecetion on the map - just for development purpose..
        for (let i = 0; i < riversIntersectedPoints.length; i++){
          let marker = L.marker(riversIntersectedPoints[i].geometry, {icon:this.greenSphereIcon, title:riversIntersectedPoints[i].name});
          this.drawnMarkers.addLayer(marker);
        }

        // Get intersections for each part of the drawn line
        let eachPartRiverPoints = [];
        let partRivers = [];
        for (let i = 0; i < this.fullSinglePart.length; i++ ) {
          let partTurfLine = [];
          let turfLine = []
          for (let j = 0; j < this.fullSinglePart[i].length; j++) {
            let point = turf.point([this.fullSinglePart[i][j].lng, this.fullSinglePart[i][j].lat]);
            turfLine.push(point.geometry.coordinates);
          }
          partRivers = [];
          partTurfLine[i] = turfLine;
          let partLine = turf.lineString(partTurfLine[i]);
          let partBuffer = turf.buffer(partLine, 0.5, 'meters');
          for (let k = 0; k < riversIntersectedPoints.length; k++){
            let riverTurfPoint = turf.point([riversIntersectedPoints[k].geometry.lng, riversIntersectedPoints[k].geometry.lat]);
            let isInside = turf.inside(riverTurfPoint, partBuffer);
            if (isInside){
              //console.log(riversIntersectedPoints[k]);
              partRivers.push(riversIntersectedPoints[k]);
            }
          }
          eachPartRiverPoints.push(partRivers);
        }

        //console.log('%cEach River Parts', 'color:black; background:violet'); console.log(eachPartRiverPoints);

        // Add feature points and sort all, feature points to be removed later
        // Needed to get the real x value for the profile graph in relation to each feature vertex
        let sortedRiversWithFeaturePoints = [];
        for (let i = 0; i < eachPartRiverPoints.length; i++) {
            let sorted = this.addFeaturePoints(eachPartRiverPoints[i], i);
            for (let j = 0; j < sorted.length; j++) {
              sortedRiversWithFeaturePoints.push(sorted[j]);
            }
        }
        //console.log(sortedRiversWithFeaturePoints);

        let n = sortedRiversWithFeaturePoints.length;
        let sumLength = 0;

        for (let i = 0; i < n - 1; i++) {
          sortedRiversWithFeaturePoints[0].distance = 0;
          if (i > 0) {
          let fromPoint = turf.point([sortedRiversWithFeaturePoints[i-1].geometry.lng, sortedRiversWithFeaturePoints[i-1].geometry.lat]);
          let toPoint = turf.point([sortedRiversWithFeaturePoints[i].geometry.lng, sortedRiversWithFeaturePoints[i].geometry.lat]);
          let temp = turf.distance(fromPoint, toPoint, 'meters');
          sumLength = sumLength + temp;
          sortedRiversWithFeaturePoints[i].distance = sumLength|0;
          }
        }

        // Remove feature nodes
        let sortedRiverPoints = sortedRiversWithFeaturePoints.filter(a => !(a.vertex));
        // Compute final data
        this.riverGraphData = [];
        for (let i = 0; i < sortedRiverPoints.length; i++) {
          this.riverGraphData[i] = {x:sortedRiverPoints[i].distance|0, y:0, name:sortedRiverPoints[i].name}
        }
        console.log ('%cRiver Graph Data ' , 'background:green; color:white'); console.log(this.riverGraphData);

        this.onfinish();
      }
    } else { console.log ('%cNo River(s) Found: ' , 'background:red; color:white') }
    
  } // Process Rivers


   public _searchedLocation (): void {

    //Anja
    let geocoder = L.control.geocoder('mapzen-u9qqNQi',
                        { position: 'topright',
                          panToPoint: true,
                          fullwidth: true,
                          expanded: false,
                          focus: true,                        // search nearby
                          placeholder: 'Suche Stadt:',
                          markers: false,
                          params: {layers: 'locality'}                     // disable MAPZEN markers we just need the details from MAPZEN
                        }).addTo(this._map);

    
    geocoder.on('select', this._geocoderMenu, this);
        
  } // _searchedLocation

   // method called from the html template on select of icons on the map
   private _changeBasemapLayer(selector: number) {

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
    //console.log(this.chartData);
  }

protected _geocoderMenu(e):void {
  let _lat = Number(e.latlng.lat);
  let _lng = Number(e.latlng.lng);
  var _selectedAddress = e.feature.properties.label;

  console.log('You have selected', _selectedAddress, _lat, _lng); // :)

  // create markers from MAPZEN information
  const pointMarker = L.icon({
								iconUrl: 'http://flyosity.com/images/_blogentries/networkicon/step4a.png',
								iconSize: [15, 15]
							}); // point marker
			 
 		// Add marker to leaflet map                       
		let placesMarker = L.marker([_lat, _lng],
		{
		  icon: pointMarker,
		  title: _lat + ' ' + _lng }
		)
		.bindTooltip(_selectedAddress , {permanent: true, direction: 'top', offset: [0, -5], })
		
    let placesPopUp = document.createElement('a');
    placesPopUp.innerHTML = 
    ` <div class= "markersdetails">
        <div class="info" id="deleteMarker"><i class="fa fa fa-times-circle"></i> löschen</div>
      </div>  `;

    this.geocodedPlaces.addLayer(placesMarker);
    placesMarker.on('click', e => 
          placesPopUp.setAttribute('leafletid', String(e.target._leaflet_id)),
          placesMarker.bindPopup(placesPopUp, { offset: [30, 80], }),
    );
      
	} // geocoder


/** 
 * Method will plot perpendicular point between two lines,
 * It was made for the nodes to disregard points that snapped to the node
 * but pependicular point cannot be found because of the angle it makes.
 * 
 * Later on, it was adapted for peaks not on node with an optional parameter to forceplot the peak,
 * because the nodes cannot be disregaded, it has to be snapped somewhere on the line.
 * (lazy to code, algorithms are hard ;p)
 *
 * It takes the coordinates of the peak point first and the other two points 
 * of the line in Leaflet LatLng format and 
 * optionally, set plot to true to show on the map, default is false. 
 * It returns the angle to the closest point to the peak makes with the other point.
 * 
 * Enoch.
 * */
private plotPerpendicular (peakName:string, a:L.LatLng, b: number, c:number, plot?:boolean, forcedPlot?:string, send?:string):number {
    // a = peakPoint
    // b = (lowest) feature vertix Index
    // c = direction - East or West

    let peakPoint = a;
    let lowestIndex = b;

    let peakTurfPoint = turf.point([peakPoint.lng, peakPoint.lat]);
    let closestFeaturePoint = turf.point([this.featureVertices[lowestIndex].lng, this.featureVertices[lowestIndex].lat]);
    let nextFeaturePoint = turf.point([this.featureVertices[lowestIndex + c].lng, this.featureVertices[lowestIndex + c].lat]);

    let featuresBearing = turf.bearing(closestFeaturePoint, nextFeaturePoint);
    //console.log('Turf Features Bearing: ' + featuresBearing);
    let closestToPeakBearing = turf.bearing(closestFeaturePoint, peakTurfPoint);
    //console.log('Turf Peak Bearing : ' + closestToPeakBearing);
    let featureAngle = (Math.abs(featuresBearing - closestToPeakBearing));
    //console.log('%cDecison Bearing : ' + featureAngle ,'color:white; background:red');
    if (((featureAngle <= 90) && (plot === true)) || (forcedPlot === 'plot')) {

        let lineString = turf.lineString([closestFeaturePoint.geometry.coordinates, nextFeaturePoint.geometry.coordinates]);
        let snappedPeak = turf.pointOnLine(lineString, peakTurfPoint);
        //console.log(snapped);
        let distanceFrom = turf.distance(closestFeaturePoint, snappedPeak, 'meters');

        this.onDrawLine(peakPoint, this.featureVertices[lowestIndex + c ], 'black');
        let ppPoint = L.latLng(snappedPeak.geometry.coordinates[1], snappedPeak.geometry.coordinates[0])
        let ppPointMarker = L.marker((ppPoint), {icon:this.yellowSphereIcon});
        this.onDrawLine(peakPoint, ppPoint, 'red');
        this.drawnMarkers.addLayer(ppPointMarker);
        
        
        if (send === 'send') {
          let node1 = L.latLng(this.elevationData.results[b].location.lat, this.elevationData.results[b].location.lng, this.elevationData.results[b].elevation);
          let node2 = L.latLng(this.elevationData.results[b].location.lat, this.elevationData.results[b+c].location.lng, this.elevationData.results[b+c].elevation);
          let snappedHeight = this.interpolateHeight(ppPoint, node1, node2 );
          ppPoint.alt = snappedHeight;
          let allPeakInformation = {name: peakName, peak:peakPoint, snapped:ppPoint, geometry:ppPoint, node1: node1, node2: node2, index:lowestIndex, distance:0, direction:c, id:0, sorted:false};
          this.peaksCurrentData.push(allPeakInformation);
          //console.log(this.peaksCurrentData);
        }
    }
    return featureAngle;
}

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
 * 
 * Enoch.
 */
public formatToGoogleElevationRequest(allPoints:Array<any>, apikey:string):string{

      let header:string = 'Access-Control-Allow-Origin: *'; // if the plugin is installed, this header wont be needed
      let request:string = 'https://maps.googleapis.com/maps/api/elevation/json?locations=';
      let separator:string = '|';
      let comma = ',';

      for (let i = 0; i < allPoints.length; i++) {
       
          if (i <= allPoints.length - 2 ) {
          request += encodeURIComponent((String(allPoints[i].lat)) + comma + (String(allPoints[i].lng)) + separator);
          }
        
          if (i === allPoints.length - 1 ) {
          request += encodeURIComponent((String(allPoints[i].lat)) + comma + (String(allPoints[i].lng)));
          }
      }

      request = request.concat('&key=' + apikey);

      return request;
}

/**
 * Basic linear interpolation method.
 * Returns an interpolated Z value of a point between two nodes.
 * 
 * Enoch
 * 
 * @param P Point on the line to be interpolated
 * @param A First Node - this node should be the closest node to the Peak
 * @param B Second Node - this node is the next node to the first node, which satisfies an angle lesser than 90degres
 */
public interpolateHeight(P:L.LatLng, A:L.LatLng, B:L.LatLng):number {
  let l = A.distanceTo(B), dz = A.alt - B.alt, f = dz / l, dPA = P.distanceTo(A), s = f * dPA;
  let z = A.alt - s; return z;
}

public getPerpendicularPoint(P:L.LatLng, A:L.LatLng, B:L.LatLng){
     let x1 = A.lat, y1 = A.lng, x2 = B.lat, y2 = B.lng, x3 = P.lat, y3 = P.lng;
    
    let k = ((y2-y1) * (x3-x1) - (x2-x1) * (y3-y1)) / (((y2-y1)*(y2-y1)) + ((x2-x1)*(x2-x1)));

    let x4 = x3 - k * (y2-y1);
    let y4 = y3 + k * (x2-x1);

    let coord:L.LatLng = L.latLng(x4, y4);
    //console.log('angle: '); console.log(coord);
}

/**
 * Method will attempt to display a turf buffer on the leaflet map if set to true.
 * Other optional parameter is the color to be shown
 * It also returns a turf Polygon.
 * 
 * Enoch
 * @param buffered Turf buffer to be shown
 * @param show Display buffer on map or not
 * @param color Color to be used, optional 
 */
public addTurfBufferToMap(buffered:any, show?:boolean, color?:string):GeoJSON.Feature<GeoJSON.Polygon>{

        if(color === undefined) {
            color = 'red';
        }

        let bufferPolygon:L.LatLng[] = [], turfPolygon = [];

        for (let i = 0; i < buffered.geometry.coordinates[0].length; i++) {
            turfPolygon[i] = [buffered.geometry.coordinates[0][i][0], buffered.geometry.coordinates[0][i][1]];
        }

        let turfPoly = turf.polygon([turfPolygon]);
        
        for (let i = 0; i < turfPoly.geometry.coordinates[0].length - 1; i++) {
           let point =  L.latLng(turfPoly.geometry.coordinates[0][i][1], turfPoly.geometry.coordinates[0][i][0]);
           bufferPolygon[i] = point;
        }
      
        let bufferLayer:L.Polygon = L.polygon(bufferPolygon); bufferLayer.setStyle({fillColor:color, fillOpacity: 0.2, stroke:false });
        
        if (show) { this.drawnMarkers.addLayer(bufferLayer) }
        return turfPoly;

}// Add Buffer to Map

public onDrawLine (point1:L.LatLng, point2:L.LatLng, color?:string) {

      if (color === undefined) {
        color = 'black';
      }
      let line = L.polyline([point1, point2], {color: color});
      this.drawnMarkers.addLayer(line);
  }

/**
 * It gets a little bit complicated sorting the peaks what is snapped to the same node.
 * This method solves the problem by first solving for an array with 2 items first then for 
 * array with more than 2 items, in both scenario, the direction of the perpendicular (snapped) point
 * of the peak is taking into consideration.
 * 
 * Enoch
 * 
 * @param data Peak data to be sorted, needs direction in -1 and +1 and the distances the snapped peak
 * makes to the feature node.
 */
public sortPeaksWithSameIndex(data:Array<any>):Array<any>{
  
  // For array with just two items
  if(data.length === 2){
    // At Opposite directions, sort the data based on the direction
    if((data[0].direction + data[1].direction) === 0){
      return data.sort(function (a, b){return a.direction - b.direction});
    
    // At same direction....
  } else {
        // At same direction but direction is forward, sort based on shortest distance to the feature node
        if (data[0].direction > 0){
          return data.sort(function (a, b){return a.distance - b.distance});
        // At same direction but direction is backward, sort based on longest distance to the feature node
        } else {
          return data.sort(function (a, b){return b.distance - a.distance});
        }
    }
  // For array with more than two items - it gets a lil bit more complicated here
} else{
``
      // First compile the directions.
      let backwardDirection = [];
      let forwardDirection = [];

      for (let i = 0; i < data.length; i++){
        if(data[i].direction > 0){
          forwardDirection.push(data[i]);
        } else {
          backwardDirection.push(data[i]);
        }
      }
      // Check if the items in forward direction array is more than 1, 
      // then sort the array based on shortest distance from the closest feature node
      if(forwardDirection.length > 1){
        forwardDirection = forwardDirection.sort(function (a, b){return a.distance - b.distance});
      }
      // Check if the items in backward direction array is more than 1, 
      // then sort the array based on longest distance from the closest feature node
      if(backwardDirection.length > 1){
        backwardDirection = backwardDirection.sort(function (a, b){return b.distance - a.distance});
      }
      
      // Now, time to join the backward and forward together
      // Note that items in the backward direction will come first
      let sorted = [];
      for (let j = 0; j < backwardDirection.length; j++){
        sorted.push(backwardDirection[j]);
      }
      for (let k = 0; k < forwardDirection.length; k++){
        sorted.push(forwardDirection[k]);
      }
      return sorted;
  }
}

public addFeaturePoints(item:any, partNo:number, category?:string):Array<any>{
  console.log('Each Feature Parts');

  let featurePart = JSON.parse(JSON.stringify(this.fullSinglePart[partNo]));

  let firstNode = turf.point([featurePart[0].lng, featurePart[0].lat]); 
  for (let i = 0; i < featurePart.length; i++) { 
    let vertex = turf.point([featurePart[i].lng, featurePart[i].lat]); 
    let distance = turf.distance(firstNode, vertex, 'meters');
    featurePart[i].distance = distance;
    featurePart[i].geometry = L.latLng(featurePart[i].lat, featurePart[i].lng);
    featurePart[i].vertex = true;
  }

  let allItems = [];
  
  for (let i = 0; i < featurePart.length - 1; i++) {
  //console.log(i);
    allItems.push(featurePart[i]);
    let start = turf.point([featurePart[i].lng, featurePart[i].lat]);
    let end = turf.point([featurePart[i+1].lng, featurePart[i+1].lat]);
    let partLine = turf.lineString([start.geometry.coordinates, end.geometry.coordinates]);
    let partBuffer = turf.buffer(partLine, 0.5, 'meters');

    for (let j = 0; j < item.length; j++) {
      let riverPoint = turf.point([item[j].geometry.lng, item[j].geometry.lat]);
      let distance = turf.distance(firstNode, riverPoint, 'meters');
      item[j].distance = distance;
      let isInside = turf.inside(riverPoint, partBuffer);
      if(isInside){allItems.push(item[j])}
    }
  }

  allItems.sort(function(a, b){return a.distance - b.distance});
  //console.log (allItems);
  return allItems;
}

  /**
   * Method returns the distance of a snapped perpendicular point from the original point on a line.
   * Input are all in LatLng format, returns distance only in meters.
   * 
   * Enoch
   * @param item Point to be snapped in LatLng format
   * @param line1 Coordinate of line LatLng format
   * @param line2 Coordinate of line LatLng format
   */
  public getShortestDistanceOnLine(item:L.LatLng, line1: L.LatLng, line2:L.LatLng):number {

    let itemPoint = turf.point([item.lng, item.lat]);
    let point1 = turf.point([line1.lng, line1.lat]);
    let point2 = turf.point([line2.lng, line2.lat]);
    let line = turf.lineString([point1.geometry.coordinates, point2.geometry.coordinates]);
    let snapped = turf.pointOnLine(line, itemPoint);
    let distance = turf.distance(snapped, itemPoint, 'metres');

    return distance;
  }

  /**
   * An intermediate point at any fraction along the great circle path between two points can also be calculated.
   * Code adapted from Chris Veness at http://www.movable-type.co.uk/scripts/latlong.html.
   * Check Intermediate point section.
   * 
   * Enoch.
   * @param point1 
   * @param point2 
   * @param allvertexNos 
   */
  public _getfractionPoints(point1:L.LatLng, point2:L.LatLng, allvertexNos:number ):number[] {
    
      const RAD = 0.01745329252, DEG = 57.295779513;

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
    
    /**
     * Publish River and Peak data to the profile component.
     * 
     * Enoch.
     */
    public onfinish() {
      let data = [];
      data[0] = {river:this.riverGraphData};
      data[1] = {peak:this.peaksGraphData};
      console.log('%cRiver and Peaks Data', 'color:white; background:black');
      console.log(data);
      this._emitterService.publishData(data);
    }

   
 
   
    public majorNodesMenu(e) {

    console.log(this.drawnMarkers);
    console.log(e);

            var label="LL";
             

        this.modal.prompt()
        .size('sm')
        .showClose(true)
        .body(`
                  <div class="input-group">
                    <span class="input-group-addon">Edit label</span>
                    <input #label id="msg" type="text" class="form-control" name="msg" placeholder="Edit label" >
                   </div>`
            )
        .open();

        let input = $('.form-control').val();

        console.log(input);

        //console.log(this.drawnMarkers);



         // e.target.setTooltipContent(label);

        // this.EventDispatcher.trigger('changeLabel', {vertex: e.target, label:'Hallo'});
       
    
  }
    



} // Leaflet map class

