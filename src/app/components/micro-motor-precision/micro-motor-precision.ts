import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MicroMotorPrecisionResult } from '../../services/rehab-quality-engine';

@Component({
  selector: 'app-micro-motor-precision',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><p class="text-xs font-black uppercase tracking-wider text-cyan-700">Micro-Motor Precision Test</p><h3 class="text-xl font-black">Mayda motorika aniqligi testi</h3><p class="text-sm text-slate-500">Bosh barmoq–barmoqlar ketma-ketligi, kaft ochish-yopish va nuqtaga yetish aniqligi.</p></div>
        <button class="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white" (click)="runTest()">Testni hisoblash</button>
      </div>
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="micro-card"><span>Aniqlik</span><strong>{{ latest?.accuracyPercent ?? 68 }}%</strong></div>
        <div class="micro-card"><span>Koordinatsiya</span><strong>{{ latest?.coordinationScore ?? 64 }}%</strong></div>
        <div class="micro-card"><span>Tremor</span><strong>{{ latest?.tremorScore ?? tremor }}%</strong></div>
        <div class="micro-card"><span>Reaksiya</span><strong>{{ latest?.reactionTime ?? 1.4 }}s</strong></div>
      </div>
      @if (latest) { <p class="mt-3 rounded-2xl bg-white/80 p-3 text-sm text-slate-700">{{ latest.patientAdvice }}</p> }
    </section>
  `,
  styles: [`.micro-card{border:1px solid rgb(207 250 254);border-radius:1rem;background:white;padding:1rem}.micro-card span{display:block;color:#64748b;font-size:.78rem;font-weight:800}.micro-card strong{display:block;margin-top:.25rem;color:#0e7490;font-size:1.45rem;font-weight:900}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroMotorPrecisionComponent {
  @Input() patientId: string | null = null;
  @Input() sessionId: string | null = null;
  @Input() movementQuality = 70;
  @Input() tremor = 12;
  @Input() fatigue = 20;
  @Output() testCompleted = new EventEmitter<MicroMotorPrecisionResult>();
  latest: MicroMotorPrecisionResult | null = null;

  runTest() {
    const accuracyPercent = this.clamp(this.movementQuality * .55 + (100 - this.tremor) * .25 + (100 - this.fatigue) * .2);
    this.latest = { id: `micro-motor-${Date.now()}`, sessionId: this.sessionId, patientId: this.patientId, testName: 'Bosh barmoq–barmoqlar ketma-ketligi', accuracyPercent, reactionTime: Number((1.9 - accuracyPercent / 135).toFixed(2)), tremorScore: this.clamp(this.tremor), coordinationScore: this.clamp(accuracyPercent - this.tremor * .12), hardestCombination: accuracyPercent > 75 ? 'Nazoratda' : 'Bosh barmoq–jimjiloq', errorSummary: accuracyPercent > 75 ? ['Kuchli xato yo‘q'] : ['Kechikish', 'Koordinatsiya pasayishi'], patientAdvice: accuracyPercent > 75 ? 'Mayda motorika yaxshi. Aniqlikni saqlang.' : 'Bosh barmoq–jimjiloq mashqini sekinroq va tanaffus bilan bajaring.', doctorClinicalNote: `Micro-motor accuracy ${accuracyPercent}%.`, createdAt: new Date().toISOString() };
    this.testCompleted.emit(this.latest);
  }

  private clamp(value: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min))); }
}
