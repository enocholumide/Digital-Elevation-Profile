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
        .append('path')
        .attr('class', 'line')
        .transition(line)
        .datum(this.data)
        .attr('d', d => line(this.data))
        .attr('x', d => this.xScale(d[0]))
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
