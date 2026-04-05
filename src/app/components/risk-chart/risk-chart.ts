import { Component, Input, ElementRef, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-risk-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="w-full bg-white p-6 rounded-3xl border border-medical-border shadow-sm">
      <h4 class="text-sm font-bold text-medical-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <mat-icon class="text-indigo-600">insights</mat-icon>
        5 yillik xavf profili
      </h4>
      <div #chartContainer class="w-full h-[450px]"></div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class RiskChartComponent implements OnChanges, AfterViewInit {
  @Input() risks: { 
    heart?: number; 
    kidney?: number; 
    lung?: number; 
    liver?: number; 
    cancer?: number; 
    diabetes?: number;
    anemia?: number;
    sepsis?: number;
    rehospitalization?: number;
    nutritional_deficiency?: number;
    chronic_inflammation?: number;
    quality_of_life_decline?: number;
  } = {};
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  private margin = { top: 20, right: 60, bottom: 40, left: 140 };

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['risks'] && this.chartContainer) {
      this.createChart();
    }
  }

  private createChart() {
    if (!this.risks || !this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.clientWidth - this.margin.left - this.margin.right;
    const height = element.clientHeight - this.margin.top - this.margin.bottom;

    const data = [
      { label: 'Yurak yetishmovchiligi', value: this.risks.heart || 0, color: '#ef4444' },
      { label: 'Buyrak yetishmovchiligi', value: this.risks.kidney || 0, color: '#3b82f6' },
      { label: 'O\'pka kasalliklari', value: this.risks.lung || 0, color: '#64748b' },
      { label: 'Jigar yetishmovchiligi', value: this.risks.liver || 0, color: '#f59e0b' },
      { label: 'Onkologiya', value: this.risks.cancer || 0, color: '#a855f7' },
      { label: 'Qandli diabet', value: this.risks.diabetes || 0, color: '#10b981' },
      { label: 'Anemiya', value: this.risks.anemia || 0, color: '#dc2626' },
      { label: 'Sepsis xavfi', value: this.risks.sepsis || 0, color: '#7f1d1d' },
      { label: 'Gospitalizatsiya', value: this.risks.rehospitalization || 0, color: '#4338ca' },
      { label: 'Nutritiv tanqislik', value: this.risks.nutritional_deficiency || 0, color: '#ea580c' },
      { label: 'Surunkali yallig\'lanish', value: this.risks.chronic_inflammation || 0, color: '#b91c1c' },
      { label: 'Hayot sifati pasayishi', value: this.risks.quality_of_life_decline || 0, color: '#4b5563' }
    ].filter(d => d.value > 0); // Only show risks with value > 0 to keep it clean

    if (data.length === 0) return;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    const y = d3.scaleBand()
      .range([0, height])
      .domain(data.map(d => d.label))
      .padding(0.3);

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .attr('class', 'text-medical-text-muted font-mono text-[10px]');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y))
      .attr('class', 'text-medical-text font-bold text-[10px]');

    // Add bars
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('y', d => y(d.label)!)
      .attr('x', 0)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => d.color)
      .attr('rx', 6)
      .transition()
      .duration(1000)
      .attr('width', d => x(d.value));

    // Add labels
    svg.selectAll('text.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('y', d => y(d.label)! + y.bandwidth() / 2 + 4)
      .attr('x', d => x(d.value) + 5)
      .text(d => d.value + '%')
      .attr('class', 'text-[10px] font-black fill-medical-text');
  }
}
