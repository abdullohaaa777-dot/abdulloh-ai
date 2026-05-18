import { Injectable } from '@angular/core';
import { RehabilitationExerciseResult, RehabilitationSession } from './rehabilitation-storage';
import type { RehabPainFatigueCheck, SmartRehabInsight } from './smart-rehab-digital-twin';

export interface RehabFeatureFlags {
  ghostSkeletonCoach: boolean;
  movementQualityScore: boolean;
  compensationWarning: boolean;
  fatigueDropDetection: boolean;
  prePostPainCheck: boolean;
  safeProgressionMode: boolean;
  microMotorTest: boolean;
  rehabHeatmap: boolean;
  weeklyRehabReport: boolean;
  doctorReviewPriority: boolean;
}

export interface MicroMotorPrecisionResult {
  id: string;
  sessionId: string | null;
  patientId: string | null;
  testName: string;
  accuracyPercent: number;
  reactionTime: number;
  tremorScore: number;
  coordinationScore: number;
  hardestCombination: string;
  errorSummary: string[];
  patientAdvice: string;
  doctorClinicalNote: string;
  createdAt: string;
}

export interface MovementQualityBreakdown {
  totalScore: number;
  jointAngleScore: number;
  rangeOfMotionScore: number;
  smoothnessScore: number;
  symmetryScore: number;
  compensationScore: number;
  fatigueScore: number;
  speedScore: number;
  strengths: string[];
  weaknesses: string[];
  patientSummary: string;
  doctorSummary: string;
}

export interface GhostSkeletonGap {
  angleGapDeg: number;
  amplitudeGapPercent: number;
  trajectoryGapPercent: number;
  feedback: string;
  idealTrajectory: { x: number; y: number }[];
  realTrajectory: { x: number; y: number }[];
}

export interface CompensationWarningResult {
  status: 'clear' | 'watch' | 'warning';
  compensationPercent: number;
  compensationType: string;
  affectedBodyPart: string;
  severity: 'low' | 'medium' | 'high';
  correctionAdvice: string;
  doctorClinicalNote: string;
}

export interface FatigueDropResult {
  dropDetected: boolean;
  dropStartRepetition: number | null;
  fatigueDropIndex: number;
  repetitionScores: { repetition: number; quality: number; amplitude: number; angle: number; speed: number; tremor: number; compensation: number; symmetry: number; accuracy: number }[];
  patientWarning: string;
  doctorClinicalNote: string;
}

export interface RehabHeatmapCell {
  bodyPart: string;
  status: 'good' | 'watch' | 'risk' | 'unknown';
  score: number;
  reason: string;
}

export interface WeeklyRehabReport {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  weekStart: string;
  weekEnd: string;
  progressSummary: string;
  improvedExercises: string[];
  worsenedExercises: string[];
  weakJoints: string[];
  painTrend: string;
  fatigueTrend: string;
  compensationTrend: string;
  symmetryTrend: string;
  patientAdvice: string;
  doctorNote: string;
  createdAt: string;
}

export interface DoctorReviewPriority {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  priorityLevel: 'high' | 'medium' | 'low';
  reasons: string[];
  latestSessionId: string;
  status: 'open' | 'reviewed';
  createdAt: string;
  updatedAt: string;
}

export interface RehabQualityInsight {
  featureFlags: RehabFeatureFlags;
  movementQuality: MovementQualityBreakdown;
  ghostSkeleton: GhostSkeletonGap;
  compensationWarning: CompensationWarningResult;
  fatigueDrop: FatigueDropResult;
  microMotor: MicroMotorPrecisionResult;
  heatmap: RehabHeatmapCell[];
  weeklyReport: WeeklyRehabReport;
  doctorPriority: DoctorReviewPriority;
  safeProgressionRecommendation: string;
}

