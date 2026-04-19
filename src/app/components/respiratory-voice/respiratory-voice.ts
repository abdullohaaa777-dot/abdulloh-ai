import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  RespiratoryVoiceMetrics,
  RespiratoryVoiceQuestionnaire,
  RespiratoryVoiceSession,
  RespiratoryVoiceStorageService
} from '../../services/respiratory-voice-storage';
import { RespiratoryVoiceInterpretationService } from '../../services/respiratory-voice-interpretation';

interface RespiratoryTest {
  id: 'rest_breathing' | 'rest_audio' | 'speech_reading' | 'speech_speed' | 'cough' | 'video_motion' | 'recovery';
  title: string;
  description: string;
  durationSec: number;
  instructions: string[];
  mistakes: string[];
  measures: string[];
  liveHints: string[];
}

@Component({
  selector: 'app-respiratory-voice',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h2 class="text-3xl font-black text-medical-text">Nafas va Ovoz Tahlili</h2>
        <p class="text-medical-text-muted mt-2">Kamera + mikrofon + simptom anketa asosida respirator skrining va kuzatuv moduli.</p>
        <div class="mt-4 p-4 rounded-2xl border border-amber-100 bg-amber-50 text-amber-800 text-sm">
          <p><strong>Bu modul skrining va kuzatuv uchun mo‘ljallangan.</strong></p>
          <p><strong>Bu mustaqil tashxis emas.</strong> Aniq tashxis uchun shifokor ko‘rigi zarur.</p>
        </div>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black">Bu modul qanday ishlaydi?</h3>
        <ol class="list-decimal pl-5 mt-3 text-sm space-y-1 text-medical-text">
          <li>Kamera orqali nafas harakati (yuz/bo‘yin/ko‘krak qafasi) signalini baholaydi.</li>
          <li>Mikrofon orqali tinch nafas, yo‘tal va gapirishdagi nafas uzilishlarini tahlil qiladi.</li>
          <li>Simptom anketa bilan signal metriclari birlashtirilib skrining xulosasi tuziladi.</li>
          <li>AI tahlil qatlami mavjud bo‘lsa metrikalar asosida chuqur izoh beradi, bo‘lmasa lokal fallback ishlaydi.</li>
        </ol>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 class="text-xl font-black">Tizimni tekshirish</h3>
        <div class="grid lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 rounded-2xl overflow-hidden bg-slate-900 min-h-[280px] relative">
            <video #video autoplay playsinline muted class="w-full h-full object-cover"></video>
            @if (!streamReady()) {
              <div class="absolute inset-0 flex items-center justify-center text-white/90">Kamera preview hali yoqilmagan</div>
            }
          </div>
          <div class="space-y-3">
            <button class="btn-primary w-full" (click)="startSystemCheck()" [disabled]="streamReady()">Kamera + mikrofonni ulash</button>
            <button class="btn-secondary w-full" (click)="stopSystemCheck()" [disabled]="!streamReady()">Tekshiruvni to‘xtatish</button>
            <div class="p-3 rounded-xl bg-slate-50 border text-sm">
              <p class="font-bold">Mikrofon signal</p>
              <div class="mt-2 w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full bg-emerald-500" [style.width.%]="micLevel()"></div>
              </div>
              <p class="text-xs mt-1">{{ micLevel() > 8 ? 'Audio qabul qilinyapti' : 'Signal sust' }}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border text-xs space-y-1">
              <p>{{ faceStatus() }}</p>
              <p>{{ chestStatus() }}</p>
              <p>{{ lightStatus() }}</p>
              <p>{{ micStatus() }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black mb-3">Simptom anketa</h3>
        <div class="grid md:grid-cols-3 gap-3 text-sm">
          <label class="space-y-1">Yo‘tal
            <select class="input-field w-full" [value]="questionnaire().cough" (change)="setQ('cough', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="yengil">Yengil</option><option value="orta">O‘rta</option><option value="kuchli">Kuchli</option>
            </select>
          </label>
          <label class="space-y-1">Hansirash
            <select class="input-field w-full" [value]="questionnaire().breathlessness" (change)="setQ('breathlessness', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="faollikda">Faollikda</option><option value="damdaHam">Dam holatida ham</option>
            </select>
          </label>
          <label class="space-y-1">Isitma
            <select class="input-field w-full" [value]="questionnaire().fever" (change)="setQ('fever', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="bor">Bor</option>
            </select>
          </label>
          <label class="space-y-1">Balgham
            <select class="input-field w-full" [value]="questionnaire().sputum" (change)="setQ('sputum', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="kam">Kam</option><option value="kop">Ko‘p</option>
            </select>
          </label>
          <label class="space-y-1">Astma tarixi
            <select class="input-field w-full" [value]="questionnaire().asthmaHistory" (change)="setQ('asthmaHistory', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="bor">Bor</option>
            </select>
          </label>
          <label class="space-y-1">Chekish tarixi
            <select class="input-field w-full" [value]="questionnaire().smokingHistory" (change)="setQ('smokingHistory', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="oldin">Oldin</option><option value="hozir">Hozir</option>
            </select>
          </label>
          <label class="space-y-1">Ko‘krak og‘rig‘i
            <select class="input-field w-full" [value]="questionnaire().chestPain" (change)="setQ('chestPain', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="yengil">Yengil</option><option value="sezilarli">Sezilarli</option>
            </select>
          </label>
          <label class="space-y-1">Tun simptomlari
            <select class="input-field w-full" [value]="questionnaire().nighttimeSymptoms" (change)="setQ('nighttimeSymptoms', $any($event.target).value)">
              <option value="yoq">Yo‘q</option><option value="ba'zan">Ba'zan</option><option value="tez-tez">Tez-tez</option>
            </select>
          </label>
          <label class="space-y-1">Davomiylik (kun)
            <input class="input-field w-full" type="number" min="0" [value]="questionnaire().symptomDurationDays" (input)="setQ('symptomDurationDays', +$any($event.target).value || 0)">
          </label>
        </div>
      </section>

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-black">Testni boshlash</h3>
            <p class="text-sm text-medical-text-muted">Avtomatik ketma-ketlik: {{ tests.length }} ta test. Har bir testdan oldin ko‘rsatma chiqadi.</p>
          </div>
          <button class="btn-primary" (click)="startGuidedFlow()" [disabled]="!streamReady() || running()">Tushundim, boshlayman</button>
        </div>

        @if (activeTest(); as t) {
          <div class="mt-4 p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30">
            <p class="text-sm uppercase font-black text-indigo-700">Test bajarilishi</p>
            <h4 class="text-lg font-black mt-1">{{ t.title }}</h4>
            <p class="text-sm text-medical-text-muted">{{ t.description }}</p>
            <ul class="list-disc pl-5 mt-2 text-sm">
              @for (ins of t.instructions; track ins) { <li>{{ ins }}</li> }
            </ul>
            <p class="mt-2 text-sm text-indigo-700 font-semibold">{{ liveHint() }}</p>
            <div class="w-full h-2 rounded-full bg-slate-200 mt-3"><div class="h-2 rounded-full bg-indigo-600" [style.width.%]="progress()"></div></div>
            <p class="text-xs mt-1">Qolgan vaqt: {{ timeLeft() }}s</p>
          </div>
        }
      </section>

      @if (latestSession(); as result) {
        <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm space-y-4">
          <h3 class="text-2xl font-black">Natijalar</h3>
          <div class="grid md:grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl border bg-slate-50"><p class="text-xs">Skrining xavf foizi</p><p class="text-3xl font-black text-rose-600">{{ result.riskPercent }}%</p></div>
            <div class="p-4 rounded-2xl border bg-slate-50"><p class="text-xs">Normaga yaqinlik</p><p class="text-3xl font-black text-emerald-600">{{ result.normalityPercent }}%</p></div>
            <div class="p-4 rounded-2xl border bg-slate-50"><p class="text-xs">Tahlil turi</p><p class="text-2xl font-black">{{ result.source === 'ai' ? 'Kengaytirilgan AI tahlili' : 'Lokal tahlil' }}</p></div>
          </div>

          <div class="grid lg:grid-cols-2 gap-4 text-sm">
            <div class="p-4 border rounded-2xl"><h4 class="font-black">1) Qisqa xulosa</h4><p>{{ result.interpretation.qisqaXulosa }}</p></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">2) Topilgan belgilar</h4><ul class="list-disc pl-5">@for (x of result.interpretation.topilganBelgilar; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">3) Nega tizim shunday xulosaga keldi?</h4><ul class="list-disc pl-5">@for (x of result.interpretation.negaXulosa; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">4) Qaysi ko‘rsatkichlar bunga sabab bo‘ldi?</h4><ul class="list-disc pl-5">@for (x of result.interpretation.metrikSabablar; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">5) Mos keluvchi yo‘nalishlar</h4><ul class="list-disc pl-5">@for (x of result.interpretation.ehtimoliyYonalislar; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">6) Nega aynan shu yo‘nalishlar?</h4><ul class="list-disc pl-5">@for (x of result.interpretation.negaMos; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">7) Skrining bo‘yicha xavf darajasi</h4><p class="uppercase font-black">{{ result.interpretation.skriningXavfDarajasi }}</p></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">8) Normaga yaqinlik bahosi</h4><p>{{ result.interpretation.normagaYaqinlikBahosi }}</p></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">9) O‘ta chuqur tavsiyalar</h4><ul class="list-disc pl-5">@for (x of result.interpretation.chuqurTavsiyalar; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">10) Uy sharoitida o‘zgarishlar</h4><ul class="list-disc pl-5">@for (x of result.interpretation.uySharoitidaOzgarishlar; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">11) Recovery / follow-up</h4><ul class="list-disc pl-5">@for (x of result.interpretation.followUpRejasi; track x) {<li>{{ x }}</li>}</ul></div>
            <div class="p-4 border rounded-2xl"><h4 class="font-black">12) Qachon shifokorga murojaat qilish kerak?</h4><ul class="list-disc pl-5">@for (x of result.interpretation.shifokorgaQachon; track x) {<li>{{ x }}</li>}</ul></div>
          </div>

          <h4 class="font-black">Diagrammalar</h4>
          <div class="grid xl:grid-cols-3 gap-4">
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Respirator waveform</p>
              <svg viewBox="0 0 300 120" class="w-full h-28 mt-2">
                <polyline [attr.points]="waveformPoints(result.waveform)" fill="none" stroke="#2563eb" stroke-width="2.5"></polyline>
              </svg>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Ko‘krak harakati area chart</p>
              <svg viewBox="0 0 300 120" class="w-full h-28 mt-2">
                <path [attr.d]="motionAreaPath(result.motionSeries || [])" fill="#93c5fd88" stroke="#0ea5e9" stroke-width="2"></path>
              </svg>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Normaga yaqinlik gauge</p>
              <div class="mt-3 h-16 rounded-t-full" [style.background]="semiGaugeBackground(result.normalityPercent)"></div>
              <p class="text-center text-sm font-black mt-1">{{ result.normalityPercent }}%</p>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Line trend (so‘nggi sessiyalar)</p>
              <svg viewBox="0 0 300 120" class="w-full h-28 mt-2">
                <polyline [attr.points]="lineChartPoints()" fill="none" stroke="#2563eb" stroke-width="3"></polyline>
              </svg>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Donut: xavf / norma</p>
              <div class="w-28 h-28 rounded-full mx-auto mt-2" [style.background]="donutBackground(result.riskPercent)"></div>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Radar-uslub profil</p>
              <div class="space-y-2 mt-2 text-xs">
                @for (r of radarRows(result.metrics); track r.label) {
                  <div><div class="flex justify-between"><span>{{ r.label }}</span><span>{{ r.value }}</span></div><div class="h-2 bg-slate-200 rounded-full"><div class="h-2 bg-cyan-600 rounded-full" [style.width.%]="r.value"></div></div></div>
                }
              </div>
            </div>
            <div class="p-4 border rounded-2xl xl:col-span-2">
              <p class="text-xs font-black">Timeline: sessiyalar bo‘yicha xavf o‘zgarishi</p>
              <svg viewBox="0 0 420 120" class="w-full h-28 mt-2">
                <polyline [attr.points]="timelinePoints()" fill="none" stroke="#7c3aed" stroke-width="2"></polyline>
              </svg>
            </div>
            <div class="p-4 border rounded-2xl">
              <p class="text-xs font-black">Stacked comparison (joriy vs oldingi)</p>
              @for (c of stackedComparison(result.metrics); track c.label) {
                <div class="mt-2">
                  <div class="flex justify-between text-xs"><span>{{ c.label }}</span><span>{{ c.current }}/{{ c.previous }}</span></div>
                  <div class="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div class="h-2 bg-emerald-500" [style.width.%]="c.current"></div>
                    <div class="h-2 bg-indigo-300" [style.width.%]="100-c.current"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black">Tarix va kuzatuv</h3>
        @if (sessions().length) {
          <div class="mt-3 space-y-2">
            @for (s of sessions(); track s.id) {
              <button class="w-full text-left p-3 rounded-xl border hover:bg-slate-50" (click)="latestSession.set(s)">
                <div class="flex justify-between text-sm"><span>{{ formatDate(s.createdAt) }}</span><span class="font-black">Xavf: {{ s.riskPercent }}%</span></div>
              </button>
            }
          </div>
        } @else {
          <p class="text-sm text-medical-text-muted mt-2">Hali saqlangan sessiyalar yo‘q.</p>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RespiratoryVoiceComponent implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  private storage = inject(RespiratoryVoiceStorageService);
  private interpretationService = inject(RespiratoryVoiceInterpretationService);

  readonly tests: RespiratoryTest[] = [
    {
      id: 'rest_breathing',
      title: 'Rest Breathing Analysis',
      description: '30 soniya tinch nafas monitoringi.',
      durationSec: 30,
      instructions: ['Nafasni tabiiy oling, majburlamang.', 'Yuz va ko‘krak kamera ichida bo‘lsin.'],
      mistakes: ['Juda tez harakatlanish', 'Kameradan uzoqlashish'],
      measures: ['breathingRate', 'breathingRhythmVariability', 'pauseFrequency'],
      liveHints: ['Yuzingiz kamera ichida to‘liq ko‘rinsin', 'Nafasni tabiiy oling']
    },
    {
      id: 'rest_audio',
      title: 'Rest Audio Analysis',
      description: 'Tinch audio signal tahlili.',
      durationSec: 20,
      instructions: ['Atrof shovqinini kamaytiring.', 'Mikrofondan bir xil masofada turing.'],
      mistakes: ['Fon shovqini', 'Mikrofondan juda uzoq turish'],
      measures: ['audioIrregularityScore'],
      liveHints: ['Tizim audio signalni tekshirmoqda', 'Signal sust bo‘lsa mikrofonga yaqinlashing']
    },
    {
      id: 'speech_reading',
      title: 'Speech Reading Test',
      description: 'Uzbek matnini o‘qish orqali nafas-gap koordinatsiyasi.',
      durationSec: 25,
      instructions: ['"Bugun nafasimni tabiiy ritmda kuzatib boryapman" matnini takrorlab o‘qing.'],
      mistakes: ['Haddan tashqari tez gapirish'],
      measures: ['speechBreathInterruptions', 'phraseContinuityScore'],
      liveHints: ['Matnni odatdagi ovoz balandligida o‘qing', 'Mikrofonga aniq gapiring']
    },
    {
      id: 'speech_speed',
      title: 'Speech Speed/Frequency',
      description: 'Nutq sur’ati va pacing tahlili.',
      durationSec: 20,
      instructions: ['Barqaror sur’atda gapiring.', 'Har iboradan so‘ng qisqa pauza qoldiring.'],
      mistakes: ['Sur’atni keskin o‘zgartirish'],
      measures: ['speechRate', 'speechRateVariability'],
      liveHints: ['Gapirish testi davom etmoqda']
    },
    {
      id: 'cough',
      title: 'Cough Analysis',
      description: '2-3 ta yo‘tal namunasini yozib olish.',
      durationSec: 15,
      instructions: ['2 yoki 3 marta aniq yo‘tal namunasini bering.'],
      mistakes: ['Juda sust yo‘tal', 'Mikrofondan uzoq turish'],
      measures: ['coughIntensityPattern', 'coughRepetitionPattern'],
      liveHints: ['Yo‘talni aniq yozib oling']
    },
    {
      id: 'video_motion',
      title: 'Video Breathing Motion',
      description: 'Ko‘krak harakat amplitudasi/regularligi.',
      durationSec: 20,
      instructions: ['Ko‘krak qafasi kamera ichida yaxshi ko‘rinsin.'],
      mistakes: ['Yorug‘lik yetarli emas'],
      measures: ['chestMotionAmplitude', 'chestMotionRegularity', 'visibleRespiratoryEffort'],
      liveHints: ['Ko‘krak qafasi kamera ichida yaxshi ko‘rinsin', 'Yorug‘likni oshiring']
    },
    {
      id: 'recovery',
      title: 'Recovery Test',
      description: 'Yengil harakatdan keyin tiklanish monitoringi.',
      durationSec: 20,
      instructions: ['5 soniya yengil harakat qiling, so‘ng tinch holatga qayting.'],
      mistakes: ['Keskin ortiqcha yuklama'],
      measures: ['recoveryTime', 'recoverySlope'],
      liveHints: ['Nafas tiklanishini kuzatamiz']
    }
  ];

  streamReady = signal(false);
  running = signal(false);
  activeTest = signal<RespiratoryTest | null>(null);
  timeLeft = signal(0);
  progress = signal(0);
  liveHint = signal('Tizim tayyor.');
  micLevel = signal(0);
  faceStatus = signal('Yuz aniqligi: kutilmoqda');
  chestStatus = signal('Ko‘krak ko‘rinishi: kutilmoqda');
  lightStatus = signal('Yorug‘lik: kutilmoqda');
  micStatus = signal('Mikrofon: kutilmoqda');
  latestSession = signal<RespiratoryVoiceSession | null>(null);
  sessions = signal<RespiratoryVoiceSession[]>(this.storage.listSessions());

  questionnaire = signal<RespiratoryVoiceQuestionnaire>({
    cough: 'yoq',
    sputum: 'yoq',
    fever: 'yoq',
    breathlessness: 'yoq',
    chestPain: 'yoq',
    asthmaHistory: 'yoq',
    allergyHistory: 'yoq',
    smokingHistory: 'yoq',
    recentViralIllness: 'yoq',
    symptomDurationDays: 0,
    exertionalWorsening: 'yoq',
    nighttimeSymptoms: 'yoq'
  });

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioData = new Uint8Array(256);
  private micTimer: number | null = null;
  private testTimer: number | null = null;
  private testTick = 0;
  private waveform: number[] = [];
  private motionSeries: number[] = [];
  private prevFrame?: Uint8ClampedArray;

  setQ<K extends keyof RespiratoryVoiceQuestionnaire>(key: K, value: RespiratoryVoiceQuestionnaire[K]) {
    this.questionnaire.update((prev) => ({ ...prev, [key]: value }));
  }

  async startSystemCheck() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
      }
      this.setupAudio(this.stream);
      this.streamReady.set(true);
      this.liveHint.set('Tizim tayyor. Testni boshlashingiz mumkin.');
      this.startPreviewCheck();
    } catch (error) {
      console.error(error);
      this.liveHint.set('Kamera/mikrofon ruxsati rad etildi yoki qurilma mavjud emas.');
    }
  }

  stopSystemCheck() {
    this.cleanupMedia();
    this.streamReady.set(false);
    this.running.set(false);
    this.activeTest.set(null);
  }

  async startGuidedFlow() {
    if (!this.streamReady() || this.running()) return;
    this.running.set(true);
    this.waveform = [];
    this.motionSeries = [];

    for (const test of this.tests) {
      this.activeTest.set(test);
      this.liveHint.set(test.liveHints[0] || 'Test davom etmoqda');
      await this.runSingleTest(test);
    }

    const metrics = this.buildMetrics();
    const interpreted = await this.interpretationService.interpret(metrics, this.questionnaire());

    const session: RespiratoryVoiceSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `resp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      metrics,
      questionnaire: this.questionnaire(),
      waveform: this.waveform.slice(-200),
      motionSeries: this.motionSeries.slice(-200),
      interpretation: interpreted.interpretation,
      riskPercent: interpreted.riskPercent,
      normalityPercent: interpreted.normalityPercent,
      source: interpreted.source
    };

    this.storage.saveSession(session);
    this.sessions.set(this.storage.listSessions());
    this.latestSession.set(session);
    this.running.set(false);
    this.activeTest.set(null);
    this.liveHint.set('Test muvaffaqiyatli yakunlandi');
  }

  private runSingleTest(test: RespiratoryTest): Promise<void> {
    return new Promise((resolve) => {
      const total = test.durationSec;
      this.timeLeft.set(total);
      this.progress.set(0);
      this.testTick = 0;

      if (this.testTimer) {
        clearInterval(this.testTimer);
      }

      this.testTimer = window.setInterval(() => {
        this.testTick += 1;
        const left = Math.max(0, total - this.testTick);
        this.timeLeft.set(left);
        this.progress.set((this.testTick / total) * 100);
        this.sampleSignals();

        if (this.testTick % 6 === 0 && test.liveHints.length > 1) {
          this.liveHint.set(test.liveHints[(this.testTick / 6) % test.liveHints.length]);
        }

        if (this.testTick >= total) {
          if (this.testTimer) clearInterval(this.testTimer);
          resolve();
        }
      }, 1000);
    });
  }

  private setupAudio(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const src = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    src.connect(this.analyser);
  }

  private startPreviewCheck() {
    if (this.micTimer) clearInterval(this.micTimer);
    this.micTimer = window.setInterval(() => {
      this.sampleSignals();
      this.lightStatus.set(this.estimateBrightness() < 45 ? 'Kamerada yorug‘lik yetarli emas' : 'Yorug‘lik me’yorida');
      this.faceStatus.set(this.estimateBrightness() > 20 ? 'Yuz pozitsiyasi qabul qilindi' : 'Yuz kam ko‘rinmoqda');
      this.chestStatus.set(this.motionSeries.slice(-8).reduce((a, b) => a + b, 0) > 2 ? 'Ko‘krak harakati ko‘rinmoqda' : 'Ko‘krak ko‘rinishini yaxshilang');
      this.micStatus.set(this.micLevel() > 8 ? 'Mikrofon signal yaxshi' : 'Tizim audio signalni yetarli qabul qilmayapti');
    }, 800);
  }

  private sampleSignals() {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.audioData);
      const rms = Math.sqrt(this.audioData.reduce((acc, n) => {
        const v = (n - 128) / 128;
        return acc + v * v;
      }, 0) / this.audioData.length);
      const level = Math.min(100, Math.round(rms * 260));
      this.micLevel.set(level);
      this.waveform.push(level);
    }

    const motion = this.estimateMotion();
    this.motionSeries.push(motion);
  }

  private estimateBrightness(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (data.length / 4);
  }

  private estimateMotion(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const current = ctx.getImageData(0, 0, 64, 48).data;
    if (!this.prevFrame) {
      this.prevFrame = current;
      return 0;
    }

    let diff = 0;
    for (let i = 0; i < current.length; i += 16) {
      diff += Math.abs(current[i] - this.prevFrame[i]);
    }
    this.prevFrame = current;
    return Math.min(100, diff / 80);
  }

  private buildMetrics(): RespiratoryVoiceMetrics {
    const audio = this.waveform.length ? this.waveform : [0];
    const motion = this.motionSeries.length ? this.motionSeries : [0];

    const meanAudio = this.avg(audio);
    const varAudio = this.std(audio);
    const meanMotion = this.avg(motion);
    const varMotion = this.std(motion);

    const breathingRate = Math.max(8, Math.min(36, Math.round(10 + meanMotion / 2 + varMotion / 3)));
    const speechRate = Math.max(70, Math.min(190, Math.round(90 + meanAudio * 1.8)));
    const symptomScore = this.symptomScore(this.questionnaire());

    const metrics: RespiratoryVoiceMetrics = {
      breathingRate,
      breathingRhythmVariability: this.clamp(Math.round(varMotion * 2.3), 0, 100),
      breathIntervalVariability: this.clamp(Math.round(varMotion * 2), 0, 100),
      pauseFrequency: this.clamp(Math.round((audio.filter((v) => v < 5).length / audio.length) * 100), 0, 100),
      pauseDurationBurden: this.clamp(Math.round((audio.filter((v) => v < 3).length / audio.length) * 120), 0, 100),
      chestMotionAmplitude: this.clamp(Math.round(meanMotion * 1.4), 0, 100),
      chestMotionRegularity: this.clamp(100 - Math.round(varMotion * 2), 0, 100),
      visibleRespiratoryEffort: this.clamp(Math.round(meanMotion + varMotion), 0, 100),
      chestMotionSymmetryScore: this.clamp(100 - Math.round(varMotion * 1.5), 0, 100),
      speechRate,
      speechRateVariability: this.clamp(Math.round(varAudio * 2), 0, 100),
      speechBreathInterruptions: this.clamp(Math.round((audio.filter((v, i) => i > 0 && Math.abs(v - audio[i - 1]) > 18).length / audio.length) * 150), 0, 100),
      phraseContinuityScore: this.clamp(100 - Math.round(varAudio * 1.4), 0, 100),
      readingBreathEfficiency: this.clamp(100 - Math.round((varAudio + varMotion) * 1.1), 0, 100),
      coughIntensityPattern: this.clamp(Math.round(Math.max(...audio) * 1.3), 0, 100),
      coughRepetitionPattern: this.clamp(Math.round((audio.filter((v) => v > 35).length / audio.length) * 160), 0, 100),
      coughBurdenIndex: this.clamp(Math.round((Math.max(...audio) * 0.6) + (audio.filter((v) => v > 35).length / Math.max(1, audio.length)) * 100), 0, 100),
      audioIrregularityScore: this.clamp(Math.round(varAudio * 2.1), 0, 100),
      recoveryTime: this.clamp(Math.round(8 + varMotion / 2), 0, 100),
      recoverySlope: this.clamp(Math.round(100 - varMotion * 1.8), 0, 100),
      symptomBurdenScore: symptomScore,
      overallRespiratoryStability: this.clamp(Math.round(100 - (varMotion * 1.2 + varAudio * 0.8)), 0, 100),
      overallFunctionalRecovery: this.clamp(Math.round(100 - varMotion * 1.5), 0, 100),
      overallSpeechBreathEfficiency: this.clamp(Math.round(100 - varAudio * 1.3), 0, 100),
      overallRespiratoryPerformance: this.clamp(Math.round(100 - ((symptomScore * 0.5) + (varMotion * 0.8))), 0, 100),
      normalityProximityScore: this.clamp(Math.round(100 - ((symptomScore * 0.5) + (varAudio * 0.7) + (varMotion * 0.7))), 0, 100),
      concernIndex: this.clamp(Math.round((symptomScore * 0.6) + (varAudio * 0.8) + (varMotion * 0.8)), 0, 100)
    };

    return metrics;
  }

  waveformPoints(data: number[]): string {
    if (!data.length) return '0,60 300,60';
    return data.slice(-120).map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 300},${110 - v}`).join(' ');
  }

  motionAreaPath(data: number[]): string {
    if (!data.length) return 'M0,110 L300,110 Z';
    const pts = data.slice(-120).map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 300},${110 - v}`);
    return `M0,110 L${pts.join(' L')} L300,110 Z`;
  }

  semiGaugeBackground(percent: number): string {
    return `conic-gradient(from 180deg, #10b981 ${percent * 1.8}deg, #e5e7eb ${percent * 1.8}deg 180deg)`;
  }

  timelinePoints(): string {
    const pts = this.sessions().slice(0, 10).reverse();
    if (!pts.length) return '0,100 420,100';
    return pts.map((s, i) => `${(i / Math.max(1, pts.length - 1)) * 420},${105 - s.riskPercent}`).join(' ');
  }

  stackedComparison(metrics: RespiratoryVoiceMetrics) {
    const previous = this.sessions().find((s) => s.id !== this.latestSession()?.id);
    const prev = previous?.metrics;
    return [
      { label: 'Respirator barqarorlik', current: metrics.overallRespiratoryStability, previous: prev?.overallRespiratoryStability ?? metrics.overallRespiratoryStability },
      { label: 'Funksional recovery', current: metrics.overallFunctionalRecovery, previous: prev?.overallFunctionalRecovery ?? metrics.overallFunctionalRecovery },
      { label: 'Speech-breath', current: metrics.overallSpeechBreathEfficiency, previous: prev?.overallSpeechBreathEfficiency ?? metrics.overallSpeechBreathEfficiency }
    ];
  }

  lineChartPoints(): string {
    const pts = this.sessions().slice(0, 8).reverse();
    if (!pts.length) return '0,100 300,100';
    return pts.map((s, i) => `${(i / Math.max(1, pts.length - 1)) * 300},${100 - s.riskPercent}`).join(' ');
  }

  donutBackground(risk: number): string {
    return `conic-gradient(#e11d48 ${risk}%, #10b981 ${risk}% 100%)`;
  }

  radarRows(metrics: RespiratoryVoiceMetrics) {
    return [
      { label: 'Respirator barqarorlik', value: metrics.overallRespiratoryStability },
      { label: 'Speech-breath samaradorlik', value: metrics.overallSpeechBreathEfficiency },
      { label: 'Recovery', value: metrics.overallFunctionalRecovery },
      { label: 'Normaga yaqinlik', value: metrics.normalityProximityScore },
      { label: 'Concern index', value: metrics.concernIndex }
    ];
  }

  formatDate(input: string): string {
    return new Date(input).toLocaleString();
  }

  private symptomScore(q: RespiratoryVoiceQuestionnaire): number {
    let s = 0;
    s += ({ yoq: 0, yengil: 12, orta: 24, kuchli: 35 } as const)[q.cough];
    s += ({ yoq: 0, faollikda: 20, damdaHam: 35 } as const)[q.breathlessness];
    s += ({ yoq: 0, bor: 12 } as const)[q.fever];
    s += ({ yoq: 0, yengil: 8, sezilarli: 18 } as const)[q.chestPain];
    s += ({ yoq: 0, oldin: 8, hozir: 18 } as const)[q.smokingHistory];
    s += ({ yoq: 0, "ba'zan": 6, 'tez-tez': 15 } as const)[q.nighttimeSymptoms];
    s += Math.min(18, q.symptomDurationDays / 2);
    return this.clamp(Math.round(s), 0, 100);
  }

  private avg(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
  }

  private std(arr: number[]): number {
    const mean = this.avg(arr);
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, arr.length);
    return Math.sqrt(variance);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(v)));
  }

  private cleanupMedia() {
    if (this.testTimer) clearInterval(this.testTimer);
    if (this.micTimer) clearInterval(this.micTimer);
    this.testTimer = null;
    this.micTimer = null;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.prevFrame = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupMedia();
  }
}
