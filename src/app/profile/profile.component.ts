import { Component, OnInit, OnChanges } from '@angular/core';
import { EmitterService } from '../shared/emitter.service';

import * as d3 from 'd3'; 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";

import {Selection, select } from 'd3-selection';
import {transition} from 'd3-transition';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
  
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
  

  private chart: any;

  private counter = 0;

  constructor(private _emitterService: EmitterService) {
    this.width = 800 - this.margin.left - this.margin.right ;
    this.height = 400 - this.margin.top - this.margin.bottom;

      

    this._emitterService.case$.subscribe( newdata => this.switch(newdata) );
    //this._emitterService.caseRiverandPeak$.subscribe(newdata => this.peaksAndRivers(newdata));
  }
 
  peaksAndRivers(newdata) {

    alert("HERE");
    console.log(newdata.peak);

    
    
  }

  switch(newdata) { this.lineData = newdata; this.createElevationProfile() }

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
          .range([this.height, 0]);

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
                          .y( (d: any) => yScale(d.y) )
                          ;

      if (this.update === false) {
      
          this.svg.append("path")
              .datum(this.lineData)
              .attr("class", "area")
              .attr("d", this.area)

          this.svg.append("path")
              .datum(this.lineData)
              .attr("class", "line")
              .attr("d", this.line)
              .attr('stroke','red')
              .attr("fill", "none")
              ;
                  
          this.svg.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + this.height + ")")
                  .call(this.xAxis);

          this.svg.append("g")
              .attr("class", "y axis")
              .call(this.yAxis);

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
          .attr("x", (d: any) => xScale(d.x) - 15 )
          .attr("y", (d: any) => yScale(d.y) - 10 )
          .attr("id", "rivers")
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
          .attr("x", ( d: any) => xScale(d.x) - 15 )
          .attr("y", ( d: any) => yScale(d.y) - 10 )
          .attr("id", "peaks")
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
 
      this.svg.append("path")
          .datum(this.lineData)
          .attr("class", "line")
          .attr("d", this.line)
          .attr('stroke','red')
          .attr("fill", "none");

      this.svg.append("path")
          .datum(this.lineData)
          .attr("class", "area")
          .attr("d", this.area);

      this.appendNodeLabels();         

      this.svg.selectAll("g .y.axis").transition()
          .call(this.yAxis);

      this.svg.selectAll("g .x.axis").transition()
          .call(this.xAxis);
    
  }

  private appendNodeLabels() {

    var xScale = this.xScale;
    var yScale = this.yScale;

    var labels = this.svg.selectAll("g nodeTexts")
                .data(this.nodeLabel)
            
            var labelsEnter = labels.enter()
              .append("g")
              
            var circle = labelsEnter.append("circle")
              .attr("id", "nodeLabels")
              .attr("r", 20)
              .attr('cx', function(d:any) { return xScale(d.x); })
              .attr("fill", "red")

              labelsEnter
              .append("text")
              .attr("id", "nodeLabels")
              .attr('dx', function(d:any) { return xScale(d.x); })
              .attr('dy', 20/4)
              .attr("text-anchor", "middle")
              .text(function(d){return d.name})
              .attr("stroke", "white")

  } // Append NodeLabels

} // Profile Class