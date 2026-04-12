import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RespiratoryChartData, RespiratoryHistoryEntry, RespiratoryMetrics, RespiratoryQuestionnaire, RespiratoryVoiceService } from '../../services/respiratory-voice';

interface TestInstruction {
  title: string;
  description: string;
  preparation: string[];
  mistakes: string[];
  after: string;
}

@Component({
  selector: 'app-respiratory-voice',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './respiratory-voice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RespiratoryVoiceComponent implements AfterViewInit, OnDestroy {
  private respiratoryService = inject(RespiratoryVoiceService);

  @ViewChild('previewVideo') previewVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('analysisCanvas') analysisCanvas?: ElementRef<HTMLCanvasElement>;

  currentView = signal<'intro' | 'check' | 'start' | 'running' | 'results' | 'history'>('intro');
  runState = signal<'idle' | 'restBreathing' | 'restAudio' | 'speech' | 'cough' | 'video' | 'recovery' | 'done'>('idle');

  cameraOk = signal(false);
  microphoneOk = signal(false);
  lightingOk = signal(false);
  audioSignalOk = signal(false);
  facePositionOk = signal(false);
  chestVisibilityOk = signal(false);
  coughInputOk = signal(false);
  readingVoiceOk = signal(false);
  mediaError = signal<string | null>(null);

  liveGuidance = signal('Tizim tayyor. Tizimni tekshirishni boshlang.');
  progress = signal(0);
  countdown = signal(0);
  audioLevelPercent = signal(0);

  currentInstruction = signal<TestInstruction | null>(null);

  questionnaire = signal<RespiratoryQuestionnaire>({
    cough: 0,
    sputum: 0,
    fever: 0,
    dyspnea: 0,
    chestPain: 0,
    asthmaHistory: false,
    allergyHistory: false,
    smokingHistory: false,
    recentViralIllness: false,
    symptomDurationDays: 0,
    exertionalWorsening: false,
    nighttimeSymptoms: false,
  });

  interpreting = signal(false);
  result = signal<RespiratoryHistoryEntry | null>(null);
  history = computed(() => this.respiratoryService.history());

  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;

  private restAudioLevels: number[] = [];
  private speechAudioLevels: number[] = [];
  private coughAudioLevels: number[] = [];
  private motionLevels: number[] = [];
  private respiratoryWaveform: number[] = [];
  private speechWaveform: number[] = [];
  private coughWaveform: number[] = [];

  private coughEvents = 0;
  private restBreathingSeconds = 45;
  private restAudioSeconds = 30;
  private speechSeconds = 45;
  private recoverySeconds = 0;
  private baselineAfterEffortGap = 1;

  speechText = 'Bugun men nafas va ovoz testini bajaraman. Matnni tabiiy tempda, bo‘g‘inlarni yutmasdan, odatdagi ovoz balandligida o‘qiyman. Nafasimni majburlamayman va qisqa pauzalarda davom etaman.';

  readonly instructions: Record<'restBreathing' | 'restAudio' | 'speech' | 'cough' | 'video' | 'recovery', TestInstruction> = {
    restBreathing: {
      title: 'Tinch nafas tahlili',
      description: 'Bu bosqich nafas tezligi, ritm barqarorligi va pauza burdenini baholaydi.',
      preparation: ['To‘g‘ri o‘tiring, yelkani bo‘sh tuting.', 'Yuz va ko‘krak kamera ichida bo‘lsin.', 'Nafasni tabiiy oling.'],
      mistakes: ['Nafasni majburlash.', 'Kameradan uzoqlashish.', 'Gapirish yoki yo‘tal bilan aralash signal berish.'],
      after: 'Bosqich tugagach, tizim ritm va interval variabelligini hisoblaydi.',
    },
    restAudio: {
      title: 'Tinch audio tahlili',
      description: 'Bu bosqich jim holatdagi nafas signalining notekisligini baholaydi.',
      preparation: ['Xona shovqinini kamaytiring.', 'Mikrofonga o‘rtacha masofada turing.'],
      mistakes: ['Fon shovqini.', 'Mikrofondan juda uzoq turish.'],
      after: 'Audio irregularity skori yangilanadi.',
    },
    speech: {
      title: 'Nutq-o‘qish testi',
      description: 'Speech-breath koordinatsiyasi, gaplar uzilishi va phrase continuity baholanadi.',
      preparation: ['Matnni oldindan bir marta o‘qib chiqing.', 'Ovoz balandligini odatdagi darajada saqlang.'],
      mistakes: ['Juda tez gapirish.', 'Mikrofondan chetlashish.', 'Nafas yetishmasada davom etish.'],
      after: 'Speech rate, cadence va interruption burden hisoblanadi.',
    },
    cough: {
      title: 'Yo‘tal namunasi',
      description: 'Yo‘tal intensivligi, takrorlanishi va burden indeksi baholanadi.',
      preparation: ['2–3 marta aniq yo‘tal namunasi bering.', 'Har yo‘taldan keyin “Yo‘talni belgilash” tugmasini bosing.'],
      mistakes: ['Juda past signal.', 'Faqat bir marta yo‘talish.'],
      after: 'Cough pattern screening indikatorlari hosil bo‘ladi.',
    },
    video: {
      title: 'Video nafas harakati',
      description: 'Ko‘krak qafasi harakati amplitudasi, regularligi va simmetriya proxysi baholanadi.',
      preparation: ['Ko‘krak qafasi to‘liq ko‘rinadigan holatga o‘ting.', 'Kamera tebranishsiz tursin.'],
      mistakes: ['Yorug‘lik yetarli emas.', 'Faqat yuz ko‘rinib, ko‘krak chiqib ketishi.'],
      after: 'Chest motion regularity va symmetry score hisoblanadi.',
    },
    recovery: {
      title: 'Recovery kinetics testi',
      description: 'Yengil harakatdan so‘ng nafas signalining baselinega qaytish tezligi baholanadi.',
      preparation: ['20 soniya yengil harakat bajaring.', 'So‘ng o‘tirib tabiiy nafasga qayting.'],
      mistakes: ['Haddan tashqari zo‘riqish.', 'Harakatdan so‘ng gapirishni davom ettirish.'],
      after: 'Recovery time va recovery slope ko‘rsatkichlari hosil bo‘ladi.',
    },
  };

  ngAfterViewInit(): void {
    // no-op
  }

  ngOnDestroy(): void {
    this.stopAllMedia();
  }

  get chartData(): RespiratoryChartData | null {
    return this.result()?.chartData ?? null;
  }

  get linePath(): string {
    return this.buildPath(this.chartData?.respiratoryWaveform ?? []);
  }

  get areaPath(): string {
    const data = this.chartData?.speechWaveform ?? [];
    if (!data.length) return '';
    const p = this.buildPath(data);
    return `${p} L 600 120 L 0 120 Z`;
  }

  get barItems(): number[] {
    const m = this.result()?.metrics;
    if (!m) return [];
    return [m.breathingRate, m.pauseFrequency, m.speechBreathInterruptions, m.coughBurdenIndex, m.concernIndex];
  }

  get radarPoints(): string {
    const m = this.result()?.metrics;
    if (!m) return '';
    const vals = [m.overallRespiratoryStability, m.overallFunctionalRecovery, m.overallSpeechBreathEfficiency, m.normalityProximityScore, 100 - m.concernIndex];
    return this.toPolar(vals, 100, 100, 70);
  }

  get donutStyle(): string {
    const concern = this.result()?.metrics.concernIndex ?? 0;
    return `conic-gradient(#ef4444 0 ${concern}%, #1d4ed8 ${concern}% 100%)`;
  }

  get gaugeNeedle(): number {
    return (this.result()?.metrics.normalityProximityScore ?? 0) * 1.8;
  }

  get polarDots(): { x: number; y: number }[] {
    const m = this.result()?.metrics;
    if (!m) return [];
    const vals = [m.breathIntervalVariability, m.speechRateVariability, m.coughBurdenIndex, m.recoverySlope, m.audioIrregularityScore, m.visibleRespiratoryEffort];
    return vals.map((v, i) => {
      const ang = (Math.PI * 2 * i) / vals.length;
      const r = 20 + (v / 100) * 60;
      return { x: 100 + Math.cos(ang) * r, y: 100 + Math.sin(ang) * r };
    });
  }

  updateSeverity(field: 'cough' | 'sputum' | 'fever' | 'dyspnea' | 'chestPain', value: number) {
    this.questionnaire.update((q) => ({ ...q, [field]: value }));
  }

  updateBool(field: keyof RespiratoryQuestionnaire, value: boolean | number) {
    this.questionnaire.update((q) => ({ ...q, [field]: value as never }));
  }

  async startSystemCheck() {
    this.currentView.set('check');
    this.mediaError.set(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      this.mediaError.set('Brauzeringiz kamera/mikrofon funksiyasini qo‘llab-quvvatlamaydi.');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.cameraOk.set(Boolean(this.stream.getVideoTracks()[0]));
      this.microphoneOk.set(Boolean(this.stream.getAudioTracks()[0]));

      if (this.previewVideo?.nativeElement) {
        this.previewVideo.nativeElement.srcObject = this.stream;
        await this.previewVideo.nativeElement.play();
      }

      await this.prepareAudioAnalyzer();
      this.startQualityPolling();
      this.liveGuidance.set('Yuzingiz kamera ichida to‘liq ko‘rinsin. Ko‘krak qafasi kamera ichida yaxshi ko‘rinsin.');
    } catch {
      this.mediaError.set('Kamera yoki mikrofon ruxsatida xatolik yuz berdi.');
    }
  }

  goToStart() {
    this.currentView.set('start');
  }

  async beginTests() {
    this.currentView.set('running');
    this.result.set(null);
    this.progress.set(0);
    this.restAudioLevels = [];
    this.speechAudioLevels = [];
    this.coughAudioLevels = [];
    this.motionLevels = [];
    this.respiratoryWaveform = [];
    this.speechWaveform = [];
    this.coughWaveform = [];
    this.coughEvents = 0;
    this.recoverySeconds = 0;

    if (!this.stream) {
      await this.startSystemCheck();
    }

    await this.runStepWithInstruction('restBreathing', this.restBreathingSeconds, (a, m) => {
      this.restAudioLevels.push(a);
      this.motionLevels.push(m);
      this.respiratoryWaveform.push(a * 100);
    }, 'Nafasni tabiiy oling.');

    await this.runStepWithInstruction('restAudio', this.restAudioSeconds, (a) => {
      this.restAudioLevels.push(a);
      this.respiratoryWaveform.push(a * 100);
    }, 'Signal juda sust bo‘lsa mikrofonga yaqinroq bo‘ling.');

    await this.runStepWithInstruction('speech', this.speechSeconds, (a) => {
      this.speechAudioLevels.push(a);
      this.speechWaveform.push(a * 100);
    }, 'Gapirish testi davom etmoqda. Matnni tabiiy tempda o‘qing.');

    await this.runStepWithInstruction('cough', 20, (a) => {
      this.coughAudioLevels.push(a);
      this.coughWaveform.push(a * 100);
    }, 'Yo‘tal namunasi aniq yozilmadi deb chiqsa qayta urining.', true);

    await this.runStepWithInstruction('video', 25, (_a, m) => {
      this.motionLevels.push(m);
      this.respiratoryWaveform.push(m * 100);
    }, 'Ko‘krak qafasi kamera ichida yaxshi ko‘rinsin.');

    await this.runRecoveryStep();
    await this.finishAssessment();
  }

  registerCough() {
    if (this.runState() === 'cough') {
      this.coughEvents += 1;
      this.coughInputOk.set(this.coughEvents >= 2);
      this.liveGuidance.set('Yo‘tal namunasini qabul qildik. Yana 1 marta yozib olishingiz mumkin.');
    }
  }

  openHistory() {
    this.currentView.set('history');
  }

  loadHistoryItem(item: RespiratoryHistoryEntry) {
    this.result.set(item);
    this.currentView.set('results');
  }

  private async runStepWithInstruction(
    state: 'restBreathing' | 'restAudio' | 'speech' | 'cough' | 'video',
    seconds: number,
    collector: (audioLevel: number, motionLevel: number) => void,
    guidance: string,
    expectCough = false,
  ) {
    const i = this.instructions[state];
    this.currentInstruction.set(i);
    await this.waitForConfirm();
    this.currentInstruction.set(null);

    this.runState.set(state);
    this.liveGuidance.set(guidance);
    this.countdown.set(seconds);

    await new Promise<void>((resolve) => {
      let elapsed = 0;
      this.timerRef = setInterval(() => {
        const audio = this.readAudioLevel();
        const motion = this.readMotionLevel();
        collector(audio, motion);
        elapsed += 0.25;
        this.countdown.set(Math.max(0, Math.ceil(seconds - elapsed)));

        if (audio < 0.03 && (state === 'speech' || expectCough)) {
          this.audioSignalOk.set(false);
          this.liveGuidance.set('Signal juda sust. Mikrofonga aniq gapiring.');
        } else {
          this.audioSignalOk.set(true);
          if (state === 'speech') this.readingVoiceOk.set(true);
        }

        if (elapsed >= seconds) {
          clearInterval(this.timerRef!);
          this.timerRef = null;
          resolve();
        }
      }, 250);
    });

    this.progress.set(Math.min(this.progress() + 14, 92));
  }

  private async runRecoveryStep() {
    const i = this.instructions.recovery;
    this.currentInstruction.set(i);
    await this.waitForConfirm();
    this.currentInstruction.set(null);

    this.runState.set('recovery');
    this.liveGuidance.set('Yengil harakatni 20 soniya bajaring, keyin nafasni tiklang.');

    const baseline = this.restAudioLevels.length
      ? this.restAudioLevels.reduce((a, b) => a + b, 0) / this.restAudioLevels.length
      : 0.3;

    let seconds = 0;
    let lastGap = 1;
    this.countdown.set(60);
    this.recoverySeconds = 60;

    await new Promise<void>((resolve) => {
      this.timerRef = setInterval(() => {
        seconds += 1;
        this.countdown.set(60 - seconds);
        const level = this.readAudioLevel();
        const gap = Math.abs(level - baseline) / Math.max(baseline, 0.05);
        lastGap = gap;
        if (seconds > 12 && gap < 0.2) {
          this.recoverySeconds = seconds;
          clearInterval(this.timerRef!);
          this.timerRef = null;
          resolve();
        }
        if (seconds >= 60) {
          clearInterval(this.timerRef!);
          this.timerRef = null;
          resolve();
        }
      }, 1000);
    });

    this.baselineAfterEffortGap = Math.min(1, Math.max(0, lastGap));
    this.progress.set(97);
    this.liveGuidance.set('Recovery testi yakunlandi. Natijalar hisoblanmoqda.');
  }

  private async finishAssessment() {
    const metrics: RespiratoryMetrics = this.respiratoryService.computeMetrics({
      restAudioLevels: this.restAudioLevels,
      motionLevels: this.motionLevels,
      speechAudioLevels: this.speechAudioLevels,
      coughAudioLevels: this.coughAudioLevels,
      coughEvents: this.coughEvents,
      faceCoverageScore: this.facePositionOk() ? 1 : 0.45,
      chestCoverageScore: this.chestVisibilityOk() ? 1 : 0.4,
      restBreathingSeconds: this.restBreathingSeconds,
      speechSeconds: this.speechSeconds,
      recoverySeconds: this.recoverySeconds,
      baselineAfterEffortGap: this.baselineAfterEffortGap,
      questionnaire: this.questionnaire(),
    });

    const chartData = this.respiratoryService.buildChartData(metrics, {
      respiratoryWaveform: this.respiratoryWaveform,
      speechWaveform: this.speechWaveform,
      coughWaveform: this.coughWaveform,
    }, this.history());

    this.interpreting.set(true);
    const interpretationResult = await this.respiratoryService.buildInterpretation(metrics, this.questionnaire());
    this.interpreting.set(false);

    const entry: RespiratoryHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rawSummary: {
        restBreathingSeconds: this.restBreathingSeconds,
        restAudioSeconds: this.restAudioSeconds,
        speechSeconds: this.speechSeconds,
        coughEvents: this.coughEvents,
        recoverySeconds: this.recoverySeconds,
      },
      questionnaire: this.questionnaire(),
      metrics,
      chartData,
      interpretation: interpretationResult.safe,
      fallbackInterpretation: interpretationResult.fallback,
    };

    this.respiratoryService.saveEntry(entry);
    this.result.set(entry);
    this.currentView.set('results');
    this.runState.set('done');
    this.progress.set(100);
    this.liveGuidance.set('Test muvaffaqiyatli yakunlandi.');
  }

  private async prepareAudioAnalyzer() {
    if (!this.stream) return;
    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
  }

  private startQualityPolling() {
    const loop = () => {
      const brightness = this.readBrightness();
      const motion = this.readMotionLevel();
      const audio = this.readAudioLevel();

      this.audioLevelPercent.set(Math.round(audio * 100));
      this.lightingOk.set(brightness > 42);
      this.facePositionOk.set(brightness > 28 && motion > 0.2);
      this.chestVisibilityOk.set(motion > 0.23);
      this.audioSignalOk.set(audio > 0.02);

      if (audio > 0.08) this.coughInputOk.set(true);
      if (audio > 0.05) this.readingVoiceOk.set(true);

      if (!this.lightingOk()) {
        this.liveGuidance.set('Yorug‘lik yetarli emas. Yorug‘ joyga o‘ting.');
      } else if (!this.audioSignalOk()) {
        this.liveGuidance.set('Signal juda sust. Mikrofonga aniq gapiring.');
      }

      if (this.currentView() === 'check') {
        this.pollTimeout = setTimeout(loop, 500);
      }
    };
    loop();
  }

  private readAudioLevel(): number {
    if (!this.analyser) return 0;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buffer);
    const sum = buffer.reduce((acc, value) => acc + value, 0);
    return sum / (buffer.length * 255);
  }

  private readMotionLevel(): number {
    const video = this.previewVideo?.nativeElement;
    const canvas = this.analysisCanvas?.nativeElement;
    if (!video || !canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let sum = 0;
    for (let i = 0; i < img.data.length; i += 40) sum += img.data[i];
    return (sum / (img.data.length / 40)) / 255;
  }

  private readBrightness(): number {
    return this.readMotionLevel() * 100;
  }

  private waitForConfirm(): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        document.removeEventListener('resp-step-confirm', handler);
        resolve();
      };
      document.addEventListener('resp-step-confirm', handler);
    });
  }

  confirmInstruction() {
    document.dispatchEvent(new CustomEvent('resp-step-confirm'));
  }

  private buildPath(values: number[]): string {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    return values
      .map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * 600;
        const y = 120 - (v / max) * 110;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  private toPolar(values: number[], cx: number, cy: number, maxR: number): string {
    return values
      .map((v, i) => {
        const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private stopAllMedia() {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
