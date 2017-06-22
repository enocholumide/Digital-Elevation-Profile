import { Component, OnInit, OnChanges, ViewChild } from '@angular/core';
import { EmitterService } from '../shared/emitter.service';
import { MapService } from '../shared/map.service';

import * as d3 from 'd3'; 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";


import * as L from 'leaflet';
import { Map } from 'leaflet';

import {Selection, select } from 'd3-selection';
import {transition} from 'd3-transition';

import { LeafletmapComponent } from '../leafletmap/leafletmap.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [ MapService ]
})

export class ProfileComponent implements OnInit {

  private margin = {top: 50, right: 40, bottom: 50, left: 40};
  private width: number;
  private height: number;
  private x: any;
  private y: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;
  private area: d3Shape.Area<[number, number]>;
  private lineData:Array<any>;
  private nodeLabel:Array<any>;
  private peakData:any;
  private riverData:any;

  private xSCALE: any;
  private ySCALE: any;

  private xAxis: any;
  private yAxis: any;

  private xScale: any;
  private yScale: any;
  private update;
  
  public mouseEventsMarkers:L.FeatureGroup;

  private chart: any;

  private counter = 0;

  private map: Map;
  private map2;

  
  constructor(private _emitterService: EmitterService, private _mapService: MapService,) {
    this.width = 800 - this.margin.left - this.margin.right ;
    this.height = 400 - this.margin.top - this.margin.bottom;

    this._emitterService.case$.subscribe( newdata => this.switch(newdata) );
    //this._emitterService.caseRiverandPeak$.subscribe(newdata => this.peaksAndRivers(newdata));
  }
 
  peaksAndRivers(newdata) {

    alert("HERE");
    console.log(newdata.peak);

  }

  switch(newdata) {
    if (newdata.hasOwnProperty("leafletmap")) {
      this.map = newdata;
      console.log("Leaflet Map");
      console.log(this.map);
    } else { this.lineData = newdata; this.createElevationProfile() }
  }

  ngOnInit() {
    this.update = false;
    this.lineData = [];   
    this.initSvg();
  }
 

   private initSvg() {
    this.svg = d3.select("svg")
                 .append("g")
                 .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  private createElevationProfile(){

    console.log('BASE MAP');
    console.log(this.map);
    
    if ( (this.lineData.hasOwnProperty("editedLabel")) ) { 
        
      this.svg.selectAll('#nodeLabels').remove();
      let newLabel:any = this.lineData;
      this.nodeLabel[newLabel.index].name = newLabel.editedLabel;
      this.appendNodeLabels();

    }
    
    else if (! ((this.lineData.hasOwnProperty("river")) || this.lineData.hasOwnProperty("peak")) ) {
    
      this.nodeLabel = [];
      let tempLabel = "";
      for ( let i = 0; i < this.lineData.length; i++ ) {
        if ( this.lineData[i].node === "Y" ) {
          if ( !(this.lineData[i].name === tempLabel) )
              { this.nodeLabel.push( {x: this.lineData[i].x, name: this.lineData[i].name, index: i} ) }
        } tempLabel = this.lineData[i].name;
      }

      this.xScale = d3Scale.scaleLinear()
          .domain([0, d3.max(this.lineData, function(d) { return d.x; })])
          .range([0, this.width]);

      this.yScale = d3Scale.scaleLinear()
          .domain([0, d3.max(this.lineData, function(d) { return d.y; })])
          .range([this.height, 40]);

      this.xAxis = d3Axis.axisBottom(this.x).scale(this.xScale);
      this.yAxis = d3Axis.axisLeft(this.y).scale(this.yScale);

      var xScale = this.xScale;                    
      var yScale = this.yScale;

      this.area = d3.area()
          .curve(d3.curveMonotoneX)
          .x(function(d:any) { return xScale(d.x); })
          .y0(this.height)
          .y1(function(d:any) { return yScale(d.y); });

      this.line = d3Shape.line()
          .curve(d3.curveMonotoneX)
          .x( (d: any) => xScale(d.x) )
          .y( (d: any) => yScale(d.y) );

      
      if (this.update === false) {
           
          this.svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + this.height + ")")
              .call(this.xAxis);

          this.svg.append("g")
              .attr("class", "y axis")
              .call(this.yAxis);

          this.appendPlotArea();
          this.appendNodeLabels();
              

    } else if (this.update === true) {  this.updateElevationProfile() }
    
    this.update = true;

  }  else { this.insertlabels() }

 }

