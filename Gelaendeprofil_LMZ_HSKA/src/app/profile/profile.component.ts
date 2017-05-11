import { Component, OnInit, OnChanges, AfterViewInit, NgZone, ViewChild, ElementRef, Input, ViewEncapsulation, AfterViewChild } from '@angular/core';
import * as d3 from 'd3';
//const d3=require('d3');
import * as moment from 'moment';
import '../shared/d3/build/d3.js';
import { element } from 'protractor';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnChanges, AfterViewChild {
  @ViewChild('chart') private element: ElementRef;
  @Input() private data = [];
  
  private host;
  private svg;
  private margin: any = { top: 15, bottom: 15, left: 15, right: 15};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;

  private HTMLElement: HTMLElement;
  t:any;
  update: any;

  constructor(private zone: NgZone) { }

  ngOnInit() {
    //console.log(this.chartContainer.nativeElement);
    this.createChart();
    if (this.data) {
      this.updateChart();
    }
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  createChart() {
    let element = this.chartContainer.nativeElement;
    console.log(element);
    //console.log(element)
    this.width = 500;
    this.height = 300;
   // this.t = d3.transition().duration(10);
    let svg = d3.select(element).append('svg')
      .attr('width', "90%")
      .attr('height', "90%");

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('class', 'line')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    let line = d3.line()
    .x(d => this.xScale(d[0]))
    .y(d => this.yScale(d[1]))
    .curve(d3.curveCatmullRom.alpha(0.5));



    // define X & Y domains
    let xDomain = this.data.map(d => d[0]);
    let yDomain = [0, d3.max(this.data, d => d[1])];

    // create scales
    this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
    //this.xScale = d3.line[this.chart.d[0], this.chart.d[1]];
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);

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

  updateChart() {
    // update scales & axis
    this.xScale.domain(this.data.map(d => d[0]));
    this.yScale.domain([0, d3.max(this.data, d => d[1])]);
    this.colors.domain([0, this.data.length]);
    this.xAxis.transition().call(d3.axisBottom(this.xScale));
    this.yAxis.transition().call(d3.axisLeft(this.yScale));

    let update = this.chart.selectAll('.bar')
      .data(this.data);
      
    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
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
    //  .append('path')
      .attr('class', 'bar')
    //  .attr('class', 'line')
      //.transition(this.t)
      //.attr('d', d => line(this.data))
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(0))
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.colors(i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScale(d[1]))
      .attr('height', d => this.height - this.yScale(d[1]));
  }
}

