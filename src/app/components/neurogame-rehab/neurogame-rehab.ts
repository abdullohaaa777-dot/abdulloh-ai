import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RehabNeuroGameResult } from '../../services/smart-rehab-digital-twin';

@Component({
  selector: 'app-neurogame-rehab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700"><mat-icon class="!text-[16px]">sports_esports</mat-icon> NeuroGame Rehab</div>
          <h3 class="mt-2 text-xl font-black text-slate-950">Mashqli o‘yinlar</h3>
          <p class="text-sm text-slate-500">Klinik mashqqa bog‘langan o‘yin: qo‘lni ko‘tarib yulduzlarni yig‘ish, aniqlik va kompensatsiyani kuzatish.</p>
        </div>
        <button class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-200" (click)="runGame()">Mini testni bajarish</button>
      </div>
      <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <div class="relative h-48 overflow-hidden rounded-3xl border border-violet-100 bg-slate-950">
          @for (star of stars; track star.x) { <span class="absolute text-2xl drop-shadow-lg" [style.left.%]="star.x" [style.top.%]="star.y">⭐</span> }
          <div class="absolute bottom-4 left-4 right-4 h-2 rounded-full bg-white/10"><div class="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" [style.width.%]="latest?.accuracy ?? 62"></div></div>
          <div class="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white">Qo‘l trayektoriyasi + aniqlik testi</div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rehab-game-metric"><span>Game score</span><strong>{{ latest?.score ?? 68 }}%</strong></div>
          <div class="rehab-game-metric"><span>Aniqlik</span><strong>{{ latest?.accuracy ?? 72 }}%</strong></div>
          <div class="rehab-game-metric"><span>Reaksiya</span><strong>{{ latest?.reactionTime ?? 1.4 }}s</strong></div>
          <div class="rehab-game-metric"><span>Kompensatsiya</span><strong>{{ latest?.compensationIndex ?? 24 }}%</strong></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .rehab-game-metric { border: 1px solid rgb(237 233 254); border-radius: 1rem; background: rgba(255,255,255,.86); padding: 1rem; }
    .rehab-game-metric span { display: block; color: rgb(100 116 139); font-size: .78rem; font-weight: 800; }
    .rehab-game-metric strong { display: block; margin-top: .25rem; color: rgb(76 29 149); font-size: 1.5rem; font-weight: 900; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeuroGameRehabComponent {
  @Input() patientId: string | null = null;
  @Input() sessionId: string | null = null;
  @Input() movementQuality = 70;
  @Input() compensationIndex = 25;
  @Input() fatigueIndex = 20;
  @Output() gameCompleted = new EventEmitter<RehabNeuroGameResult>();

  latest: RehabNeuroGameResult | null = null;
  stars = [{ x: 14, y: 28 }, { x: 38, y: 18 }, { x: 62, y: 35 }, { x: 78, y: 16 }, { x: 52, y: 62 }];

  runGame() {
    const score = this.clamp(this.movementQuality * 0.55 + (100 - this.compensationIndex) * 0.25 + (100 - this.fatigueIndex) * 0.2);
    this.latest = { id: `rehab-neurogame-${Date.now()}`, patientId: this.patientId, sessionId: this.sessionId, gameName: 'Yulduzlarni yig‘ish', targetBodyPart: 'Qo‘l koordinatsiyasi va aniqlik', score, accuracy: this.clamp(score + 6), reactionTime: Number((1.8 - score / 140).toFixed(2)), movementQuality: this.movementQuality, compensationIndex: this.compensationIndex, fatigueIndex: this.fatigueIndex, createdAt: new Date().toISOString() };
    this.gameCompleted.emit(this.latest);
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
