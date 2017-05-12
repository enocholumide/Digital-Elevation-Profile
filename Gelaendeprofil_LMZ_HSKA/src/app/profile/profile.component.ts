import { Component, OnInit, OnChanges, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';



import * as moment from 'moment';
import * as d3 from 'd3';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})


export class ProfileComponent implements OnInit, OnChanges, AfterViewInit {

  @Input()  private data = [];
  @ViewChild('chart') element: ElementRef;
  
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
    this.htmlElement = this.element.nativeElement;
    this.host = d3.select(this.htmlElement);
  }


  ngOnChanges() {

    if(!this.data || this.data.length === 0 || !this.host) return;

    

    this.data.forEach((d: any) => {

      d.location = d[0];
      d.elevation = d[1];
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
                     .attr('transform', `translate(${this.margin.left},      ${this.margin.top})`);

  }

  buildSVG() {

    this.svg.html('')

    this.xScale = d3.scaleIdentity() .domain([d3.min(this.data, d => d[0]), d3.max(this.data, d => d[0])]) .range([0, this.width]);

    this.yScale = d3.scaleLinear() .domain([d3.min(this.data, d => d[1]), d3.max(this.data, d => d[1])]) .range([this.height, 0]);

    this.svg.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.xScale));

    this.svg.append('g')
     .call(d3.axisLeft(this.yScale));

    let line = d3.line() .x(d => this.xScale(d[0])) .y(d => this.yScale(d[1]));

    this.update = this.svg.selectAll('.line').data(this.data);
    this.update
        .enter()
        .append('area')
        .attr('class', 'line')
        .transition(line)
        .attr('d', d => line(d.elevation))
        .style('stroke', '#153ac0')
        .style('stroke-width', 3)
        .style('fill', 'none');

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































/*import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3'; 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";

import '../shared/d3/build/d3.js';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data = [];
  private margin: any = { top: 20, bottom: 0, left: 0, right: 0};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;

 private x: any;
  private y: any;
  private svg: any;
  private line: d3Shape.Line<[number, number]>;

  constructor() { }

  ngOnInit() {
    //console.log(this.chartContainer.nativeElement);
    this.createChart();
    if (this.data) {
      this.updateChart();
      this.drawLine();
    }
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
      this.drawLine();
    }
  }

  createChart() {
    let element = this.chartContainer.nativeElement;
    console.log(element);
    
    this.width = 450;
    this.height = 250;
    let svg = d3.select(element).append('svg')
      .attr('width', "100%")
      .attr('height', "100%");

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'lines')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // define X & Y domains
    let xDomain = this.data.map(d => d[0]);
    let yDomain = [0, d3.max(this.data, d => d[1])];

    // create scales
  
    this.xScale = d3.scaleBand().padding(0).domain(xDomain).rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).rangeRound([this.height, 0]);

    // bar colors
    this.colors = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>['red', 'blue']);

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3.axisBottom(this.xScale));
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale));
  }


 private drawLine() {
   this.line = d3.line()    .x(function(d) { return (this.data.d[0]); })    .y(function(d) { return (this.height-this.data.d[1]); });
  // this.line = d3Shape.line().x( (d: any) => this.x(d[0]) ).y( (d: any) => this.y(d[1]) );
    this.svg.append("line").datum(this.data).attr("class", "line").attr("d", this.line);}


  updateChart() {
    // update scales & axis
    this.xScale.domain(this.data.map(d => d[0]));
    this.yScale.domain([0, d3.max(this.data, d => d[1])]);
    this.colors.domain([0, this.data.length]);
    this.xAxis.transition().call(d3.axisBottom(this.xScale));
    this.yAxis.transition().call(d3.axisLeft(this.yScale));

    let update = this.chart.selectAll('.line')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();
  
 
    
    // update existing bars
    this.chart.selectAll('.line').transition()
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', d => this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d[1]))
      .style('fill', (d, i) => this.colors(i));

    // add new bars
    update
      .enter()
      .append('rect')
      //.append('line')
      .attr('class', 'line')
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(0))
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.colors(i))
      .transition()
      .delay((d, i) => i)
      .attr('y', d => this.yScale(d[1]))
      .attr('height', d => this.height - this.yScale(d[1]));
  }

 




}
*/