import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { recommendNextBestTests, runTransplantTwin, simulateScenario } from '../../engine/transplant-twin.engine';

@Component({ standalone: true, imports: [JsonPipe], template: `
<h1>Transplant Causal Resilience Twin</h1>
<p>Risk/explanation engine, tashxis emas.</p>
<button (click)="run()">Generate</button>
<pre>{{result() | json}}</pre>
<pre>{{next() | json}}</pre>
<pre>{{scenario() | json}}</pre>` })
export class TransplantTwinPage {
  result = signal<unknown>(null); next = signal<unknown>(null); scenario = signal<unknown>(null);
  run(){
    const base = { creatinine: 1.8, egfr: 44, crp: 7, albumin: 3.1, systolicBp: 152, urineOutputMlDay: 650, medicationAdherencePercent: 72, dsaStatus: 'positive' as const, ddCfDna: 1.2, tacrolimusLevel: 13 };
    const res = runTransplantTwin(base);
    this.result.set(res);
    this.next.set(recommendNextBestTests(res));
    this.scenario.set(simulateScenario(base, { medicationAdherencePercent: 95, systolicBp: 130 }));
  }
}
