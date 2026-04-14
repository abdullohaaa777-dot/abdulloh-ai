import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  DiagnosisProb,
  HeartMicroImpulseFeatures,
  HeartMicroImpulseSession,
  HeartMicroImpulseStorageService
} from '../../services/heart-micro-impulse-storage';
import { HeartMicroImpulseInterpretationService } from '../../services/heart-micro-impulse-interpretation';

@Component({
  selector: 'app-heart-micro-impulse',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
  <div class="max-w-7xl mx-auto space-y-6">
    <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
      <h2 class="text-3xl font-black text-medical-text">Yurak Mikro Impuls</h2>
      <p class="text-medical-text-muted mt-2">No-invaziv multimodal yurak mikro-impuls skrining moduli (kamera + mikrofon).</p>
      <div class="mt-3 p-4 border border-amber-100 bg-amber-50 rounded-2xl text-sm text-amber-800">
        <p><strong>Medical disclaimer:</strong> Bu modul skrining va diagnostik qo‘llab-quvvatlash konsepti. Bu mustaqil yakuniy tashxis emas.</p>
      </div>
    </section>

    <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
      <h3 class="text-xl font-black">Tayyorgarlik protokoli</h3>
      <div class="mt-3 inline-flex rounded-xl border border-medical-border p-1 bg-slate-50">
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold"
          [class.bg-white]="scanMode() === 'standard'"
          [class.shadow-sm]="scanMode() === 'standard'"
          (click)="scanMode.set('standard')"
        >
          Standart skan
        </button>
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold"
          [class.bg-white]="scanMode() === 'topography'"
          [class.shadow-sm]="scanMode() === 'topography'"
          (click)="scanMode.set('topography')"
        >
          Prekordial Rezonans Topografiya
        </button>
      </div>
      <ol class="list-decimal pl-5 text-sm mt-3 space-y-1">
        <li>Ko‘krak sohasi kameraga markazda tushsin (asosiy zona).</li>
        <li>Bo‘yin/jugular sohasi ikkilamchi yordamchi zona sifatida ko‘rinishi mumkin.</li>
        <li>Atrof shovqinini kamaytiring, normal nafas holatida turing.</li>
        <li>Qurilma avtomatik tanlanadi: telefon yoki noutbuk kamera/mikrofoni.</li>
      </ol>
      @if (scanMode() === 'topography') {
        <div class="mt-3 text-sm p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800">
          Topografiya rejimi: target zona avval aniqlanadi, so‘ng anatomik overlay va individual yurak modeli quriladi.
        </div>
      }
      <div class="mt-4 flex gap-2">
        <button class="btn-primary" (click)="initCapture()" [disabled]="captureReady()">Tizimni ulash</button>
        <button class="btn-secondary" (click)="stopCapture()" [disabled]="!captureReady()">To‘xtatish</button>
      </div>
    </section>

    <section class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white border border-medical-border rounded-3xl p-4 shadow-sm">
        <div class="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[340px]">
          <video #video autoplay playsinline muted class="w-full h-full object-cover"></video>
          <canvas #overlay class="absolute inset-0 w-full h-full"></canvas>
          @if (!captureReady()) {
            <div class="absolute inset-0 flex items-center justify-center text-white/90">Capture hali yoqilmagan</div>
          }
          @if (isRecording()) {
            <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">REC {{ timeLeft() }}s</div>
          }
        </div>
        <div class="mt-3">
          <p class="text-sm font-semibold">Live guidance: {{ liveGuide() }}</p>
          <div class="h-2 rounded-full bg-slate-200 mt-2"><div class="h-2 rounded-full bg-indigo-600" [style.width.%]="progress()"></div></div>
        </div>
      </div>
      <div class="bg-white border border-medical-border rounded-3xl p-5 shadow-sm space-y-3">
        <h3 class="font-black">Signal nazorati</h3>
        <p class="text-sm">Qurilma: {{ hardwareInfo() }}</p>
        <p class="text-sm">Signal sifati: <strong>{{ signalQuality() }}%</strong></p>
        <p class="text-sm">Ishonchlilik: <strong>{{ confidence() }}%</strong></p>
        <p class="text-sm">Shoshilinch indikator: <strong>{{ urgency() }}%</strong></p>
        @if (scanMode() === 'topography') {
          <p class="text-sm">Tracking aniqligi: <strong>{{ trackingConfidence() }}%</strong></p>
          <p class="text-sm">Kontur ishonchliligi (kiyim ta’siri): <strong>{{ clothingReliability() }}%</strong></p>
        }
        @if (isReady()) {
          <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">
            Signal to‘g‘ri. Natija chiqarish uchun yetarli. Testni boshlang.
          </div>
        } @else {
          <div class="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            <p class="font-semibold mb-1">Signal sifati past. Natija aniqligi pasayishi mumkin.</p>
            @for (warn of readinessWarnings(); track warn) { <p>• {{ warn }}</p> }
            <p class="mt-1 font-semibold">Joylashuvni yaxshilang yoki baribir testni boshlang.</p>
          </div>
        }
        <button class="btn-primary w-full" (click)="startRecording()" [disabled]="!captureReady() || isRecording()">{{ isReady() ? 'Avtomatik capture (25s)' : 'Baribir testni boshlash (25s)' }}</button>
      </div>
    </section>

    @if (pipelineActive()) {
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black">Ilmiy pipeline ishlayapti...</h3>
        <div class="mt-3 space-y-2">
          @for (s of pipelineSteps; track s) {
            <p class="text-sm" [class.font-bold]="s === activePipelineStep()">• {{ s }}</p>
          }
        </div>
      </section>
    }

    @if (latest(); as r) {
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 class="text-2xl font-black">Yurak skrining natijasi</h3>

        <div class="grid md:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Umumiy yurak xavfi</p><p class="text-2xl font-black text-rose-600">{{ overallRisk(r) }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Signal sifati</p><p class="text-2xl font-black">{{ r.features.signalQuality }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Ishonchlilik</p><p class="text-2xl font-black">{{ r.features.confidence }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Urgency</p><p class="text-2xl font-black">{{ r.features.urgency }}%</p></div>
        </div>

        <div class="p-4 rounded-2xl border bg-indigo-50/40">
          <h4 class="font-black">Bitta asosiy diagnoz</h4>
          <p class="text-lg font-bold">{{ r.mainDiagnosis.name }} — {{ r.mainDiagnosis.percent }}%</p>
          <p class="text-sm mt-2">{{ r.narrative.qisqaXulosa }}</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Top 3 ehtimoliy diagnoz</h4>
            @for (d of r.topDiagnoses; track d.name) {
              <div class="mt-2">
                <div class="flex justify-between text-sm"><span>{{ d.name }}</span><span>{{ d.percent }}%</span></div>
                <div class="h-2 rounded-full bg-slate-200"><div class="h-2 rounded-full bg-rose-500" [style.width.%]="d.percent"></div></div>
              </div>
            }
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Diagnostik taqsimot (100%)</h4>
            <div class="w-28 h-28 rounded-full mx-auto mt-3" [style.background]="diagDonut(r.topDiagnoses)"></div>
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Confidence gauge</h4>
            <div class="mt-4 h-16 rounded-t-full" [style.background]="semiGauge(r.features.confidence)"></div>
            <p class="text-center font-black mt-1">{{ r.features.confidence }}%</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">EKG-uslub signal</h4>
            <svg viewBox="0 0 420 120" class="w-full h-28 mt-2"><polyline [attr.points]="wavePoints(r.waveform)" fill="none" stroke="#22c55e" stroke-width="2.5"></polyline></svg>
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Ko‘krak mikro-harakat trendi</h4>
            <svg viewBox="0 0 420 120" class="w-full h-28 mt-2"><polyline [attr.points]="wavePoints(r.motionTrace)" fill="none" stroke="#0ea5e9" stroke-width="2.5"></polyline></svg>
          </div>
          <div class="p-4 rounded-2xl border lg:col-span-2">
            <h4 class="font-black">Electromechanical phase timeline</h4>
            <svg viewBox="0 0 420 60" class="w-full h-16 mt-2">
              <line x1="0" y1="30" x2="420" y2="30" stroke="#94a3b8" stroke-width="2"></line>
              <circle [attr.cx]="(r.features.electromechanicalTimingProxy/100)*420" cy="30" r="8" fill="#7c3aed"></circle>
              <circle [attr.cx]="(r.features.cycleStabilityProxy/100)*420" cy="30" r="8" fill="#10b981"></circle>
            </svg>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-4 text-sm">
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Bo‘lishi mumkin bo‘lgan holatlar</h4><ul class="list-disc pl-5">@for (x of r.narrative.bolishiMumkinHolatlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">O‘tkir va surunkali xavf belgisi</h4><ul class="list-disc pl-5">@for (x of r.narrative.otkirVaSurunkaliXavfBelgisi; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Shoshilinch xavf belgisi</h4><ul class="list-disc pl-5">@for (x of r.narrative.shoshilinchXavfBelgisi; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Tavsiya etiladigan tekshiruvlar</h4><ul class="list-disc pl-5">@for (x of r.narrative.tavsiyaTekshiruvlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Patogenez</h4><ul class="list-disc pl-5">@for (x of r.narrative.patogenez; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Molekulyar mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.molekulyarMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Biofizik mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.biofizikMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Biokimyoviy mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.biokimyoviyMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Clinical interpretation</h4><ul class="list-disc pl-5">@for (x of r.narrative.klinikInterpretatsiya; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Recommended next steps</h4><ul class="list-disc pl-5">@for (x of r.narrative.keyingiQadamlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Sodda izoh</h4><ul class="list-disc pl-5">@for (x of r.narrative.soddaIzoh; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Chuqur ilmiy izoh</h4><ul class="list-disc pl-5">@for (x of r.narrative.chuqurIlmiyIzoh; track x) {<li>{{ x }}</li>}</ul></div>
        </div>

        <div class="p-4 border rounded-2xl text-sm">
          <h4 class="font-black">O‘ta chuqur mexanistik izoh</h4>
          <ul class="list-disc pl-5">@for (x of r.narrative.otaChuqurMexanistikIzoh; track x) {<li>{{ x }}</li>}</ul>
        </div>

        @if (r.scanMode === 'topography') {
          <div class="grid lg:grid-cols-2 gap-4">
            <div class="p-4 border rounded-2xl text-sm">
              <h4 class="font-black">Topografik xarita izohi</h4>
              <ul class="list-disc pl-5">@for (x of r.narrative.topografikXaritaIzohi; track x) {<li>{{ x }}</li>}</ul>
            </div>
            <div class="p-4 border rounded-2xl text-sm">
              <h4 class="font-black">Individual yurak modeli izohi</h4>
              <ul class="list-disc pl-5">@for (x of r.narrative.individualYurakModelIzohi; track x) {<li>{{ x }}</li>}</ul>
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-4">
            <div class="p-4 border rounded-2xl">
              <h4 class="font-black">Individual yurak vizualizatsiyasi (3D-uslub)</h4>
              <div class="mt-3 h-52 rounded-2xl border relative overflow-hidden bg-slate-950/95">
                <div class="absolute inset-0 opacity-80" [style.background]="heartModelBackground(r)"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="relative" [style.transform]="heartModelTransform(r)">
                    <div class="w-24 h-28 rounded-[42%_42%_48%_48%] bg-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.55)] animate-pulse"></div>
                    <div class="absolute -top-3 -left-2 w-9 h-10 rounded-full bg-rose-400/75"></div>
                    <div class="absolute -top-2 right-0 w-8 h-9 rounded-full bg-rose-300/70"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4 border rounded-2xl">
              <h4 class="font-black">Prekordial rezonans topografiya xaritasi</h4>
              <div class="mt-3 grid grid-cols-6 gap-1.5">
                @for (z of topographyCells(r); track $index) {
                  <div class="h-10 rounded-md border border-slate-200" [style.background]="topographyColor(z)"></div>
                }
              </div>
              <p class="text-xs text-medical-text-muted mt-2">Zonal ko‘krak rezonans tarqalishi (yuqori qiymat = yuqori dispersiya/turbulentlik).</p>
            </div>
          </div>
        }
      </section>
    }
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeartMicroImpulseComponent implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') overlayRef?: ElementRef<HTMLCanvasElement>;

  private storage = inject(HeartMicroImpulseStorageService);
  private interpretationService = inject(HeartMicroImpulseInterpretationService);

  captureReady = signal(false);
  isRecording = signal(false);
  timeLeft = signal(0);
  progress = signal(0);
  liveGuide = signal('Ko‘krak sohasi markazda bo‘lsin.');
  hardwareInfo = signal('Aniqlanmoqda...');
  signalQuality = signal(0);
  confidence = signal(0);
  urgency = signal(0);
  isReady = signal(false);
  readinessWarnings = signal<string[]>(['Natija chiqarish uchun signal hali yetarli emas']);
  overlayTracked = signal(false);
  trackingConfidence = signal(0);
  clothingReliability = signal(70);
  scanMode = signal<'standard' | 'topography'>('standard');
  latest = signal<HeartMicroImpulseSession | null>(null);
  pipelineActive = signal(false);
  activePipelineStep = signal('');

  pipelineSteps = [
    'Multimodal signal extraction',
    'Motion noise filtering',
    'Vibroakustik pattern tahlili',
    'Electromechanical irregularity estimation',
    'Diagnostik taqsimot generatsiyasi',
    'Ilmiy narrativ sintezi'
  ];

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioData = new Uint8Array(256);
  private timer: number | null = null;
  private qcTimer: number | null = null;
  private rafId: number | null = null;
  private prevFrame: Uint8ClampedArray | null = null;
  private waveform: number[] = [];
  private motionTrace: number[] = [];
  private torsoPose = { cx: 0.5, cy: 0.58, scale: 1, tilt: 0 };
  private isPreviewMirrored = true;

  async initCapture() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (this.videoRef?.nativeElement) this.videoRef.nativeElement.srcObject = this.stream;
      this.setupAudio(this.stream);
      this.captureReady.set(true);
      this.hardwareInfo.set(navigator.userAgent.includes('Mobile') ? 'Telefon kamera + mikrofon' : 'Noutbuk webcam + mikrofon');
      this.isPreviewMirrored = true;
      this.startQualityLoop();
      this.startOverlayLoop();
    } catch (error) {
      console.error(error);
      this.liveGuide.set('Qurilma ruxsati rad etildi yoki media qurilma topilmadi.');
    }
  }

  stopCapture() {
    this.cleanup();
    this.captureReady.set(false);
    this.isRecording.set(false);
  }

  async startRecording() {
    if (!this.captureReady() || this.isRecording()) return;
    this.isRecording.set(true);
    this.waveform = [];
    this.motionTrace = [];
    this.timeLeft.set(25);
    this.progress.set(0);

    let tick = 0;
    this.timer = window.setInterval(async () => {
      tick += 1;
      this.timeLeft.set(Math.max(0, 25 - tick));
      this.progress.set((tick / 25) * 100);
      this.sampleSignals();
      this.drawOverlay();

      if (tick >= 25) {
        if (this.timer) clearInterval(this.timer);
        this.isRecording.set(false);
        await this.runPipelineAndGenerate();
      }
    }, 1000);
  }

  private startQualityLoop() {
    if (this.qcTimer) clearInterval(this.qcTimer);
    this.qcTimer = window.setInterval(() => {
      this.sampleSignals();
      const brightness = this.brightness();
      const motion = this.motionTrace.slice(-8).reduce((a, b) => a + b, 0) / Math.max(1, this.motionTrace.slice(-8).length);
      const mic = this.waveform.slice(-8).reduce((a, b) => a + b, 0) / Math.max(1, this.waveform.slice(-8).length);
      const pose = this.estimateTorsoPose();
      this.trackingConfidence.set(Math.round(pose.confidence * 100));
      const clothingReliability = this.chestContourReliability(pose);
      this.clothingReliability.set(clothingReliability);
      this.updateGuidance(brightness, motion, mic);

      const quality = Math.max(10, Math.min(98, Math.round(100 - Math.abs(55 - brightness) - motion * 0.7 - Math.max(0, 12 - mic) * 2)));
      this.signalQuality.set(quality);
      this.confidence.set(Math.max(10, Math.min(98, Math.round(quality * 0.78 + (100 - motion) * 0.22))));
      this.urgency.set(Math.max(1, Math.min(99, Math.round((motion * 0.5) + (100 - quality) * 0.5))));
    }, 800);
  }

  private startOverlayLoop = () => {
    this.drawOverlay();
    this.rafId = requestAnimationFrame(this.startOverlayLoop);
  };

  private async runPipelineAndGenerate() {
    this.pipelineActive.set(true);
    for (const step of this.pipelineSteps) {
      this.activePipelineStep.set(step);
      await new Promise((r) => setTimeout(r, 500));
    }

    const features = this.buildFeatures();
    const topDiagnoses = this.diagnosisDistribution(features);
    const main = topDiagnoses[0];
    const narrative = await this.interpretationService.interpret(features, topDiagnoses, main, this.scanMode());
    const topographyGrid = this.scanMode() === 'topography' ? this.buildTopographyGrid(features) : [];
    const heartVisualProfile = this.buildHeartVisualProfile(features);

    const session: HeartMicroImpulseSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `heart-${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetZone: 'chest',
      waveform: this.waveform.slice(-240),
      motionTrace: this.motionTrace.slice(-240),
      features,
      topDiagnoses,
      mainDiagnosis: main,
      narrative,
      scanMode: this.scanMode(),
      topographyGrid,
      heartVisualProfile
    };

    this.storage.save(session);
    this.latest.set(session);
    this.pipelineActive.set(false);
  }

  private buildFeatures(): HeartMicroImpulseFeatures {
    const w = this.waveform.length ? this.waveform : [0];
    const m = this.motionTrace.length ? this.motionTrace : [0];
    const wavStd = this.std(w);
    const motStd = this.std(m);

    return {
      rhythmIrregularity: this.clamp(Math.round(wavStd * 2.4), 1, 99),
      motionEnergyAsymmetry: this.clamp(Math.round(motStd * 2.1), 1, 99),
      acousticTurbulence: this.clamp(Math.round(this.max(w) * 1.4), 1, 99),
      electromechanicalTimingProxy: this.clamp(Math.round((wavStd + motStd) * 1.7), 1, 99),
      cycleStabilityProxy: this.clamp(Math.round(100 - (wavStd * 1.4 + motStd * 1.2)), 1, 99),
      chestMicroMotionAmplitude: this.clamp(Math.round(this.avg(m) * 1.8), 1, 99),
      vibroacousticResonanceShift: this.clamp(Math.round(Math.abs(this.avg(w) - this.avg(m)) * 1.5), 1, 99),
      perfusionInstabilityProxy: this.clamp(Math.round((motStd * 1.2 + wavStd * 0.8)), 1, 99),
      autonomicStressProxy: this.clamp(Math.round(this.signalQuality() < 60 ? 70 : 35 + motStd), 1, 99),
      signalQuality: this.signalQuality(),
      confidence: this.confidence(),
      urgency: this.urgency(),
      rezonansAsimmetriyaIndeksi: this.clamp(Math.round((motStd * 1.1) + (Math.abs(this.avg(w) - this.avg(m)) * 1.2)), 1, 99),
      mexanikTarqalishKechikishi: this.clamp(Math.round((wavStd * 0.9) + (motStd * 1.1)), 1, 99),
      prekordialDispersiyaSkori: this.clamp(Math.round((this.max(w) * 0.8) + (this.max(m) * 0.9)), 1, 99),
      mikrosinxronlikIndeksi: this.clamp(Math.round(100 - ((wavStd * 1.1) + (motStd * 1.0))), 1, 99),
      turbulentVibroakustikEhtimol: this.clamp(Math.round((this.max(w) * 1.0) + (motStd * 0.8)), 1, 99)
    };
  }

  private diagnosisDistribution(f: HeartMicroImpulseFeatures): DiagnosisProb[] {
    const topographyBoost = this.scanMode() === 'topography'
      ? (f.rezonansAsimmetriyaIndeksi * 0.25 + f.mexanikTarqalishKechikishi * 0.2 + f.prekordialDispersiyaSkori * 0.22)
      : 0;
    const raw = [
      { name: 'Aritmiya yo‘nalishi', score: f.rhythmIrregularity * 1.2 + f.electromechanicalTimingProxy + topographyBoost * 0.22 },
      { name: 'Yurak yetishmovchiligi yo‘nalishi', score: f.perfusionInstabilityProxy + (100 - f.cycleStabilityProxy) + f.motionEnergyAsymmetry * 0.8 + topographyBoost * 0.26 },
      { name: 'Ishemik yurak kasalligi yo‘nalishi', score: f.vibroacousticResonanceShift + f.acousticTurbulence + f.autonomicStressProxy * 0.5 + topographyBoost * 0.3 },
      { name: 'Klapan patologiyasi yo‘nalishi', score: f.acousticTurbulence + f.chestMicroMotionAmplitude * 0.7 },
      { name: 'Miokard disfunksiyasi yo‘nalishi', score: f.electromechanicalTimingProxy + f.perfusionInstabilityProxy + topographyBoost * 0.2 },
      { name: 'Post-viral yurak zararlanishi', score: f.autonomicStressProxy + f.vibroacousticResonanceShift + topographyBoost * 0.12 },
      { name: 'Vegetativ disbalans yo‘nalishi', score: f.autonomicStressProxy + (100 - f.signalQuality) }
    ].sort((a, b) => b.score - a.score).slice(0, 3);

    const total = raw.reduce((s, x) => s + x.score, 0) || 1;
    const p1 = Math.round((raw[0].score / total) * 100);
    const p2 = Math.round((raw[1].score / total) * 100);
    const p3 = 100 - p1 - p2;

    return [
      { name: raw[0].name, percent: p1 },
      { name: raw[1].name, percent: p2 },
      { name: raw[2].name, percent: Math.max(1, p3) }
    ];
  }

  overallRisk(r: HeartMicroImpulseSession): number {
    return Math.round((r.mainDiagnosis.percent * 0.5) + (r.features.urgency * 0.3) + ((100 - r.features.cycleStabilityProxy) * 0.2));
  }

  diagDonut(list: DiagnosisProb[]): string {
    const a = list[0]?.percent || 0;
    const b = (list[1]?.percent || 0) + a;
    return `conic-gradient(#ef4444 ${a}%, #f59e0b ${a}% ${b}%, #3b82f6 ${b}% 100%)`;
  }

  semiGauge(percent: number): string {
    return `conic-gradient(from 180deg, #10b981 ${percent * 1.8}deg, #e5e7eb ${percent * 1.8}deg 180deg)`;
  }

  wavePoints(data: number[]): string {
    if (!data.length) return '0,60 420,60';
    return data.slice(-180).map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 420},${110 - v}`).join(' ');
  }

  private drawOverlay() {
    const video = this.videoRef?.nativeElement;
    const canvas = this.overlayRef?.nativeElement;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = video.clientWidth || 640;
    const h = canvas.height = video.clientHeight || 360;
    ctx.clearRect(0, 0, w, h);

    const quality = this.signalQuality();
    const ok = quality >= 65;
    const accent = ok ? '#22c55e' : '#f97316';
    const soft = ok ? 'rgba(34,197,94,0.14)' : 'rgba(249,115,22,0.14)';

    const pose = this.estimateTorsoPose();
    const tracked = pose.confidence >= 0.56;
    this.overlayTracked.set(tracked);

    if (!tracked) {
      // Stage 1: search/detect mode – full anatomical overlayni ko‘rsatmaymiz
      ctx.strokeStyle = 'rgba(148,163,184,0.75)';
      ctx.lineWidth = 1.5;
      const boxW = w * 0.42;
      const boxH = h * 0.44;
      const boxX = (w - boxW) / 2;
      const boxY = h * 0.34;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.fillText('Target zona qidirilmoqda...', boxX + 8, boxY - 8);
      ctx.fillText('Ko‘krak sohasi hali to‘liq ko‘rinmayapti', boxX + 8, boxY + boxH + 16);
      return;
    }

    // Stage 2/3: tracked mode
    this.torsoPose.cx = this.torsoPose.cx * 0.82 + pose.cx * 0.18;
    this.torsoPose.cy = this.torsoPose.cy * 0.82 + pose.cy * 0.18;
    this.torsoPose.scale = this.torsoPose.scale * 0.84 + pose.scale * 0.16;
    this.torsoPose.tilt = this.torsoPose.tilt * 0.8 + pose.tilt * 0.2;

    const cx = w * this.torsoPose.cx;
    const neckY = h * (this.torsoPose.cy - 0.3 * this.torsoPose.scale);
    const shoulderY = h * (this.torsoPose.cy - 0.2 * this.torsoPose.scale);
    const thoraxTop = h * (this.torsoPose.cy - 0.2 * this.torsoPose.scale);
    const thoraxBottom = h * (this.torsoPose.cy + 0.28 * this.torsoPose.scale);
    const thoraxHalfW = w * 0.2 * this.torsoPose.scale;

    // outer thorax contour
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.85, shoulderY);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 1.18, h * 0.48, cx - thoraxHalfW * 0.78, thoraxBottom);
    ctx.quadraticCurveTo(cx, h * 0.9, cx + thoraxHalfW * 0.78, thoraxBottom);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 1.18, h * 0.48, cx + thoraxHalfW * 0.85, shoulderY);
    ctx.stroke();

    // subtle fill for target framing zone
    ctx.fillStyle = soft;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.8, thoraxTop);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 1.05, h * 0.5, cx - thoraxHalfW * 0.72, thoraxBottom * 0.98);
    ctx.quadraticCurveTo(cx, h * 0.86, cx + thoraxHalfW * 0.72, thoraxBottom * 0.98);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 1.05, h * 0.5, cx + thoraxHalfW * 0.8, thoraxTop);
    ctx.closePath();
    ctx.fill();

    // clavicles + neck base
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.58, shoulderY);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 0.2, neckY + h * 0.02, cx, neckY + h * 0.03);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 0.2, neckY + h * 0.02, cx + thoraxHalfW * 0.58, shoulderY);
    ctx.stroke();

    // sternum line + center axis
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, shoulderY + 6);
    ctx.lineTo(cx, thoraxBottom - 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // rib-cage hints (left/right arcs)
    ctx.strokeStyle = 'rgba(148,163,184,0.72)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      const y = thoraxTop + (i + 1) * ((thoraxBottom - thoraxTop) / 6);
      const spread = thoraxHalfW * (0.76 - i * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - spread, y);
      ctx.quadraticCurveTo(cx - spread * 0.25, y - 7, cx - thoraxHalfW * 0.08, y + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + thoraxHalfW * 0.08, y + 1);
      ctx.quadraticCurveTo(cx + spread * 0.25, y - 7, cx + spread, y);
      ctx.stroke();
    }

    // shoulder balance lines
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 1.05, shoulderY);
    ctx.lineTo(cx - thoraxHalfW * 0.58, shoulderY);
    ctx.moveTo(cx + thoraxHalfW * 0.58, shoulderY);
    ctx.lineTo(cx + thoraxHalfW * 1.05, shoulderY);
    ctx.stroke();

    // precordial target zone (left chest emphasis)
    // preview mirrored bo‘lganda chap precordial hududni foydalanuvchi nuqtai nazariga mos akslantiramiz
    const precordialSign = this.isPreviewMirrored ? 1 : -1;
    const heartX = cx + precordialSign * thoraxHalfW * 0.24;
    const heartY = h * 0.56;
    const heartW = thoraxHalfW * 0.52;
    const heartH = h * 0.19;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(heartX, heartY, heartW * 0.55, heartH * 0.5, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ok ? 'rgba(16,185,129,0.16)' : 'rgba(249,115,22,0.16)';
    ctx.fill();

    // neck support ring (secondary region)
    ctx.strokeStyle = ok ? 'rgba(34,197,94,0.7)' : 'rgba(249,115,22,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, neckY, thoraxHalfW * 0.32, h * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();

    // guidance text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(ok ? 'Anatomik zona mos: ko‘krak sohasi to‘g‘ri' : 'Ko‘krak markaziga yaqinlashing va barqaror turing', cx - thoraxHalfW, thoraxTop - 8);
  }

  private estimateTorsoPose(): { cx: number; cy: number; scale: number; tilt: number; confidence: number } {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return { ...this.torsoPose, confidence: 0 };
    const c = document.createElement('canvas');
    c.width = 96; c.height = 72;
    const ctx = c.getContext('2d');
    if (!ctx) return { ...this.torsoPose, confidence: 0 };
    ctx.drawImage(video, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    let count = 0;
    let sumX = 0, sumY = 0;
    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    let leftMass = 0, rightMass = 0;

    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (lum < 165) {
          count++;
          sumX += x; sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < c.width / 2) leftMass++; else rightMass++;
        }
      }
    }

    if (count < 220) return { ...this.torsoPose, confidence: 0.2 };
    const cx = sumX / count / c.width;
    const cy = sumY / count / c.height;
    const bw = Math.max(1, maxX - minX);
    const scale = Math.max(0.72, Math.min(1.28, (bw / c.width) * 1.9));
    const tilt = (rightMass - leftMass) / Math.max(1, count);
    const occupancy = count / (c.width * c.height);
    const centered = 1 - Math.min(1, Math.abs(cx - 0.5) * 2.2) - Math.min(1, Math.abs(cy - 0.57) * 2.4);
    const confidence = Math.max(0, Math.min(1, occupancy * 2.4 + centered * 0.35));
    return { cx, cy, scale, tilt, confidence };
  }

  private updateGuidance(brightness: number, motion: number, mic: number) {
    const p = this.torsoPose;
    const tooFar = p.scale < 0.84;
    const tooNear = p.scale > 1.18;
    const offCenter = Math.abs(p.cx - 0.5) > 0.11;
    const highLow = p.cy < 0.48 || p.cy > 0.67;
    const rotated = Math.abs(p.tilt) > 0.08;
    const unstable = motion > 45;
    const orientationWrong = this.isPreviewMirrored ? p.tilt < -0.12 : p.tilt > 0.12;
    const trackingWeak = !this.overlayTracked();
    const clothingWeak = this.scanMode() === 'topography' && this.clothingReliability() < 52;

    const warnings: string[] = [];
    if (brightness < 45) warnings.push('Yorug‘lik yetarli emas');
    if (mic < 8) warnings.push('Audio sifati past');
    if (tooFar) warnings.push('Kamera juda uzoq');
    if (tooNear) warnings.push('Kamera juda yaqin');
    if (offCenter) warnings.push('Ko‘krak sohasi noto‘g‘ri joylashgan');
    if (highLow) warnings.push('Target zona markazda emas');
    if (rotated) warnings.push('Tana juda burilgan');
    if (orientationWrong) warnings.push('Chap/o‘ng yo‘nalish noto‘g‘ri');
    if (unstable) warnings.push('Foydalanuvchi ko‘p harakatlanyapti, signal beqaror');
    if (trackingWeak) warnings.push('Ko‘krak sohasi aniqlanmoqda, target zona qidirilmoqda');
    if (clothingWeak) warnings.push('Kiyim konturi sabab topografik aniqlik pasayishi mumkin');

    const readinessScore =
      (offCenter ? 0 : 18) +
      (highLow ? 0 : 15) +
      (tooFar || tooNear ? 0 : 14) +
      (rotated || orientationWrong ? 0 : 13) +
      (brightness >= 45 ? 12 : 0) +
      (mic >= 8 ? 12 : 0) +
      (motion <= 45 ? 16 : 0);
    const ready = !trackingWeak && readinessScore >= 78 && this.signalQuality() >= 62 && this.confidence() >= 58;
    this.isReady.set(ready);
    this.readinessWarnings.set(ready
      ? ['Signal to‘g‘ri', 'Natija chiqarish uchun yetarli', 'Testni boshlang']
      : [...warnings, 'Natija aniqligi pasayishi mumkin', 'Signal past, lekin davom etish mumkin']);

    if (ready) this.liveGuide.set('Signal to‘g‘ri. Natija chiqarish uchun yetarli. Testni boshlang');
    else this.liveGuide.set(warnings[0] || 'Natija chiqarish uchun signal hali yetarli emas');
  }

  private sampleSignals() {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.audioData);
      const rms = Math.sqrt(this.audioData.reduce((s, n) => {
        const v = (n - 128) / 128;
        return s + v * v;
      }, 0) / this.audioData.length);
      this.waveform.push(Math.min(100, Math.round(rms * 260)));
    }
    this.motionTrace.push(this.estimateMotion());
  }

  private brightness(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    const ctx = c.getContext('2d'); if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (data.length / 4);
  }

  private estimateMotion(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    const ctx = c.getContext('2d'); if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const current = ctx.getImageData(0, 0, 64, 48).data;
    if (!this.prevFrame) {
      this.prevFrame = current;
      return 0;
    }
    let diff = 0;
    for (let i = 0; i < current.length; i += 20) diff += Math.abs(current[i] - this.prevFrame[i]);
    this.prevFrame = current;
    return Math.min(100, diff / 70);
  }

  topographyCells(r: HeartMicroImpulseSession): number[] {
    if (r.topographyGrid?.length) return r.topographyGrid;
    return this.buildTopographyGrid(r.features);
  }

  topographyColor(v: number): string {
    const clamped = this.clamp(v, 1, 99);
    const hue = 220 - Math.round(clamped * 1.8);
    const alpha = 0.18 + (clamped / 100) * 0.66;
    return `hsla(${hue}, 85%, 54%, ${alpha})`;
  }

  heartModelBackground(r: HeartMicroImpulseSession): string {
    const profile = r.heartVisualProfile ?? this.buildHeartVisualProfile(r.features);
    const shift = Math.max(-20, Math.min(20, profile.leftRightBias));
    const left = this.clamp(46 - shift, 20, 80);
    const right = this.clamp(54 + shift, 20, 80);
    return `radial-gradient(circle at ${left}% 45%, rgba(244,63,94,0.44), rgba(15,23,42,0.88) 54%), radial-gradient(circle at ${right}% 62%, rgba(14,165,233,0.32), transparent 60%)`;
  }

  heartModelTransform(r: HeartMicroImpulseSession): string {
    const profile = r.heartVisualProfile ?? this.buildHeartVisualProfile(r.features);
    const rot = Math.max(-14, Math.min(14, profile.leftRightBias * 0.65));
    const scale = 0.92 + (profile.pulseLevel / 100) * 0.18;
    return `translateY(${profile.kineticDelay * 0.08}px) rotate(${rot}deg) scale(${scale})`;
  }

  private buildTopographyGrid(features: HeartMicroImpulseFeatures): number[] {
    const base = [
      features.prekordialDispersiyaSkori * 0.9,
      features.rezonansAsimmetriyaIndeksi * 0.84,
      features.mexanikTarqalishKechikishi * 0.95,
      features.turbulentVibroakustikEhtimol * 0.88,
      features.mikrosinxronlikIndeksi * 0.65,
      features.motionEnergyAsymmetry * 0.78
    ];
    const grid: number[] = [];
    for (let i = 0; i < 24; i++) {
      const x = i % 6;
      const y = Math.floor(i / 6);
      const spread = base[(x + y) % base.length];
      const resonance = features.prekordialDispersiyaSkori * (1 + (x - 2.5) * 0.06);
      const asym = features.rezonansAsimmetriyaIndeksi * (this.isPreviewMirrored ? (x > 2 ? 1.08 : 0.92) : (x < 3 ? 1.08 : 0.92));
      const depth = features.mexanikTarqalishKechikishi * (1 + y * 0.04);
      grid.push(this.clamp((spread + resonance + asym + depth) / 4, 1, 99));
    }
    return grid;
  }

  private buildHeartVisualProfile(features: HeartMicroImpulseFeatures): { pulseLevel: number; leftRightBias: number; kineticDelay: number } {
    return {
      pulseLevel: this.clamp((features.signalQuality * 0.35) + (features.confidence * 0.45) + (features.acousticTurbulence * 0.2), 1, 99),
      leftRightBias: this.clamp((features.rezonansAsimmetriyaIndeksi - 50) * 0.9, -40, 40),
      kineticDelay: this.clamp((features.mexanikTarqalishKechikishi * 0.65) + ((100 - features.mikrosinxronlikIndeksi) * 0.2), 1, 99)
    };
  }

  private chestContourReliability(pose: { confidence: number; scale: number }): number {
    const brightness = this.brightness();
    const base = pose.confidence * 100;
    const sizePenalty = pose.scale < 0.82 || pose.scale > 1.2 ? 16 : 0;
    const lightPenalty = brightness < 42 ? 18 : 0;
    return this.clamp(base - sizePenalty - lightPenalty + 22, 1, 99);
  }

  private setupAudio(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const src = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    src.connect(this.analyser);
  }

  private avg(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); }
  private max(arr: number[]) { return arr.reduce((a, b) => Math.max(a, b), 0); }
  private std(arr: number[]) {
    const m = this.avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + ((v - m) ** 2), 0) / Math.max(1, arr.length));
  }
  private clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(v))); }

  private cleanup() {
    if (this.timer) clearInterval(this.timer);
    if (this.qcTimer) clearInterval(this.qcTimer);
    this.timer = null;
    this.qcTimer = null;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.prevFrame = null;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
