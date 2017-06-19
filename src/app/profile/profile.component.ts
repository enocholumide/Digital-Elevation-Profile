import { Component, OnInit } from '@angular/core';
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
  private lineData:Array<any>;

  private xScale: any;
  private yScale: any;

  private chart: any;

  private counter = 0;

  constructor(private _emitterService: EmitterService) {
    this.width = 800 - this.margin.left - this.margin.right ;
    this.height = 400 - this.margin.top - this.margin.bottom;

    this._emitterService.case$.subscribe(newdata => this.switch(newdata));
  }
 

  switch(newdata) {
    this.counter++;
    //console.log(newdata);
    this.lineData = newdata;
    if (this.counter > 1) {this.updateChart()} else {this.initAxis()}
  }

  ngOnInit() {
    this.lineData = [];    
    this.initSvg();  
  }

   private initSvg() {
    this.svg = d3.select("svg")
                 .append("g")
                 .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");;
  }

  private initAxis() {
    this.x = d3Scale.scaleLinear().range([0, this.width]);
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    this.x.domain([d3.min(this.lineData, d => d.x), d3.max(this.lineData, d => d.x)]) .range([0, this.width]);
    this.y.domain([d3.min(this.lineData, d => d.y), d3.max(this.lineData, d => d.y)]) .range([this.height, 0]);
    this.drawAxis();
  }

  private drawAxis() {

    this.svg.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + this.height + ")")
          .call(d3Axis.axisBottom(this.x))
          ;

    this.svg.append("g")
          .attr("class", "axis axis--y")
          .call(d3Axis.axisLeft(this.y))
          .append("text")
          .attr("class", "axis-title")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("elevation")
          ;
          this.drawLine();
         }

  private drawLine() {
    this.line = d3Shape.line()
                        .curve(d3.curveMonotoneX)
                        .x( (d: any) => this.x(d.x) )
                        .y( (d: any) => this.y(d.y) );
                       

    this.svg.append("path")
            .datum(this.lineData)
            .attr("class", "line")
            .attr("d", this.line)
            .attr('stroke','blue')
            .attr("fill", "none")
            ;


this.xScale= this.x;
this.yScale = this.y;

   this.svg.selectAll('text')
            .data(this.lineData)
            .enter()
            .append('text')
            .attr("style", "fill: red; writing-mode: tb; glyph-orientation-vertical: 0")
            .attr("x", function(d, i) {return(this.xScale(d.x))})
            .attr("y", function(d,i){return(this.yScale(d.y))})
            .text(function(d, i){ return d.name})
            .style("font-size", "10px")
            .attr("text-anchor", "middle") 
            .attr("dy", ".35em")

            ;
  }


  private updateChart(){
    
    // TODO
    this.x.domain([d3.min(this.lineData, d => d.x), d3.max(this.lineData, d => d.x)]) .range([0, this.width]);
    this.y.domain([d3.min(this.lineData, d => d.y), d3.max(this.lineData, d => d.y)]) .range([this.height, 0]);

    this.x.call(d3.axisBottom(this.xScale));
    this.y.call(d3.axisLeft(this.yScale));


        this.line = d3Shape.line()
                        .curve(d3.curveMonotoneX)
                        .x( (d: any) => this.x(d.x) )
                        .y( (d: any) => this.y(d.y) );

    let update = this.svg.selectAll('.line')
      .data(this.lineData);

    // remove exiting bars
    update.exit().remove();

    this.svg.selectAll('.line').transition()
      
            
            .attr("class", "line")
            .attr("d", this.line)
            .attr('stroke','blue')
            .attr("fill", "none")
            ;

      update
      .enter()
      .append("path")
      .datum(this.lineData)
      .attr("class", "line")
      .attr('x', d => this.xScale(d.x))
      .attr('y', d => this.yScale(d.y))
      .attr("d", this.line)
      .attr('stroke','blue')
      .attr("fill", "none")
      ;


  }

}