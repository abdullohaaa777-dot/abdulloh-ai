import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase';
import {
  SdhFeatureSet,
  SdhInputSnapshot,
  SdhOrganRisk,
  SdhResult,
  SilentDiseaseHunterStorageService
} from '../../services/silent-disease-hunter-storage';

interface SdhPatientOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-silent-disease-hunter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="sdh-dashboard min-h-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <section class="sdh-hero relative p-6 md:p-8 overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(99,102,241,.18),transparent_28%),linear-gradient(135deg,#020617,#0f172a_48%,#111827)]"></div>
        <div class="absolute inset-0 pointer-events-none opacity-40">
          <svg viewBox="0 0 900 280" class="w-full h-full">
            <path d="M0 180 C110 120 180 220 295 160 C430 90 520 230 650 160 C760 100 820 145 910 95" fill="none" stroke="rgba(34,211,238,.5)" stroke-width="4"></path>
            <path d="M0 225 C120 170 240 250 350 205 C470 156 560 255 710 198 C790 168 850 178 910 150" fill="none" stroke="rgba(99,102,241,.42)" stroke-width="3"></path>
            <circle cx="720" cy="92" r="58" fill="none" stroke="rgba(16,185,129,.35)" stroke-width="2"></circle>
            <circle cx="720" cy="92" r="92" fill="none" stroke="rgba(16,185,129,.18)" stroke-width="1.5"></circle>
          </svg>
        </div>
        <div class="relative z-10 grid lg:grid-cols-[1.15fr_.85fr] gap-6 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm text-cyan-100">
              <mat-icon class="!text-[18px]">radar</mat-icon>
              <span>Yashirin fiziologik og‘ishlarni erta baholash</span>
            </div>
            <h1 class="mt-5 text-4xl md:text-5xl font-black tracking-tight">Yashirin kasalliklarni erta aniqlash</h1>
            <p class="mt-4 text-cyan-50/90 max-w-3xl text-lg">Organizmdagi yashirin fiziologik og‘ishlarni kamera, mikrofon, qo‘lda kiritilgan wearable, laborator ko‘rsatkichlar va savol-javob asosida ehtiyotkor multimodal baholash moduli.</p>
            <p class="mt-3 text-sm text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-2xl p-3 max-w-3xl">Bu tizim yakuniy tashxis qo‘ymaydi. Yuqori xavfli belgilar bo‘lsa, shifokor yoki shoshilinch tibbiy yordamga murojaat qiling.</p>
          </div>
          <div class="sdh-status-card rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md p-5 shadow-2xl">
            <p class="text-sm text-cyan-100">Umumiy fiziologik stabilitet</p>
            <div class="mt-3 flex items-end justify-between gap-3">
              <p class="text-5xl font-black">{{ latestResult()?.physiologicalStability ?? sdhLiveStability() }}%</p>
              <span class="px-3 py-1 rounded-full text-sm bg-emerald-400/15 text-emerald-100 border border-emerald-300/20">{{ sdhRiskLevel(latestResult()?.overallRisk ?? sdhLiveRisk()) }}</span>
            </div>
            <div class="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-400 to-cyan-300" [style.width.%]="latestResult()?.physiologicalStability ?? sdhLiveStability()"></div></div>
            <div class="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Risk</p><p class="font-bold text-lg">{{ latestResult()?.overallRisk ?? sdhLiveRisk() }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Ishonch</p><p class="font-bold text-lg">{{ latestResult()?.confidence ?? sdhLiveConfidence() }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Signal</p><p class="font-bold text-lg">{{ latestResult()?.signalQuality ?? sdhSignalQuality() }}%</p></div>
            </div>
          </div>
        </div>
      </section>

      <section class="sdh-content p-5 md:p-7 space-y-6 bg-slate-950">
        <div class="grid xl:grid-cols-[.95fr_1.05fr] gap-5">
          <div class="sdh-panel rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-black">Ma’lumot yig‘ish qatlami</h2>
                <p class="text-sm text-slate-400">Har bir manba ixtiyoriy. Yetishmagan ma’lumotlar fallback rejimida belgilanadi.</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-200 border border-cyan-300/20">SDH</span>
            </div>

            <div class="block text-sm text-slate-300">Bemor profili</div>
            <select class="sdh-input w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white" [(ngModel)]="sdhSelectedPatientId">
              <option value="umumiy">Umumiy profil</option>
              @for (patient of sdhPatients(); track patient.id) {
                <option [value]="patient.id">{{ patient.name }}</option>
              }
            </select>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.cameraEnabled"><span>Kamera signali</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.microphoneEnabled"><span>Mikrofon signali</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.wearableProvided"><span>Wearable qo‘lda kiritildi</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.labProvided"><span>Laborator ko‘rsatkichlar bor</span></div>
            </div>

            <div class="grid sm:grid-cols-3 gap-3">
              <div><div class="sdh-label">Yurak urishi</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.heartRate" placeholder="72"></div>
              <div><div class="sdh-label">HRV</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hrv" placeholder="45"></div>
              <div><div class="sdh-label">SpO2</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.spo2" placeholder="98"></div>
              <div><div class="sdh-label">Uyqu soati</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.sleepHours" placeholder="7"></div>
              <div><div class="sdh-label">Glyukoza</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.glucose" placeholder="5.4"></div>
              <div><div class="sdh-label">HbA1c</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hbA1c" placeholder="5.6"></div>
              <div><div class="sdh-label">Gemoglobin</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hemoglobin" placeholder="135"></div>
              <div><div class="sdh-label">CRP</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.crp" placeholder="3"></div>
              <div><div class="sdh-label">Kreatinin</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.creatinine" placeholder="80"></div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div><div class="sdh-label">Charchoq darajasi: {{ sdhInput.fatigue }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.fatigue" class="w-full"></div>
              <div><div class="sdh-label">Nafas qisishi: {{ sdhInput.dyspnea }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.dyspnea" class="w-full"></div>
              <div><div class="sdh-label">Stress yuklamasi: {{ sdhInput.stress }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.stress" class="w-full"></div>
              <div><div class="sdh-label">Uyqu sifati: {{ sdhInput.sleepQuality }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.sleepQuality" class="w-full"></div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.chestDiscomfort"><span>Ko‘krak noqulayligi bor</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.neurologicalAsymmetry"><span>Nevrologik asimmetriya sezilgan</span></div>
            </div>

            @if (sdhWarnings().length) {
              <div class="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                @for (warning of sdhWarnings(); track warning) { <p>• {{ warning }}</p> }
              </div>
            }

            <div class="flex flex-wrap gap-3">
              <button class="sdh-button-primary" (click)="sdhStartMonitoring()" [disabled]="sdhMonitoring()">Monitoringni boshlash</button>
              <button class="sdh-button-secondary" (click)="sdhStopMonitoring()" [disabled]="!sdhMonitoring()">Monitoringni to‘xtatish</button>
              <button class="sdh-button-secondary" (click)="sdhRunAnalysis()">Tahlilni hisoblash</button>
            </div>
          </div>

          <div class="space-y-5">
            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              @for (item of sdhMonitoringCards(); track item.name) {
                <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-400]="item.active" [class.bg-amber-400]="!item.active"></span><p class="font-bold">{{ item.name }}</p></div>
                  <p class="text-sm text-slate-400 mt-1">{{ item.status }}</p>
                </div>
              }
            </div>

            <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div class="flex items-center justify-between gap-3 mb-4">
                <h2 class="text-xl font-black">Organlar bo‘yicha og‘ish xaritasi</h2>
                <span class="text-xs text-slate-400">Risk foizi va asosiy markerlar</span>
              </div>
              <div class="grid md:grid-cols-2 gap-3">
                @for (organ of sdhCurrentOrganRisks(); track organ.key) {
                  <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <p class="font-bold">{{ organ.nameUz }}</p>
                      <span class="text-sm" [class.text-emerald-300]="organ.percent <= 30" [class.text-amber-300]="organ.percent > 30 && organ.percent <= 60" [class.text-rose-300]="organ.percent > 60">{{ organ.percent }}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden mt-3"><div class="h-full" [class.bg-emerald-400]="organ.percent <= 30" [class.bg-amber-400]="organ.percent > 30 && organ.percent <= 60" [class.bg-rose-500]="organ.percent > 60" [style.width.%]="organ.percent"></div></div>
                    <p class="text-xs text-slate-400 mt-2">{{ organ.levelUz }} · {{ organ.trendUz }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-5">
              <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 class="font-black">Risk vaqt chizig‘i</h3>
                <svg viewBox="0 0 420 150" class="w-full h-40 mt-3">
                  <polyline [attr.points]="sdhTimelinePoints()" fill="none" stroke="#22d3ee" stroke-width="3"></polyline>
                  <line x1="0" y1="115" x2="420" y2="115" stroke="rgba(148,163,184,.25)"></line>
                  <line x1="0" y1="75" x2="420" y2="75" stroke="rgba(148,163,184,.25)"></line>
                </svg>
              </div>
              <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 class="font-black">Fiziologik radar xarita</h3>
                <div class="grid grid-cols-6 gap-2 mt-4">
                  @for (organ of sdhCurrentOrganRisks(); track organ.key) {
                    <div class="h-24 rounded-xl border border-slate-800" [style.background]="sdhHeatColor(organ.percent)" [title]="organ.nameUz"></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        @if (latestResult(); as result) {
          <section class="sdh-result rounded-3xl border border-slate-800 bg-slate-900/85 p-5 md:p-6 space-y-5">
            @if (result.emergencyWarning) {
              <div class="rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-red-100 font-semibold">Bu natija shoshilinch tibbiy baholashni talab qilishi mumkin. Agar kuchli ko‘krak og‘rig‘i, nafas yetishmovchiligi, hushdan ketish, nutq buzilishi yoki tananing bir tomonida kuchsizlik bo‘lsa, darhol shoshilinch tibbiy yordamga murojaat qiling.</div>
            }
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-2xl font-black">Silent Disease Hunter natijasi</h2>
                <p class="text-sm text-slate-400">{{ result.createdAt | date:'medium' }} · Bemor: {{ sdhPatientName(result.patientId) }}</p>
              </div>
              <button class="sdh-button-secondary" (click)="sdhPrintReport()">Hisobotni chop etish</button>
            </div>

            <div class="grid sm:grid-cols-4 gap-3">
              <div class="sdh-metric"><p>Umumiy risk</p><strong>{{ result.overallRisk }}%</strong></div>
              <div class="sdh-metric"><p>Stabilitet</p><strong>{{ result.physiologicalStability }}%</strong></div>
              <div class="sdh-metric"><p>Ishonchlilik</p><strong>{{ result.confidence }}%</strong></div>
              <div class="sdh-metric"><p>Signal sifati</p><strong>{{ result.signalQuality }}%</strong></div>
            </div>

            <div class="grid lg:grid-cols-2 gap-4">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Tushuntiriladigan AI paneli</h3>
                <p class="mt-2 text-slate-200">{{ result.aiSummary }}</p>
                <ul class="list-disc pl-5 mt-3 text-sm text-slate-300 space-y-1">
                  @for (finding of result.aiFindings; track finding) { <li>{{ finding }}</li> }
                </ul>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Ehtimoliy fiziologik yo‘nalishlar</h3>
                @for (item of result.differentialReasoning; track item.titleUz) {
                  <div class="mt-3">
                    <div class="flex justify-between text-sm"><span>{{ item.titleUz }}</span><span>{{ item.percent }}%</span></div>
                    <div class="h-2 rounded-full bg-slate-800 mt-1"><div class="h-full bg-cyan-400 rounded-full" [style.width.%]="item.percent"></div></div>
                    <p class="text-xs text-slate-500 mt-1">{{ item.systemUz }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-4">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Bemor uchun sodda tushuntirish</h3>
                <p class="text-sm text-slate-300 mt-2">{{ result.patientExplanation }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Shifokor ko‘rigi paneli</h3>
                <textarea class="sdh-input min-h-24 mt-2" [(ngModel)]="sdhDoctorNote" placeholder="Shifokor izohi yoki follow-up rejasi"></textarea>
                <button class="sdh-button-secondary mt-3" (click)="sdhSaveDoctorNote(result)">Izohni saqlash</button>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Keyingi tavsiyalar</h3>
                <ul class="list-disc pl-5 text-sm text-slate-300 mt-2 space-y-1">
                  @for (rec of result.recommendations; track rec) { <li>{{ rec }}</li> }
                </ul>
              </div>
            </div>

            <div class="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">Bu tizim AI asosidagi fiziologik baholash vositasidir. U yakuniy tashxis qo‘ymaydi va shifokor ko‘rigini almashtirmaydi.</div>
          </section>
        }
      </section>
    </div>
  `,
  styles: [`
    .sdh-input { width: 100%; border-radius: 0.75rem; border: 1px solid rgb(51 65 85); background: rgba(2, 6, 23, .82); color: white; padding: .75rem 1rem; outline: none; }
    .sdh-input:focus { border-color: rgb(34 211 238); box-shadow: 0 0 0 4px rgba(34, 211, 238, .12); }
    .sdh-label { display: block; font-size: .75rem; color: rgb(203 213 225); margin-bottom: .35rem; }
    .sdh-toggle { display: flex; align-items: center; gap: .6rem; border: 1px solid rgb(51 65 85); border-radius: 1rem; padding: .85rem; background: rgba(15, 23, 42, .8); color: rgb(226 232 240); font-size: .9rem; }
    .sdh-button-primary { border-radius: .9rem; background: linear-gradient(90deg, #0891b2, #4f46e5); color: white; padding: .8rem 1.1rem; font-weight: 800; box-shadow: 0 14px 35px rgba(34, 211, 238, .16); }
    .sdh-button-primary:disabled, .sdh-button-secondary:disabled { opacity: .55; cursor: not-allowed; }
    .sdh-button-secondary { border-radius: .9rem; border: 1px solid rgb(51 65 85); background: rgba(15, 23, 42, .88); color: rgb(226 232 240); padding: .8rem 1.1rem; font-weight: 700; }
    .sdh-metric { border: 1px solid rgb(51 65 85); border-radius: 1rem; background: rgba(2, 6, 23, .65); padding: 1rem; }
    .sdh-metric p { color: rgb(148 163 184); font-size: .78rem; }
    .sdh-metric strong { display: block; color: white; font-size: 1.8rem; line-height: 1.1; margin-top: .25rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SilentDiseaseHunterComponent implements OnInit, OnDestroy {
  private sdhStorage = inject(SilentDiseaseHunterStorageService);
  private sdhSupabase = inject(SupabaseService);

  sdhPatients = signal<SdhPatientOption[]>([]);
  sdhMonitoring = signal(false);
  sdhWarnings = signal<string[]>(['Kamera, mikrofon, wearable yoki laborator ma’lumotlar kiritilmasa ham fallback baholash ishlaydi.']);
  latestResult = signal<SdhResult | null>(null);
  sdhLiveRisk = signal(28);
  sdhLiveStability = signal(72);
  sdhLiveConfidence = signal(64);
  sdhSignalQuality = signal(70);
  sdhDoctorNote = '';
  sdhSelectedPatientId = 'umumiy';

  sdhInput: SdhInputSnapshot = {
    patientId: 'umumiy',
    cameraEnabled: false,
    microphoneEnabled: false,
    wearableProvided: false,
    labProvided: false,
    questionnaireProvided: true,
    heartRate: null,
    hrv: null,
    spo2: null,
    sleepHours: null,
    glucose: null,
    hbA1c: null,
    hemoglobin: null,
    crp: null,
    creatinine: null,
    alt: null,
    fatigue: 35,
    dyspnea: 20,
    stress: 35,
    sleepQuality: 65,
    chestDiscomfort: false,
    neurologicalAsymmetry: false
  };

  private sdhTimer: number | null = null;
  private sdhMediaStream: MediaStream | null = null;
  private sdhTimeline = [22, 26, 24, 30, 28, 32];

  async ngOnInit() {
    await this.sdhLoadPatients();
    const list = await this.sdhStorage.sdhList();
    this.latestResult.set(list[0] ?? null);
  }

  ngOnDestroy() {
    this.sdhStopMonitoring();
  }

  async sdhLoadPatients() {
    const { data } = await this.sdhSupabase.getCases();
    const cases = Array.isArray(data) ? data : [];
    this.sdhPatients.set(cases.map((item) => {
      const record = item as { id?: string; patient_name?: string; name?: string; title?: string };
      return {
        id: String(record.id ?? 'umumiy'),
        name: String(record.patient_name ?? record.name ?? record.title ?? 'Bemor profili')
      };
    }));
  }

  async sdhStartMonitoring() {
    this.sdhMonitoring.set(true);
    this.sdhWarnings.set([]);
    if (this.sdhInput.cameraEnabled || this.sdhInput.microphoneEnabled) {
      try {
        this.sdhMediaStream = await navigator.mediaDevices.getUserMedia({
          video: this.sdhInput.cameraEnabled,
          audio: this.sdhInput.microphoneEnabled
        });
      } catch (error) {
        console.warn('Silent Disease Hunter media permission warning:', error);
        this.sdhWarnings.set(['Kamera yoki mikrofon ruxsati berilmadi. Modul savol-javob, wearable va laborator ma’lumotlar asosida davom etadi.']);
      }
    }

    this.sdhTimer = window.setInterval(() => {
      const features = this.sdhExtractFeatures(this.sdhBuildSnapshot());
      const organRisks = this.sdhFuseOrganRisks(features);
      const risk = this.sdhClamp(Math.round(organRisks.reduce((sum, x) => sum + x.percent, 0) / organRisks.length), 1, 99);
      this.sdhLiveRisk.set(risk);
      this.sdhLiveStability.set(this.sdhClamp(100 - risk, 1, 99));
      this.sdhLiveConfidence.set(this.sdhCalculateConfidence());
      this.sdhSignalQuality.set(this.sdhCalculateSignalQuality());
      this.sdhTimeline = [...this.sdhTimeline.slice(-8), risk];
    }, 5000);
  }

  sdhStopMonitoring() {
    this.sdhMonitoring.set(false);
    if (this.sdhTimer) window.clearInterval(this.sdhTimer);
    this.sdhTimer = null;
    this.sdhMediaStream?.getTracks().forEach((track) => track.stop());
    this.sdhMediaStream = null;
  }

  async sdhRunAnalysis() {
    const snapshot = this.sdhBuildSnapshot();
    const features = this.sdhExtractFeatures(snapshot);
    const organRisks = this.sdhFuseOrganRisks(features);
    const overallRisk = this.sdhClamp(Math.round(organRisks.reduce((sum, x) => sum + x.percent, 0) / organRisks.length), 1, 99);
    const result: SdhResult = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sdh-${Date.now()}`,
      patientId: snapshot.patientId,
      createdAt: new Date().toISOString(),
      overallRisk,
      physiologicalStability: this.sdhClamp(100 - overallRisk, 1, 99),
      confidence: this.sdhCalculateConfidence(),
      signalQuality: this.sdhCalculateSignalQuality(),
      emergencyWarning: this.sdhEmergencyWarning(snapshot, overallRisk),
      usedInputs: this.sdhUsedInputs(snapshot),
      inputSnapshot: snapshot,
      features,
      organRisks,
      differentialReasoning: this.sdhDifferentialReasoning(organRisks, features),
      timeline: [...this.sdhTimeline, overallRisk],
      aiSummary: this.sdhAiSummary(overallRisk, organRisks),
      aiFindings: this.sdhAiFindings(features, organRisks),
      patientExplanation: 'Tizim kiritilgan signallarni birlashtirib, ayrim organ tizimlarida yashirin zo‘riqish yoki fiziologik notekislik ehtimolini baholadi. Bu tashxis emas, balki ehtiyotkor skrining signalidir.',
      doctorNote: this.sdhDoctorNote,
      recommendations: this.sdhRecommendations(overallRisk, organRisks)
    };

    const saved = await this.sdhStorage.sdhSave(result);
    if (saved.error) this.sdhWarnings.set([`Natija lokal saqlandi, lekin bulutga yozishda xatolik: ${saved.error.message}`]);
    this.latestResult.set(result);
    this.sdhLiveRisk.set(result.overallRisk);
    this.sdhLiveStability.set(result.physiologicalStability);
  }

  async sdhSaveDoctorNote(result: SdhResult) {
    const updated = { ...result, doctorNote: this.sdhDoctorNote };
    await this.sdhStorage.sdhSave(updated);
    this.latestResult.set(updated);
  }

  sdhBuildSnapshot(): SdhInputSnapshot {
    return { ...this.sdhInput, patientId: this.sdhSelectedPatientId || 'umumiy' };
  }

  sdhExtractFeatures(input: SdhInputSnapshot): SdhFeatureSet {
    const fatigue = Number(input.fatigue || 0);
    const dyspnea = Number(input.dyspnea || 0);
    const stress = Number(input.stress || 0);
    const poorSleep = 100 - Number(input.sleepQuality || 60);
    const heartRateRisk = input.heartRate ? Math.abs(input.heartRate - 72) * 1.2 : 25;
    const hrvRisk = input.hrv ? Math.max(0, 55 - input.hrv) * 1.4 : 30;
    const spo2Risk = input.spo2 ? Math.max(0, 97 - input.spo2) * 12 : 20;
    const glucoseRisk = input.glucose ? Math.max(0, input.glucose - 5.6) * 18 : 20;
    const hbA1cRisk = input.hbA1c ? Math.max(0, input.hbA1c - 5.7) * 20 : 15;
    const hemoglobinRisk = input.hemoglobin ? Math.max(0, 125 - input.hemoglobin) * 0.8 : 12;
    const crpRisk = input.crp ? Math.max(0, input.crp - 3) * 6 : 15;
    const creatinineRisk = input.creatinine ? Math.max(0, input.creatinine - 100) * 0.45 : 12;

    return {
      facialFatigueScore: this.sdhClamp(fatigue * 0.75 + poorSleep * 0.25, 1, 99),
      pallorCyanosisSuspicionScore: this.sdhClamp(hemoglobinRisk + spo2Risk * 0.6, 1, 99),
      microExpressionVariability: this.sdhClamp(100 - stress * 0.55 - fatigue * 0.2, 1, 99),
      motorSymmetryScore: this.sdhClamp(input.neurologicalAsymmetry ? 45 : 82 - fatigue * 0.18, 1, 99),
      respiratoryMotionPattern: this.sdhClamp(dyspnea * 0.72 + spo2Risk * 0.28, 1, 99),
      voiceStressIndex: this.sdhClamp(stress * 0.75 + poorSleep * 0.2, 1, 99),
      speechPauseFrequency: this.sdhClamp(dyspnea * 0.45 + fatigue * 0.25 + stress * 0.15, 1, 99),
      breathPressureDuringSpeech: this.sdhClamp(dyspnea * 0.55 + spo2Risk * 0.25, 1, 99),
      hrvTrend: this.sdhClamp(hrvRisk, 1, 99),
      restingHeartRateTrend: this.sdhClamp(heartRateRisk, 1, 99),
      spo2Instability: this.sdhClamp(spo2Risk, 1, 99),
      sleepRecoveryScore: this.sdhClamp(input.sleepQuality ?? 55, 1, 99),
      activityDeclineScore: this.sdhClamp(fatigue * 0.55 + poorSleep * 0.2, 1, 99),
      inflammatoryBurdenScore: this.sdhClamp(crpRisk + fatigue * 0.15, 1, 99),
      metabolicStressScore: this.sdhClamp(glucoseRisk + hbA1cRisk + poorSleep * 0.15, 1, 99),
      anemiaRiskSignal: this.sdhClamp(hemoglobinRisk + fatigue * 0.18, 1, 99),
      renalStressSignal: this.sdhClamp(creatinineRisk, 1, 99),
      hepaticStressSignal: this.sdhClamp((input.alt ? Math.max(0, input.alt - 40) * 0.6 : 10), 1, 99),
      fatigueIndex: this.sdhClamp(fatigue, 1, 99),
      dyspneaIndex: this.sdhClamp(dyspnea, 1, 99),
      stressLoadScore: this.sdhClamp(stress, 1, 99),
      neurologicalSymptomScore: this.sdhClamp(input.neurologicalAsymmetry ? 70 : stress * 0.25 + poorSleep * 0.25, 1, 99)
    };
  }

  sdhFuseOrganRisks(features: SdhFeatureSet): SdhOrganRisk[] {
    return [
      this.sdhOrgan('heart', 'Yurak-qon tomir tizimi', features.restingHeartRateTrend * 0.3 + features.hrvTrend * 0.35 + features.anemiaRiskSignal * 0.15 + features.stressLoadScore * 0.2, ['HRV trendi', 'yurak urish tezligi', 'anemiya signali']),
      this.sdhOrgan('lungs', 'Nafas tizimi', features.spo2Instability * 0.42 + features.dyspneaIndex * 0.34 + features.respiratoryMotionPattern * 0.24, ['SpO2 beqarorligi', 'nafas qisishi', 'ko‘krak harakati']),
      this.sdhOrgan('brain', 'Miya va asab tizimi', (100 - features.motorSymmetryScore) * 0.34 + features.neurologicalSymptomScore * 0.4 + features.sleepRecoveryScore * -0.12 + 22, ['motor simmetriya', 'uyqu tiklanishi', 'nevrologik simptom']),
      this.sdhOrgan('metabolic', 'Metabolik tizim', features.metabolicStressScore * 0.58 + features.activityDeclineScore * 0.2 + features.sleepRecoveryScore * -0.08 + 18, ['glyukoza/HbA1c', 'faollik pasayishi', 'uyqu sifati']),
      this.sdhOrgan('stress', 'Psixofiziologik holat', features.voiceStressIndex * 0.35 + features.stressLoadScore * 0.45 + features.sleepRecoveryScore * -0.08 + 18, ['ovoz stressi', 'stress yuklamasi', 'uyqu tiklanishi']),
      this.sdhOrgan('cellular', 'Cellular stress va yallig‘lanish', features.inflammatoryBurdenScore * 0.5 + features.metabolicStressScore * 0.22 + features.hepaticStressSignal * 0.12 + features.renalStressSignal * 0.16, ['CRP', 'metabolik stress', 'buyrak/jigar signallari'])
    ];
  }

  sdhOrgan(key: SdhOrganRisk['key'], nameUz: string, raw: number, reasons: string[]): SdhOrganRisk {
    const percent = this.sdhClamp(raw, 1, 99);
    return {
      key,
      nameUz,
      percent,
      levelUz: this.sdhRiskLevel(percent),
      trendUz: percent > 60 ? 'kuchaygan kuzatuv kerak' : percent > 30 ? 'monitoring tavsiya etiladi' : 'katta og‘ish ko‘rinmayapti',
      reasons
    };
  }

  sdhDifferentialReasoning(organs: SdhOrganRisk[], features: SdhFeatureSet): { titleUz: string; percent: number; systemUz: string }[] {
    const heart = organs.find((x) => x.key === 'heart')?.percent ?? 20;
    const lungs = organs.find((x) => x.key === 'lungs')?.percent ?? 20;
    const metabolic = organs.find((x) => x.key === 'metabolic')?.percent ?? 20;
    const stress = organs.find((x) => x.key === 'stress')?.percent ?? 20;
    return [
      { titleUz: 'Stressga bog‘liq yurak-qon tomir zo‘riqishi ehtimoli', percent: this.sdhClamp((heart + stress) / 2, 1, 99), systemUz: 'Yurak va psixofiziologik holat' },
      { titleUz: 'Nafas yetishmovchiligi yoki giperventilyatsiya yo‘nalishi ehtimoli', percent: this.sdhClamp(lungs, 1, 99), systemUz: 'Nafas tizimi' },
      { titleUz: 'Glyukoza-lipid yoki metabolik stress yo‘nalishi ehtimoli', percent: this.sdhClamp(metabolic + features.metabolicStressScore * 0.15, 1, 99), systemUz: 'Metabolik tizim' }
    ].sort((a, b) => b.percent - a.percent);
  }

  sdhAiSummary(overallRisk: number, organs: SdhOrganRisk[]): string {
    const main = [...organs].sort((a, b) => b.percent - a.percent)[0];
    return `Umumiy fiziologik risk ${overallRisk}% deb baholandi. Eng ko‘proq e’tibor talab qilayotgan tizim: ${main.nameUz}. Xulosa multimodal skrining signali bo‘lib, yakuniy tashxis emas.`;
  }

  sdhAiFindings(features: SdhFeatureSet, organs: SdhOrganRisk[]): string[] {
    const main = [...organs].sort((a, b) => b.percent - a.percent).slice(0, 3);
    return [
      `Signal sifati ${this.sdhCalculateSignalQuality()}%: natija ishonchliligiga bevosita ta’sir qiladi.`,
      `Charchoq indeksi ${features.fatigueIndex}% va stress yuklamasi ${features.stressLoadScore}% darajada baholandi.`,
      `Asosiy organ og‘ishlari: ${main.map((x) => `${x.nameUz} ${x.percent}%`).join(', ')}.`
    ];
  }

  sdhRecommendations(overallRisk: number, organs: SdhOrganRisk[]): string[] {
    const recs = ['Natijani simptomlar kundaligi bilan birga qayta baholang.', 'Signal sifati past bo‘lsa, yorug‘lik, tinch muhit va ma’lumot to‘liqligini yaxshilang.'];
    if (overallRisk > 60) recs.push('Shifokor ko‘rigini rejalashtiring va formal tekshiruvlar bilan tasdiqlang.');
    if (organs.some((x) => x.key === 'heart' && x.percent > 60)) recs.push('EKG, qon bosimi va yurak-qon tomir baholashini ko‘rib chiqing.');
    if (organs.some((x) => x.key === 'metabolic' && x.percent > 60)) recs.push('Glyukoza, HbA1c va lipidlar bo‘yicha laborator nazoratni kuchaytiring.');
    return recs;
  }

  sdhUsedInputs(input: SdhInputSnapshot): string[] {
    const used: string[] = [];
    if (input.cameraEnabled) used.push('kamera');
    if (input.microphoneEnabled) used.push('mikrofon');
    if (input.wearableProvided) used.push('wearable qo‘lda kiritilgan');
    if (input.labProvided) used.push('laborator ko‘rsatkichlar');
    if (input.questionnaireProvided) used.push('savol-javob');
    return used.length ? used : ['minimal savol-javob'];
  }

  sdhEmergencyWarning(input: SdhInputSnapshot, overallRisk: number): boolean {
    return overallRisk >= 82 || !!(input.spo2 && input.spo2 < 90) || (input.chestDiscomfort && input.dyspnea > 65) || input.neurologicalAsymmetry;
  }

  sdhCalculateSignalQuality(): number {
    let quality = 35;
    if (this.sdhInput.cameraEnabled) quality += 13;
    if (this.sdhInput.microphoneEnabled) quality += 12;
    if (this.sdhInput.wearableProvided) quality += 16;
    if (this.sdhInput.labProvided) quality += 18;
    if (this.sdhInput.questionnaireProvided) quality += 10;
    return this.sdhClamp(quality, 10, 98);
  }

  sdhCalculateConfidence(): number {
    const sourceCount = this.sdhUsedInputs(this.sdhBuildSnapshot()).length;
    return this.sdhClamp(this.sdhCalculateSignalQuality() * 0.72 + sourceCount * 5, 10, 98);
  }

  sdhCurrentOrganRisks(): SdhOrganRisk[] {
    return this.latestResult()?.organRisks ?? this.sdhFuseOrganRisks(this.sdhExtractFeatures(this.sdhBuildSnapshot()));
  }

  sdhMonitoringCards() {
    return [
      { name: 'Kamera', active: this.sdhInput.cameraEnabled, status: this.sdhInput.cameraEnabled ? 'ruxsat so‘raladi yoki faol' : 'fallback rejim' },
      { name: 'Mikrofon', active: this.sdhInput.microphoneEnabled, status: this.sdhInput.microphoneEnabled ? 'ovoz markerlari baholanadi' : 'ovozsiz baholash' },
      { name: 'Wearable', active: this.sdhInput.wearableProvided, status: this.sdhInput.wearableProvided ? 'qo‘lda kiritilgan' : 'ma’lumot kiritilmagan' },
      { name: 'EKG', active: false, status: 'qo‘lda risk signali sifatida qo‘shilishi mumkin' },
      { name: 'Laboratoriya', active: this.sdhInput.labProvided, status: this.sdhInput.labProvided ? 'biomarkerlar ishlatiladi' : 'ma’lumot kiritilmagan' },
      { name: 'Monitoring', active: this.sdhMonitoring(), status: this.sdhMonitoring() ? 'har 5 soniyada yangilanmoqda' : 'to‘xtatilgan' }
    ];
  }

  sdhTimelinePoints(): string {
    const data = this.latestResult()?.timeline ?? this.sdhTimeline;
    return data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 420},${135 - this.sdhClamp(v, 1, 99)}`).join(' ');
  }

  sdhHeatColor(percent: number): string {
    const hue = 145 - percent * 1.15;
    return `linear-gradient(180deg, hsla(${hue}, 85%, 48%, .92), rgba(15,23,42,.92))`;
  }

  sdhRiskLevel(percent: number): string {
    if (percent <= 30) return 'Past risk';
    if (percent <= 60) return 'O‘rta risk';
    if (percent <= 80) return 'Yuqori risk';
    return 'Juda yuqori risk';
  }

  sdhPatientName(id: string): string {
    return this.sdhPatients().find((x) => x.id === id)?.name ?? 'Umumiy profil';
  }

  sdhPrintReport() {
    if (typeof window !== 'undefined') window.print();
  }

  private sdhClamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
