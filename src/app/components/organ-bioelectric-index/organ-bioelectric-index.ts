import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase';
import { CaseData } from '../../services/ai';
import { OrganBioelectricResult, OrganKey, OrganSignalInputs, SignalQuality } from '../../models/organ-bioelectric';
import { BIOELECTRIC_DISCLAIMER_UZ, INDIRECT_SIGNAL_NOTE_UZ, ORGAN_LABELS_UZ, ORGAN_SCORE_LABELS_UZ, SCORE_LEVELS } from '../../utils/organ-bioelectric.constants';
import { calculateOrganBioelectricIndex } from '../../utils/organ-bioelectric-calculator';

type FlowStep = 'intro' | 'tests' | 'analyzing' | 'result';

@Component({
  selector: 'app-organ-bioelectric-index',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto bioelectric-shell">
      @if (step() === 'intro') {
        <section class="relative overflow-hidden rounded-[2rem] border border-indigo-200/60 bg-slate-950 text-white p-6 md:p-10 shadow-[0_30px_80px_-45px_rgba(15,23,42,1)]">
          <div class="absolute inset-0 bioelectric-grid opacity-30"></div>
          <div class="absolute -right-28 -top-28 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
          <div class="absolute left-1/2 bottom-0 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.24em] text-sky-200 mb-4">Yangi skrining moduli</p>
              <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-tight">Organlararo Bioelektr Indeks</h1>
              <p class="mt-5 text-base md:text-lg text-slate-200 max-w-2xl leading-relaxed">
                Kamera, ovoz, nafas, yo‘tal va neuromotor signal belgilaridan yurak, buyrak, miya, jigar, o‘pka va endokrin tizim o‘rtasidagi ehtimoliy funksional bosim xaritasini tuzing.
              </p>
              <div class="mt-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-300/30 text-amber-50 flex gap-3">
                <mat-icon class="text-amber-200">medical_information</mat-icon>
                <p class="text-sm font-semibold leading-relaxed">{{ disclaimer }}</p>
              </div>
              <button type="button" class="mt-8 btn-primary px-7 py-4 text-base" (click)="startTests()">
                <mat-icon>bolt</mat-icon>
                Tahlilni boshlash
              </button>
            </div>

            <div class="bioelectric-hero-scene" aria-hidden="true">
              @for (organ of organNodes; track organ.key) {
                <div class="organ-node" [style.left.%]="organ.x" [style.top.%]="organ.y">
                  <mat-icon>{{ organ.icon }}</mat-icon>
                  <span>{{ organ.label }}</span>
                </div>
              }
              <div class="bio-ring ring-a"></div>
              <div class="bio-ring ring-b"></div>
              <div class="bio-pulse-line line-a"></div>
              <div class="bio-pulse-line line-b"></div>
            </div>
          </div>
        </section>
      }

      @if (step() === 'tests') {
        <section class="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
          <div class="bg-white border border-medical-border rounded-[2rem] p-6 md:p-8 shadow-xl h-fit">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-medical-primary mb-2">Signal yig‘ish</p>
            <h2 class="text-3xl font-black text-medical-text">Test bosqichlari</h2>
            <p class="text-medical-text-muted mt-3 leading-relaxed">Real klinik qurilma ulanmagan holatda ham modul signal belgilarini strukturali kiritish orqali formulaviy skrining natijasini chiqaradi.</p>
            <div class="mt-6 space-y-3">
              @for (item of testStages; track item.title) {
                <div class="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <mat-icon class="text-medical-primary">{{ item.icon }}</mat-icon>
                  <div>
                    <p class="font-bold text-medical-text text-sm">{{ item.title }}</p>
                    <p class="text-xs text-medical-text-muted">{{ item.text }}</p>
                  </div>
                </div>
              }
            </div>
            @if (inputs.signalQuality === 'past') {
              <div class="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold">
                Signal sifati past. Natija aniqligi pasayishi mumkin, ammo tahlilni davom ettirish mumkin.
              </div>
            }
          </div>

          <div class="bg-white border border-medical-border rounded-[2rem] p-6 md:p-8 shadow-xl">
            <div class="grid md:grid-cols-2 gap-5">
              @for (control of controls; track control.key) {
                <label class="space-y-2 block">
                  <span class="text-xs font-black uppercase tracking-widest text-medical-text-muted">{{ control.label }}</span>
                  <input type="range" min="0" max="100" [(ngModel)]="inputs[control.key]" [attr.aria-label]="control.label" class="w-full accent-indigo-600">
                  <div class="flex justify-between text-xs font-bold text-medical-text-muted">
                    <span>{{ control.low }}</span>
                    <span class="text-medical-primary">{{ inputs[control.key] }}%</span>
                    <span>{{ control.high }}</span>
                  </div>
                </label>
              }
            </div>

            <div class="mt-6 grid sm:grid-cols-2 gap-4">
              <label class="space-y-2 block sm:col-span-2">
                <span class="text-xs font-black uppercase tracking-widest text-medical-text-muted">Bemor profiliga bog‘lash</span>
                <select [(ngModel)]="selectedPatientId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-medical-border focus:border-medical-primary outline-none">
                  <option value="">Umumiy dashboard natijasi sifatida saqlash</option>
                  @for (caseItem of cases(); track caseItem.id) {
                    <option [value]="caseItem.id">Bemor #{{ caseItem.id.slice(0, 8) }} — {{ caseItem.age }} yosh</option>
                  }
                </select>
              </label>
              <label class="space-y-2 block">
                <span class="text-xs font-black uppercase tracking-widest text-medical-text-muted">Signal sifati</span>
                <select [(ngModel)]="inputs.signalQuality" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-medical-border focus:border-medical-primary outline-none">
                  @for (quality of signalQualities; track quality) {
                    <option [ngValue]="quality">{{ quality }}</option>
                  }
                </select>
              </label>
              <label class="flex items-center gap-3 p-4 rounded-2xl border border-medical-border bg-slate-50 cursor-pointer">
                <input type="checkbox" [(ngModel)]="inputs.includePreviousHeartSignal" class="w-5 h-5 accent-indigo-600">
                <span class="text-sm font-semibold text-medical-text">Oldingi yurak mikro-impuls natijasini qo‘shish</span>
              </label>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <button type="button" class="btn-primary py-3 px-6" (click)="analyze()">
                <mat-icon>auto_awesome</mat-icon>
                Abdulloh AI bilan hisoblash
              </button>
              <button type="button" class="btn-secondary py-3 px-6" (click)="resetInputs()">
                <mat-icon>restart_alt</mat-icon>
                Qayta sozlash
              </button>
            </div>
          </div>
        </section>
      }

      @if (step() === 'analyzing') {
        <section class="min-h-[520px] rounded-[2rem] bg-slate-950 text-white border border-indigo-300/20 flex items-center justify-center relative overflow-hidden">
          <div class="bio-ring ring-a"></div>
          <div class="bio-ring ring-b"></div>
          <div class="text-center relative z-10 px-6">
            <div class="w-24 h-24 mx-auto rounded-full border border-sky-300/40 grid place-items-center bg-white/10 backdrop-blur mb-6 animate-pulse">
              <mat-icon class="text-5xl h-12 w-12 text-sky-200">hub</mat-icon>
            </div>
            <h2 class="text-3xl font-black">Abdulloh AI tahlil qilmoqda...</h2>
            <p class="mt-4 text-slate-200 font-semibold">Organlararo bioelektr signal xaritasi tuzilmoqda...</p>
            <p class="mt-2 text-slate-300 text-sm">Ionik va vegetativ indekslar hisoblanmoqda...</p>
          </div>
        </section>
      }

      @if (step() === 'result' && result(); as analysis) {
        <section class="space-y-8 print:space-y-5">
          <div class="bg-white border border-medical-border rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col lg:flex-row gap-6 justify-between print:shadow-none">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-medical-primary mb-2">Natija</p>
              <h2 class="text-3xl md:text-4xl font-black text-medical-text">Organlararo Bioelektr Indeks: {{ analysis.overallIndex }}%</h2>
              <p class="mt-3 text-medical-text-muted max-w-3xl">{{ analysis.disclaimerUz }}</p>
              <p class="mt-2 text-sm font-semibold text-amber-700">{{ indirectNote }}</p>
            </div>
            <div class="flex flex-wrap gap-3 items-start">
              <span class="px-4 py-2 rounded-full border text-sm font-black" [ngClass]="levelClass(analysis.overallIndex)">Daraja: {{ levelLabel(analysis.overallIndex) }}</span>
              <span class="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-black">Ishonchlilik: {{ analysis.confidence }}</span>
              <button type="button" class="btn-secondary py-2 px-4 print:hidden" (click)="printResult()"><mat-icon>print</mat-icon>PDF/Chop etish</button>
              <button type="button" class="btn-primary py-2 px-4 print:hidden" (click)="saveResult()" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saqlanmoqda...' : 'Bemor profiliga saqlash' }}</button>
            </div>
          </div>

          @if (saveMessage()) {
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold print:hidden">{{ saveMessage() }}</div>
          }
          @if (saveError()) {
            <div class="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-semibold print:hidden">{{ saveError() }}</div>
          }

          <div class="grid lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-slate-950 text-white rounded-[2rem] p-6 md:p-8 relative overflow-hidden print:bg-white print:text-slate-900 print:border">
              <h3 class="text-xl font-black mb-5">Organlararo aloqa xaritasi</h3>
              <div class="network-map">
                @for (organ of organNodes; track organ.key) {
                  <div class="organ-node result-node" [style.left.%]="organ.x" [style.top.%]="organ.y">
                    <mat-icon>{{ organ.icon }}</mat-icon>
                    <span>{{ organ.label }}</span>
                  </div>
                }
                @for (edge of analysis.networkEdges.slice(0, 6); track edge.interpretationUz) {
                  <div class="edge-card">
                    <span>{{ organLabel(edge.from) }} → {{ targetLabel(edge.to) }}</span>
                    <b>{{ edge.score }}%</b>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-5">Radar ko‘rsatkichlar</h3>
              <div class="space-y-4">
                @for (score of organScoreList(analysis); track score.key) {
                  <div>
                    <div class="flex justify-between text-sm font-bold mb-1"><span>{{ score.label }}</span><span>{{ score.value }}%</span></div>
                    <div class="h-3 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" [style.width.%]="score.value"></div></div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-8">
            <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-5">Organlararo bosim heatmap</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                @for (edge of analysis.networkEdges; track edge.interpretationUz) {
                  <div class="p-3 rounded-2xl border" [ngClass]="levelClass(edge.score)">
                    <p class="text-xs font-black">{{ organLabel(edge.from) }} → {{ targetLabel(edge.to) }}</p>
                    <p class="text-2xl font-black mt-1">{{ edge.score }}%</p>
                    <p class="text-[11px] mt-1">{{ levelLabel(edge.score) }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-5">Top-3 ehtimoliy muammo</h3>
              <div class="space-y-4">
                @for (problem of analysis.topProblems; track problem.titleUz; let i = $index) {
                  <div class="p-4 rounded-2xl bg-slate-50 border border-medical-border">
                    <div class="flex justify-between gap-3 font-black text-medical-text"><span>{{ i + 1 }}. {{ problem.titleUz }}</span><span>{{ problem.probability }}%</span></div>
                    <div class="h-2 bg-white rounded-full overflow-hidden my-3"><div class="h-full bg-gradient-to-r from-medical-primary to-sky-400" [style.width.%]="problem.probability"></div></div>
                    <p class="text-sm text-medical-text-muted">{{ problem.explanationUz }}</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-8">
            <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-4">Abdulloh AI klinik izohi</h3>
              <p class="text-medical-text-muted leading-relaxed">{{ analysis.aiSummaryUz }}</p>
              <p class="mt-4 text-xs font-semibold text-medical-text-muted">Xom signal xulosasi: {{ analysis.rawTestSummary }}</p>
            </div>
            <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-4">Tavsiya etilgan keyingi tekshiruvlar</h3>
              <ul class="space-y-3">
                @for (recommendation of analysis.recommendationsUz; track recommendation) {
                  <li class="flex gap-3 text-sm font-semibold text-medical-text"><mat-icon class="text-emerald-500">check_circle</mat-icon><span>{{ recommendation }}</span></li>
                }
              </ul>
            </div>
          </div>

          <div class="bg-white border border-medical-border rounded-[2rem] p-6 shadow-xl print:shadow-none">
            <h3 class="text-xl font-black text-medical-text mb-4">Oldingi natija bilan solishtirish</h3>
            @if (latestResult()) {
              <p class="text-medical-text-muted font-semibold">Oxirgi saqlangan indeks: {{ latestIndex() }}%. Yangi natija: {{ analysis.overallIndex }}%.</p>
            } @else {
              <p class="text-medical-text-muted font-semibold">Hozircha oldingi natija topilmadi. Ushbu natijani saqlasangiz, keyingi tahlillarda solishtirish uchun ishlatiladi.</p>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .bioelectric-grid { background-image: linear-gradient(rgba(125, 211, 252, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 211, 252, .12) 1px, transparent 1px); background-size: 34px 34px; }
    .bioelectric-hero-scene, .network-map { min-height: 420px; position: relative; border-radius: 2rem; border: 1px solid rgba(125,211,252,.25); background: radial-gradient(circle at center, rgba(79,70,229,.24), rgba(15,23,42,.4) 45%, rgba(15,23,42,.75)); overflow: hidden; }
    .network-map { min-height: 520px; }
    .organ-node { position: absolute; z-index: 3; transform: translate(-50%, -50%); display: grid; place-items: center; gap: .35rem; width: 6.5rem; height: 6.5rem; border-radius: 999px; background: rgba(255,255,255,.9); color: #1e293b; border: 1px solid rgba(125,211,252,.45); box-shadow: 0 18px 35px -22px rgba(125,211,252,.95); font-size: .72rem; font-weight: 900; text-align: center; animation: bioFloat 7s ease-in-out infinite; }
    .result-node { width: 5.5rem; height: 5.5rem; font-size: .68rem; }
    .bio-ring { position: absolute; inset: 0; margin: auto; border-radius: 999px; border: 1px dashed rgba(125,211,252,.36); animation: bioRotate 24s linear infinite; }
    .ring-a { width: 70%; height: 70%; }
    .ring-b { width: 48%; height: 48%; animation-direction: reverse; animation-duration: 18s; }
    .bio-pulse-line { position: absolute; left: -12%; right: -12%; top: 48%; height: 2px; background: linear-gradient(90deg, transparent, rgba(125,211,252,.8), rgba(129,140,248,.8), transparent); animation: bioPulse 4s ease-in-out infinite; }
    .line-b { top: 60%; animation-delay: -1.8s; opacity: .7; }
    .edge-card { position: relative; z-index: 4; display: flex; justify-content: space-between; gap: 1rem; margin: .55rem; padding: .72rem .9rem; border-radius: 1rem; color: white; background: linear-gradient(90deg, rgba(79,70,229,.45), rgba(14,165,233,.22)); border: 1px solid rgba(125,211,252,.25); font-size: .78rem; font-weight: 800; }
    @keyframes bioRotate { to { transform: rotate(360deg); } }
    @keyframes bioPulse { 0%,100% { opacity: .25; transform: scaleX(.85); } 50% { opacity: .95; transform: scaleX(1); } }
    @keyframes bioFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -10px; } }
    @media print { .bioelectric-shell { max-width: none; } button { display: none !important; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganBioelectricIndexComponent {
  private supabase = inject(SupabaseService);

  step = signal<FlowStep>('intro');
  result = signal<OrganBioelectricResult | null>(null);
  saving = signal(false);
  saveMessage = signal<string | null>(null);
  saveError = signal<string | null>(null);
  latestResult = signal<Record<string, unknown> | null>(null);
  cases = signal<CaseData[]>([]);
  selectedPatientId = '';

  readonly disclaimer = BIOELECTRIC_DISCLAIMER_UZ;
  readonly indirectNote = INDIRECT_SIGNAL_NOTE_UZ;
  readonly signalQualities: SignalQuality[] = ['yuqori', 'o‘rtacha', 'past'];

  inputs: OrganSignalInputs = this.defaultInputs();

  readonly organNodes = [
    { key: 'heart' as OrganKey, label: 'Yurak', icon: 'favorite', x: 50, y: 32 },
    { key: 'kidney' as OrganKey, label: 'Buyrak', icon: 'water_drop', x: 26, y: 62 },
    { key: 'brain' as OrganKey, label: 'Miya', icon: 'psychology', x: 50, y: 14 },
    { key: 'liver' as OrganKey, label: 'Jigar', icon: 'biotech', x: 74, y: 62 },
    { key: 'endocrine' as OrganKey, label: 'Endokrin', icon: 'hub', x: 24, y: 28 },
    { key: 'lung' as OrganKey, label: 'O‘pka', icon: 'air', x: 76, y: 28 }
  ];

  readonly testStages = [
    { icon: 'air', title: 'Nafas testi', text: 'Ritm, chidamlilik va nafas yuklamasi baholanadi.' },
    { icon: 'face', title: 'Yuz mimikasi testi', text: 'Mimika barqarorligi va charchoq signallari kuzatiladi.' },
    { icon: 'record_voice_over', title: 'Ovoz yoki o‘qish namunasi', text: 'Akustik notekislik va ovoz charchog‘i baholanadi.' },
    { icon: 'graphic_eq', title: 'Yo‘tal ovozi tahlili', text: 'Yo‘tal akustik yuklamasi va o‘pka signali olinadi.' },
    { icon: 'front_hand', title: 'Qo‘l/neuromotor test', text: 'Tremor, koordinatsiya va mikroharakat belgisi baholanadi.' }
  ];

  readonly controls: { key: keyof Omit<OrganSignalInputs, 'signalQuality' | 'includePreviousHeartSignal'>; label: string; low: string; high: string }[] = [
    { key: 'facialSymmetry', label: 'Yuz/mimika beqarorligi', low: 'barqaror', high: 'beqaror' },
    { key: 'facialFatigue', label: 'Yuz charchoq belgisi', low: 'past', high: 'yuqori' },
    { key: 'breathingRhythm', label: 'Nafas ritmi beqarorligi', low: 'tekis', high: 'notekis' },
    { key: 'breathingLoad', label: 'Nafas yuklamasi', low: 'past', high: 'yuqori' },
    { key: 'voiceStability', label: 'Ovoz akustik notekisligi', low: 'barqaror', high: 'notekis' },
    { key: 'coughAcousticLoad', label: 'Yo‘tal akustik yuklamasi', low: 'past', high: 'yuqori' },
    { key: 'neuromotorTremor', label: 'Neuromotor tremor', low: 'past', high: 'yuqori' },
    { key: 'coordinationStability', label: 'Koordinatsiya barqarorligi', low: 'past', high: 'yuqori' },
    { key: 'recoveryTolerance', label: 'Tiklanish bosimi', low: 'past', high: 'yuqori' }
  ];

  organScoreList(analysis: OrganBioelectricResult) {
    return (Object.keys(analysis.organScores) as OrganKey[]).map(key => ({
      key,
      label: ORGAN_SCORE_LABELS_UZ[key],
      value: analysis.organScores[key]
    }));
  }

  organLabel(key: OrganKey) {
    return ORGAN_LABELS_UZ[key];
  }

  targetLabel(key: OrganKey | 'bloodPressure' | 'ionChannels' | 'metabolicSystem') {
    if (key === 'bloodPressure') return 'Yurak/qon bosimi';
    if (key === 'ionChannels') return 'Ion kanallar';
    if (key === 'metabolicSystem') return 'Endokrin/metabolik tizim';
    return ORGAN_LABELS_UZ[key];
  }

  levelLabel(value: number) {
    return SCORE_LEVELS.find(level => value >= level.min && value <= level.max)?.labelUz ?? 'past';
  }

  levelClass(value: number) {
    return SCORE_LEVELS.find(level => value >= level.min && value <= level.max)?.className ?? SCORE_LEVELS[0].className;
  }

  startTests() {
    this.step.set('tests');
    void this.loadLatestResult();
  }

  resetInputs() {
    this.inputs = this.defaultInputs();
    this.saveMessage.set(null);
    this.saveError.set(null);
  }

  analyze() {
    this.step.set('analyzing');
    this.saveMessage.set(null);
    this.saveError.set(null);
    setTimeout(() => {
      this.result.set(calculateOrganBioelectricIndex(this.inputs));
      this.step.set('result');
    }, 900);
  }

  async saveResult() {
    const analysis = this.result();
    if (!analysis) return;
    this.saving.set(true);
    this.saveMessage.set(null);
    this.saveError.set(null);
    const { error } = await this.supabase.saveOrganBioelectricResult(analysis, this.selectedPatientId || null);
    if (error) {
      this.saveError.set('Natijani saqlashda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.');
    } else {
      this.saveMessage.set('Natija bemor profiliga va dashboard tarixiga saqlandi.');
      await this.loadLatestResult();
    }
    this.saving.set(false);
  }

  printResult() {
    window.print();
  }

  latestIndex() {
    const latest = this.latestResult();
    const value = latest?.['overall_index'];
    return typeof value === 'number' ? value : '—';
  }

  private async loadLatestResult() {
    const { data } = await this.supabase.getLatestOrganBioelectricResult();
    this.latestResult.set(data as Record<string, unknown> | null);
    const { data: cases } = await this.supabase.getCases();
    this.cases.set((cases ?? []) as CaseData[]);
  }

  private defaultInputs(): OrganSignalInputs {
    return {
      facialSymmetry: 28,
      facialFatigue: 36,
      breathingRhythm: 42,
      breathingLoad: 40,
      voiceStability: 34,
      coughAcousticLoad: 31,
      neuromotorTremor: 26,
      coordinationStability: 74,
      recoveryTolerance: 38,
      signalQuality: 'o‘rtacha',
      includePreviousHeartSignal: false
    };
  }
}
