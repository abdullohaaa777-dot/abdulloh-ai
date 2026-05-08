import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { CaseData } from '../../services/ai';
import { HomeostasisInputData, HomeostasisResult } from '../../models/homeostasis';
import { buildFallbackAIAnalysis, buildHomeostasisResult, calculateHomeostasisScores, defaultHomeostasisInput } from '../../utils/homeostasis-score-engine';
import { requestHomeostasisAIAnalysis } from '../../utils/homeostasis-ai-interpreter';
import { HomeostasisInputFormComponent } from './homeostasis-input-form';
import { HomeostasisChartsComponent } from './homeostasis-charts';
import { Homeostasis3DMapComponent } from './homeostasis-3d-map';

type PageState = 'form' | 'loading' | 'result';

@Component({
  selector: 'app-homeostasis-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule, HomeostasisInputFormComponent, HomeostasisChartsComponent, Homeostasis3DMapComponent],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <section class="homeostasis-hero relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-6 md:p-10 shadow-[0_35px_90px_-55px_rgba(15,23,42,1)]">
        <div class="absolute inset-0 homeostasis-grid opacity-25"></div>
        <div class="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl"></div>
        <div class="absolute left-1/2 bottom-0 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div class="relative grid lg:grid-cols-[1fr_0.9fr] gap-10 items-center">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.24em] text-emerald-200 mb-4">Klinik-metabolik AI analitika</p>
            <h1 class="text-4xl md:text-6xl font-black leading-tight tracking-tight">Homeostaz AI</h1>
            <p class="mt-5 text-base md:text-lg text-slate-200 max-w-3xl leading-relaxed">
              Homeostaz barqarorligi, glyukoza-insulin dinamikasi, kortizol-stress o‘qi, energiya tiklanishi, elektrolitlar va organlararo metabolik bog‘liqlikni yagona klinik xaritada baholang.
            </p>
            <div class="mt-6 grid sm:grid-cols-3 gap-3">
              <div class="hero-chip"><b>5/10 yil</b><span>risk trend prognozi</span></div>
              <div class="hero-chip"><b>Na⁺ K⁺ Ca²⁺ Mg²⁺</b><span>elektrolit muvozanati</span></div>
              <div class="hero-chip"><b>Fallback</b><span>AI bo‘lmasa lokal scoring</span></div>
            </div>
          </div>
          <div class="hero-orbit" aria-hidden="true">
            <div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="metabolic-core"><mat-icon>monitor_heart</mat-icon></div>
            <span class="floating-badge badge-a">Glyukoza-insulin</span><span class="floating-badge badge-b">Kortizol-stress</span><span class="floating-badge badge-c">Elektrolitlar</span>
          </div>
        </div>
      </section>

      @if (state() === 'form') {
        <div class="grid lg:grid-cols-[1fr_320px] gap-8">
          <div class="space-y-5">
            <div class="rounded-3xl bg-white border border-medical-border p-5 shadow-xl">
              <label class="grid gap-2 text-xs font-black uppercase tracking-widest text-medical-text-muted">
                Bemor profiliga bog‘lash
                <select [(ngModel)]="selectedPatientId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-medical-border focus:border-medical-primary outline-none normal-case tracking-normal text-sm text-medical-text">
                  <option value="">Umumiy profilga saqlash</option>
                  @for (caseItem of cases(); track caseItem.id) {
                    <option [value]="caseItem.id">Bemor #{{ caseItem.id.slice(0, 8) }} — {{ caseItem.age }} yosh</option>
                  }
                </select>
              </label>
            </div>
            <app-homeostasis-input-form [model]="inputData" (analyzeRequested)="runAnalysis()" />
          </div>
          <aside class="space-y-5">
            <div class="rounded-3xl bg-white border border-medical-border p-5 shadow-xl">
              <h3 class="font-black text-medical-text flex items-center gap-2"><mat-icon class="text-medical-primary">history</mat-icon>Homeostaz AI tarixchasi</h3>
              @if (previousResults().length) {
                <div class="mt-4 space-y-3">
                  @for (item of previousResults().slice(0, 3); track item.createdAt) {
                    <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <p class="text-sm font-black text-medical-text">{{ item.calculatedScores.homeostasisStabilityIndex }}% — {{ item.riskLevel }}</p>
                      <p class="text-xs text-medical-text-muted">{{ item.createdAt | date:'dd.MM.yyyy HH:mm' }}</p>
                    </div>
                  }
                </div>
              } @else {
                <p class="mt-3 text-sm text-medical-text-muted font-semibold">Hozircha oldingi natija yo‘q. Birinchi tahlil keyingi solishtirish uchun asos bo‘ladi.</p>
              }
            </div>
            <div class="rounded-3xl bg-amber-50 border border-amber-100 p-5 text-amber-800">
              <h3 class="font-black flex items-center gap-2"><mat-icon>info</mat-icon>Muhim ogohlantirish</h3>
              <p class="mt-2 text-sm font-semibold leading-relaxed">Bu modul yakuniy diagnoz qo‘ymaydi. Natija klinik-metabolik skrining va ehtimoliy yo‘nalish sifatida talqin qilinadi.</p>
            </div>
          </aside>
        </div>
      }

      @if (state() === 'loading') {
        <section class="min-h-[520px] rounded-[2rem] bg-slate-950 text-white grid place-items-center relative overflow-hidden">
          <div class="orbit orbit-a"></div><div class="orbit orbit-b"></div>
          <div class="text-center relative z-10 px-6">
            <div class="w-24 h-24 mx-auto rounded-full bg-white/10 border border-emerald-300/30 grid place-items-center mb-6 animate-pulse"><mat-icon class="text-5xl h-12 w-12 text-emerald-200">hub</mat-icon></div>
            <h2 class="text-3xl font-black">Abdulloh AI tahlil qilmoqda...</h2>
            <p class="mt-4 text-slate-200 font-semibold">Homeostaz, metabolik trend va organlararo signal xaritasi hisoblanmoqda...</p>
          </div>
        </section>
      }

      @if (state() === 'result' && result(); as analysis) {
        <section class="space-y-8 print:space-y-5">
          <div class="rounded-[2rem] bg-white border border-medical-border p-6 md:p-8 shadow-xl flex flex-col lg:flex-row gap-5 justify-between print:shadow-none">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-medical-primary mb-2">Homeostaz AI natijasi</p>
              <h2 class="text-3xl md:text-4xl font-black text-medical-text">Homeostaz Barqarorlik Indeksi: {{ analysis.calculatedScores.homeostasisStabilityIndex }}%</h2>
              <p class="mt-3 text-medical-text-muted max-w-3xl">{{ analysis.aiAnalysis.summary }}</p>
              @if (analysis.missingData.length) {
                <p class="mt-3 text-sm font-bold text-amber-700">Ma’lumotlar to‘liq emas. Abdulloh AI mavjud parametrlar asosida taxminiy tahlil qildi. Aniqlikni oshirish uchun laborator yoki sensor ma’lumotlarini qo‘shing: {{ analysis.missingData.join(', ') }}.</p>
              }
            </div>
            <div class="flex flex-wrap gap-3 items-start">
              <span class="px-4 py-2 rounded-full border text-sm font-black" [ngClass]="riskClass(analysis.riskLevel)">{{ analysis.riskLevel }}</span>
              <button type="button" class="btn-secondary py-2 px-4 print:hidden" (click)="printResult()"><mat-icon>print</mat-icon>PDF/Chop etish</button>
              <button type="button" class="btn-primary py-2 px-4 print:hidden" (click)="saveResult()" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saqlanmoqda...' : 'Natijani saqlash' }}</button>
            </div>
          </div>
          @if (analysis.riskLevel === 'Yuqori xavf' || analysis.riskLevel === 'Kritik signal') {
            <div class="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 font-bold">Yuqori xavf belgisi aniqlandi. Bu yakuniy diagnoz emas. Shifokor ko‘rigidan o‘tish tavsiya qilinadi.</div>
          }
          @if (saveMessage()) { <div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 font-bold print:hidden">{{ saveMessage() }}</div> }
          @if (saveError()) { <div class="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 font-bold print:hidden">{{ saveError() }}</div> }

          <div class="grid lg:grid-cols-[0.95fr_1.05fr] gap-8">
            <app-homeostasis-3d-map [interactions]="analysis.organInteractionMap" />
            <div class="grid sm:grid-cols-2 gap-4">
              @for (score of scoreCards(analysis); track score.title) {
                <div class="rounded-3xl bg-white border border-medical-border p-5 shadow-xl print:shadow-none">
                  <p class="text-xs font-black uppercase tracking-widest text-medical-text-muted">{{ score.title }}</p>
                  <p class="text-4xl font-black text-medical-text mt-2">{{ score.value }}%</p>
                  <p class="text-sm text-medical-text-muted font-semibold mt-2">{{ score.text }}</p>
                </div>
              }
            </div>
          </div>

          <app-homeostasis-charts [result]="analysis" />

          <div class="grid lg:grid-cols-2 gap-8">
            <div class="rounded-[2rem] bg-white border border-medical-border p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-4">Differensialga o‘xshash ehtimoliy klinik yo‘nalishlar</h3>
              <div class="space-y-4">
                @for (direction of analysis.aiAnalysis.possibleDirections; track direction.titleUz) {
                  <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div class="flex justify-between gap-3 font-black"><span>{{ direction.titleUz }}</span><span>{{ direction.probability }}%</span></div>
                    <p class="text-sm text-medical-text-muted mt-2">{{ direction.explanationUz }}</p>
                  </div>
                }
              </div>
            </div>
            <div class="rounded-[2rem] bg-white border border-medical-border p-6 shadow-xl print:shadow-none">
              <h3 class="text-xl font-black text-medical-text mb-4">Abdulloh AI izohi va monitoring rejasi</h3>
              <p class="text-medical-text-muted leading-relaxed font-medium">{{ analysis.aiAnalysis.explanationForPatient }}</p>
              <h4 class="font-black text-medical-text mt-5 mb-3">Tavsiyalar</h4>
              <ul class="space-y-2">
                @for (item of analysis.recommendations; track item) { <li class="flex gap-2 text-sm font-semibold"><mat-icon class="text-emerald-500">check_circle</mat-icon><span>{{ item }}</span></li> }
              </ul>
              <h4 class="font-black text-medical-text mt-5 mb-3">Monitoring rejasi</h4>
              <ul class="space-y-2">
                @for (item of analysis.aiAnalysis.monitoringPlan; track item) { <li class="flex gap-2 text-sm font-semibold"><mat-icon class="text-medical-primary">timeline</mat-icon><span>{{ item }}</span></li> }
              </ul>
            </div>
          </div>

          <div class="rounded-[2rem] bg-white border border-medical-border p-6 shadow-xl print:shadow-none">
            <h3 class="text-xl font-black text-medical-text mb-4">5 yillik va 10 yillik prognoz</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100"><b>5 yillik:</b> {{ analysis.fiveYearProjection.status }} — {{ analysis.fiveYearProjection.riskPercent }}%. <p class="text-sm text-medical-text-muted mt-2">{{ analysis.fiveYearProjection.explanationUz }}</p></div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100"><b>10 yillik:</b> {{ analysis.tenYearProjection.status }} — {{ analysis.tenYearProjection.riskPercent }}%. <p class="text-sm text-medical-text-muted mt-2">{{ analysis.tenYearProjection.explanationUz }}</p></div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .homeostasis-grid { background-image: linear-gradient(rgba(110,231,183,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,.13) 1px, transparent 1px); background-size: 36px 36px; }
    .hero-chip { border: 1px solid rgba(125,211,252,.25); background: rgba(255,255,255,.08); border-radius: 1.25rem; padding: .9rem; display: grid; gap: .25rem; backdrop-filter: blur(10px); } .hero-chip b { color: #d1fae5; } .hero-chip span { color: #cbd5e1; font-size: .78rem; font-weight: 700; }
    .hero-orbit { position: relative; min-height: 330px; border-radius: 2rem; border: 1px solid rgba(125,211,252,.2); background: radial-gradient(circle at center, rgba(16,185,129,.16), rgba(15,23,42,.66)); overflow: hidden; }
    .orbit { position: absolute; inset: 0; margin: auto; border-radius: 999px; border: 1px dashed rgba(125,211,252,.36); animation: orbitRotate 24s linear infinite; } .orbit-a { width: 72%; height: 72%; } .orbit-b { width: 48%; height: 48%; animation-direction: reverse; animation-duration: 17s; }
    .metabolic-core { position: absolute; inset: 0; margin: auto; width: 5rem; height: 5rem; border-radius: 999px; display: grid; place-items: center; background: rgba(255,255,255,.9); color: #4f46e5; box-shadow: 0 25px 45px -28px rgba(16,185,129,.9); } .metabolic-core mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
    .floating-badge { position: absolute; border-radius: 999px; background: rgba(255,255,255,.9); color: #1e293b; border: 1px solid rgba(148,163,184,.25); padding: .55rem .8rem; font-size: .76rem; font-weight: 900; animation: badgeFloat 7s ease-in-out infinite; } .badge-a { left: 1.2rem; top: 2rem; } .badge-b { right: 1rem; top: 45%; } .badge-c { left: 30%; bottom: 1.3rem; }
    @keyframes orbitRotate { to { transform: rotate(360deg); } } @keyframes badgeFloat { 50% { translate: 0 -10px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeostasisAIComponent {
  private supabase = inject(SupabaseService);

  state = signal<PageState>('form');
  result = signal<HomeostasisResult | null>(null);
  previousResults = signal<HomeostasisResult[]>([]);
  cases = signal<CaseData[]>([]);
  selectedPatientId = '';
  saving = signal(false);
  saveMessage = signal<string | null>(null);
  saveError = signal<string | null>(null);
  inputData: HomeostasisInputData = defaultHomeostasisInput();

  constructor() {
    void this.loadHistory();
  }

  async runAnalysis() {
    this.state.set('loading');
    this.saveMessage.set(null);
    this.saveError.set(null);
    const localScores = calculateHomeostasisScores(this.inputData);
    const serverAnalysis = await requestHomeostasisAIAnalysis(this.inputData, localScores);
    const fallback = buildFallbackAIAnalysis(this.inputData, localScores, []);
    this.result.set(buildHomeostasisResult(this.inputData, this.previousResults(), serverAnalysis ?? fallback));
    this.state.set('result');
  }

  async saveResult() {
    const current = this.result();
    if (!current) return;
    this.saving.set(true);
    const { error } = await this.supabase.saveHomeostasisResult(current, this.selectedPatientId || null);
    if (error) {
      this.saveError.set('Natijani saqlashda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.');
    } else {
      this.saveMessage.set('Homeostaz AI natijasi profil va dashboard tarixiga saqlandi.');
      await this.loadHistory();
    }
    this.saving.set(false);
  }

  printResult() { window.print(); }

  scoreCards(result: HomeostasisResult) {
    const s = result.calculatedScores;
    return [
      { title: 'Metabolik Xavf Indeksi', value: s.metabolicRiskIndex, text: 'Glyukoza, insulin, HbA1c, lipidlar, BMI, faollik va simptomlar asosida.' },
      { title: 'Kortizol-Stress Yuklama Indeksi', value: s.cortisolStressLoadIndex, text: 'Kortizol, stress, uyqu, puls, charchoq va vegetativ belgilar asosida.' },
      { title: 'Energiya Tiklanish Indeksi', value: s.energyRecoveryIndex, text: 'Uyqu, faollik, charchoq, glyukoza va umumiy metabolik bosim asosida.' },
      { title: 'Elektrolit Muvozanat Indeksi', value: s.electrolyteBalanceIndex, text: 'Na⁺, K⁺, Ca²⁺ va Mg²⁺ qiymatlari asosida.' }
    ];
  }

  riskClass(level: string) {
    if (level === 'Kritik signal') return 'bg-red-50 text-red-700 border-red-100';
    if (level === 'Yuqori xavf') return 'bg-orange-50 text-orange-700 border-orange-100';
    if (level === 'O‘rta xavf') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }

  private async loadHistory() {
    const { data } = await this.supabase.getHomeostasisResults();
    this.previousResults.set((data ?? []) as HomeostasisResult[]);
    const { data: cases } = await this.supabase.getCases();
    this.cases.set((cases ?? []) as CaseData[]);
  }
}
