import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  NeuroMotorInterpretation,
  NeuroMotorSession,
  NeuroMotorStorageService,
  NeuroMotorTestResult,
  NeuroMotorTestType
} from '../../services/neuromotor-storage';
import { HandTrackerService } from '../../services/hand-tracker';
import { NeuromotorInterpretationService } from '../../services/neuromotor-interpretation';

interface TestDef {
  id: NeuroMotorTestType;
  title: string;
  description: string;
  instruction: string;
  durationSec: number;
  icon: string;
  purpose: string;
  preparation: string[];
  steps: string[];
  duringFocus: string[];
  mistakes: string[];
  completionText: string;
  measures: string[];
  liveHints: string[];
}


const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

@Component({
  selector: 'app-neuromotor',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:justify-between gap-4">
          <div>
            <h2 class="text-3xl font-extrabold text-medical-text">NevroMotorika</h2>
            <p class="text-medical-text-muted mt-2 max-w-3xl">Nevrologik qo‘l motorikasi bo‘yicha skrining, monitoring va reabilitatsiya qo‘llab-quvvatlash moduli.</p>
            <div class="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
              <strong>Diqqat:</strong> Modul mustaqil tashxis bermaydi. Natijalar klinik baholashni to‘ldiruvchi funksional ko‘rsatkichlar.
            </div>
          </div>
          <div class="min-w-64 space-y-2">
            <button class="btn-primary w-full" (click)="startCamera()" [disabled]="cameraRunning()">
              <mat-icon>videocam</mat-icon><span>{{ cameraRunning() ? 'Kamera ishlayapti' : 'Start Camera' }}</span>
            </button>
            <button class="btn-secondary w-full" (click)="stopCamera()" [disabled]="!cameraRunning()">
              <mat-icon>videocam_off</mat-icon><span>Stop</span>
            </button>
            <div class="grid grid-cols-2 gap-2">
              <label class="text-xs text-medical-text-muted">Sensitivity
                <input type="range" min="0.6" max="1.8" step="0.1" [value]="sensitivity()" (input)="setSensitivity($event)" class="w-full">
              </label>
              <label class="text-xs text-medical-text-muted">Duration
                <select class="w-full input-field py-1" [value]="durationScale()" (change)="setDurationScale($event)">
                  <option value="0.8">Qisqa</option>
                  <option value="1">Standart</option>
                  <option value="1.3">Uzun</option>
                </select>
              </label>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span [class.text-emerald-600]="handDetected()" [class.text-amber-600]="!handDetected()" class="font-bold">
                {{ handDetected() ? 'Qo‘l aniqlandi' : 'Qo‘l yo‘qolgan / noaniq' }}
              </span>
              <button class="btn-secondary" (click)="toggleSkeleton()">Skeleton: {{ skeletonEnabled() ? 'ON' : 'OFF' }}</button>
            </div>
            @if (cameraError()) { <p class="text-xs text-red-600">{{ cameraError() }}</p> }
          </div>
        </div>
      </section>


      @if (pendingTest(); as introTest) {
        <section class="bg-white border border-indigo-200 rounded-3xl p-6 shadow-sm">
          <div class="flex items-start gap-3">
            <mat-icon class="text-indigo-600">{{ introTest.icon }}</mat-icon>
            <div class="flex-1">
              <h3 class="text-xl font-black text-medical-text">{{ introTest.title }}</h3>
              <p class="text-sm text-medical-text-muted mt-1">{{ introTest.description }}</p>
              <div class="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 class="font-bold">Bu test nimani baholaydi?</h4>
                  <p>{{ introTest.purpose }}</p>
                </div>
                <div>
                  <h4 class="font-bold">Testdan oldin tayyorgarlik</h4>
                  <ul class="list-disc pl-4">@for (p of introTest.preparation; track p) {<li>{{ p }}</li>}</ul>
                </div>
                <div>
                  <h4 class="font-bold">Qanday bajariladi?</h4>
                  <ul class="list-decimal pl-4">@for (step of introTest.steps; track step) {<li>{{ step }}</li>}</ul>
                </div>
                <div>
                  <h4 class="font-bold">Test vaqtida nimalarga e’tibor bering?</h4>
                  <ul class="list-disc pl-4">@for (f of introTest.duringFocus; track f) {<li>{{ f }}</li>}</ul>
                </div>
                <div>
                  <h4 class="font-bold">Qaysi xatolar testni buzishi mumkin?</h4>
                  <ul class="list-disc pl-4">@for (m of introTest.mistakes; track m) {<li>{{ m }}</li>}</ul>
                </div>
                <div>
                  <h4 class="font-bold">Test tugagach nima bo‘ladi?</h4>
                  <p>{{ introTest.completionText }}</p>
                  <p class="text-xs text-medical-text-muted mt-1">Davomiyligi: {{ scaledDuration(introTest.durationSec) }} soniya</p>
                </div>
              </div>
              <div class="mt-4 p-3 rounded-xl bg-slate-50 border">
                <p class="text-xs uppercase font-black text-medical-text-muted">Bu test nimalarni o‘lchaydi?</p>
                <p class="text-sm">{{ introTest.measures.join(', ') }}</p>
              </div>
              <div class="mt-4 flex gap-2">
                <button class="btn-primary" (click)="beginTestFromInstruction()">Tushundim, testni boshlash</button>
                <button class="btn-secondary" (click)="cancelInstruction()">Bekor qilish</button>
              </div>
            </div>
          </div>
        </section>
      }

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white border border-medical-border rounded-3xl p-4 shadow-sm">
          <div class="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[340px] md:min-h-[440px]">
            <video #video autoplay playsinline muted class="w-full h-full object-cover"></video>
            <canvas #overlay class="absolute inset-0 w-full h-full"></canvas>

            @if (countdown() > 0) {
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-7xl font-black">{{ countdown() }}</div>
            }
            @if (!cameraRunning()) {
              <div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white"><div class="text-center"><mat-icon class="text-5xl h-12 w-12">back_hand</mat-icon><p>Kamera ishga tushirilmagan</p></div></div>
            }
          </div>

          <div class="mt-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-medical-text">Holat: {{ statusText() }}</p>
            <p class="text-sm font-black text-indigo-600">Timer: {{ timeLeft() }}s</p>
          </div>
          <p class="text-sm text-indigo-700 font-semibold mt-1">{{ liveGuidance() }}</p>
          <div class="w-full bg-slate-100 rounded-full h-2 mt-2"><div class="h-2 rounded-full bg-indigo-500" [style.width.%]="progress()"></div></div>

          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 border"><p class="text-[10px] uppercase font-black text-medical-text-muted">Tezlik</p><p class="text-xl font-black">{{ liveSummary().harakat_tezligi }}</p></div>
            <div class="p-3 rounded-xl bg-slate-50 border"><p class="text-[10px] uppercase font-black text-medical-text-muted">Barqarorlik</p><p class="text-xl font-black">{{ liveSummary().harakat_barqarorligi }}</p></div>
            <div class="p-3 rounded-xl bg-slate-50 border"><p class="text-[10px] uppercase font-black text-medical-text-muted">Ritm</p><p class="text-xl font-black">{{ liveSummary().ritm_muntazamligi }}</p></div>
            <div class="p-3 rounded-xl bg-slate-50 border"><p class="text-[10px] uppercase font-black text-medical-text-muted">Koordinatsiya</p><p class="text-xl font-black">{{ liveSummary().koordinatsiya }}</p></div>
          </div>
        </div>

        <div class="bg-white border border-medical-border rounded-3xl p-5 shadow-sm">
          <h3 class="font-black mb-3">Joriy test</h3>
          @if (activeTest(); as t) {
            <p class="font-bold">{{ t.title }}</p>
            <p class="text-xs text-medical-text-muted mt-1">{{ t.instruction }}</p>
            <div class="grid grid-cols-2 gap-2 mt-3">
              <button class="btn-secondary" (click)="retryTest()">Qayta</button>
              <button class="btn-secondary" (click)="finishTestEarly()">Yakunlash</button>
            </div>
            <button class="btn-primary w-full mt-2" (click)="goNextTest()">Keyingi test</button>
          } @else {
            <p class="text-sm text-medical-text-muted">Testni tanlang. Avval camera ni yoqing.</p>
          }

          <div class="mt-4 text-xs text-medical-text-muted space-y-1">
            <p>• Timer va progress bar test holatini ko‘rsatadi.</p>
            <p>• Qo‘l yo‘qolsa tizim xato o‘rniga ogohlantirish beradi.</p>
            <p>• Natijalar monitoring va reabilitatsiya maqsadida ishlatiladi.</p>
          </div>
        </div>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black mb-4">Testlar</h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (test of tests; track test.id) {
            <div class="p-4 rounded-2xl border" [class.border-indigo-300]="activeTest()?.id===test.id" [class.bg-indigo-50]="activeTest()?.id===test.id">
              <p class="font-bold">{{ test.title }}</p>
              <p class="text-xs text-medical-text-muted">{{ test.description }}</p>
              <p class="text-xs text-indigo-600 mt-1">{{ scaledDuration(test.durationSec) }}s</p>
              <button class="btn-secondary mt-3" (click)="openInstruction(test)" [disabled]="!cameraRunning()">Boshlash</button>
            </div>
          }
        </div>
      </section>

      <section class="grid xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-black">Sessiya natijalari</h3>
            <div class="flex gap-2">
              <button class="btn-secondary" (click)="exportJson()" [disabled]="!testResults().length">JSON export</button>
              <button class="btn-primary" (click)="saveSession()" [disabled]="!testResults().length">Saqlash</button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-3 mb-4">

          <div class="mt-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40">
            <p class="text-xs uppercase font-black text-emerald-700">AI skrining tahlili</p>
            <p class="text-sm text-medical-text">Bu mustaqil tashxis emas. Xavf foizi: <strong>{{ aiRiskPercent() }}%</strong> · {{ aiLabel() }}</p>
            <p class="text-xs text-medical-text-muted mt-1">Natijalar faqat skrining va kuzatuv uchun mo‘ljallangan. Aniq tashxis uchun nevrolog ko‘rigi zarur.</p>
          </div>

            <div class="p-3 border rounded-xl bg-slate-50"><p class="text-xs">Speed</p><p class="font-black text-xl">{{ overall().speed }}</p></div>
            <div class="p-3 border rounded-xl bg-slate-50"><p class="text-xs">Stability</p><p class="font-black text-xl">{{ overall().stability }}</p></div>
            <div class="p-3 border rounded-xl bg-slate-50"><p class="text-xs">Rhythm</p><p class="font-black text-xl">{{ overall().rhythm }}</p></div>
          </div>

          @if (latestResult(); as lr) {
            <div class="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
              <h4 class="font-black text-medical-text">Qisqa xulosa</h4>
              <p class="text-sm">{{ lr.interpretation?.qisqa_xulosa || lr.note }}</p>
              <div class="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 class="font-bold">Topilgan motor belgilar</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.topilgan_motor_belgilar || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Nega tizim shunday xulosaga keldi?</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.nega_shunday_xulosa || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Ehtimoliy klinik yo‘nalishlar</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.ehtimoliy_klinik_yonalishlar || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Xavf darajasi</h5>
                  <p class="uppercase font-black">{{ lr.interpretation?.xavf_darajasi || 'past' }}</p>
                </div>
                <div>
                  <h5 class="font-bold">Holatni yaxshilash uchun tavsiyalar</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.holatni_yaxshilash_tavsiyalari || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Reabilitatsion mashqlar</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.reabilitatsion_mashqlar || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Qachon shifokorga murojaat qilish kerak?</h5>
                  <ul class="list-disc pl-4">@for (i of (lr.interpretation?.qachon_shifokorga_murojaat || []); track i) {<li>{{ i }}</li>}</ul>
                </div>
                <div>
                  <h5 class="font-bold">Keyingi kuzatuv tavsiyasi</h5>
                  <p>{{ lr.interpretation?.keyingi_kuzatuv_tavsiyasi }}</p>
                </div>
              </div>
            </div>
          }



          <div class="mt-5 grid xl:grid-cols-2 gap-4">
            <div class="p-4 border rounded-2xl bg-slate-50">
              <p class="text-xs font-black">Motor domain radar (bar uslub)</p>
              @for (row of neuromotorRadarRows(); track row.label) {
                <div class="mt-2">
                  <div class="flex justify-between text-xs"><span>{{ row.label }}</span><span>{{ row.value }}</span></div>
                  <div class="h-2 rounded-full bg-slate-200"><div class="h-2 rounded-full bg-indigo-600" [style.width.%]="row.value"></div></div>
                </div>
              }
            </div>
            <div class="p-4 border rounded-2xl bg-slate-50">
              <p class="text-xs font-black">Normaga yaqinlik gauge</p>
              <div class="mt-4 h-16 rounded-t-full" [style.background]="semiGauge(overallNormProximity())"></div>
              <p class="text-center text-sm font-black mt-1">{{ overallNormProximity() }}%</p>
              <p class="text-xs text-medical-text-muted mt-2">Asimmetriya: {{ asymmetryScore() }} · Silliqlik: {{ movementSmoothness() }}</p>
            </div>
            <div class="p-4 border rounded-2xl bg-slate-50">
              <p class="text-xs font-black">Testlar bo‘yicha bar chart</p>
              @for (r of testBars(); track r.label) {
                <div class="mt-2">
                  <div class="flex justify-between text-xs"><span>{{ r.label }}</span><span>{{ r.value }}</span></div>
                  <div class="h-2 rounded-full bg-slate-200"><div class="h-2 rounded-full bg-emerald-500" [style.width.%]="r.value"></div></div>
                </div>
              }
            </div>
            <div class="p-4 border rounded-2xl bg-slate-50">
              <p class="text-xs font-black">Irregularity heatmap</p>
              <div class="grid grid-cols-7 gap-1 mt-2">
                @for (cell of irregularityHeatmap(); track $index) {
                  <div class="h-6 rounded" [style.background]="heatColor(cell)" [title]="cell"></div>
                }
              </div>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="text-xs text-medical-text-muted uppercase"><th class="py-2">Test</th><th>Tezlik</th><th>Ritm</th><th>Aniqlik</th><th>Barqarorlik</th></tr></thead>
              <tbody>
                @for (r of testResults(); track r.test) {
                  <tr class="border-t"><td class="py-2 font-semibold">{{ testName(r.test) }}</td><td>{{ r.summary.harakat_tezligi }}</td><td>{{ r.summary.ritm_muntazamligi }}</td><td>{{ r.summary.aniqlik }}</td><td>{{ r.summary.harakat_barqarorligi }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
          <h3 class="text-xl font-black mb-4">Oldingi sessiyalar</h3>
          <div class="h-40 bg-slate-50 rounded-xl border p-2 mb-4">
            <svg viewBox="0 0 420 130" class="w-full h-full">
              <polyline fill="none" stroke="#6366f1" stroke-width="3" [attr.points]="trend('stability')"></polyline>
              <polyline fill="none" stroke="#14b8a6" stroke-width="2" [attr.points]="trend('speed')"></polyline>
              <polyline fill="none" stroke="#f59e0b" stroke-width="2" [attr.points]="trend('rhythm')"></polyline>
            </svg>
          </div>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            @for (s of sessions(); track s.id) {
              <div class="p-3 rounded-xl border bg-slate-50">
                <p class="text-xs font-black">{{ s.createdAt | date:'short' }}</p>
                <p class="text-xs text-medical-text-muted">Speed {{ s.overall.speed }} · Stability {{ s.overall.stability }} · Rhythm {{ s.overall.rhythm || 0 }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeuroMotorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') canvasRef?: ElementRef<HTMLCanvasElement>;

  private storage = inject(NeuroMotorStorageService);
  private handTracker = inject(HandTrackerService);
  private interpretationService = inject(NeuromotorInterpretationService);
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private prevFrame: Uint8ClampedArray | null = null;
  private frameStats: { ts: number; motion: number; cx: number; cy: number }[] = [];
  private smoothed = { x: 0, y: 0 };
  private eventCooldownUntil = 0;
  private eventCounter = 0;
  private currentHits = 0;
  private currentMisses = 0;
  private testTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private testStartedAtIso = new Date().toISOString();
  private lastFrameTs = 0;

  cameraRunning = signal(false);
  cameraError = signal<string | null>(null);
  handDetected = signal(false);
  statusText = signal('Kutilmoqda');
  skeletonEnabled = signal(true);
  sensitivity = signal(1);
  durationScale = signal(1);

  activeTest = signal<TestDef | null>(null);
  pendingTest = signal<TestDef | null>(null);
  liveGuidance = signal("Qo'lingizni kamera markazida ushlang.");
  timeLeft = signal(0);
  countdown = signal(0);
  progress = signal(0);

  sessions = signal<NeuroMotorSession[]>([]);
  testResults = signal<NeuroMotorTestResult[]>([]);
  latestResult = signal<NeuroMotorTestResult | null>(null);
  aiRiskPercent = signal<number>(0);
  aiSource = signal<'local' | 'ai'>('local');
  lastCompletedTest = signal<NeuroMotorTestType | null>(null);
  liveSummary = signal({ harakat_barqarorligi: 0, harakat_tezligi: 0, koordinatsiya: 0, aniqlik: 0, ritm_muntazamligi: 0, charchashga_moyillik: 0 });

  tests: TestDef[] = [
    {
      id: 'rest_tremor',
      title: 'Rest Tremor Observation',
      description: 'Qo‘lni tinch holatda ushlang.',
      instruction: 'Kaftni kadr markazida tuting, 3 soniya tinch holatni saqlang.',
      durationSec: 20,
      icon: 'back_hand',
      purpose: 'Qo‘lning tinch holatdagi barqarorligi va mayda tebranishlar (mikro-harakat)ni kuzatadi.',
      preparation: ['Qo‘lni qulay holatga keltiring.', 'Qo‘l stolga tayangan yoki erkin tinch holatda bo‘lishi mumkin.', 'Yorug‘lik yetarli bo‘lsin va qo‘l to‘liq ko‘rinsin.'],
      steps: ['Qo‘lingizni kamera oldida tinch holatda ushlab turing.', 'Barmoqlarni ortiqcha qimirlatmang.', 'Tizim countdown tugagach avtomatik yozishni boshlaydi.'],
      duringFocus: ['Qo‘lni kamera markazida saqlang.', 'Keraksiz harakat qilmang.'],
      mistakes: ['Qo‘l kameradan chiqib ketishi.', 'Barmoqlarni ataylab qimirlatish.', 'Juda yaqin/juda uzoq masofa.'],
      completionText: 'Tizim barqarorlik, drift va mayda tebranish proxy ko‘rsatkichlarini chiqaradi.',
      measures: ['stability', 'drift', 'micro-movement'],
      liveHints: ['Qo‘lingizni kamera markazida ushlang', 'Barmoqlarni ortiqcha qimirlatmang', 'Maqsad — tinch holatdagi mayda tebranishlarni kuzatish']
    },
    {
      id: 'finger_tapping',
      title: 'Finger Tapping Test',
      description: 'Barmoq urish ritmini baholash.',
      instruction: 'Bosh barmoq va ko‘rsatkich barmoqni bir tekis ritmda tekkizing.',
      durationSec: 20,
      icon: 'touch_app',
      purpose: 'Tezlik, ritm muntazamligi va charchashga moyillikni baholaydi.',
      preparation: ['Qo‘l to‘liq ko‘rinadigan masofani tanlang.', 'Bosh barmoq va ko‘rsatkich barmoq aniq ko‘rinsin.'],
      steps: ['Bosh barmoq bilan ko‘rsatkich barmog‘ini bir-biriga tekkizing.', 'Ajrating va yana takrorlang.', 'Harakatni ketma-ket va bir xil tezlikda davom ettiring.'],
      duringFocus: ['Harakatni bir maromda bajaring.', 'Katta qo‘l silkitish shart emas.'],
      mistakes: ['Ritmni tez-tez o‘zgartirish.', 'Qo‘lni kadrdan chiqarish.', 'Juda tez yoki juda sust harakat.'],
      completionText: 'Tizim tap soni, ritm va tezlik bo‘yicha neytral skrining xulosasini beradi.',
      measures: ['speed', 'rhythm regularity', 'fatigue trend'],
      liveHints: ['Endi bosh barmoqni ko‘rsatkich barmog‘iga tekkizing', 'Harakatni bir maromda davom ettiring', 'Harakat juda tez bo‘lsa maromni barqaror qiling']
    },
    {
      id: 'open_close',
      title: 'Open-Close Hand Test',
      description: 'Kaftni ochib-yoping.',
      instruction: 'Kaftni to‘liq ochib, so‘ng musht qiling.',
      durationSec: 20,
      icon: 'pan_tool',
      purpose: 'Qo‘l harakati tezligi, silliqligi va amplitudasini baholaydi.',
      preparation: ['Kaft kamera qarshisida bo‘lsin.', 'Bilakni qulay ushlang.'],
      steps: ['Kaftni to‘liq oching.', 'Keyin qo‘lingizni musht qiling.', 'Shu siklni test tugaguncha takrorlang.'],
      duringFocus: ['Har safar kaftni to‘liq oching.', 'Mushtni aniq yoping.'],
      mistakes: ['Yarim ochish/yopish.', 'Ritmni yo‘qotish.', 'Qo‘lning yarmi kadrdan tashqarida qolishi.'],
      completionText: 'Sikl soni, silliqlik va amplituda barqarorligi ko‘rsatkichlari chiqariladi.',
      measures: ['speed', 'smoothness', 'amplitude consistency'],
      liveHints: ['Mushtni to‘liq yoping va qayta oching', 'Harakatni bir maromda davom ettiring', 'Qo‘l yetarlicha ko‘rinmayapti']
    },
    {
      id: 'pinch_precision',
      title: 'Pinch Precision Test',
      description: 'Pinch aniqligi va ushlab turish.',
      instruction: 'Bosh barmoq va ko‘rsatkich barmoq uchini aniq birlashtiring.',
      durationSec: 18,
      icon: 'gesture',
      purpose: 'Nozik motorika, pinch aniqligi va ushlab turish barqarorligini baholaydi.',
      preparation: ['Barmoq uchlari aniq ko‘rinadigan masofani tanlang.', 'Yorug‘likni yaxshilang.'],
      steps: ['Bosh barmoq va ko‘rsatkich barmoq uchini birlashtiring.', 'Qisqa ushlab turing.', 'Ajrating va qayta takrorlang.'],
      duringFocus: ['Shoshmasdan aniq bajaring.', 'Harakatni nazorat bilan bajaring.'],
      mistakes: ['Pinch nuqtasi noaniq bo‘lishi.', 'Qo‘l silkinishi.', 'Kadrdan chiqib ketish.'],
      completionText: 'Pinch aniqligi va barqarorligi bo‘yicha ko‘rsatkichlar taqdim etiladi.',
      measures: ['fine motor control', 'accuracy', 'stability'],
      liveHints: ['Pinchni aniq bajaring', 'Pinch yetarlicha aniq aniqlanmadi', 'Qo‘l to‘liq ko‘rinmayapti']
    },
    {
      id: 'finger_sequence',
      title: 'Finger Sequencing Test',
      description: 'Ketma-ketlikni bajarish.',
      instruction: '1→2→3 barmoq ketma-ketligini takrorlang.',
      durationSec: 20,
      icon: 'filter_3',
      purpose: 'Ketma-ket motor rejalash, koordinatsiya va reaktsiya izchilligini baholaydi.',
      preparation: ['Kamera oldida qo‘lni to‘g‘ri joylashtiring.', 'Barmoqlar soni aniq ko‘rinsin.'],
      steps: ['Avval 1 barmoq ko‘rsating.', 'So‘ng 2 barmoq.', 'Keyin 3 barmoq.', 'Ketma-ketlikni buzmasdan takrorlang.'],
      duringFocus: ['Har holatni 0.5–1 soniya ushlab ko‘rsating.', 'Ketma-ketlikni chalkashtirmang.'],
      mistakes: ['Ketma-ketlikni buzish.', 'Juda tez almashtirish.', 'Kamera tashqarisida ko‘rsatish.'],
      completionText: 'To‘g‘ri ketma-ketlik soni va xatolar bo‘yicha neytral tahlil beriladi.',
      measures: ['coordination', 'sequencing', 'reaction consistency'],
      liveHints: ['Barmoqlar sonini ketma-ket to‘g‘ri ko‘rsating', 'Ketma-ketlik buzildi. Qaytadan 1 barmoqdan boshlang', 'Har bir holat aniq ko‘rinsin']
    },
    {
      id: 'target_touch',
      title: 'Target Touch Test',
      description: 'Nishonlarga yetib borish aniqligi.',
      instruction: 'Ekrandagi nishonga ko‘rsatkich barmoq bilan yetib boring.',
      durationSec: 22,
      icon: 'my_location',
      purpose: 'Aniqlik, yo‘nalish nazorati va harakat boshqaruvini baholaydi.',
      preparation: ['Nishon va qo‘l bir kadrda ko‘rinsin.', 'Qo‘lni juda tez silkitmang.'],
      steps: ['Yashil nishon paydo bo‘lganda unga yaqinlashing.', 'Har bir nishonni iloji boricha aniq uring.', 'Keyingi nishonga nazorat bilan o‘ting.'],
      duringFocus: ['Keskin siljish o‘rniga nazoratli harakat qiling.', 'Harakat trayektoriyasini barqaror saqlang.'],
      mistakes: ['Nishondan ortiqcha oshib ketish.', 'Juda sust javob.', 'Nishon paytida qo‘lning yo‘qolishi.'],
      completionText: 'Hit/miss, aniqlik va harakat nazorati ko‘rsatkichlari ko‘rsatiladi.',
      measures: ['accuracy', 'movement control', 'smoothness'],
      liveHints: ['Nishonga yo‘naling', 'Harakat noto‘g‘ri. Ekrandagi namunaga amal qiling', 'Kamera bilan oraliq masofani biroz moslang']
    },
    {
      id: 'hold_still',
      title: 'Hold-Still Stability Test',
      description: 'Stabil ushlab turish testi.',
      instruction: 'Qo‘lni bir holatda imkon qadar qimirlatmasdan tuting.',
      durationSec: 16,
      icon: 'pan_tool_alt',
      purpose: 'Barqarorlik, drift va mikro-harakat darajasini baholaydi.',
      preparation: ['Qo‘lni markazda joylashtiring.', 'Qulay holatda muzlatib ushlashga tayyor turing.'],
      steps: ['Ko‘rsatilgan holatni qabul qiling.', '8–10 soniya qimirlatmasdan ushlang.', 'Qo‘l kamera markazida qolsin.'],
      duringFocus: ['Iloji boricha harakatsiz turing.', 'Nafasni tabiiy saqlang.'],
      mistakes: ['Qo‘lni pastga tushirib yuborish.', 'Barmoqlarni keraksiz qimirlatish.', 'Kadrdan chiqib ketish.'],
      completionText: 'Stability index va drift bo‘yicha neytral skrining ko‘rsatiladi.',
      measures: ['stability', 'drift', 'micro-movement'],
      liveHints: ['Qo‘lingizni kamera markazida ushlang', 'Iloji boricha qimirlatmang', 'Test muvaffaqiyatli yakunlandi']
    }
  ];

  async ngAfterViewInit() {
    this.sessions.set(await this.storage.listSessions());
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setSensitivity(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.sensitivity.set(value);
  }

  setDurationScale(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.durationScale.set(value);
  }

  scaledDuration(base: number) {
    return Math.round(base * this.durationScale());
  }

  toggleSkeleton() {
    this.skeletonEnabled.update(v => !v);
  }

  async startCamera() {
    this.cameraError.set(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set("Brauzeringizda kamera API qo'llab-quvvatlanmaydi.");
      this.statusText.set('Kamera mavjud emas');
      return;
    }
    try {
      const trackerReady = await this.handTracker.initialize();
      if (!trackerReady) {
        this.cameraError.set(this.handTracker.error() || "Qo'l trekeri ishga tushmadi.");
      }
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      const video = this.videoRef?.nativeElement;
      if (!video) return;
      video.srcObject = this.stream;
      await video.play();
      this.cameraRunning.set(true);
      this.statusText.set('Kamera tayyor');
      this.runLoop();
    } catch {
      this.cameraError.set('Kameraga ruxsat berilmadi yoki qurilmada kamera topilmadi.');
      this.statusText.set('Kamera xatosi');
    }
  }

  stopCamera() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.testTimer) clearInterval(this.testTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.testTimer = null;
    this.countdownTimer = null;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.cameraRunning.set(false);
    this.activeTest.set(null);
    this.statusText.set('To‘xtatildi');
    this.handTracker.dispose();
  }


  openInstruction(test: TestDef) {
    this.pendingTest.set(test);
    this.liveGuidance.set(test.instruction);
  }

  cancelInstruction() {
    this.pendingTest.set(null);
  }

  beginTestFromInstruction() {
    const test = this.pendingTest();
    if (!test) return;
    this.pendingTest.set(null);
    this.startTest(test);
  }

  startTest(test: TestDef) {
    this.activeTest.set(test);
    this.latestResult.set(null);
    this.frameStats = [];
    this.currentHits = 0;
    this.currentMisses = 0;
    this.eventCounter = 0;
    this.timeLeft.set(this.scaledDuration(test.durationSec));
    this.progress.set(0);
    this.runCountdownAndStart();
  }

  retryTest() {
    const currentId = this.activeTest()?.id || this.lastCompletedTest();
    if (!currentId) return;
    const test = this.tests.find(t => t.id === currentId);
    if (test) this.startTest(test);
  }

  goNextTest() {
    const currentId = this.activeTest()?.id || this.lastCompletedTest();
    if (!currentId) return;
    const idx = this.tests.findIndex(t => t.id === currentId);
    const next = this.tests[(idx + 1) % this.tests.length];
    this.startTest(next);
  }

  finishTestEarly() {
    this.finishCurrentTest();
  }

  testName(test: NeuroMotorTestType) {
    return this.tests.find(t => t.id === test)?.title || test;
  }

  overall() {
    const all = this.testResults();
    if (!all.length) return { speed: 0, accuracy: 0, stability: 0, coordination: 0, fatigue: 0, rhythm: 0 };
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return {
      speed: avg(all.map(a => a.summary.harakat_tezligi)),
      accuracy: avg(all.map(a => a.summary.aniqlik)),
      stability: avg(all.map(a => a.summary.harakat_barqarorligi)),
      coordination: avg(all.map(a => a.summary.koordinatsiya)),
      fatigue: avg(all.map(a => a.summary.charchashga_moyillik)),
      rhythm: avg(all.map(a => a.summary.ritm_muntazamligi))
    };
  }


  private async refreshAiInterpretation() {
    const tests = this.testResults();
    if (!tests.length) return;

    const pick = (id: NeuroMotorTestType, key: string, fallback = 50) => {
      const t = tests.find(x => x.test === id);
      const raw = t?.metrics?.[key];
      return typeof raw === 'number' ? raw : fallback;
    };

    const metrics = {
      tappingSpeed: pick('finger_tapping', 'taps_per_10_sec', this.overall().speed),
      tappingRhythmVariability: 100 - (tests.find(x => x.test === 'finger_tapping')?.summary.ritm_muntazamligi ?? 50),
      openCloseSpeed: tests.find(x => x.test === 'open_close')?.summary.harakat_tezligi ?? this.overall().speed,
      openCloseAmplitudeConsistency: Number(pick('open_close', 'amplitude_consistency', 60)),
      pinchAccuracy: Number(pick('pinch_precision', 'targeting_accuracy', 60)),
      pinchHoldStability: Number(pick('pinch_precision', 'hold_stability', 60)),
      sequencingErrors: Number(pick('finger_sequence', 'sequencing_errors', 2)),
      holdStillDrift: Number(pick('hold_still', 'drift_score', 50)),
      tremorAmplitudeProxy: Number(pick('rest_tremor', 'movement_amplitude_proxy', 1)),
      fatigueTrend: tests.reduce((a, b) => a + b.summary.charchashga_moyillik, 0) / tests.length,
      overallMotorStability: this.overall().stability,
      overallCoordination: this.overall().coordination,
      overallFineMotorControl: Math.round((this.overall().accuracy + this.overall().coordination) / 2)
    };

    const out = await this.interpretationService.interpret(tests, metrics);
    this.aiRiskPercent.set(out.riskPercent);
    this.aiSource.set(out.source);

    const latest = this.latestResult();
    if (latest) {
      this.latestResult.set({ ...latest, interpretation: out.interpretation });
    }
  }


  aiLabel() {
    return this.aiSource() === 'ai' ? 'Kengaytirilgan AI tahlili' : 'Lokal tahlil';
  }

  neuromotorRadarRows() {
    const o = this.overall();
    return [
      { label: 'Barqarorlik', value: o.stability },
      { label: 'Koordinatsiya', value: o.coordination },
      { label: 'Aniqlik', value: o.accuracy },
      { label: 'Ritm', value: o.rhythm },
      { label: 'Fine motor', value: Math.round((o.accuracy + o.coordination) / 2) }
    ];
  }

  overallNormProximity() {
    const o = this.overall();
    return Math.max(1, Math.min(99, Math.round((o.stability * 0.35) + (o.coordination * 0.35) + (o.accuracy * 0.3))));
  }

  asymmetryScore() {
    const left = this.testResults().filter((x) => x.hand === 'left');
    const right = this.testResults().filter((x) => x.hand === 'right');
    if (!left.length || !right.length) return 0;
    const l = left.reduce((s, r) => s + r.summary.aniqlik, 0) / left.length;
    const r = right.reduce((s, r2) => s + r2.summary.aniqlik, 0) / right.length;
    return Math.round(Math.abs(l - r));
  }

  movementSmoothness() {
    const tests = this.testResults();
    if (!tests.length) return 50;
    const variance = tests.reduce((s, r) => s + Math.abs(r.summary.ritm_muntazamligi - r.summary.harakat_barqarorligi), 0) / tests.length;
    return Math.max(0, Math.min(100, Math.round(100 - variance)));
  }

  semiGauge(percent: number) {
    return `conic-gradient(from 180deg, #22c55e ${percent * 1.8}deg, #e5e7eb ${percent * 1.8}deg 180deg)`;
  }

  testBars() {
    return this.testResults().map((r) => ({ label: this.testName(r.test), value: Math.round((r.summary.harakat_tezligi + r.summary.harakat_barqarorligi + r.summary.aniqlik) / 3) }));
  }

  irregularityHeatmap() {
    return this.testResults().map((r) => Math.max(0, Math.min(100, 100 - r.summary.ritm_muntazamligi)));
  }

  heatColor(value: number) {
    const red = Math.min(255, Math.round(80 + value * 1.7));
    const green = Math.min(255, Math.round(220 - value * 1.6));
    return `rgb(${red}, ${green}, 120)`;
  }

  trend(metric: 'stability' | 'speed' | 'rhythm') {
    const list = this.sessions().slice(0, 10).reverse();
    if (!list.length) return '';
    const step = 420 / Math.max(1, list.length - 1);
    return list.map((s, i) => {
      const value = metric === 'stability' ? s.overall.stability : metric === 'speed' ? s.overall.speed : (s.overall.rhythm || 0);
      const y = 120 - value;
      return `${Math.round(step * i)},${Math.round(Math.max(8, y))}`;
    }).join(' ');
  }

  async saveSession() {
    if (typeof window === 'undefined') return;
    if (!this.testResults().length) return;
    const session: NeuroMotorSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      hand: 'unknown',
      tests: this.testResults(),
      overall: this.overall(),
      version: 2
    };
    const { error } = await this.storage.saveSession(session);
    if (error) return alert(error.message);
    this.sessions.set(await this.storage.listSessions());
    alert('Sessiya saqlandi.');
  }

  exportJson() {
    if (typeof window === 'undefined') return;
    const payload = { createdAt: new Date().toISOString(), tests: this.testResults(), overall: this.overall() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuromotor-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private runCountdownAndStart() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdown.set(3);
    this.statusText.set('Tayyorlaning');

    this.countdownTimer = setInterval(() => {
      const c = this.countdown() - 1;
      this.countdown.set(c);
      if (c <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.beginActiveTimer();
      }
    }, 1000);
  }

  private beginActiveTimer() {
    this.statusText.set('Test davom etmoqda');
    this.testStartedAtIso = new Date().toISOString();
    if (this.testTimer) clearInterval(this.testTimer);

    const total = this.timeLeft();
    this.testTimer = setInterval(() => {
      const left = this.timeLeft() - 1;
      this.timeLeft.set(left);
      this.progress.set(Math.min(100, ((total - left) / total) * 100));
      if (left <= 0) this.finishCurrentTest();
    }, 1000);
  }

  private runLoop = () => {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || !this.cameraRunning()) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(video, 0, 0, w, h);

    const nowTs = performance.now();
    this.lastFrameTs = nowTs;

    const handResult = this.handTracker.detect(video, nowTs);
    const landmarks = handResult?.landmarks?.[0];

    let motion = 0;
    let rawX = w / 2;
    let rawY = h / 2;

    if (landmarks?.length) {
      this.handDetected.set(true);
      const center = landmarks.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      rawX = (center.x / landmarks.length) * w;
      rawY = (center.y / landmarks.length) * h;

      if (this.prevFrame) {
        const px = Math.max(0, Math.min(w - 1, Math.round(rawX)));
        const py = Math.max(0, Math.min(h - 1, Math.round(rawY)));
        const idx = (py * w + px) * 4;
        motion = Math.abs(this.prevFrame[idx] - 120) * 10;
      }
    } else {
      this.handDetected.set(false);
      const image = ctx.getImageData(0, 0, w, h);
      const data = image.data;
      let mx = 0;
      let my = 0;
      let changed = 0;
      const step = 24;

      if (this.prevFrame) {
        for (let i = 0; i < data.length; i += 4 * step) {
          const diff = Math.abs(data[i] - this.prevFrame[i]) + Math.abs(data[i + 1] - this.prevFrame[i + 1]) + Math.abs(data[i + 2] - this.prevFrame[i + 2]);
          if (diff > 60 * this.sensitivity()) {
            motion += diff;
            const px = ((i / 4) % w);
            const py = Math.floor((i / 4) / w);
            mx += px;
            my += py;
            changed++;
          }
        }
      }
      if (changed > 8) {
        rawX = mx / changed;
        rawY = my / changed;
      }
      this.prevFrame = new Uint8ClampedArray(data);
    }
    this.smoothed.x = this.smoothed.x ? this.smoothed.x * 0.75 + rawX * 0.25 : rawX;
    this.smoothed.y = this.smoothed.y ? this.smoothed.y * 0.75 + rawY * 0.25 : rawY;

    if (this.activeTest() && this.countdown() === 0) {
      this.frameStats.push({ ts: performance.now(), motion, cx: this.smoothed.x, cy: this.smoothed.y });
      this.detectStableEvents(motion, this.smoothed.x, this.smoothed.y, w, h);
      this.updateLiveGuidance();
    }

    this.updateLiveSummary();

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    if (this.skeletonEnabled()) {
      const detected = this.handDetected();
      ctx.fillStyle = detected ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(this.smoothed.x, this.smoothed.y, detected ? 9 : 6, 0, Math.PI * 2);
      ctx.fill();

      if (handResult?.landmarks?.length) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        for (const hand of handResult.landmarks) {
          for (const [a, b] of HAND_CONNECTIONS) {
            const p1 = hand[a];
            const p2 = hand[b];
            if (!p1 || !p2) continue;
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }

          ctx.fillStyle = '#f59e0b';
          for (const p of hand) {
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    if (this.activeTest()?.id === 'target_touch') {
      const t = this.targetPoint(w, h);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    this.rafId = requestAnimationFrame(this.runLoop);
  };


  private updateLiveGuidance() {
    const test = this.activeTest();
    if (!test) return;

    if (!this.handDetected()) {
      this.liveGuidance.set('Qo‘l topilmadi. Qo‘lingizni kamera ichiga olib kiring. Qo‘l to‘liq ko‘rinmayapti.');
      return;
    }

    const speed = this.liveSummary().harakat_tezligi;
    if (speed > 80) {
      this.liveGuidance.set('Harakat juda tez. Bir maromga keltiring.');
      return;
    }
    if (speed < 20) {
      this.liveGuidance.set('Harakat juda sust. Davom eting.');
      return;
    }

    const index = Math.min(test.liveHints.length - 1, Math.floor((100 - this.timeLeft()) / 4));
    this.liveGuidance.set(test.liveHints[Math.max(0, index)] || test.instruction);
  }

  private detectStableEvents(motion: number, x: number, y: number, w: number, h: number) {
    const now = performance.now();
    if (now < this.eventCooldownUntil) return;

    const threshold = 900 * this.sensitivity();
    if (motion > threshold) {
      this.eventCounter += 1;
    } else {
      this.eventCounter = Math.max(0, this.eventCounter - 1);
    }

    if (this.eventCounter >= 3) {
      this.eventCounter = 0;
      this.eventCooldownUntil = now + 500;

      if (this.activeTest()?.id === 'target_touch') {
        const t = this.targetPoint(w, h);
        const dist = Math.hypot(x - t.x, y - t.y);
        if (dist < 30) this.currentHits += 1;
        else this.currentMisses += 1;
      }
    }
  }

  private updateLiveSummary() {
    const sample = this.frameStats.slice(-80);
    if (!sample.length) return;

    const motionVals = sample.map(s => s.motion);
    const avg = motionVals.reduce((a, b) => a + b, 0) / motionVals.length;
    const variance = motionVals.reduce((a, b) => a + (b - avg) ** 2, 0) / motionVals.length;

    const speed = this.normalize(avg / 1100);
    const stability = this.normalize(100 - Math.sqrt(variance) / 35);
    const rhythm = this.normalize(100 - Math.min(85, this.eventCounter * 8 + Math.sqrt(variance) / 25));

    this.liveSummary.set({
      harakat_barqarorligi: stability,
      harakat_tezligi: speed,
      koordinatsiya: this.normalize((stability + speed) / 2),
      aniqlik: this.normalize(85 - Math.min(70, Math.sqrt(variance) / 28)),
      ritm_muntazamligi: rhythm,
      charchashga_moyillik: this.normalize(100 - speed)
    });
  }

  private finishCurrentTest() {
    if (this.testTimer) clearInterval(this.testTimer);
    this.testTimer = null;
    this.countdown.set(0);

    const test = this.activeTest();
    if (!test) return;

    const result = this.computeResult(test.id, this.frameStats.slice());
    this.testResults.update(prev => [...prev.filter(x => x.test !== test.id), result]);
    this.latestResult.set(result);
    this.lastCompletedTest.set(test.id);
    this.statusText.set('Test yakunlandi');
    this.liveGuidance.set(test.completionText);
    this.progress.set(100);

    this.refreshAiInterpretation().catch(() => undefined);
    this.activeTest.set(null);
    this.timeLeft.set(0);
    this.frameStats = [];
  }

  private computeResult(test: NeuroMotorTestType, stats: { ts: number; motion: number; cx: number; cy: number }[]): NeuroMotorTestResult {
    const movements = stats.map(s => s.motion);
    const avgMotion = movements.length ? movements.reduce((a, b) => a + b, 0) / movements.length : 0;
    const duration = Math.max(1, ((stats.at(-1)?.ts || 0) - (stats.at(0)?.ts || 0)) / 1000);

    const path = stats.slice(1).reduce((acc, s, i) => acc + Math.hypot(s.cx - stats[i].cx, s.cy - stats[i].cy), 0);
    const tapEvents = this.countThresholdCrossings(movements, avgMotion * 1.35, 8);

    const speed = this.normalize((path / duration) / 12);
    const accuracy = this.normalize(100 - Math.min(90, Math.abs(tapEvents - duration * 1.6) * 3));
    const stability = this.normalize(100 - Math.min(95, avgMotion / 160));
    const coordination = this.normalize((speed + accuracy + stability) / 3);
    const rhythm = this.normalize(100 - Math.min(80, Math.abs(tapEvents - duration * 1.7) * 5));
    const fatigue = this.normalize(100 - speed + Math.min(20, duration));

    const metrics: Record<string, number | string> = {
      duration_sec: Number(duration.toFixed(1)),
      event_count: tapEvents,
      drift: Number((path / Math.max(1, stats.length)).toFixed(2)),
      movement_amplitude_proxy: Number((avgMotion / 95).toFixed(2))
    };

    if (test === 'target_touch') {
      metrics['hits'] = this.currentHits;
      metrics['misses'] = this.currentMisses;
      metrics['accuracy_percent'] = this.normalize((this.currentHits / Math.max(1, this.currentHits + this.currentMisses)) * 100);
    }

    const summary = {
      harakat_barqarorligi: stability,
      harakat_tezligi: speed,
      koordinatsiya: coordination,
      aniqlik: accuracy,
      ritm_muntazamligi: rhythm,
      charchashga_moyillik: fatigue
    };

    const interpretation = this.buildInterpretation(test, summary, metrics);

    return {
      test,
      startedAt: this.testStartedAtIso,
      completedAt: new Date().toISOString(),
      hand: 'unknown',
      metrics,
      summary,
      note: 'Skrining bo‘yicha mos keluvchi motor belgilar. Mustaqil tashxis sifatida qabul qilinmaydi.',
      interpretation
    };
  }

  private buildInterpretation(test: NeuroMotorTestType, summary: NeuroMotorTestResult['summary'], metrics: Record<string, number | string>): NeuroMotorInterpretation {
    const flags: string[] = [];
    if (summary.ritm_muntazamligi < 45) flags.push('Ritm muntazamligi pasaygan.');
    if (summary.harakat_barqarorligi < 45) flags.push('Harakat barqarorligi past.');
    if (summary.aniqlik < 45) flags.push('Aniqlik ko‘rsatkichi pasaygan.');
    if (summary.charchashga_moyillik > 65) flags.push('Charchashga moyillik yuqori bo‘lishi mumkin.');

    const risk: 'past' | 'orta' | 'yuqori' = summary.harakat_barqarorligi < 40 || summary.aniqlik < 40 ? 'yuqori' : summary.harakat_barqarorligi < 60 ? 'orta' : 'past';

    return {
      qisqa_xulosa: `Skrining bo‘yicha ${this.testName(test)} testida funksional motor ko‘rsatkichlar baholandi. Yakuniy xulosa: ${risk} xavf darajasi.` ,
      topilgan_motor_belgilar: flags.length ? flags : ['Ko‘rsatkichlar nisbatan barqaror diapazonda.'],
      nega_shunday_xulosa: [
        `Tezlik: ${summary.harakat_tezligi}`,
        `Ritm: ${summary.ritm_muntazamligi}`,
        `Stability: ${summary.harakat_barqarorligi}`,
        `Accuracy: ${summary.aniqlik}`,
        `Fatigue proxy: ${summary.charchashga_moyillik}`,
        `Drift: ${metrics['drift'] ?? 'N/A'}`
      ],
      ehtimoliy_klinik_yonalishlar: [
        'Funksional motor monitoringni davom ettirish',
        'Qo‘shimcha nevrologik baholash ehtimoli bo‘lishi mumkin',
        'Reabilitatsion mashqlar bilan dinamik kuzatuv'
      ],
      xavf_darajasi: risk,
      holatni_yaxshilash_tavsiyalari: [
        'Uyqu gigiyenasini yaxshilang va stressni kamaytiring.',
        'Har kuni qisqa qo‘l motorika mashqlarini muntazam bajaring.',
        'Bir xil sharoitda haftalik qayta test o‘tkazing.'
      ],
      reabilitatsion_mashqlar: [
        'Barmoq-uch mashqlari: 3 set, har set 60 soniya.',
        'Open-close kaft mashqi: 2 daqiqa, ritmni saqlab.',
        'Pinch hold: 10-15 takror, har biri 2 soniya.'
      ],
      qachon_shifokorga_murojaat: [
        'Belgilar 2-3 hafta davomida saqlansa yoki yomonlashsa.',
        'To‘satdan kuchsizlik, nutq buzilishi, yuz assimetriyasi paydo bo‘lsa zudlik bilan murojaat qiling.',
        'Kunlik faoliyatga sezilarli ta’sir qila boshlasa.'
      ],
      keyingi_kuzatuv_tavsiyasi: '7-14 kun ichida qayta skrining o‘tkazib, trendni solishtiring.'
    };
  }

  private countThresholdCrossings(values: number[], threshold: number, minGapFrames: number) {
    let count = 0;
    let last = -minGapFrames;
    for (let i = 1; i < values.length; i++) {
      if (values[i] >= threshold && values[i - 1] < threshold && i - last >= minGapFrames) {
        count += 1;
        last = i;
      }
    }
    return count;
  }

  private targetPoint(w: number, h: number) {
    const t = Math.floor((performance.now() / 1800) % 6);
    const p = [
      { x: w * 0.2, y: h * 0.2 },
      { x: w * 0.8, y: h * 0.25 },
      { x: w * 0.5, y: h * 0.4 },
      { x: w * 0.2, y: h * 0.65 },
      { x: w * 0.8, y: h * 0.7 },
      { x: w * 0.5, y: h * 0.85 }
    ];
    return p[t];
  }

  private normalize(v: number) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }
}
