import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3'; 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";

import { data } from './data';

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

  constructor() {
    this.width = 690 - this.margin.left - this.margin.right ;
    this.height = 300 - this.margin.top - this.margin.bottom;
  }

  ngOnInit() {
    this.initSvg()
    this.initAxis();
    this.drawAxis();
    this.drawLine();
  }

  private initSvg() {
    this.svg = d3.select("svg")
                 .append("g")
                 .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");;
  }

  private initAxis() {
    this.x = d3Scale.scaleLinear().range([0, this.width]);
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    this.x.domain([d3.min(data, d => d.dist), d3.max(data, d => d.dist)]) .range([0, this.width]);
    this.y.domain([d3.min(data, d => d.ele), d3.max(data, d => d.ele)]) .range([this.height, 0]);
  }

  private drawAxis() {

    this.svg.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + this.height + ")")
          .call(d3Axis.axisBottom(this.x))
          //.style("text-anchor", "center")
         // .text("distance")
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
          /*.text(function(data, d => d.name) {
            return d.name;
          })*/
          ;
         }

  private drawLine() {
    this.line = d3Shape.line()
                        .curve(d3.curveCardinal)
                       .x( (d: any) => this.x(d.dist) )
                       .y( (d: any) => this.y(d.ele) );
                       

    this.svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", this.line)
            .attr('stroke','blue')
            .attr("fill", "none")
           .style('fill', 'area')
            ;

    this.svg.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .text(function(d, i){ return (d.name)})
            .attr("y", function(d){ return (d.name)})
            .attr('x', function(d){return (d.dist)})
            .attr("dy", ".93em")
            
            ;
  }

}



/*import { Component, OnInit, OnChanges, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';



import * as moment from 'moment';
import * as d3 from 'd3'; 'd3-selection';

import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";

import { data } from './data';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})


export class ProfileComponent implements OnInit, OnChanges, AfterViewInit, data {

//  @Input()  private data = [];
  @ViewChild('chart') element: ElementRef;

public dist;
public ele;
public name;
  private host;
  private svg;
  private margin;
  private width: any;
  private height: any;
  private xScale;
  private yScale;
  private xAxis;
  private yAxis;
  private htmlElement: HTMLElement;
  t: any;
  update: any;


  constructor() { }

  ngOnInit() {
    this.margin = { top: 20, right: 20, left: 50, bottom: 20 };
    this.width = 500;
    this.height = 300;
  }


  ngAfterViewInit(){
    //this.htmlElement = this.element.nativeElement;
    this.host = d3.select(this.htmlElement);
  }


  ngOnChanges() {

    //if(!data || data.length === 0 || !this.host) return;

    

    data.forEach(function(d: any) {

      d.dist = d[0];
      d.ele = d[1];
      d.name = d[2];
        console.log(d[0],d[1],d[2])
    });

    if(!this.svg) {
      this.setup();
    }

    this.buildSVG();

    this.drawXAxis();
    this.drawYAxis();
    this.populate();

  }

  setup() {

    this.svg = this.host
                   .append('svg')
                     .attr('width', this.width + this.margin.left + this.margin.right)
                     .attr('height', this.height + this.margin.top + this.margin.bottom)
                     .call(this.responsivefy)
                   .append('g')
                     .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

  }

  buildSVG() {

    this.svg.html('')

    this.xScale = d3.scaleLinear() .domain([d3.min(data, d => d.dist), d3.max(data, d => d.dist)]) .range([0, this.width]);

    this.yScale = d3.scaleLinear() .domain([d3.min(data, d => d.ele), d3.max(data, d => d.ele)]) .range([this.height, 0]);

    this.svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.xScale));

    this.svg.append('g')
     .call(d3.axisLeft(this.yScale));

    let line = d3.line() .x(d => this.xScale(d[0])) .y(d => this.yScale(d[1]));
//let line = d3.line() .x(function(d){return this.xScale(d[0])}) .y(function (d) {return this.yScale(d[1])});

    this.update = this.svg.selectAll('.line').data(data);
    this.update
        .enter()
        .attr("d", line)
        .append('path')
        .attr('class', 'line')
        .transition(line)
        //.datum(data)
        //.attr('d', d => line(d[1]))
        //.attr('x', d => this.xScale(d[0]))
       // .style('stroke', '#153ac0')
       // .style('stroke-width', 3)
        //.style('fill', 'area')
        ;

  }

  responsivefy(svg) {

      var chart = d3.select(svg.node().parentNode);
      let margin = { top: 20, right: 20, left:20, bottom: 20 };
      var width = parseInt(svg.style('width'));
      var height = parseInt(svg.style('height'));
      var aspect = width / height;

      svg.attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
         .attr('preserveAspectRatio', 'xMinYMid')
         .call(resize);

      d3.select(window).on('resize.' + chart.attr('id'), resize);

      function resize() {
        var targetWidth = parseInt(chart.style('width'));

        svg.attr('width', targetWidth);
        svg.attr('height', Math.round(targetWidth/aspect));
      }
  }

  drawXAxis() {


  }

  drawYAxis() {


  }

  populate() {


  }
}
*/