 /**
  * 
  * Enoch
  */
 private insertlabels() {

    var xScale = this.xScale;                    
    var yScale = this.yScale;
  
    if ( this.lineData.hasOwnProperty("river") ) {

      // -------------------------------------------
      this.riverData = this.lineData;
      let river:Array<any> = this.riverData.river;
      // -------------------------------------------

      if (river.length > 0) {
        var riverLabels = this.svg.selectAll("g rivers").data(river); 
        var riverLabelsEnter = riverLabels.enter().append("g");
        var circle = riverLabelsEnter.append("circle")
          .attr("r", 5)
          .attr('cx', function(d:any) { return xScale(d.x); })
          .attr('cy', function(d:any) { return yScale(d.y); })
          .attr("id", "rivers")
          .attr("fill", "blue")
          
        riverLabelsEnter.append("text")
          .text( (d: any) => (d.name) )
          .attr("id", "rivers")
           .attr("transform", function(d){
            var x = xScale(d.x);
            var y = yScale(d.y - 10);
            return "translate(" + x + "," + y + ") rotate(90)" })
          .attr("font_family", "sans-serif")
          .attr("font-size", "14px")
          .attr("fill", "darkblue");
      }
    }

    if ( this.lineData.hasOwnProperty("peak") ) {

      // -------------------------------------------
      this.peakData = this.lineData;
      let peak:Array<any> = this.peakData.peak;
      // ------------------------------------------- 

      if (peak.length > 0) {
        var peakLabels = this.svg.selectAll("g peaks").data(peak); 
        var peaksLabelsEnter = peakLabels.enter().append("g");  
        var circle = peaksLabelsEnter.append("circle")
          .attr("r", 5)
          .attr('cx', function(d:any) { return xScale(d.x); })
          .attr('cy', function(d:any) { return yScale(d.y); })
          .attr("id", "peaks")
          .attr("fill", "black");
          
        peaksLabelsEnter.append("text")
          .text( (d: any) => (d.name) )
          .attr("id", "peaks")
          .attr("transform", function(d){
            var x = xScale(d.x);
            var y = yScale(d.y) - 10;
            return "translate(" + x + "," + y + ") rotate(-45)" })
          .attr("font_family", "sans-serif")
          .attr("font-size", "14px")
          .attr("fill", "purple");
      }
    }
 }

  private updateElevationProfile() {

    console.log("Update");

      let updateLine = this.svg.selectAll('.line').remove();
      let updateArea = this.svg.selectAll('.area').remove();
      this.svg.selectAll('#peaks').remove();
      this.svg.selectAll('#rivers').remove();
      this.svg.selectAll('#nodeLabels').remove();
      this.svg.selectAll('#hiddenTicks').remove();
 
      this.appendPlotArea();
      this.appendNodeLabels();         

      this.svg.selectAll("g .y.axis").transition()
          .call(this.yAxis);

      this.svg.selectAll("g .x.axis").transition()
          .call(this.xAxis);
    
  }

  private appendNodeLabels() {

    let xScale = this.xScale;
    let yScale = this.yScale;

    console.log(this.nodeLabel);

    let labels = this.svg.selectAll("g nodeTexts")
                .data(this.nodeLabel)
            
    let labelsEnter = labels.enter()
      .append("g")
      
    let circle = labelsEnter.append("circle")
      .attr("id", "nodeLabels")
      .attr("r", 20)
      .attr('cx', function(d:any) { return xScale(d.x); })
      .attr("fill", "red");

    labelsEnter
      .append("text")
      .attr("id", "nodeLabels")
      .attr('dx', function(d:any) { return xScale(d.x); })
      .attr('dy', 20/4)
      .attr("text-anchor", "middle")
      .text(function(d){return d.name})
      .attr("stroke", "white");

    labelsEnter
      .append("line")
      .style("stroke", "darkgrey")
      .filter(function(d) { return d.x > 0 })
      .attr("id", "nodeLabels")
      .attr("x1", (d: any) => xScale(d.x) )
      .attr("x2", (d: any) => xScale(d.x) )
      .attr("y1", this.height )
      .style("stroke-dasharray", ("7, 7"))
      .attr("y2", +30 );

  } // Append NodeLabels


  private appendPlotArea() {

      let xScale = this.xScale;
      let yScale = this.yScale;

      this.svg.append("path")
          .datum(this.lineData)
          .attr("class", "line")
          .attr("d", this.line)
          .attr('stroke','red')
          .attr("fill", "none");

      this.svg.append("path")
          .datum(this.lineData)
          .attr("class", "area")
          .attr("d", this.area)
          .attr("fill", "lightsteelblue");

      let hidden = this.svg.selectAll("g hiddenTicks")
          .data(this.lineData);
      let hiddenEnter = hidden.enter()
          .append("g");

      let circle = hiddenEnter.append("line")
          .style("stroke", "lightsteelblue")
          .attr("id", "hiddenTicks")
          .attr("x1", (d: any) => xScale(d.x) )
          .attr("x2", (d: any) => xScale(d.x) )   
          .attr("y1", this.height )  
          .attr("y2", (d: any) => yScale(d.y)  ) 
          .on("mouseover", d => this.handleMouseOver(d, this.map))
          .on("mouseout", d => this.handleMouseOut(d))
          .transition();
     
  }

  private handleMouseOver(d, map) {

    let lmap:Map = map;
    let markers:any;

    this.mouseEventsMarkers = new L.FeatureGroup(markers);
    lmap.addLayer(this.mouseEventsMarkers);

    let yellowSphereIcon = L.icon({ iconUrl: 'http://www.iconsdb.com/icons/preview/royal-blue/map-marker-2-xxl.png', 
                                    iconSize: [30,30],
                                    iconAnchor: [15,35]});
    let marker = L.marker([d.geometry.lng, d.geometry.lat], {icon: yellowSphereIcon });
    this.mouseEventsMarkers.addLayer(marker);
  
  }

  private handleMouseOut(e) {
    this.mouseEventsMarkers.clearLayers();
  }



} // Profile Class