@Injectable({ providedIn: 'root' })
export class RehabQualityEngineService {
  readonly featureFlags: RehabFeatureFlags = {
    ghostSkeletonCoach: true,
    movementQualityScore: true,
    compensationWarning: true,
    fatigueDropDetection: true,
    prePostPainCheck: true,
    safeProgressionMode: true,
    microMotorTest: true,
    rehabHeatmap: true,
    weeklyRehabReport: true,
    doctorReviewPriority: true
  };

  buildInsight(session: RehabilitationSession, history: RehabilitationSession[], smartRehab: SmartRehabInsight | null, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, microMotor?: MicroMotorPrecisionResult | null): RehabQualityInsight {
    const exercise = session.exercises[0] ?? null;
    const movementQuality = this.movementQuality(session, exercise, smartRehab);
    const ghostSkeleton = this.ghostSkeleton(exercise, movementQuality);
    const compensationWarning = this.compensationWarning(session, exercise, smartRehab);
    const fatigueDrop = this.fatigueDrop(session, exercise, compensationWarning);
    const heatmap = this.heatmap(session, exercise, checks, compensationWarning);
    const weeklyReport = this.weeklyReport(session, history, heatmap, fatigueDrop, compensationWarning);
    const doctorPriority = this.doctorPriority(session, checks, movementQuality, compensationWarning, fatigueDrop, weeklyReport);
    const safeProgressionRecommendation = this.safeProgression(session, checks, movementQuality, compensationWarning, fatigueDrop);
    return {
      featureFlags: this.featureFlags,
      movementQuality,
      ghostSkeleton,
      compensationWarning,
      fatigueDrop,
      microMotor: microMotor ?? this.microMotorFallback(session, exercise),
      heatmap,
      weeklyReport,
      doctorPriority,
      safeProgressionRecommendation
    };
  }

  buildMicroMotorResult(patientId: string | null, sessionId: string | null, movementQuality: number, tremor: number, fatigue: number): MicroMotorPrecisionResult {
    const accuracyPercent = this.clamp(movementQuality * 0.55 + (100 - tremor) * 0.25 + (100 - fatigue) * 0.2);
    const coordinationScore = this.clamp(accuracyPercent - tremor * 0.12);
    return {
      id: `rehab-micro-motor-${Date.now()}`,
      sessionId,
      patientId,
      testName: 'Bosh barmoq–barmoqlar ketma-ketligi',
      accuracyPercent,
      reactionTime: Number((1.9 - accuracyPercent / 135).toFixed(2)),
      tremorScore: this.clamp(tremor),
      coordinationScore,
      hardestCombination: accuracyPercent > 75 ? 'Bosh barmoq–jimjiloq nazoratda' : 'Bosh barmoq–jimjiloq koordinatsiyasi',
      errorSummary: accuracyPercent > 75 ? ['Kuchli xato aniqlanmadi'] : ['Kechikish', 'Mayda tremor', 'Koordinatsiya pasayishi'],
      patientAdvice: accuracyPercent > 75 ? 'Barmoqlarni sekin va aniqlik bilan davom ettiring.' : 'Bosh barmoqni jimjiloqqa sekin tekkizish mashqini qisqa tanaffuslar bilan bajaring.',
      doctorClinicalNote: `Mayda motorika aniqligi ${accuracyPercent}%, koordinatsiya ${coordinationScore}%, tremor ${this.clamp(tremor)}%.`,
      createdAt: new Date().toISOString()
    };
  }

