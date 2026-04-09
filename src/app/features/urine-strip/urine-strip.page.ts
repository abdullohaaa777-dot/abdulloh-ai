import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { analyzeUrineStrip } from '../../engine/urine-strip.engine';

@Component({ standalone: true, imports: [FormsModule, JsonPipe], template: `
<h1>Urine Strip Vision</h1>
<p>Kimyoviy xulosalar faqat strip rasmi orqali.</p>
<label>Timing seconds <input type="number" [(ngModel)]="timing"></label>
<button (click)="run()">Parse strip</button>
<pre>{{result() | json}}</pre>` })
export class UrineStripPage {
  timing = 60; result = signal<unknown>(null);
  run(){ this.result.set(analyzeUrineStrip({ timingSeconds: this.timing, calibrationCardDetected: true, padSignals: { protein: 0.4, blood: 0.1, glucose: 0.2, ketone: 0.1, nitrite: 0.2, leukocyte: 0.3, ph: 0.5, sg: 0.6 } })); }
}
