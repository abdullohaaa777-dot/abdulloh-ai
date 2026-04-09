import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { analyzeUrineBasic } from '../../engine/urine-basic.engine';
import { UrineBasicResult } from '../../models/clinical.models';

@Component({ standalone: true, imports: [FormsModule, JsonPipe], template: `
<h1>Urine Basic Vision</h1>
<p>Plain urine photo faqat makroskopik screening uchun.</p>
<label>Brightness <input type="number" step="0.01" [(ngModel)]="brightness"></label>
<label>Blur <input type="number" step="0.01" [(ngModel)]="blur"></label>
<button (click)="run()">Analyze</button>
<pre>{{result() | json}}</pre>` })
export class UrineBasicPage {
  brightness = 0.5; blur = 0.2; result = signal<UrineBasicResult | null>(null);
  run(){ this.result.set(analyzeUrineBasic({ brightness: this.brightness, blurScore: this.blur, turbiditySignal: 0.4, redHueSignal: 0.2, foamSignal: 0.3, calibrationCardDetected: true })); }
}
