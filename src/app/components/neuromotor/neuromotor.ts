import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NeuroMotorSession, NeuroMotorStorageService, NeuroMotorTestResult, NeuroMotorTestType } from '../../services/neuromotor-storage';

interface TestDef {
  id: NeuroMotorTestType;
  title: string;
  description: string;
  durationSec: number;
}

@Component({
  selector: 'app-neuromotor',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 class="text-3xl font-extrabold text-medical-text">NevroMotorika</h2>
            <p class="text-medical-text-muted mt-2 max-w-3xl">
              Qo‘l harakatlari uchun nevrologik skrining va reabilitatsiya kuzatuv moduli.
              Bu modul funksional baholash, monitoring va ta’limiy ko‘mak uchun mo‘ljallangan.
            </p>
            <div class="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
              <strong>Diqqat:</strong> Ushbu tizim mustaqil tashxis qo‘ymaydi. Natijalar skrining/monitoring maqsadida.
              Noaniq yoki yomonlashgan holatda malakali shifokor ko‘rigiga murojaat qiling.
            </div>
          </div>
          <div class="flex flex-col gap-2 min-w-56">
            <button class="btn-primary" (click)="startCamera()" [disabled]="cameraRunning()">
              <mat-icon>videocam</mat-icon>
              <span>{{ cameraRunning() ? 'Kamera ishlayapti' : 'Start Camera' }}</span>
            </button>
            <button class="btn-secondary" (click)="stopCamera()" [disabled]="!cameraRunning()">
              <mat-icon>videocam_off</mat-icon>
              <span>Stop</span>
            </button>
            @if (cameraError()) {
              <p class="text-xs text-red-600 font-semibold">{{ cameraError() }}</p>
            }
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white border border-medical-border rounded-3xl p-4 shadow-sm">
          <div class="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[360px] md:min-h-[460px]">
            <video #video autoplay playsinline muted class="w-full h-full object-cover"></video>
            <canvas #overlay class="absolute inset-0 w-full h-full"></canvas>

            @if (!cameraRunning()) {
              <div class="absolute inset-0 flex items-center justify-center text-white/90 bg-slate-900/75">
                <div class="text-center">
                  <mat-icon class="text-5xl h-12 w-12">back_hand</mat-icon>
                  <p class="font-bold mt-2">Kamera ishga tushirilmagan</p>
                </div>
              </div>
            }
          </div>

          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p class="text-[10px] uppercase text-medical-text-muted font-black">Harakat tezligi</p>
              <p class="text-xl font-black text-medical-text">{{ liveSummary().harakat_tezligi }}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p class="text-[10px] uppercase text-medical-text-muted font-black">Barqarorlik</p>
              <p class="text-xl font-black text-medical-text">{{ liveSummary().harakat_barqarorligi }}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p class="text-[10px] uppercase text-medical-text-muted font-black">Koordinatsiya</p>
              <p class="text-xl font-black text-medical-text">{{ liveSummary().koordinatsiya }}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p class="text-[10px] uppercase text-medical-text-muted font-black">Aniqlik</p>
              <p class="text-xl font-black text-medical-text">{{ liveSummary().aniqlik }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-medical-border rounded-3xl p-5 shadow-sm space-y-4">
          <h3 class="font-black text-medical-text">Test holati</h3>
          @if (activeTest(); as test) {
            <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <p class="text-xs uppercase font-black text-indigo-500">Joriy test</p>
              <p class="font-bold text-medical-text">{{ test.title }}</p>
              <p class="text-xs text-medical-text-muted mt-1">{{ test.description }}</p>
              <p class="mt-2 text-sm font-black text-indigo-700">Qolgan vaqt: {{ timeLeft() }}s</p>
              <button class="btn-secondary mt-3 w-full" (click)="finishTestEarly()">Testni yakunlash</button>
            </div>
          } @else {
            <p class="text-sm text-medical-text-muted">Test tanlang. Kamera yoqilgan bo‘lsa avtomatik monitoring boshlanadi.</p>
          }

          <div class="space-y-2">
            <h4 class="text-xs font-black text-medical-text-muted uppercase">How it works</h4>
            <ul class="text-xs text-medical-text-muted list-disc pl-4 space-y-1">
              <li>Webcam oqimi ustida real-time harakat kuzatiladi.</li>
              <li>Har bir test uchun ritm, tezlik, aniqlik va barqarorlik proxy metrikalari hisoblanadi.</li>
              <li>Natijalar sessiya sifatida saqlanadi va trend ko‘rinishida ko‘rsatiladi.</li>
            </ul>
          </div>

          <div class="p-3 border border-emerald-100 bg-emerald-50 rounded-2xl text-xs text-emerald-800">
            Qo‘llash sohasi: skrining, monitoring, reabilitatsiya kuzatuvi va o‘quv vizualizatsiyasi.
          </div>
        </div>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black text-medical-text mb-4">Testlar</h3>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (test of tests; track test.id) {
            <div class="p-4 border rounded-2xl" [class.border-indigo-300]="activeTest()?.id===test.id" [class.bg-indigo-50]="activeTest()?.id===test.id">
              <p class="font-bold text-medical-text">{{ test.title }}</p>
              <p class="text-xs text-medical-text-muted mt-1">{{ test.description }}</p>
              <div class="flex items-center justify-between mt-3">
                <span class="text-[10px] uppercase text-medical-text-muted">{{ test.durationSec }}s</span>
                <button class="btn-secondary" (click)="startTest(test)" [disabled]="!cameraRunning()">Boshlash</button>
              </div>
            </div>
          }
        </div>
      </section>

      <section class="grid xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-black text-medical-text">Sessiya metrikalari</h3>
            <button class="btn-primary" (click)="saveSession()" [disabled]="!testResults().length">Sessiyani saqlash</button>
          </div>
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p class="text-xs font-black text-medical-text-muted uppercase">Yakuniy tezlik</p>
              <p class="text-2xl font-black text-medical-text">{{ overall().speed }}</p>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p class="text-xs font-black text-medical-text-muted uppercase">Yakuniy aniqlik</p>
              <p class="text-2xl font-black text-medical-text">{{ overall().accuracy }}</p>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p class="text-xs font-black text-medical-text-muted uppercase">Yakuniy barqarorlik</p>
              <p class="text-2xl font-black text-medical-text">{{ overall().stability }}</p>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p class="text-xs font-black text-medical-text-muted uppercase">Koordinatsiya / charchash</p>
              <p class="text-2xl font-black text-medical-text">{{ overall().coordination }} / {{ overall().fatigue }}</p>
            </div>
          </div>

          <div class="h-48 bg-slate-50 border border-slate-100 rounded-2xl p-3">
            <svg viewBox="0 0 600 160" class="w-full h-full">
              <polyline fill="none" stroke="#6366f1" stroke-width="3" [attr.points]="trendPoints()"></polyline>
              <line x1="0" y1="150" x2="600" y2="150" stroke="#cbd5e1" stroke-width="1"></line>
            </svg>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="text-medical-text-muted text-xs uppercase">
                  <th class="py-2">Test</th>
                  <th class="py-2">Tezlik</th>
                  <th class="py-2">Aniqlik</th>
                  <th class="py-2">Barqarorlik</th>
                  <th class="py-2">Koordinatsiya</th>
                </tr>
              </thead>
              <tbody>
                @for (r of testResults(); track r.test) {
                  <tr class="border-t border-slate-100">
                    <td class="py-2 font-semibold">{{ testName(r.test) }}</td>
                    <td class="py-2">{{ r.summary.harakat_tezligi }}</td>
                    <td class="py-2">{{ r.summary.aniqlik }}</td>
                    <td class="py-2">{{ r.summary.harakat_barqarorligi }}</td>
                    <td class="py-2">{{ r.summary.koordinatsiya }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
          <h3 class="text-xl font-black text-medical-text mb-4">Oldingi sessiyalar</h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (s of sessions(); track s.id) {
              <div class="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p class="text-xs font-black text-medical-text">{{ s.createdAt | date:'short' }}</p>
                <p class="text-xs text-medical-text-muted">Qo‘l: {{ s.hand }}</p>
                <p class="text-xs text-medical-text-muted">Testlar: {{ s.tests.length }}</p>
                <p class="text-xs text-medical-text-muted">Stability: {{ s.overall.stability }} | Accuracy: {{ s.overall.accuracy }}</p>
              </div>
            }
            @if (!sessions().length) {
              <p class="text-sm text-medical-text-muted">Hozircha saqlangan sessiyalar yo‘q.</p>
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
  private testStartTs = 0;
  private testStartedAtIso = new Date().toISOString();
  private testTimer: ReturnType<typeof setInterval> | null = null;

  cameraRunning = signal(false);
  cameraError = signal<string | null>(null);
  activeTest = signal<TestDef | null>(null);
  timeLeft = signal(0);
  sessions = signal<NeuroMotorSession[]>([]);
  testResults = signal<NeuroMotorTestResult[]>([]);
  liveSummary = signal({
    harakat_barqarorligi: 0,
    harakat_tezligi: 0,
    koordinatsiya: 0,
    aniqlik: 0,
    ritm_muntazamligi: 0,
    charchashga_moyillik: 0
  });

  tests: TestDef[] = [
    { id: 'rest_tremor', title: 'Rest Tremor Observation', description: 'Qo‘lni tinch holatda ushlab turing. Mikro-tebranish kuzatiladi.', durationSec: 20 },
    { id: 'finger_tapping', title: 'Finger Tapping Test', description: 'Bosh barmoq va ko‘rsatkich barmoqni tez-tez tekkizing.', durationSec: 20 },
    { id: 'open_close', title: 'Open-Close Hand Test', description: 'Kaftni ochib-yuming. Ritm va amplitude baholanadi.', durationSec: 20 },
    { id: 'pinch_precision', title: 'Pinch Precision Test', description: 'Pinch holatini barqaror ushlang, aniqlik baholanadi.', durationSec: 18 },
    { id: 'finger_sequence', title: 'Finger Sequencing Test', description: '1→2→3 barmoq ketma-ketligini takrorlang.', durationSec: 20 },
    { id: 'target_touch', title: 'Target Touch Test', description: 'Ekrandagi nishonlarga barmoq markazi bilan tegishga harakat qiling.', durationSec: 22 },
    { id: 'hold_still', title: 'Hold-Still Stability Test', description: 'Qo‘lni bir holatda qimirlatmasdan ushlang.', durationSec: 15 }
  ];

  async ngAfterViewInit() {
    this.sessions.set(await this.storage.listSessions());
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera() {
    this.cameraError.set(null);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      const video = this.videoRef?.nativeElement;
      if (!video) return;
      video.srcObject = this.stream;
      await video.play();
      this.cameraRunning.set(true);
      this.runLoop();
    } catch (error) {
      console.error('Camera start failed:', error);
      this.cameraError.set('Kameraga ruxsat berilmadi yoki kamera mavjud emas.');
    }
  }

  stopCamera() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.testTimer) clearInterval(this.testTimer);
    this.testTimer = null;
    this.cameraRunning.set(false);
    this.activeTest.set(null);
  }

  startTest(test: TestDef) {
    this.activeTest.set(test);
    this.timeLeft.set(test.durationSec);
    this.frameStats = [];
    this.testStartTs = performance.now();
    this.testStartedAtIso = new Date().toISOString();

    if (this.testTimer) clearInterval(this.testTimer);
    this.testTimer = setInterval(() => {
      const left = this.timeLeft() - 1;
      this.timeLeft.set(left);
      if (left <= 0) {
        this.finishCurrentTest();
      }
    }, 1000);
  }

  finishTestEarly() {
    this.finishCurrentTest();
  }

  testName(test: NeuroMotorTestType) {
    return this.tests.find(t => t.id === test)?.title || test;
  }

  overall() {
    const all = this.testResults();
    if (!all.length) return { speed: 0, accuracy: 0, stability: 0, coordination: 0, fatigue: 0 };
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return {
      speed: avg(all.map(a => a.summary.harakat_tezligi)),
      accuracy: avg(all.map(a => a.summary.aniqlik)),
      stability: avg(all.map(a => a.summary.harakat_barqarorligi)),
      coordination: avg(all.map(a => a.summary.koordinatsiya)),
      fatigue: avg(all.map(a => a.summary.charchashga_moyillik))
    };
  }

  trendPoints() {
    const sessions = this.sessions().slice(0, 8).reverse();
    if (!sessions.length) return '';
    const step = 600 / Math.max(1, sessions.length - 1);
    return sessions
      .map((s, i) => {
        const y = 150 - Math.min(120, s.overall.stability * 1.2);
        return `${Math.round(i * step)},${Math.round(y)}`;
      })
      .join(' ');
  }

  async saveSession() {
    const tests = this.testResults();
    if (!tests.length) return;

    const session: NeuroMotorSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      hand: 'unknown',
      tests,
      overall: this.overall()
    };

    const { error } = await this.storage.saveSession(session);
    if (error) {
      alert(error.message);
      return;
    }

    this.sessions.set(await this.storage.listSessions());
    alert('Sessiya muvaffaqiyatli saqlandi.');
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

    if (this.prevFrame) {
      const step = 16;
      for (let i = 0; i < data.length; i += 4 * step) {
        const diff = Math.abs(data[i] - this.prevFrame[i]) + Math.abs(data[i + 1] - this.prevFrame[i + 1]) + Math.abs(data[i + 2] - this.prevFrame[i + 2]);
        if (diff > 70) {
          motion += diff;
          const px = ((i / 4) % w);
          const py = Math.floor((i / 4) / w);
          mx += px;
          my += py;
        }
      }
    }

    this.prevFrame = new Uint8ClampedArray(data);

    const points = Math.max(1, motion / 120);
    const cx = mx / points;
    const cy = my / points;

    if (this.activeTest()) {
      this.frameStats.push({ ts: performance.now(), motion, cx: Number.isFinite(cx) ? cx : w / 2, cy: Number.isFinite(cy) ? cy : h / 2 });
    }

    this.updateLiveSummary();

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
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

  private updateLiveSummary() {
    const sample = this.frameStats.slice(-80);
    if (!sample.length) return;

    const motionVals = sample.map(s => s.motion);
    const avg = motionVals.reduce((a, b) => a + b, 0) / motionVals.length;
    const variance = motionVals.reduce((a, b) => a + (b - avg) ** 2, 0) / motionVals.length;

    const speed = this.normalize(avg / 1200);
    const stability = this.normalize(100 - Math.sqrt(variance) / 40);

    this.liveSummary.set({
      harakat_barqarorligi: stability,
      harakat_tezligi: speed,
      koordinatsiya: this.normalize((stability + speed) / 2),
      aniqlik: this.normalize(80 - Math.min(60, Math.sqrt(variance) / 30)),
      ritm_muntazamligi: this.normalize(100 - Math.min(70, Math.sqrt(variance) / 25)),
      charchashga_moyillik: this.normalize(Math.max(0, 100 - speed))
    });
  }

  private finishCurrentTest() {
    const test = this.activeTest();
    if (!test) return;

    if (this.testTimer) clearInterval(this.testTimer);
    this.testTimer = null;

    const stats = this.frameStats.slice();
    const result = this.computeResult(test.id, stats);

    this.testResults.update(prev => {
      const noCurrent = prev.filter(x => x.test !== test.id);
      return [...noCurrent, result];
    });

    this.activeTest.set(null);
    this.timeLeft.set(0);
    this.frameStats = [];
  }

  private computeResult(test: NeuroMotorTestType, stats: { ts: number; motion: number; cx: number; cy: number }[]): NeuroMotorTestResult {
    const movements = stats.map(s => s.motion);
    const avgMotion = movements.length ? movements.reduce((a, b) => a + b, 0) / movements.length : 0;
    const peaks = movements.filter(m => m > avgMotion * 1.4).length;
    const duration = Math.max(1, ((stats.at(-1)?.ts || 0) - (stats.at(0)?.ts || 0)) / 1000);

    const path = stats.slice(1).reduce((acc, s, i) => acc + Math.hypot(s.cx - stats[i].cx, s.cy - stats[i].cy), 0);
    const speed = this.normalize((path / duration) / 12);
    const accuracy = this.normalize(100 - Math.min(90, peaks * 2));
    const stability = this.normalize(100 - Math.min(95, avgMotion / 180));
    const coordination = this.normalize((speed + accuracy + stability) / 3);
    const rhythm = this.normalize(100 - Math.min(80, Math.abs(peaks - duration * 1.7) * 5));
    const fatigue = this.normalize(Math.min(100, Math.max(0, 100 - (speed - 20))));

    const specific: Record<string, number | string> = {
      duration_sec: Number(duration.toFixed(1)),
      movement_amplitude_proxy: Number((avgMotion / 100).toFixed(2)),
      stability_index: stability
    };

    if (test === 'finger_tapping') {
      specific['total_taps'] = peaks;
      specific['taps_per_10_sec'] = Number(((peaks / duration) * 10).toFixed(1));
      specific['regularity_score'] = rhythm;
      specific['fatigue_trend'] = fatigue;
    } else if (test === 'open_close') {
      specific['cycle_count'] = Math.round(peaks / 2);
      specific['avg_cycle_duration_sec'] = Number((duration / Math.max(1, peaks / 2)).toFixed(2));
      specific['smoothness_score'] = stability;
      specific['amplitude_consistency'] = accuracy;
    } else if (test === 'pinch_precision') {
      specific['pinch_completion_count'] = Math.round(peaks / 2);
      specific['targeting_accuracy'] = accuracy;
      specific['hold_stability'] = stability;
      specific['coordination_score'] = coordination;
    } else if (test === 'finger_sequence') {
      specific['correct_sequence_completion'] = Math.round(peaks / 3);
      specific['reaction_time_ms'] = Math.round((duration / Math.max(1, peaks)) * 1000);
      specific['sequencing_errors'] = Math.max(0, Math.round(duration) - Math.round(peaks / 3));
      specific['coordination_score'] = coordination;
    } else if (test === 'target_touch') {
      const hits = Math.round(peaks / 2);
      const misses = Math.max(0, Math.round(duration) - hits);
      specific['hits'] = hits;
      specific['misses'] = misses;
      specific['avg_completion_time_sec'] = Number((duration / Math.max(1, hits)).toFixed(2));
      specific['accuracy_percent'] = this.normalize((hits / Math.max(1, hits + misses)) * 100);
      specific['movement_control_score'] = coordination;
    } else if (test === 'hold_still') {
      specific['drift_score'] = this.normalize(100 - path / 30);
      specific['micro_movement_summary'] = Number((avgMotion / 120).toFixed(2));
    } else if (test === 'rest_tremor') {
      specific['frequency_proxy_hz'] = Number((peaks / duration).toFixed(2));
      specific['movement_amplitude_proxy'] = Number((avgMotion / 90).toFixed(2));
    }

    return {
      test,
      startedAt: this.testStartedAtIso,
      completedAt: new Date().toISOString(),
      hand: 'unknown',
      metrics: specific,
      summary: {
        harakat_barqarorligi: stability,
        harakat_tezligi: speed,
        koordinatsiya: coordination,
        aniqlik: accuracy,
        ritm_muntazamligi: rhythm,
        charchashga_moyillik: fatigue
      },
      note: 'Natija funksional skrining va monitoring uchun. Mustaqil tashxis emas.'
    };
  }

  private targetPoint(w: number, h: number) {
    const t = Math.floor((performance.now() / 1800) % 6);
    const positions = [
      { x: w * 0.2, y: h * 0.2 },
      { x: w * 0.8, y: h * 0.25 },
      { x: w * 0.5, y: h * 0.4 },
      { x: w * 0.2, y: h * 0.65 },
      { x: w * 0.8, y: h * 0.7 },
      { x: w * 0.5, y: h * 0.85 }
    ];
    return positions[t];
  }

  private normalize(v: number) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }
}
