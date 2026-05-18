import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MicroMotorPrecisionResult } from '../../services/rehab-quality-engine';

@Component({
  selector: 'app-micro-motor-precision',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-3xl border border-[#D4AF37]/30 bg-[#0B0C0A]/90 p-5 text-[#F8F1D0] shadow-[0_0_35px_rgba(212,175,55,0.10)] backdrop-blur-xl">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><p class="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">Micro-Motor Precision Test</p><h3 class="text-xl font-black text-[#F8F1D0]">Mayda motorika aniqligi testi</h3><p class="text-sm text-[#C9C2A4]">Bosh barmoq–barmoqlar ketma-ketligi, kaft ochish-yopish va nuqtaga yetish aniqligi.</p></div>
        <button class="rounded-xl border border-[#D4AF37]/45 bg-[#11100B]/95 px-4 py-2 text-sm font-black text-[#F2D675] shadow-[0_0_24px_rgba(212,175,55,0.14)] transition-all hover:bg-[#1A160C] hover:border-[#D4AF37]/70 hover:shadow-[0_0_35px_rgba(212,175,55,0.22)] active:scale-[0.98]" (click)="runTest()">Testni hisoblash</button>
      </div>
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="micro-card"><span>Aniqlik</span><strong>{{ latest?.accuracyPercent ?? 68 }}%</strong></div>
        <div class="micro-card"><span>Koordinatsiya</span><strong>{{ latest?.coordinationScore ?? 64 }}%</strong></div>
        <div class="micro-card"><span>Tremor</span><strong>{{ latest?.tremorScore ?? tremor }}%</strong></div>
        <div class="micro-card"><span>Reaksiya</span><strong>{{ latest?.reactionTime ?? 1.4 }}s</strong></div>
      </div>
      @if (latest) { <p class="mt-3 rounded-2xl border border-[#D4AF37]/25 bg-[#11100B]/90 p-3 text-sm text-[#C9C2A4]">{{ latest.patientAdvice }}</p> }
    </section>
  `,
  styles: [`.micro-card{border:1px solid rgba(212,175,55,.32);border-radius:1rem;background:rgba(18,16,10,.96);padding:1rem;box-shadow:0 0 24px rgba(212,175,55,.08);transition:.2s}.micro-card:hover{border-color:rgba(242,214,117,.58);box-shadow:0 0 32px rgba(212,175,55,.16)}.micro-card span{display:block;color:#C9C2A4;font-size:.78rem;font-weight:800}.micro-card strong{display:block;margin-top:.25rem;color:#F2D675;font-size:1.45rem;font-weight:900}`],
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
