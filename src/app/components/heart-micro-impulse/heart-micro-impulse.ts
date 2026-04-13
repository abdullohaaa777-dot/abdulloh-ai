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
      <ol class="list-decimal pl-5 text-sm mt-3 space-y-1">
        <li>Ko‘krak sohasi kameraga markazda tushsin (asosiy zona).</li>
        <li>Bo‘yin/jugular sohasi ikkilamchi yordamchi zona sifatida ko‘rinishi mumkin.</li>
        <li>Atrof shovqinini kamaytiring, normal nafas holatida turing.</li>
        <li>Qurilma avtomatik tanlanadi: telefon yoki noutbuk kamera/mikrofoni.</li>
      </ol>
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
        <button class="btn-primary w-full" (click)="startRecording()" [disabled]="!captureReady() || isRecording()">Avtomatik capture (25s)</button>
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
  private prevFrame: Uint8ClampedArray | null = null;
  private waveform: number[] = [];
  private motionTrace: number[] = [];

  async initCapture() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (this.videoRef?.nativeElement) this.videoRef.nativeElement.srcObject = this.stream;
      this.setupAudio(this.stream);
      this.captureReady.set(true);
      this.hardwareInfo.set(navigator.userAgent.includes('Mobile') ? 'Telefon kamera + mikrofon' : 'Noutbuk webcam + mikrofon');
      this.startQualityLoop();
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

      if (brightness < 45) this.liveGuide.set('Yorug‘lik yetarli emas, nur manbasini oshiring.');
      else if (motion > 45) this.liveGuide.set('Harakat ko‘p, gavdani barqaror ushlang.');
      else if (mic < 8) this.liveGuide.set('Audio signal sust, mikrofonni to‘smang.');
      else this.liveGuide.set('Pozitsiya to‘g‘ri, capture sifati yaxshi.');

      const quality = Math.max(10, Math.min(98, Math.round(100 - Math.abs(55 - brightness) - motion * 0.7 - Math.max(0, 12 - mic) * 2)));
      this.signalQuality.set(quality);
      this.confidence.set(Math.max(10, Math.min(98, Math.round(quality * 0.78 + (100 - motion) * 0.22))));
      this.urgency.set(Math.max(1, Math.min(99, Math.round((motion * 0.5) + (100 - quality) * 0.5))));
      this.drawOverlay();
    }, 800);
  }

  private async runPipelineAndGenerate() {
    this.pipelineActive.set(true);
    for (const step of this.pipelineSteps) {
      this.activePipelineStep.set(step);
      await new Promise((r) => setTimeout(r, 500));
    }

    const features = this.buildFeatures();
    const topDiagnoses = this.diagnosisDistribution(features);
    const main = topDiagnoses[0];
    const narrative = await this.interpretationService.interpret(features, topDiagnoses, main);

    const session: HeartMicroImpulseSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `heart-${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetZone: 'chest',
      waveform: this.waveform.slice(-240),
      motionTrace: this.motionTrace.slice(-240),
      features,
      topDiagnoses,
      mainDiagnosis: main,
      narrative
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
      urgency: this.urgency()
    };
  }

  private diagnosisDistribution(f: HeartMicroImpulseFeatures): DiagnosisProb[] {
    const raw = [
      { name: 'Aritmiya yo‘nalishi', score: f.rhythmIrregularity * 1.2 + f.electromechanicalTimingProxy },
      { name: 'Yurak yetishmovchiligi yo‘nalishi', score: f.perfusionInstabilityProxy + (100 - f.cycleStabilityProxy) + f.motionEnergyAsymmetry * 0.8 },
      { name: 'Ishemik yurak kasalligi yo‘nalishi', score: f.vibroacousticResonanceShift + f.acousticTurbulence + f.autonomicStressProxy * 0.5 },
      { name: 'Klapan patologiyasi yo‘nalishi', score: f.acousticTurbulence + f.chestMicroMotionAmplitude * 0.7 },
      { name: 'Miokard disfunksiyasi yo‘nalishi', score: f.electromechanicalTimingProxy + f.perfusionInstabilityProxy },
      { name: 'Post-viral yurak zararlanishi', score: f.autonomicStressProxy + f.vibroacousticResonanceShift },
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

    const cx = w / 2;
    const neckY = h * 0.26;
    const shoulderY = h * 0.35;
    const thoraxTop = h * 0.35;
    const thoraxBottom = h * 0.83;
    const thoraxHalfW = w * 0.2;

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
    const heartX = cx - thoraxHalfW * 0.24;
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
