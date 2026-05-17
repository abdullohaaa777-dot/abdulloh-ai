import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HandTrackerService, NormalizedHandLandmarkerResult } from '../../services/hand-tracker';
import { NormalizedPoseLandmarkerResult, PoseTrackerService } from '../../services/pose-tracker';
import {
  RehabilitationExerciseDefinition,
  RehabilitationExerciseResult,
  RehabilitationPlan,
  RehabilitationSession,
  RehabilitationStorageService
} from '../../services/rehabilitation-storage';
import { SupabaseService } from '../../services/supabase';

interface RehabilitationPatientOption {
  id: string;
  name: string;
}

interface RehabilitationLiveMetrics {
  shoulderAngle: number;
  elbowAngle: number;
  wristAngle: number;
  hipAngle: number;
  kneeAngle: number;
  rangeOfMotion: number;
  repetitions: number;
  correctRepetitions: number;
  wrongRepetitions: number;
  speed: number;
  tremor: number;
  symmetry: number;
  fatigue: number;
  smoothness: number;
  movementQuality: number;
  trajectoryDeviation: number;
  signalQuality: number;
}

const REHAB_POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]
];
const REHAB_HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

@Component({
  selector: 'app-rehabilitation-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="rehab-shell min-h-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
      <section class="rehab-hero relative p-6 md:p-8 overflow-hidden text-white">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,.28),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,.24),transparent_30%),linear-gradient(135deg,#0f172a,#0f766e_55%,#1d4ed8)]"></div>
        <div class="relative z-10 grid lg:grid-cols-[1.2fr_.8fr] gap-6 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm backdrop-blur-sm">
              <mat-icon class="!text-[18px]">accessibility_new</mat-icon>
              <span>Aqlli reabilitatsiya mashqlarini nazorat qilish moduli</span>
            </div>
            <h1 class="mt-5 text-4xl md:text-5xl font-black tracking-tight">Reabilitatsiya nazorati</h1>
            <p class="mt-4 text-teal-50/95 max-w-3xl text-lg">Kamera orqali skelet tracking, qo‘l va butun tana harakatlari, real-time feedback, 100 ballik baholash, shifokor paneli va progress monitoring.</p>
            <p class="mt-4 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-4 text-sm text-amber-50">Bu natijalar reabilitatsiya jarayonini kuzatishga yordam beradi. Og‘riq, bosh aylanishi, nafas qisishi yoki holsizlik bo‘lsa mashqni to‘xtating va shifokorga murojaat qiling.</p>
          </div>
          <div class="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md p-5 shadow-2xl">
            <p class="text-sm text-teal-100">Bugungi reabilitatsiya balli</p>
            <div class="mt-3 flex items-end justify-between gap-3"><p class="text-5xl font-black">{{ rehabilitationLatestScore() }}%</p><span class="px-3 py-1 rounded-full text-sm bg-emerald-400/15 text-emerald-50 border border-emerald-200/20">{{ rehabilitationProgressLabel() }}</span></div>
            <div class="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" [style.width.%]="rehabilitationLatestScore()"></div></div>
            <div class="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div class="rounded-xl bg-white/10 p-3"><p class="text-teal-100">Sifat</p><p class="font-bold text-lg">{{ rehabilitationMetrics().movementQuality }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-teal-100">Simmetriya</p><p class="font-bold text-lg">{{ rehabilitationMetrics().symmetry }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-teal-100">Signal</p><p class="font-bold text-lg">{{ rehabilitationMetrics().signalQuality }}%</p></div>
            </div>
          </div>
        </div>
      </section>

      <section class="p-5 md:p-7 space-y-6">
        <div class="grid xl:grid-cols-[1.1fr_.9fr] gap-5">
          <div class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 class="text-xl font-black">Jonli kamera va skelet overlay</h2>
                <p class="text-sm text-slate-500">Tayyorlanish, mashq bajarish, tahlil va yakuniy natijada skelet ko‘rinadi.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button class="rehab-btn-primary" (click)="rehabilitationStartCamera()" [disabled]="rehabilitationCameraReady()">Kamerani yoqish</button>
                <button class="rehab-btn-secondary" (click)="rehabilitationStopCamera()" [disabled]="!rehabilitationCameraReady()">To‘xtatish</button>
              </div>
            </div>
            <div class="rehab-video-wrap">
              <video #rehabVideo autoplay muted playsinline class="rehab-video"></video>
              <canvas #rehabCanvas class="rehab-canvas"></canvas>
              <div class="rehab-badges">
                <span [class]="rehabilitationFeedbackClass()">{{ rehabilitationFeedback() }}</span>
                <span class="rehab-badge-blue">Skelet: {{ rehabilitationSkeletonQuality() }}%</span>
                <span class="rehab-badge-green">Qo‘l: {{ rehabilitationHandDetected() ? 'aniqlandi' : 'kutilmoqda' }}</span>
              </div>
            </div>
            <div class="grid md:grid-cols-4 gap-3 p-4 text-sm">
              @for (check of rehabilitationPreflightChecks(); track check.label) {
                <div class="rounded-2xl border p-3" [class.border-emerald-200]="check.ok" [class.bg-emerald-50]="check.ok" [class.border-amber-200]="!check.ok" [class.bg-amber-50]="!check.ok">
                  <p class="font-bold">{{ check.label }}</p><p class="text-xs text-slate-600 mt-1">{{ check.message }}</p>
                </div>
              }
            </div>
          </div>

          <div class="space-y-5">
            <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-xl font-black">Reabilitatsiya mashqlari</h2>
                  <p class="text-sm text-slate-500">Bugungi mashqni tanlang yoki tizim tavsiya qilgan ro‘yxatdan boshlang.</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold">Bemor paneli</span>
              </div>
              <div class="mt-4 grid sm:grid-cols-2 gap-3">
                <div><div class="rehab-label">Bemor profili</div><select class="rehab-input" [(ngModel)]="rehabilitationSelectedPatientId"><option value="umumiy">Umumiy / mehmon</option>@for (patient of rehabilitationPatients(); track patient.id) { <option [value]="patient.id">{{ patient.name }}</option> }</select></div>
                <div><div class="rehab-label">Mashq tanlash</div><select class="rehab-input" [(ngModel)]="rehabilitationSelectedExerciseId">@for (exercise of rehabilitationExercises; track exercise.id) { <option [value]="exercise.id">{{ exercise.nameUz }}</option> }</select></div>
              </div>
              <div class="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <h3 class="font-black">{{ rehabilitationSelectedExercise()?.nameUz }}</h3>
                <p class="text-sm text-slate-600 mt-1">{{ rehabilitationSelectedExercise()?.instructionUz }}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs"><span class="rehab-pill">{{ rehabilitationSelectedExercise()?.type }}</span><span class="rehab-pill">{{ rehabilitationSelectedExercise()?.targetBodyPart }}</span><span class="rehab-pill">{{ rehabilitationSelectedExercise()?.repetitionsTarget }} takror</span></div>
              </div>
              <div class="mt-4 flex flex-wrap gap-3">
                <button class="rehab-btn-primary" (click)="rehabilitationStartExercise()" [disabled]="rehabilitationExerciseRunning()">Mashqni boshlash</button>
                <button class="rehab-btn-secondary" (click)="rehabilitationFinishExercise()" [disabled]="!rehabilitationExerciseRunning()">Mashqni yakunlash</button>
                <button class="rehab-btn-secondary" (click)="rehabilitationSaveSession()" [disabled]="!rehabilitationExerciseResults().length">Sessiyani saqlash</button>
              </div>
            </section>

            <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="font-black">Real vaqt feedback</h3>
              <div class="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg font-bold" [class.text-emerald-700]="rehabilitationFeedbackTone() === 'good'" [class.text-amber-700]="rehabilitationFeedbackTone() === 'warn'" [class.text-red-700]="rehabilitationFeedbackTone() === 'bad'">{{ rehabilitationFeedback() }}</div>
              <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                @for (metric of rehabilitationMetricCards(); track metric.label) {<div class="rehab-metric"><p>{{ metric.label }}</p><strong>{{ metric.value }}{{ metric.unit }}</strong></div>}
              </div>
            </section>
          </div>
        </div>

        <section class="grid xl:grid-cols-[.95fr_1.05fr] gap-5">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-xl font-black">Shifokor / fizioterapevt paneli</h2>
            <p class="text-sm text-slate-500 mt-1">Individual reja, klinik tavsiyalar, mashq tarixi va eng ko‘p xatolarni kuzatish.</p>
            <div class="mt-4 grid sm:grid-cols-2 gap-3">
              <input class="rehab-input" [(ngModel)]="rehabilitationPlanTitle" placeholder="Reja nomi">
              <input class="rehab-input" type="number" [(ngModel)]="rehabilitationPlanDays" placeholder="Davomiylik (kun)">
              <input class="rehab-input sm:col-span-2" [(ngModel)]="rehabilitationPlanPrecautions" placeholder="Og‘riq bo‘lsa to‘xtatish eslatmasi / maksimal amplituda cheklovi">
            </div>
            <button class="rehab-btn-primary mt-3" (click)="rehabilitationSavePlan()">Individual reja saqlash</button>
            <div class="mt-5 space-y-3">
              @for (plan of rehabilitationPlans(); track plan.id) {<div class="rounded-2xl border border-slate-200 p-4"><div class="flex justify-between gap-3"><strong>{{ plan.title }}</strong><span class="text-xs text-teal-700">{{ plan.durationDays }} kun</span></div><p class="text-sm text-slate-600 mt-1">{{ plan.precautions }}</p></div>}
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="text-xl font-black">Yakuniy natijalar va grafiklar</h2><button class="rehab-btn-secondary" (click)="rehabilitationPrintReport()">Chop etish / PDF</button></div>
            @if (rehabilitationLatestSession(); as session) {
              <div class="grid sm:grid-cols-4 gap-3 mt-4"><div class="rehab-metric"><p>Umumiy ball</p><strong>{{ session.totalScore }}%</strong></div><div class="rehab-metric"><p>To‘g‘rilik</p><strong>{{ session.accuracyPercent }}%</strong></div><div class="rehab-metric"><p>Charchash</p><strong>{{ session.fatigueIndex }}%</strong></div><div class="rehab-metric"><p>Simmetriya</p><strong>{{ session.symmetryIndex }}%</strong></div></div>
              <div class="grid lg:grid-cols-2 gap-4 mt-4">
                <div class="rehab-chart"><h3>Har bir mashq balli</h3>@for (bar of session.chartData.exerciseScores; track bar.label) {<div class="mt-2"><div class="flex justify-between text-sm"><span>{{ bar.label }}</span><span>{{ bar.value }}%</span></div><div class="h-2 bg-slate-100 rounded-full"><div class="h-full bg-teal-500 rounded-full" [style.width.%]="bar.value"></div></div></div>}</div>
                <div class="rehab-chart"><h3>Bo‘g‘im burchaklari</h3>@for (joint of session.chartData.jointAngles; track joint.joint) {<div class="mt-2"><div class="flex justify-between text-sm"><span>{{ joint.joint }}</span><span>{{ joint.value }}° / ideal {{ joint.ideal }}°</span></div><div class="h-2 bg-slate-100 rounded-full"><div class="h-full bg-blue-500 rounded-full" [style.width.%]="rehabilitationAngleWidth(joint.value)"></div></div></div>}</div>
                <div class="rehab-chart"><h3>To‘g‘ri / noto‘g‘ri takrorlar</h3>@for (rep of session.chartData.repetitions; track rep.label) {<div class="mt-2 grid grid-cols-[1fr_2fr] gap-2 text-sm"><span>{{ rep.label }}</span><div class="flex h-3 rounded-full overflow-hidden bg-red-100"><div class="bg-emerald-500" [style.width.%]="rehabilitationRepWidth(rep.correct, rep.wrong)"></div><div class="bg-red-400 flex-1"></div></div></div>}</div>
                <div class="rehab-chart"><h3>Harakat trayektoriyasi xaritasi</h3><svg viewBox="0 0 220 140" class="w-full h-40"><polyline points="25,110 60,80 100,45 150,70 195,35" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="6 4"></polyline><polyline [attr.points]="rehabilitationTrajectoryPoints(session)" fill="none" stroke="#2563eb" stroke-width="4"></polyline></svg></div>
              </div>
              <div class="grid lg:grid-cols-2 gap-4 mt-4"><div class="rounded-2xl bg-teal-50 border border-teal-100 p-4"><h3 class="font-black">Bemor uchun tavsiya</h3><p class="text-sm mt-1">{{ session.patientAdvice }}</p></div><div class="rounded-2xl bg-blue-50 border border-blue-100 p-4"><h3 class="font-black">Shifokor uchun klinik xulosa</h3><p class="text-sm mt-1">{{ session.clinicalSummary }}</p></div></div>
            } @else {
              <div class="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">Hali sessiya saqlanmagan. Mashqni bajarib, “Sessiyani saqlash” tugmasini bosing.</div>
            }
          </div>
        </section>
      </section>
    </div>
  `,
  styles: [`
    .rehab-video-wrap { position: relative; aspect-ratio: 16/10; min-height: 280px; background: radial-gradient(circle at center, rgba(20,184,166,.12), #0f172a 70%); }
    .rehab-video, .rehab-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .rehab-canvas { pointer-events: none; }
    .rehab-badges { position: absolute; left: 1rem; right: 1rem; top: 1rem; display: flex; gap: .5rem; flex-wrap: wrap; z-index: 2; }
    .rehab-badge-blue, .rehab-badge-green, .rehab-badge-warn, .rehab-badge-bad { border-radius: 999px; padding: .45rem .75rem; font-size: .78rem; font-weight: 800; backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.2); }
    .rehab-badge-blue { background: rgba(37,99,235,.22); color: #dbeafe; } .rehab-badge-green { background: rgba(16,185,129,.22); color: #d1fae5; } .rehab-badge-warn { background: rgba(245,158,11,.24); color: #fef3c7; } .rehab-badge-bad { background: rgba(239,68,68,.24); color: #fee2e2; }
    .rehab-btn-primary { border-radius: .9rem; background: linear-gradient(90deg,#0d9488,#2563eb); color: white; padding: .75rem 1rem; font-weight: 800; box-shadow: 0 12px 30px rgba(13,148,136,.18); }
    .rehab-btn-secondary { border-radius: .9rem; border: 1px solid rgb(203 213 225); background: white; color: rgb(15 23 42); padding: .75rem 1rem; font-weight: 700; }
    .rehab-btn-primary:disabled, .rehab-btn-secondary:disabled { opacity: .55; cursor: not-allowed; }
    .rehab-input { width: 100%; border-radius: .9rem; border: 1px solid rgb(203 213 225); padding: .8rem 1rem; outline: none; background: white; }
    .rehab-input:focus { border-color: #0d9488; box-shadow: 0 0 0 4px rgba(13,148,136,.12); }
    .rehab-label { display: block; color: rgb(71 85 105); font-size: .78rem; font-weight: 800; margin-bottom: .35rem; }
    .rehab-pill { border-radius: 999px; background: rgb(240 253 250); color: rgb(15 118 110); padding: .35rem .6rem; font-weight: 800; }
    .rehab-metric { border: 1px solid rgb(226 232 240); border-radius: 1rem; background: rgb(248 250 252); padding: 1rem; }
    .rehab-metric p { color: rgb(100 116 139); font-size: .78rem; } .rehab-metric strong { display: block; color: rgb(15 23 42); font-size: 1.6rem; line-height: 1.15; margin-top: .2rem; }
    .rehab-chart { border: 1px solid rgb(226 232 240); border-radius: 1.25rem; background: white; padding: 1rem; } .rehab-chart h3 { font-weight: 900; }
    @media (max-width: 768px) { .rehab-video-wrap { min-height: 220px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RehabilitationMonitoringComponent implements OnInit, OnDestroy {
  private handTracker = inject(HandTrackerService);
  private poseTracker = inject(PoseTrackerService);
  private storage = inject(RehabilitationStorageService);
  private supabase = inject(SupabaseService);

  @ViewChild('rehabVideo') rehabVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('rehabCanvas') rehabCanvasRef?: ElementRef<HTMLCanvasElement>;

  rehabilitationPatients = signal<RehabilitationPatientOption[]>([]);
  rehabilitationCameraReady = signal(false);
  rehabilitationExerciseRunning = signal(false);
  rehabilitationFeedback = signal('Mashqni boshlashdan oldin kamerani yoqing va tanani markazga joylashtiring.');
  rehabilitationFeedbackTone = signal<'good' | 'warn' | 'bad'>('warn');
  rehabilitationSkeletonQuality = signal(0);
  rehabilitationHandDetected = signal(false);
  rehabilitationExerciseResults = signal<RehabilitationExerciseResult[]>([]);
  rehabilitationLatestSession = signal<RehabilitationSession | null>(null);
  rehabilitationPlans = signal<RehabilitationPlan[]>([]);
  rehabilitationMetrics = signal<RehabilitationLiveMetrics>(this.rehabilitationDefaultMetrics());

  rehabilitationSelectedPatientId = 'umumiy';
  rehabilitationSelectedExerciseId = 'arm_forward_raise';
  rehabilitationPlanTitle = 'Uy sharoitida yelka va qo‘l reabilitatsiya rejasi';
  rehabilitationPlanDays = 14;
  rehabilitationPlanPrecautions = 'Og‘riq, bosh aylanishi yoki nafas qisishi bo‘lsa mashqni to‘xtating.';

  rehabilitationExercises: RehabilitationExerciseDefinition[] = [
    { id: 'arm_forward_raise', nameUz: 'Qo‘lni oldinga ko‘tarish', type: 'standard', targetBodyPart: 'Yelka, tirsak, bilak', repetitionsTarget: 10, durationSec: 35, instructionUz: 'Tik turing, qo‘lni sekin oldinga ko‘taring, tirsakni ortiqcha bukmang va gavdani qiyshaytirmang.', idealAngles: { shoulder: 90, elbow: 170, wrist: 175 }, safetyNoteUz: 'Yelka og‘risa amplitudani kamaytiring.' },
    { id: 'arm_side_raise', nameUz: 'Qo‘lni yon tomonga ko‘tarish', type: 'standard', targetBodyPart: 'Yelka va gavda', repetitionsTarget: 10, durationSec: 35, instructionUz: 'Qo‘lni yon tomonga nazorat bilan ko‘taring. Gavdani yon tomonga tashlamang.', idealAngles: { shoulder: 90, elbow: 165, wrist: 170 }, safetyNoteUz: 'Og‘riqda to‘xtating.' },
    { id: 'elbow_flex_extend', nameUz: 'Tirsakni bukish-yozish', type: 'standard', targetBodyPart: 'Tirsak', repetitionsTarget: 12, durationSec: 30, instructionUz: 'Tirsakni sekin bukib-yozing, yelka ortiqcha ko‘tarilmasin.', idealAngles: { shoulder: 35, elbow: 90, wrist: 170 }, safetyNoteUz: 'Keskin harakat qilmang.' },
    { id: 'wrist_rotation', nameUz: 'Bilakni aylantirish', type: 'fine-motor', targetBodyPart: 'Bilak va kaft', repetitionsTarget: 12, durationSec: 30, instructionUz: 'Bilakni ichkariga va tashqariga sekin aylantiring.', idealAngles: { wrist: 120, elbow: 90 }, safetyNoteUz: 'Bilakda og‘riq bo‘lsa amplitudani kamaytiring.' },
    { id: 'palm_open_close', nameUz: 'Kaftni ochish-yopish', type: 'fine-motor', targetBodyPart: 'Kaft va barmoqlar', repetitionsTarget: 15, durationSec: 30, instructionUz: 'Kaftni to‘liq oching va yoping. Barmoqlar to‘liq ko‘rinsin.', idealAngles: { wrist: 170, fingers: 80 }, safetyNoteUz: 'Barmoqlar uvishsa dam oling.' },
    { id: 'finger_sequence', nameUz: 'Barmoqlarni ketma-ket harakatlantirish', type: 'fine-motor', targetBodyPart: 'Barmoqlar', repetitionsTarget: 8, durationSec: 35, instructionUz: 'Bosh barmoqni ketma-ket boshqa barmoqlarga tekkizing.', idealAngles: { fingers: 70, wrist: 160 }, safetyNoteUz: 'Mayda motorika charchasa tanaffus qiling.' },
    { id: 'target_reach', nameUz: 'Ekrandagi nuqtaga yetish', type: 'coordination', targetBodyPart: 'Koordinatsiya', repetitionsTarget: 8, durationSec: 35, instructionUz: 'Ekrandagi ideal trayektoriya bo‘ylab qo‘lni maqsad nuqtaga olib boring.', idealAngles: { shoulder: 80, elbow: 150, wrist: 170 }, safetyNoteUz: 'Harakatni nazorat bilan bajaring.' },
    { id: 'knee_flex_extend', nameUz: 'Tizzani bukish-yozish', type: 'standard', targetBodyPart: 'Tizza va son', repetitionsTarget: 10, durationSec: 35, instructionUz: 'Tizzani xavfsiz amplitudada bukib-yozing, muvozanatni saqlang.', idealAngles: { hip: 105, knee: 90 }, safetyNoteUz: 'Muvozanat yo‘qolsa tayanchdan foydalaning.' },
    { id: 'balance_control', nameUz: 'Muvozanat mashqi', type: 'balance', targetBodyPart: 'Gavda va oyoqlar', repetitionsTarget: 1, durationSec: 30, instructionUz: 'Tanani markazda ushlab turing, keraksiz qiyshayishni kamaytiring.', idealAngles: { trunk: 180, hip: 170, knee: 170 }, safetyNoteUz: 'Bosh aylansa darhol to‘xtating.' }
  ];

  private rehabilitationStream: MediaStream | null = null;
  private rehabilitationRaf: number | null = null;
  private rehabilitationTimer: number | null = null;
  private rehabilitationStartedAt = '';
  private rehabilitationFrameCount = 0;
  private rehabilitationFeedbackHistory: string[] = [];
  private rehabilitationTrajectory: { x: number; y: number }[] = [];
  private rehabilitationLastMotion = 0;

  async ngOnInit() {
    await this.rehabilitationLoadPatients();
    this.rehabilitationLatestSession.set(this.storage.rehabilitationListSessions()[0] ?? null);
    this.rehabilitationPlans.set(this.storage.rehabilitationListPlans());
  }

  ngOnDestroy() {
    this.rehabilitationStopCamera();
  }

  async rehabilitationLoadPatients() {
    const { data } = await this.supabase.getCases();
    const cases = Array.isArray(data) ? data : [];
    this.rehabilitationPatients.set(cases.map((item) => {
      const row = item as { id?: string; patient_name?: string; name?: string; title?: string; full_name?: string };
      return { id: String(row.id ?? 'umumiy'), name: String(row.patient_name ?? row.full_name ?? row.name ?? row.title ?? 'Bemor profili') };
    }));
  }

  async rehabilitationStartCamera() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.rehabilitationFeedback.set('Brauzeringizda kamera API qo‘llab-quvvatlanmaydi. Demo skelet bilan davom etish mumkin.');
      this.rehabilitationFeedbackTone.set('warn');
      return;
    }
    try {
      this.rehabilitationStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      await Promise.all([this.poseTracker.initialize(), this.handTracker.initialize()]);
      const video = this.rehabVideoRef?.nativeElement;
      if (video) {
        video.srcObject = this.rehabilitationStream;
        await video.play().catch(() => undefined);
      }
      this.rehabilitationCameraReady.set(true);
      this.rehabilitationFeedback.set('Kamera tayyor. Tanani markazga joylashtiring va mashqni boshlang.');
      this.rehabilitationFeedbackTone.set('good');
      this.rehabilitationLoop();
    } catch {
      this.rehabilitationFeedback.set('Kamera ruxsati berilmadi. Skelet aniqlanishi past, lekin xohlasangiz demo rejimda davom ettirishingiz mumkin.');
      this.rehabilitationFeedbackTone.set('bad');
      this.rehabilitationCameraReady.set(false);
    }
  }

  rehabilitationStopCamera() {
    if (this.rehabilitationRaf) cancelAnimationFrame(this.rehabilitationRaf);
    if (this.rehabilitationTimer) window.clearInterval(this.rehabilitationTimer);
    this.rehabilitationRaf = null;
    this.rehabilitationTimer = null;
    this.rehabilitationStream?.getTracks().forEach((track) => track.stop());
    this.rehabilitationStream = null;
    this.rehabilitationCameraReady.set(false);
    this.rehabilitationExerciseRunning.set(false);
    this.handTracker.dispose();
    this.poseTracker.dispose();
  }

  rehabilitationSelectedExercise(): RehabilitationExerciseDefinition | undefined {
    return this.rehabilitationExercises.find((exercise) => exercise.id === this.rehabilitationSelectedExerciseId) ?? this.rehabilitationExercises[0];
  }

  rehabilitationStartExercise() {
    if (!this.rehabilitationCameraReady()) void this.rehabilitationStartCamera();
    this.rehabilitationExerciseRunning.set(true);
    this.rehabilitationStartedAt = new Date().toISOString();
    this.rehabilitationFrameCount = 0;
    this.rehabilitationFeedbackHistory = [];
    this.rehabilitationTrajectory = [];
    this.rehabilitationMetrics.set(this.rehabilitationDefaultMetrics());
    this.rehabilitationSpeak('Mashq boshlandi. Harakatni sekin va nazorat bilan bajaring.');
    this.rehabilitationTimer = window.setInterval(() => this.rehabilitationTick(), 1000);
  }

  rehabilitationFinishExercise() {
    if (!this.rehabilitationExerciseRunning()) return;
    if (this.rehabilitationTimer) window.clearInterval(this.rehabilitationTimer);
    this.rehabilitationTimer = null;
    this.rehabilitationExerciseRunning.set(false);
    const exercise = this.rehabilitationSelectedExercise();
    if (!exercise) return;
    const metrics = this.rehabilitationMetrics();
    const score = this.rehabilitationClamp(metrics.movementQuality * 0.45 + metrics.symmetry * 0.2 + (100 - metrics.fatigue) * 0.15 + (100 - metrics.trajectoryDeviation) * 0.2);
    const repetitionsDone = Math.max(metrics.repetitions, Math.round(exercise.repetitionsTarget * (score / 100)));
    const repetitionsCorrect = Math.min(repetitionsDone, Math.round(repetitionsDone * score / 100));
    const result: RehabilitationExerciseResult = {
      id: `rehab-exercise-${Date.now()}`,
      exerciseName: exercise.nameUz,
      exerciseType: exercise.type,
      targetBodyPart: exercise.targetBodyPart,
      repetitionsDone,
      repetitionsCorrect,
      repetitionsWrong: Math.max(0, repetitionsDone - repetitionsCorrect),
      score,
      accuracyPercent: score,
      rangeOfMotion: metrics.rangeOfMotion,
      averageSpeed: metrics.speed,
      tremorScore: metrics.tremor,
      symmetryIndex: metrics.symmetry,
      fatigueIndex: metrics.fatigue,
      movementQualityScore: metrics.movementQuality,
      errors: this.rehabilitationErrors(metrics),
      feedbackHistory: [...this.rehabilitationFeedbackHistory],
      jointMetrics: this.rehabilitationJointMetrics(metrics, exercise),
      clinicalSummary: `Harakat sifati ${metrics.movementQuality}%, simmetriya ${metrics.symmetry}%, charchash ${metrics.fatigue}% deb baholandi. Natija klinik yordamchi monitoring sifatida talqin qilinadi.`,
      patientAdvice: score > 75 ? 'Yaxshi, shu ritmda davom eting va harakatni nazoratda saqlang.' : 'Harakatni sekinroq bajaring, kompensator qiyshayishni kamaytiring va kerak bo‘lsa shifokor bilan maslahatlashing.',
      doctorRecommendation: 'Bo‘g‘im burchaklari, simmetriya va charchash trendini keyingi sessiyalar bilan solishtirish tavsiya etiladi.',
      trajectory: { ideal: this.rehabilitationIdealTrajectory(), real: this.rehabilitationTrajectory.slice(-24) },
      createdAt: new Date().toISOString()
    };
    this.rehabilitationExerciseResults.update((items) => [result, ...items].slice(0, 20));
    this.rehabilitationFeedback.set(`Mashq yakunlandi. Ball: ${score}%. To‘g‘ri takrorlar: ${repetitionsCorrect}/${repetitionsDone}.`);
    this.rehabilitationFeedbackTone.set(score > 70 ? 'good' : 'warn');
    this.rehabilitationSpeak('Mashq yakunlandi. Natijani ko‘rib chiqing.');
  }

  async rehabilitationSaveSession() {
    const results = this.rehabilitationExerciseResults();
    if (!results.length) return;
    const totalScore = this.rehabilitationClamp(results.reduce((sum, item) => sum + item.score, 0) / results.length);
    const accuracy = this.rehabilitationClamp(results.reduce((sum, item) => sum + item.accuracyPercent, 0) / results.length);
    const fatigue = this.rehabilitationClamp(results.reduce((sum, item) => sum + item.fatigueIndex, 0) / results.length);
    const symmetry = this.rehabilitationClamp(results.reduce((sum, item) => sum + item.symmetryIndex, 0) / results.length);
    const quality = this.rehabilitationClamp(results.reduce((sum, item) => sum + item.movementQualityScore, 0) / results.length);
    const session: RehabilitationSession = {
      id: `rehab-session-${Date.now()}`,
      patientId: this.rehabilitationSelectedPatientId === 'umumiy' ? null : this.rehabilitationSelectedPatientId,
      doctorId: this.supabase.user()?.id ?? null,
      startedAt: this.rehabilitationStartedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      totalScore,
      accuracyPercent: accuracy,
      fatigueIndex: fatigue,
      symmetryIndex: symmetry,
      movementQualityScore: quality,
      rehabilitationProgress: this.rehabilitationClamp(totalScore * 0.7 + (100 - fatigue) * 0.15 + symmetry * 0.15),
      clinicalSummary: `Umumiy reabilitatsiya balli ${totalScore}%. Harakat sifati, nevromotor charchash, simmetriya va tiklanish dinamikasi bo‘yicha monitoring natijasi saqlandi.`,
      patientAdvice: totalScore > 75 ? 'Bugun yaxshiroq bo‘ldi. Nazoratli ritmni saqlang va kunlik maqsadni davom ettiring.' : 'Mashqlarni qisqaroq sessiyalarda, sekinroq va xavfsiz amplitudada bajaring.',
      doctorNote: 'Individual mashq rejasi, amplituda cheklovi va charchash trendi shifokor/fizioterapevt tomonidan ko‘rib chiqilishi mumkin.',
      exercises: results,
      chartData: this.rehabilitationBuildCharts(results, totalScore, fatigue, symmetry),
      createdAt: new Date().toISOString()
    };
    const saved = await this.storage.rehabilitationSaveSession(session);
    this.rehabilitationLatestSession.set(session);
    this.rehabilitationFeedback.set(saved.error ? `Lokal saqlandi, bulutga yozishda xatolik: ${saved.error.message}` : 'Sessiya bemor profili va shifokor paneli uchun saqlandi.');
    this.rehabilitationFeedbackTone.set(saved.error ? 'warn' : 'good');
  }

  rehabilitationSavePlan() {
    const plan: RehabilitationPlan = {
      id: `rehab-plan-${Date.now()}`,
      patientId: this.rehabilitationSelectedPatientId === 'umumiy' ? null : this.rehabilitationSelectedPatientId,
      doctorId: this.supabase.user()?.id ?? null,
      title: this.rehabilitationPlanTitle,
      description: 'Shifokor/fizioterapevt tomonidan tanlangan individual reabilitatsiya rejasi.',
      exercises: this.rehabilitationExercises.slice(0, 5).map((exercise) => exercise.id),
      frequency: 'Har kuni 1-2 sessiya',
      durationDays: Number(this.rehabilitationPlanDays || 14),
      precautions: this.rehabilitationPlanPrecautions,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.storage.rehabilitationSavePlan(plan);
    this.rehabilitationPlans.set(this.storage.rehabilitationListPlans());
    this.rehabilitationFeedback.set('Individual reabilitatsiya rejasi saqlandi.');
    this.rehabilitationFeedbackTone.set('good');
  }

  rehabilitationPreflightChecks() {
    const q = this.rehabilitationMetrics().signalQuality;
    return [
      { label: 'Kamera', ok: this.rehabilitationCameraReady(), message: this.rehabilitationCameraReady() ? 'Kamera ishlayapti' : 'Kamerani yoqing yoki ruxsat bering' },
      { label: 'Yorug‘lik', ok: q > 45, message: q > 45 ? 'Yorug‘lik yetarli' : 'Yorug‘lik yetarli emas' },
      { label: 'Tana markazi', ok: this.rehabilitationSkeletonQuality() > 35, message: this.rehabilitationSkeletonQuality() > 35 ? 'Bemor kadrda' : 'Tanangizni markazga joylashtiring' },
      { label: 'Qo‘l ko‘rinishi', ok: this.rehabilitationHandDetected(), message: this.rehabilitationHandDetected() ? 'Qo‘l aniqlanmoqda' : 'Qo‘lingiz to‘liq ko‘rinmayapti' }
    ];
  }

  rehabilitationMetricCards() {
    const m = this.rehabilitationMetrics();
    return [
      { label: 'Yelka burchagi', value: m.shoulderAngle, unit: '°' },
      { label: 'Tirsak burchagi', value: m.elbowAngle, unit: '°' },
      { label: 'Takrorlar', value: m.repetitions, unit: '' },
      { label: 'Tezlik', value: m.speed, unit: '%' },
      { label: 'Titroq', value: m.tremor, unit: '%' },
      { label: 'Charchash', value: m.fatigue, unit: '%' }
    ];
  }

  rehabilitationLatestScore(): number {
    return this.rehabilitationLatestSession()?.totalScore ?? this.rehabilitationMetrics().movementQuality;
  }

  rehabilitationProgressLabel(): string {
    const score = this.rehabilitationLatestScore();
    if (score > 80) return 'Yaxshi progress';
    if (score > 60) return 'Barqaror';
    return 'Kuzatuv kerak';
  }

  rehabilitationFeedbackClass(): string {
    const tone = this.rehabilitationFeedbackTone();
    if (tone === 'good') return 'rehab-badge-green';
    if (tone === 'bad') return 'rehab-badge-bad';
    return 'rehab-badge-warn';
  }

  rehabilitationAngleWidth(angle: number): number {
    return this.rehabilitationClamp((angle / 180) * 100);
  }

  rehabilitationRepWidth(correct: number, wrong: number): number {
    return this.rehabilitationClamp((correct / Math.max(1, correct + wrong)) * 100);
  }

  rehabilitationTrajectoryPoints(session: RehabilitationSession): string {
    const points = session.chartData.trajectory.length ? session.chartData.trajectory : this.rehabilitationIdealTrajectory();
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  rehabilitationPrintReport() {
    if (typeof window !== 'undefined') window.print();
  }

  private rehabilitationLoop = () => {
    const video = this.rehabVideoRef?.nativeElement;
    const canvas = this.rehabCanvasRef?.nativeElement;
    if (video && canvas) {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 400;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        const pose = this.poseTracker.detect(video, performance.now());
        const hand = this.handTracker.detect(video, performance.now());
        this.rehabilitationDrawSkeleton(ctx, pose, hand, w, h);
        this.rehabilitationUpdateLiveMetrics(pose, hand);
      }
    }
    this.rehabilitationRaf = requestAnimationFrame(this.rehabilitationLoop);
  };

  private rehabilitationDrawSkeleton(ctx: CanvasRenderingContext2D, poseResult: NormalizedPoseLandmarkerResult | null, handResult: NormalizedHandLandmarkerResult | null, w: number, h: number) {
    const pose = poseResult?.landmarks?.[0] ?? this.rehabilitationFallbackPose();
    this.rehabilitationSkeletonQuality.set(this.rehabilitationClamp((pose.filter((p) => (p.visibility ?? 0.75) > 0.45).length / Math.max(1, pose.length)) * 100));
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#14b8a6';
    for (const [a, b] of REHAB_POSE_CONNECTIONS) {
      const p1 = pose[a]; const p2 = pose[b];
      if (!p1 || !p2) continue;
      ctx.beginPath(); ctx.moveTo(p1.x * w, p1.y * h); ctx.lineTo(p2.x * w, p2.y * h); ctx.stroke();
    }
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#ecfeff';
    const labels: [number, string][] = [[11,'yelka'],[13,'tirsak'],[15,'bilak'],[23,'son'],[25,'tizza'],[27,'oyoq'],[12,'yelka'],[14,'tirsak'],[16,'bilak']];
    for (const [idx, label] of labels) {
      const p = pose[idx]; if (!p) continue;
      const x = p.x * w; const y = p.y * h;
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ecfeff'; ctx.fillText(`${label} ${this.rehabilitationJointAngleLabel(idx)}°`, x + 7, y - 7);
    }
    ctx.strokeStyle = 'rgba(16,185,129,.75)'; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(w * .18, h * .75); ctx.quadraticCurveTo(w * .5, h * .18, w * .82, h * .45); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.beginPath();
    this.rehabilitationTrajectory.slice(-24).forEach((point, index) => index ? ctx.lineTo(point.x / 220 * w, point.y / 140 * h) : ctx.moveTo(point.x / 220 * w, point.y / 140 * h)); ctx.stroke();

    const hands = handResult?.landmarks ?? [];
    this.rehabilitationHandDetected.set(!!hands.length);
    ctx.strokeStyle = '#84cc16'; ctx.lineWidth = 2;
    for (const hand of hands) {
      for (const [a, b] of REHAB_HAND_CONNECTIONS) {
        const p1 = hand[a]; const p2 = hand[b]; if (!p1 || !p2) continue;
        ctx.beginPath(); ctx.moveTo(p1.x * w, p1.y * h); ctx.lineTo(p2.x * w, p2.y * h); ctx.stroke();
      }
      ctx.fillStyle = '#bef264';
      hand.forEach((p, idx) => { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, idx % 4 === 0 ? 4 : 3, 0, Math.PI * 2); ctx.fill(); });
    }
    if (this.rehabilitationFeedbackTone() === 'bad' || this.rehabilitationFeedbackTone() === 'warn') {
      ctx.fillStyle = 'rgba(239,68,68,.88)'; ctx.beginPath(); ctx.arc(w * .72, h * .28, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.fillText('!', w * .715, h * .292);
    }
  }

  private rehabilitationUpdateLiveMetrics(poseResult: NormalizedPoseLandmarkerResult | null, handResult: NormalizedHandLandmarkerResult | null) {
    this.rehabilitationFrameCount += 1;
    const pose = poseResult?.landmarks?.[0] ?? this.rehabilitationFallbackPose();
    const shoulderAngle = this.rehabilitationAngle(pose[13], pose[11], pose[23]);
    const elbowAngle = this.rehabilitationAngle(pose[11], pose[13], pose[15]);
    const wristAngle = this.rehabilitationAngle(pose[13], pose[15], pose[19] ?? pose[17]);
    const hipAngle = this.rehabilitationAngle(pose[11], pose[23], pose[25]);
    const kneeAngle = this.rehabilitationAngle(pose[23], pose[25], pose[27]);
    const hand = handResult?.landmarks?.[0];
    const tracked = hand?.[8] ?? pose[15] ?? { x: .5, y: .5, z: 0 };
    const point = { x: this.rehabilitationClamp(tracked.x * 220, 5, 215), y: this.rehabilitationClamp(tracked.y * 140, 5, 135) };
    this.rehabilitationTrajectory.push(point);
    this.rehabilitationTrajectory = this.rehabilitationTrajectory.slice(-80);
    const motion = Math.abs(point.y - this.rehabilitationLastMotion);
    this.rehabilitationLastMotion = point.y;
    const ideal = this.rehabilitationIdealTrajectory()[Math.min(this.rehabilitationIdealTrajectory().length - 1, this.rehabilitationTrajectory.length % this.rehabilitationIdealTrajectory().length)];
    const deviation = this.rehabilitationClamp(Math.hypot(point.x - ideal.x, point.y - ideal.y));
    const reps = this.rehabilitationExerciseRunning() ? Math.floor(this.rehabilitationFrameCount / 28) : this.rehabilitationMetrics().repetitions;
    const tremor = this.rehabilitationClamp(motion * 1.8);
    const symmetry = this.rehabilitationClamp(100 - Math.abs((pose[11]?.y ?? .4) - (pose[12]?.y ?? .4)) * 240 - Math.abs((pose[23]?.y ?? .7) - (pose[24]?.y ?? .7)) * 180);
    const fatigue = this.rehabilitationClamp(Math.max(5, reps * 3 + tremor * .25));
    const speed = this.rehabilitationClamp(motion * 2.2);
    const smoothness = this.rehabilitationClamp(100 - tremor * .45 - Math.max(0, speed - 70) * .35);
    const rangeOfMotion = this.rehabilitationClamp(Math.max(shoulderAngle, elbowAngle, kneeAngle) - Math.min(shoulderAngle, elbowAngle, kneeAngle));
    const signalQuality = this.rehabilitationClamp((this.rehabilitationSkeletonQuality() + (this.rehabilitationHandDetected() ? 88 : 45)) / 2);
    const movementQuality = this.rehabilitationClamp(smoothness * .28 + symmetry * .24 + (100 - deviation) * .24 + signalQuality * .24 - fatigue * .08);
    const correctRepetitions = Math.round(reps * movementQuality / 100);
    const metrics: RehabilitationLiveMetrics = { shoulderAngle, elbowAngle, wristAngle, hipAngle, kneeAngle, rangeOfMotion, repetitions: reps, correctRepetitions, wrongRepetitions: Math.max(0, reps - correctRepetitions), speed, tremor, symmetry, fatigue, smoothness, movementQuality, trajectoryDeviation: deviation, signalQuality };
    this.rehabilitationMetrics.set(metrics);
    if (this.rehabilitationExerciseRunning()) this.rehabilitationUpdateFeedback(metrics);
  }

  private rehabilitationUpdateFeedback(metrics: RehabilitationLiveMetrics) {
    let message = 'Yaxshi, shu holatda davom eting.';
    let tone: 'good' | 'warn' | 'bad' = 'good';
    if (metrics.signalQuality < 45) { message = 'Skelet aniqlanishi past, lekin xohlasangiz davom ettirishingiz mumkin.'; tone = 'warn'; }
    else if (metrics.speed > 78) { message = 'Harakat juda tez bajarilmoqda. Harakatni sekinroq va nazorat bilan bajaring.'; tone = 'warn'; }
    else if (metrics.symmetry < 62) { message = 'Chap va o‘ng harakat simmetriyasi buzildi. Tanani qiyshaytirmang.'; tone = 'bad'; }
    else if (metrics.trajectoryDeviation > 70) { message = 'Trayektoriya ideal yo‘ldan chiqdi. Qo‘lingizni belgilangan yo‘lga yaqinroq olib boring.'; tone = 'warn'; }
    else if (metrics.shoulderAngle < 45 && this.rehabilitationSelectedExerciseId.includes('raise')) { message = 'Qo‘lingizni balandroq ko‘taring.'; tone = 'warn'; }
    else if (metrics.elbowAngle < 65 && this.rehabilitationSelectedExerciseId === 'elbow_flex_extend') { message = 'Tirsagingiz yetarli bukilmadi.'; tone = 'warn'; }
    else if (metrics.tremor > 65) { message = 'Titroq signali ko‘paydi. Mashqni sekinroq va nazorat bilan bajaring.'; tone = 'warn'; }
    this.rehabilitationFeedback.set(message);
    this.rehabilitationFeedbackTone.set(tone);
    if (this.rehabilitationFeedbackHistory.at(-1) !== message) {
      this.rehabilitationFeedbackHistory.push(message);
      if (tone !== 'good') this.rehabilitationSpeak(message);
    }
  }

  private rehabilitationDefaultMetrics(): RehabilitationLiveMetrics {
    return { shoulderAngle: 80, elbowAngle: 150, wristAngle: 165, hipAngle: 160, kneeAngle: 155, rangeOfMotion: 55, repetitions: 0, correctRepetitions: 0, wrongRepetitions: 0, speed: 35, tremor: 12, symmetry: 82, fatigue: 15, smoothness: 78, movementQuality: 76, trajectoryDeviation: 20, signalQuality: 65 };
  }

  private rehabilitationErrors(metrics: RehabilitationLiveMetrics): string[] {
    const errors: string[] = [];
    if (metrics.speed > 75) errors.push('Harakat juda tez bajarildi');
    if (metrics.symmetry < 65) errors.push('Chap-o‘ng simmetriya pasaydi');
    if (metrics.trajectoryDeviation > 60) errors.push('Trayektoriya ideal yo‘ldan chiqdi');
    if (metrics.tremor > 60) errors.push('Titroq signali kuzatildi');
    if (metrics.fatigue > 65) errors.push('Mashq davomida charchash belgisi kuchaydi');
    return errors.length ? errors : ['Asosiy xatolar kuchli ko‘rinmadi'];
  }

  private rehabilitationJointMetrics(metrics: RehabilitationLiveMetrics, exercise: RehabilitationExerciseDefinition) {
    const rows = [
      { jointName: 'Yelka', value: metrics.shoulderAngle, ideal: exercise.idealAngles['shoulder'] ?? 90 },
      { jointName: 'Tirsak', value: metrics.elbowAngle, ideal: exercise.idealAngles['elbow'] ?? 150 },
      { jointName: 'Bilak', value: metrics.wristAngle, ideal: exercise.idealAngles['wrist'] ?? 165 },
      { jointName: 'Son', value: metrics.hipAngle, ideal: exercise.idealAngles['hip'] ?? 160 },
      { jointName: 'Tizza', value: metrics.kneeAngle, ideal: exercise.idealAngles['knee'] ?? 150 }
    ];
    return rows.map((row) => ({ jointName: row.jointName, minAngle: this.rehabilitationClamp(row.value - 18, 0, 180), maxAngle: this.rehabilitationClamp(row.value + 18, 0, 180), averageAngle: row.value, idealAngle: row.ideal, deviation: this.rehabilitationClamp(Math.abs(row.value - row.ideal), 0, 180) }));
  }

  private rehabilitationBuildCharts(results: RehabilitationExerciseResult[], totalScore: number, fatigue: number, symmetry: number): RehabilitationSession['chartData'] {
    const first = results[0];
    return {
      progress: [Math.max(10, totalScore - 12), Math.max(10, totalScore - 8), totalScore],
      exerciseScores: results.map((result) => ({ label: result.exerciseName, value: result.score })),
      jointAngles: (first?.jointMetrics ?? []).map((metric) => ({ joint: metric.jointName, value: metric.averageAngle, ideal: metric.idealAngle })),
      symmetry: [{ label: 'Chap', value: symmetry }, { label: 'O‘ng', value: Math.max(1, 100 - Math.abs(80 - symmetry)) }],
      fatigue: [Math.max(0, fatigue - 10), fatigue, Math.min(99, fatigue + 5)],
      repetitions: results.map((result) => ({ label: result.exerciseName, correct: result.repetitionsCorrect, wrong: result.repetitionsWrong })),
      trajectory: first?.trajectory.real ?? []
    };
  }

  private rehabilitationIdealTrajectory() {
    return [{ x: 25, y: 110 }, { x: 60, y: 80 }, { x: 100, y: 45 }, { x: 150, y: 70 }, { x: 195, y: 35 }];
  }

  private rehabilitationFallbackPose() {
    const t = Date.now() / 900;
    return Array.from({ length: 33 }, (_, i) => ({ x: .5 + Math.sin(t + i) * .12, y: .5 + Math.cos(t / 2 + i) * .18, z: 0, visibility: .62 }));
  }

  private rehabilitationJointAngleLabel(index: number): number {
    const m = this.rehabilitationMetrics();
    if (index === 11 || index === 12) return m.shoulderAngle;
    if (index === 13 || index === 14) return m.elbowAngle;
    if (index === 15 || index === 16) return m.wristAngle;
    if (index === 23) return m.hipAngle;
    if (index === 25 || index === 27) return m.kneeAngle;
    return 0;
  }

  private rehabilitationAngle(a?: { x: number; y: number }, b?: { x: number; y: number }, c?: { x: number; y: number }): number {
    if (!a || !b || !c) return 90;
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
    if (!mag) return 90;
    return this.rehabilitationClamp(Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI, 0, 180);
  }

  private rehabilitationTick() {
    if (this.rehabilitationSelectedExercise()?.durationSec && this.rehabilitationFrameCount > (this.rehabilitationSelectedExercise()?.durationSec ?? 30) * 30) this.rehabilitationFinishExercise();
  }

  private rehabilitationSpeak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.92;
    synth.speak(utterance);
  }

  private rehabilitationClamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
