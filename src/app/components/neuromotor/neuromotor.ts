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

interface TestDef {
  id: NeuroMotorTestType;
  title: string;
  description: string;
  instruction: string;
  durationSec: number;
}

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
              <button class="btn-secondary mt-3" (click)="startTest(test)" [disabled]="!cameraRunning()">Boshlash</button>
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

  cameraRunning = signal(false);
  cameraError = signal<string | null>(null);
  handDetected = signal(false);
  statusText = signal('Kutilmoqda');
  skeletonEnabled = signal(true);
  sensitivity = signal(1);
  durationScale = signal(1);

  activeTest = signal<TestDef | null>(null);
  timeLeft = signal(0);
  countdown = signal(0);
  progress = signal(0);

  sessions = signal<NeuroMotorSession[]>([]);
  testResults = signal<NeuroMotorTestResult[]>([]);
  latestResult = signal<NeuroMotorTestResult | null>(null);
  liveSummary = signal({ harakat_barqarorligi: 0, harakat_tezligi: 0, koordinatsiya: 0, aniqlik: 0, ritm_muntazamligi: 0, charchashga_moyillik: 0 });

  tests: TestDef[] = [
    { id: 'rest_tremor', title: 'Rest Tremor Observation', description: 'Qo‘lni tinch holatda ushlang.', instruction: 'Kaftni kadr markazida tuting, 3 soniya tinch holatni saqlang.', durationSec: 20 },
    { id: 'finger_tapping', title: 'Finger Tapping Test', description: 'Barmoq urish ritmini baholash.', instruction: 'Bosh barmoq va ko‘rsatkich barmoqni bir tekis ritmda tekkizing.', durationSec: 20 },
    { id: 'open_close', title: 'Open-Close Hand Test', description: 'Kaftni ochib-yoping.', instruction: 'Kaftni to‘liq ochib, so‘ng musht qiling. Harakatni bir maromda takrorlang.', durationSec: 20 },
    { id: 'pinch_precision', title: 'Pinch Precision Test', description: 'Pinch aniqligi va ushlab turish.', instruction: 'Pinch holatini 1-2 soniya ushlab turing, so‘ng qo‘yib yuboring.', durationSec: 18 },
    { id: 'finger_sequence', title: 'Finger Sequencing Test', description: 'Ketma-ketlikni bajarish.', instruction: '1→2→3 barmoq ketma-ketligini takrorlang, tezlikdan ko‘ra aniqlikka e’tibor bering.', durationSec: 20 },
    { id: 'target_touch', title: 'Target Touch Test', description: 'Nishonlarga yetib borish aniqligi.', instruction: 'Harakat markazini yashil nishonlarga yaqinlashtiring.', durationSec: 22 },
    { id: 'hold_still', title: 'Hold-Still Stability Test', description: 'Stabil ushlab turish testi.', instruction: 'Qo‘lni bir holatda imkon qadar qimirlatmasdan tuting.', durationSec: 16 }
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
    try {
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
    const test = this.activeTest();
    if (test) this.startTest(test);
  }

  goNextTest() {
    const current = this.activeTest();
    if (!current) return;
    const idx = this.tests.findIndex(t => t.id === current.id);
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

    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;

    let motion = 0;
    let mx = 0;
    let my = 0;
    let changed = 0;
    const step = 20;

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
    this.prevFrame = new Uint8ClampedArray(data);

    const detected = changed > 10;
    this.handDetected.set(detected);

    const rawX = detected ? mx / changed : w / 2;
    const rawY = detected ? my / changed : h / 2;
    this.smoothed.x = this.smoothed.x ? this.smoothed.x * 0.75 + rawX * 0.25 : rawX;
    this.smoothed.y = this.smoothed.y ? this.smoothed.y * 0.75 + rawY * 0.25 : rawY;

    if (this.activeTest() && this.countdown() === 0) {
      this.frameStats.push({ ts: performance.now(), motion, cx: this.smoothed.x, cy: this.smoothed.y });
      this.detectStableEvents(motion, this.smoothed.x, this.smoothed.y, w, h);
    }

    this.updateLiveSummary();

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    if (this.skeletonEnabled()) {
      ctx.fillStyle = detected ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(this.smoothed.x, this.smoothed.y, detected ? 9 : 6, 0, Math.PI * 2);
      ctx.fill();
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
    this.statusText.set('Test yakunlandi');
    this.progress.set(100);
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