  private movementQuality(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null, smartRehab: SmartRehabInsight | null): MovementQualityBreakdown {
    const jointAngleScore = this.clamp(20 - ((exercise?.jointMetrics?.[0]?.deviation ?? 12) / 180) * 20, 0, 20);
    const rangeOfMotionScore = this.clamp((exercise?.rangeOfMotion ?? 50) / 90 * 20, 0, 20);
    const smoothnessScore = this.clamp((session.movementQualityScore / 100) * 15, 0, 15);
    const symmetryScore = this.clamp((session.symmetryIndex / 100) * 15, 0, 15);
    const compensationScore = this.clamp((100 - (smartRehab?.compensation.compensationIndex ?? Math.max(0, 100 - session.symmetryIndex))) / 100 * 15, 0, 15);
    const fatigueScore = this.clamp((100 - session.fatigueIndex) / 100 * 10, 0, 10);
    const speedScore = this.clamp((100 - Math.abs((exercise?.averageSpeed ?? 45) - 45)) / 100 * 5, 0, 5);
    const totalScore = this.clamp(jointAngleScore + rangeOfMotionScore + smoothnessScore + symmetryScore + compensationScore + fatigueScore + speedScore);
    const strengths = [jointAngleScore > 14 ? 'Burchak mosligi yaxshi' : '', rangeOfMotionScore > 14 ? 'Amplituda yetarli' : '', symmetryScore > 11 ? 'Simmetriya yaxshi' : ''].filter(Boolean);
    const weaknesses = [compensationScore < 9 ? 'Kompensator harakat bor' : '', fatigueScore < 6 ? 'Charchash belgisi kuchaygan' : '', speedScore < 3 ? 'Tezlik nazorati past' : ''].filter(Boolean);
    return {
      totalScore,
      jointAngleScore,
      rangeOfMotionScore,
      smoothnessScore,
      symmetryScore,
      compensationScore,
      fatigueScore,
      speedScore,
      strengths: strengths.length ? strengths : ['Asosiy harakat komponentlari barqaror'],
      weaknesses: weaknesses.length ? weaknesses : ['Kritik zaif komponent aniqlanmadi'],
      patientSummary: `Harakat sifati: ${totalScore}/100. ${weaknesses.length ? weaknesses.join(', ') : 'Harakat ideal trayektoriyaga yaqin.'}`,
      doctorSummary: `Movement Quality Score ${totalScore}/100: angle ${jointAngleScore}/20, ROM ${rangeOfMotionScore}/20, smoothness ${smoothnessScore}/15, symmetry ${symmetryScore}/15, compensation ${compensationScore}/15, fatigue ${fatigueScore}/10, speed ${speedScore}/5.`
    };
  }

  private ghostSkeleton(exercise: RehabilitationExerciseResult | null, movementQuality: MovementQualityBreakdown): GhostSkeletonGap {
    const idealTrajectory = exercise?.trajectory.ideal?.length ? exercise.trajectory.ideal : [{ x: 25, y: 110 }, { x: 60, y: 80 }, { x: 100, y: 45 }, { x: 150, y: 70 }, { x: 195, y: 35 }];
    const realTrajectory = exercise?.trajectory.real?.length ? exercise.trajectory.real : idealTrajectory.map((point) => ({ x: point.x + 10, y: point.y + 12 }));
    const trajectoryGapPercent = this.clamp(100 - movementQuality.totalScore);
    const angleGapDeg = this.clamp((exercise?.jointMetrics?.[0]?.deviation ?? trajectoryGapPercent / 2), 0, 90);
    const amplitudeGapPercent = this.clamp(Math.abs((exercise?.rangeOfMotion ?? 55) - 70));
    return { angleGapDeg, amplitudeGapPercent, trajectoryGapPercent, feedback: angleGapDeg > 18 ? `Qo‘lingiz ideal trayektoriyadan ${angleGapDeg}° farq qilyapti.` : 'Yaxshi, harakat ideal trayektoriyaga yaqin.', idealTrajectory, realTrajectory };
  }

