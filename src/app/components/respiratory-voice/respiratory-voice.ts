import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RespiratoryHistoryEntry, RespiratoryMetrics, RespiratoryQuestionnaire, RespiratoryVoiceService } from '../../services/respiratory-voice';

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
  mediaError = signal<string | null>(null);

  liveGuidance = signal('Tizim tayyor. Tizimni sinab ko‘rishni boshlang.');
  progress = signal(0);
  countdown = signal(0);

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
  private rafId: number | null = null;

  private restAudioLevels: number[] = [];
  private speechAudioLevels: number[] = [];
  private coughAudioLevels: number[] = [];
  private motionLevels: number[] = [];
  private coughEvents = 0;

  private restBreathingSeconds = 45;
  private restAudioSeconds = 30;
  private speechSeconds = 45;
  private recoverySeconds = 0;

  speechText = 'Assalomu alaykum. Men test uchun ushbu matnni odatdagi ovoz balandligida va tabiiy nafas ritmida o‘qiyapman. Nafasimni majburlamasdan davom etaman.';

  ngAfterViewInit(): void {
    // no-op
  }

  ngOnDestroy(): void {
    this.stopAllMedia();
  }

  updateSeverity(field: 'cough' | 'sputum' | 'fever' | 'dyspnea' | 'chestPain', value: number) {
    this.questionnaire.update((q) => ({ ...q, [field]: value }));
  }

  updateBool(field: keyof RespiratoryQuestionnaire, value: boolean | number) {
    this.questionnaire.update((q) => ({ ...q, [field]: value }));
  }

  async startSystemCheck() {
    this.currentView.set('check');
    this.mediaError.set(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      this.mediaError.set('Brauzer media qurilmalarni qo‘llab-quvvatlamaydi.');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = this.stream.getVideoTracks()[0];
      const audioTrack = this.stream.getAudioTracks()[0];
      this.cameraOk.set(Boolean(videoTrack));
      this.microphoneOk.set(Boolean(audioTrack));

      if (this.previewVideo?.nativeElement) {
        this.previewVideo.nativeElement.srcObject = this.stream;
        await this.previewVideo.nativeElement.play();
      }

      await this.prepareAudioAnalyzer();
      this.measureQualitySignals();
      this.liveGuidance.set('Yuzingiz kamera ichida to‘liq ko‘rinsin va mikrofonga odatdagi masofada gapiring.');
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
    this.coughEvents = 0;
    this.recoverySeconds = 0;

    if (!this.stream) {
      await this.startSystemCheck();
    }

    await this.runTimedStep('restBreathing', this.restBreathingSeconds, (level, motion) => {
      this.restAudioLevels.push(level);
      this.motionLevels.push(motion);
    }, 'Nafasni tabiiy oling, majburlamang. Ko‘krak harakati ko‘rinsin.');

    await this.runTimedStep('restAudio', this.restAudioSeconds, (level) => {
      this.restAudioLevels.push(level);
    }, 'Jim holatda turing, audio signal qabul qilinmoqda.');

    await this.runTimedStep('speech', this.speechSeconds, (level) => {
      this.speechAudioLevels.push(level);
    }, 'Matnni odatdagi ovoz balandligida o‘qing. Mikrofonga yaqinroq gapiring.');

    await this.runTimedStep('cough', 20, (level) => {
      this.coughAudioLevels.push(level);
    }, '2-3 marta yo‘talni aniq yozib oling.', true);

    await this.runTimedStep('video', 25, (_level, motion) => {
      this.motionLevels.push(motion);
    }, 'Ko‘krak harakati yaxshi ko‘rinadigan holatga o‘ting.');

    await this.runRecoveryStep();
    await this.finishAssessment();
  }

  registerCough() {
    if (this.runState() === 'cough') {
      this.coughEvents += 1;
      this.liveGuidance.set('Yo‘tal qayd etildi. Yana 1-2 marta yozib oling.');
    }
  }

  private async runRecoveryStep() {
    this.runState.set('recovery');
    this.liveGuidance.set('Yengil harakatni 20 soniya bajaring, keyin nafas tiklanishini kuzatamiz.');

    const baseline = this.restAudioLevels.length
      ? this.restAudioLevels.reduce((a, b) => a + b, 0) / this.restAudioLevels.length
      : 0.3;

    let seconds = 0;
    this.countdown.set(60);
    this.recoverySeconds = 60;

    await new Promise<void>((resolve) => {
      this.timerRef = setInterval(() => {
        seconds += 1;
        this.countdown.set(60 - seconds);
        const level = this.readAudioLevel();
        const diff = Math.abs(level - baseline);
        if (seconds > 12 && diff < baseline * 0.15 + 0.02) {
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

    this.progress.set(95);
    this.liveGuidance.set('Recovery testi yakunlandi. Natijalar hisoblanmoqda.');
  }

  private async runTimedStep(
    state: 'restBreathing' | 'restAudio' | 'speech' | 'cough' | 'video',
    seconds: number,
    collector: (audioLevel: number, motionLevel: number) => void,
    guidance: string,
    expectCough = false,
  ) {
    this.runState.set(state);
    this.liveGuidance.set(guidance);
    this.countdown.set(seconds);

    await new Promise<void>((resolve) => {
      let elapsed = 0;
      const run = () => {
        const audio = this.readAudioLevel();
        const motion = this.readMotionLevel();
        collector(audio, motion);
        elapsed += 0.25;
        this.countdown.set(Math.max(0, Math.ceil(seconds - elapsed)));

        if (audio < 0.03 && (state === 'speech' || expectCough)) {
          this.audioSignalOk.set(false);
          this.liveGuidance.set('Tizim audio signalni yetarli qabul qilmayapti. Mikrofonga yaqinroq gapiring.');
        } else {
          this.audioSignalOk.set(true);
        }

        if (elapsed >= seconds) {
          resolve();
          return;
        }
        this.rafId = window.setTimeout(run, 250) as unknown as number;
      };
      run();
    });

    const nextProgress = this.progress() + 15;
    this.progress.set(Math.min(nextProgress, 90));
  }

  private async finishAssessment() {
    const metrics: RespiratoryMetrics = this.respiratoryService.computeMetrics({
      restAudioLevels: this.restAudioLevels,
      motionLevels: this.motionLevels,
      speechAudioLevels: this.speechAudioLevels,
      coughAudioLevels: this.coughAudioLevels,
      coughEvents: this.coughEvents,
      restBreathingSeconds: this.restBreathingSeconds,
      restAudioSeconds: this.restAudioSeconds,
      speechSeconds: this.speechSeconds,
      recoverySeconds: this.recoverySeconds,
      questionnaire: this.questionnaire(),
    });

    this.interpreting.set(true);
    const interpretation = await this.respiratoryService.buildInterpretation(metrics, this.questionnaire());
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
      interpretation,
    };

    this.respiratoryService.saveEntry(entry);
    this.result.set(entry);
    this.currentView.set('results');
    this.runState.set('done');
    this.progress.set(100);
    this.liveGuidance.set('Test muvaffaqiyatli yakunlandi.');
  }

  openHistory() {
    this.currentView.set('history');
  }

  loadHistoryItem(item: RespiratoryHistoryEntry) {
    this.result.set(item);
    this.currentView.set('results');
  }

  private async prepareAudioAnalyzer() {
    if (!this.stream) return;
    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
  }

  private measureQualitySignals() {
    const update = () => {
      const brightness = this.readBrightness();
      this.lightingOk.set(brightness > 45);
      if (brightness <= 45) {
        this.liveGuidance.set('Kamerada yorug‘lik yetarli emas. Yorug‘ joyga o‘ting.');
      }

      const audio = this.readAudioLevel();
      this.audioSignalOk.set(audio > 0.02);
      if (this.currentView() === 'check' && audio < 0.02) {
        this.liveGuidance.set('Tizim audio signalni yetarli qabul qilmayapti.');
      }

      if (this.currentView() === 'check') {
        window.setTimeout(update, 800);
      }
    };
    update();
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
    let sample = 0;
    for (let i = 0; i < img.data.length; i += 40) {
      sample += img.data[i];
    }
    return (sample / (img.data.length / 40)) / 255;
  }

  private readBrightness(): number {
    return this.readMotionLevel() * 100;
  }

  private stopAllMedia() {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
    if (this.rafId) {
      clearTimeout(this.rafId);
      this.rafId = null;
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
