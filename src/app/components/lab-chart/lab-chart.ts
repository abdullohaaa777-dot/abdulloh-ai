import { Component, Input, ElementRef, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';

import { MatIconModule } from '@angular/material/icon';

interface LabData {
  marker: string;
  value: number;
  min: number;
  max: number;
  status: string;
}

@Component({
  selector: 'app-lab-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="w-full overflow-x-auto bg-white p-6 rounded-3xl border border-medical-border shadow-sm">
      <h4 class="text-sm font-bold text-medical-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <mat-icon class="text-medical-primary">bar_chart</mat-icon>
        Laboratoriya ko'rsatkichlari diagrammasi
      </h4>
      <div #chartContainer class="w-full h-[400px]"></div>
      <div class="mt-4 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Normal</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>O'zgargan</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-1 bg-slate-200 border-x border-slate-400"></div>
          <span>Referens oralig'i</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .chart-container { width: 100%; height: 100%; }
  `]
})
export class LabChartComponent implements OnChanges, AfterViewInit {
  @Input() data: { marker: string; value: string; reference_range: string; status: string }[] = [];
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  private svg: unknown;
  private margin = { top: 20, right: 30, bottom: 60, left: 120 };

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.chartContainer) {
      this.createChart();
    }
  }

  private parseRange(rangeStr: string): { min: number; max: number } {
    // Matches patterns like "13–17", "4–10", "<5", ">150"
    const rangeMatch = rangeStr.match(/(\d+\.?\d*)\s*[–-]\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    
    const lessMatch = rangeStr.match(/<\s*(\d+\.?\d*)/);
    if (lessMatch) {
      return { min: 0, max: parseFloat(lessMatch[1]) };
    }

    const greaterMatch = rangeStr.match(/>\s*(\d+\.?\d*)/);
    if (greaterMatch) {
      return { min: parseFloat(greaterMatch[1]), max: parseFloat(greaterMatch[1]) * 2 };
    }

    return { min: 0, max: 100 };
  }

  private createChart() {
    if (!this.data || this.data.length === 0 || !this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.clientWidth - this.margin.left - this.margin.right;
    const height = element.clientHeight - this.margin.top - this.margin.bottom;

    const processedData: LabData[] = this.data.map(d => {
      const range = this.parseRange(d.reference_range);
      return {
        marker: d.marker,
        value: parseFloat(d.value.replace(/[^0-9.]/g, '')),
        min: range.min,
        max: range.max,
        status: d.status
      };
    }).filter(d => !isNaN(d.value));

    if (processedData.length === 0) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    const y = d3.scaleBand()
      .range([0, height])
      .domain(processedData.map(d => d.marker))
      .padding(0.4);

    const maxVal = d3.max(processedData, d => Math.max(d.value, d.max));
    const x = d3.scaleLinear()
      .domain([0, (maxVal || 100) * 1.1])
      .range([0, width]);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr('class', 'text-medical-text-muted font-mono text-[10px]');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y))
      .attr('class', 'text-medical-text font-bold text-[10px]');

    // Add Reference Ranges
    svg.selectAll('rect.range')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'range')
      .attr('y', d => y(d.marker)!)
      .attr('x', d => x(d.min))
      .attr('width', d => x(d.max) - x(d.min))
      .attr('height', y.bandwidth())
      .attr('fill', '#f1f5f9')
      .attr('rx', 4);

    // Add Value Bars
    svg.selectAll('rect.value')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'value')
      .attr('y', d => y(d.marker)! + y.bandwidth() / 4)
      .attr('x', 0)
      .attr('width', d => x(d.value))
      .attr('height', y.bandwidth() / 2)
      .attr('fill', d => d.status === 'normal' ? '#10b981' : '#ef4444')
      .attr('rx', 2)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Add Value Labels
    svg.selectAll('text.value-label')
      .data(processedData)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('y', d => y(d.marker)! + y.bandwidth() / 2 + 4)
      .attr('x', d => x(d.value) + 5)
      .text(d => d.value)
      .attr('class', 'text-[10px] font-black fill-medical-text');
  }
}