  private compensationWarning(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null, smartRehab: SmartRehabInsight | null): CompensationWarningResult {
    const compensationPercent = smartRehab?.compensation.compensationIndex ?? this.clamp((100 - session.symmetryIndex) * 0.7 + session.fatigueIndex * 0.2 + (exercise?.tremorScore ?? 0) * 0.1);
    const status: CompensationWarningResult['status'] = compensationPercent > 55 ? 'warning' : compensationPercent > 30 ? 'watch' : 'clear';
    return { status, compensationPercent, compensationType: smartRehab?.compensation.compensationType ?? (status === 'warning' ? 'Gavda qiyshayishi / simmetriya kompensatsiyasi' : 'Kompensatsiya past'), affectedBodyPart: exercise?.targetBodyPart ?? 'Umumiy harakat zanjiri', severity: compensationPercent > 65 ? 'high' : compensationPercent > 35 ? 'medium' : 'low', correctionAdvice: compensationPercent > 35 ? 'Tanani markazda ushlang va harakatni sekinlashtiring.' : 'Joriy nazoratni saqlang.', doctorClinicalNote: `Compensation Warning: ${compensationPercent}%, status ${status}.` };
  }

  private fatigueDrop(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null, compensation: CompensationWarningResult): FatigueDropResult {
    const reps = Math.max(5, exercise?.repetitionsDone ?? session.exercises.length + 4);
    const repetitionScores = Array.from({ length: Math.min(10, reps) }, (_, index) => {
      const fatiguePenalty = index * (session.fatigueIndex / 18);
      const compensationPenalty = index > 3 ? compensation.compensationPercent / 12 : 0;
      const quality = this.clamp(session.movementQualityScore - fatiguePenalty - compensationPenalty);
      return { repetition: index + 1, quality, amplitude: this.clamp((exercise?.rangeOfMotion ?? 60) - index * 2), angle: this.clamp(90 - index * 3), speed: this.clamp((exercise?.averageSpeed ?? 45) + index * 2), tremor: this.clamp((exercise?.tremorScore ?? 12) + index * 3), compensation: this.clamp(compensation.compensationPercent + index * 2), symmetry: this.clamp(session.symmetryIndex - index * 2), accuracy: quality };
    });
    const first = repetitionScores[0]?.quality ?? session.movementQualityScore;
    const dropStart = repetitionScores.find((item) => first - item.quality >= 18)?.repetition ?? null;
    const fatigueDropIndex = this.clamp(first - (repetitionScores.at(-1)?.quality ?? first));
    return { dropDetected: dropStart !== null, dropStartRepetition: dropStart, fatigueDropIndex, repetitionScores, patientWarning: dropStart ? `${dropStart}-takrordan keyin charchash belgisi kuchaydi. Mashqni sekinlashtiring.` : 'Charchash keskin pasayishi aniqlanmadi.', doctorClinicalNote: dropStart ? `Fatigue Drop detected after repetition ${dropStart}; index ${fatigueDropIndex}.` : `No significant fatigue drop; index ${fatigueDropIndex}.` };
  }

  private heatmap(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, compensation: CompensationWarningResult): RehabHeatmapCell[] {
    const parts = ['Yelka', 'Tirsak', 'Bilak', 'Kaft', 'Barmoqlar', 'Gavda', 'Son', 'Tizza', 'Oyoq panjasi'];
    const weak = new Set(exercise?.jointMetrics.filter((metric) => metric.deviation > 25).map((metric) => metric.jointName) ?? []);
    return parts.map((bodyPart) => {
      const painPenalty = checks.post.painScore * 4;
      const score = this.clamp(session.movementQualityScore - (weak.has(bodyPart) ? 25 : 0) - (bodyPart === 'Gavda' ? compensation.compensationPercent * 0.25 : 0) - painPenalty);
      return { bodyPart, score, status: score > 75 ? 'good' : score > 55 ? 'watch' : 'risk', reason: score > 75 ? 'Yaxshi tiklanish' : score > 55 ? 'O‘rtacha e’tibor kerak' : 'Zaif yoki xavfli zona' };
    });
  }

