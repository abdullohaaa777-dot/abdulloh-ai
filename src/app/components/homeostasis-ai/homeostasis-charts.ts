import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeostasisResult } from '../../models/homeostasis';

@Component({
  selector: 'app-homeostasis-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (result) {
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="chart-card">
          <h3>Gauge indekslar</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            @for (gauge of gauges(); track gauge.label) {
              <div class="gauge" [style.--value.%]="gauge.value">
                <div class="gauge-circle"><span>{{ gauge.value }}%</span></div>
                <p>{{ gauge.label }}</p>
              </div>
            }
          </div>
        </div>
        <div class="chart-card">
          <h3>Radar profil</h3>
          <div class="radar-wrap">
            <svg viewBox="0 0 220 220" role="img" aria-label="Homeostaz radar profili">
              <polygon points="110,18 197,82 164,186 56,186 23,82" fill="rgba(79,70,229,.08)" stroke="rgba(79,70,229,.25)" />
              <polygon [attr.points]="radarPoints()" fill="rgba(14,165,233,.28)" stroke="#4f46e5" stroke-width="3" />
              <text x="110" y="12">HB</text><text x="202" y="82">MX</text><text x="170" y="204">KS</text><text x="35" y="204">ET</text><text x="6" y="82">EM</text>
            </svg>
          </div>
        </div>
        <div class="chart-card">
          <h3>Risk komponentlari</h3>
          @for (bar of bars(); track bar.label) {
            <div class="bar-row"><span>{{ bar.label }}</span><b>{{ bar.value }}%</b><div><i [style.width.%]="bar.value"></i></div></div>
          }
        </div>
        <div class="chart-card">
          <h3>Metabolik trend chizig‘i</h3>
          <svg viewBox="0 0 420 180" class="line-chart" role="img" aria-label="Metabolik trend chizig‘i">
            <polyline points="20,130 110,112 200,122 290,88 400,70" fill="none" stroke="#4f46e5" stroke-width="5" stroke-linecap="round" />
            <polyline points="20,145 110,130 200,118 290,105 400,96" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 8" />
          </svg>
          <p class="text-sm text-medical-text-muted font-semibold mt-2">Trend oldingi natijalar mavjud bo‘lsa dinamik solishtiriladi; hozirgi holat: {{ result.trendStatus }}.</p>
        </div>
        <div class="chart-card lg:col-span-2">
          <h3>Organlararo metabolik heatmap</h3>
          <div class="grid md:grid-cols-3 gap-3">
            @for (edge of result.organInteractionMap; track edge.labelUz) {
              <div class="heat-cell" [ngClass]="heatClass(edge.score)"><span>{{ edge.labelUz }}</span><b>{{ edge.score }}%</b></div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 1.25rem; box-shadow: 0 20px 40px -30px rgba(15,23,42,.55); }
    .chart-card h3 { font-size: 1.05rem; font-weight: 900; color: #1e293b; margin-bottom: 1rem; }
    .gauge { display: grid; place-items: center; gap: .65rem; }
    .gauge-circle { width: 8rem; height: 8rem; border-radius: 999px; display: grid; place-items: center; background: conic-gradient(#4f46e5 var(--value), #e2e8f0 0); position: relative; }
    .gauge-circle::after { content: ''; position: absolute; inset: .75rem; border-radius: inherit; background: white; }
    .gauge-circle span { position: relative; z-index: 1; font-weight: 900; color: #1e293b; }
    .gauge p, .bar-row span { font-weight: 800; color: #64748b; font-size: .82rem; text-align: center; }
    .radar-wrap { display: grid; place-items: center; } .radar-wrap svg { max-width: 300px; width: 100%; } text { font-size: 11px; font-weight: 900; fill: #64748b; }
    .bar-row { display: grid; grid-template-columns: 1fr auto; gap: .5rem; align-items: center; margin-bottom: .85rem; font-size: .85rem; } .bar-row div { grid-column: 1 / -1; height: .65rem; background: #f1f5f9; border-radius: 999px; overflow: hidden; } .bar-row i { display: block; height: 100%; background: linear-gradient(90deg,#4f46e5,#0ea5e9); border-radius: inherit; }
    .line-chart { width: 100%; background: linear-gradient(180deg,#f8fafc,#fff); border-radius: 1rem; }
    .heat-cell { padding: 1rem; border-radius: 1rem; border: 1px solid; display: grid; gap: .35rem; font-weight: 800; } .heat-cell b { font-size: 1.6rem; }
    .low { background: #ecfdf5; color: #047857; border-color: #a7f3d0; } .mid { background: #fffbeb; color: #b45309; border-color: #fde68a; } .high { background: #fff7ed; color: #c2410c; border-color: #fed7aa; } .critical { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeostasisChartsComponent {
  @Input() result: HomeostasisResult | null = null;

  gauges() {
    if (!this.result) return [];
    const s = this.result.calculatedScores;
    return [
      { label: 'Homeostaz barqarorligi', value: s.homeostasisStabilityIndex },
      { label: 'Metabolik xavf', value: s.metabolicRiskIndex },
      { label: 'Kortizol-stress', value: s.cortisolStressLoadIndex },
      { label: 'Elektrolit muvozanati', value: s.electrolyteBalanceIndex }
    ];
  }

  bars() {
    if (!this.result) return [];
    const s = this.result.calculatedScores;
    return [
      { label: 'Metabolik xavf indeksi', value: s.metabolicRiskIndex },
      { label: 'Kortizol-stress yuklamasi', value: s.cortisolStressLoadIndex },
      { label: 'Energiya tiklanish xavfi', value: 100 - s.energyRecoveryIndex },
      { label: 'Elektrolit og‘ish riski', value: 100 - s.electrolyteBalanceIndex }
    ];
  }

  radarPoints() {
    if (!this.result) return '';
    const values = [
      this.result.calculatedScores.homeostasisStabilityIndex,
      100 - this.result.calculatedScores.metabolicRiskIndex,
      100 - this.result.calculatedScores.cortisolStressLoadIndex,
      this.result.calculatedScores.energyRecoveryIndex,
      this.result.calculatedScores.electrolyteBalanceIndex
    ];
    const center = 110;
    const radius = 88;
    return values.map((value, index) => {
      const angle = (-90 + index * 72) * Math.PI / 180;
      const distance = radius * (value / 100);
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    }).join(' ');
  }

  heatClass(score: number) {
    if (score >= 82) return 'critical';
    if (score >= 62) return 'high';
    if (score >= 36) return 'mid';
    return 'low';
  }
}