  private weeklyReport(session: RehabilitationSession, history: RehabilitationSession[], heatmap: RehabHeatmapCell[], fatigueDrop: FatigueDropResult, compensation: CompensationWarningResult): WeeklyRehabReport {
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const values = [session, ...history].slice(0, 7);
    const previous = values.at(-1)?.totalScore ?? session.totalScore;
    const delta = session.totalScore - previous;
    return { id: `rehab-weekly-${session.patientId ?? 'guest'}-${new Date().toISOString().slice(0, 10)}`, patientId: session.patientId, doctorId: session.doctorId, weekStart, weekEnd: new Date().toISOString(), progressSummary: delta >= 0 ? `Haftalik progress +${delta} ball.` : `Haftalik progress ${delta} ball, qayta ko‘rib chiqish kerak.`, improvedExercises: session.exercises.filter((item) => item.score >= 75).map((item) => item.exerciseName), worsenedExercises: session.exercises.filter((item) => item.score < 60).map((item) => item.exerciseName), weakJoints: heatmap.filter((item) => item.status === 'risk').map((item) => item.bodyPart), painTrend: 'Pre/post og‘riq javoblari asosida kuzatiladi', fatigueTrend: fatigueDrop.dropDetected ? 'Charchash oshgan' : 'Charchash barqaror', compensationTrend: compensation.compensationPercent > 45 ? 'Kompensatsiya e’tibor talab qiladi' : 'Kompensatsiya nazoratda', symmetryTrend: session.symmetryIndex > 70 ? 'Simmetriya barqaror' : 'Simmetriya pasaygan', patientAdvice: 'Keyingi haftada mashqni nazoratli va xavfsiz ritmda davom ettiring.', doctorNote: 'Movement quality, fatigue drop, compensation warning va pain trend klinik reja bilan solishtirilsin.', createdAt: new Date().toISOString() };
  }

  private doctorPriority(session: RehabilitationSession, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, movementQuality: MovementQualityBreakdown, compensation: CompensationWarningResult, fatigueDrop: FatigueDropResult, weekly: WeeklyRehabReport): DoctorReviewPriority {
    const reasons = [checks.post.painScore > checks.pre.painScore + 2 ? 'Og‘riq oshgan' : '', checks.post.dizziness || checks.post.shortnessOfBreath || checks.post.numbnessOrWeakness ? 'Xavfli simptom belgilangan' : '', compensation.compensationPercent > 55 ? 'Kompensator harakat kuchaygan' : '', fatigueDrop.dropDetected ? 'Fatigue drop aniqlangan' : '', movementQuality.totalScore < 60 ? 'Movement quality pasaygan' : '', weekly.weakJoints.length ? 'Zaif bo‘g‘im/segment bor' : ''].filter(Boolean);
    const priorityLevel: DoctorReviewPriority['priorityLevel'] = reasons.length >= 3 ? 'high' : reasons.length >= 1 ? 'medium' : 'low';
    return { id: `rehab-priority-${session.id}`, patientId: session.patientId, doctorId: session.doctorId, priorityLevel, reasons: reasons.length ? reasons : ['Shoshilinch ko‘rib chiqish signali yo‘q'], latestSessionId: session.id, status: 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  private safeProgression(session: RehabilitationSession, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, movementQuality: MovementQualityBreakdown, compensation: CompensationWarningResult, fatigueDrop: FatigueDropResult): string {
    if (checks.post.dizziness || checks.post.shortnessOfBreath || checks.post.numbnessOrWeakness || movementQuality.totalScore < 45) return 'Shifokor bilan maslahat kerak';
    if (compensation.compensationPercent > 55 || fatigueDrop.dropDetected || checks.post.painScore > checks.pre.painScore + 2) return 'Yengillashtirish kerak';
    if (movementQuality.totalScore > 80 && session.symmetryIndex > 75) return 'Kuchaytirish mumkin';
    return 'Shu darajada davom eting';
  }

  private microMotorFallback(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null): MicroMotorPrecisionResult {
    return this.buildMicroMotorResult(session.patientId, session.id, session.movementQualityScore, exercise?.tremorScore ?? 12, session.fatigueIndex);
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
