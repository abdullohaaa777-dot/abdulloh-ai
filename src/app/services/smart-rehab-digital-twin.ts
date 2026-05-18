import { Injectable } from '@angular/core';
import { RehabilitationExerciseResult, RehabilitationSession } from './rehabilitation-storage';

export interface RehabPainFatigueCheck {
  painScore: number;
  fatigueScore: number;
  dizziness: boolean;
  shortnessOfBreath: boolean;
  numbnessOrWeakness: boolean;
  readyToContinue: boolean;
  phase: 'pre' | 'post';
}

export interface SmartRehabDigitalTwinProfile {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  baselineProfile: Record<string, number | string>;
  currentProfile: Record<string, number | string>;
  movementSignature: string;
  weakJoints: string[];
  commonErrors: string[];
  compensationPatterns: string[];
  fatiguePattern: string;
  painPattern: string;
  recoveryStage: string;
  updatedAt: string;
}

export interface RehabCompensationMetric {
  id: string;
  sessionId: string;
  patientId: string | null;
  exerciseId: string | null;
  compensationIndex: number;
  compensationType: string;
  affectedBodyPart: string;
  severity: 'low' | 'moderate' | 'high';
  correctionAdvice: string;
  clinicalNote: string;
  createdAt: string;
}

export interface RehabSafeProgressionScore {
  id: string;
  sessionId: string;
  patientId: string | null;
  score: number;
  painScore: number;
  fatigueScore: number;
  riskLevel: 'low' | 'caution' | 'reduce' | 'stop';
  recommendation: string;
  createdAt: string;
}

export interface RehabAdaptiveProtocol {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  currentLevel: number;
  nextLevel: number;
  recommendationType: 'progress' | 'maintain' | 'reduce' | 'doctor_review' | 'temporary_limit';
  reason: string;
  exerciseAdjustments: string[];
  safetyLimitations: string[];
  patientMessage: string;
  doctorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface RehabRecoveryTrajectory {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  periodDays: 7 | 14 | 30;
  progressSummary: string;
  slowRecoveryAreas: string[];
  improvedAreas: string[];
  predictedNextStatus: string;
  doctorRecommendation: string;
  progressValues: number[];
  createdAt: string;
}

export interface RehabNeuroGameResult {
  id: string;
  patientId: string | null;
  sessionId: string | null;
  gameName: string;
  targetBodyPart: string;
  score: number;
  accuracy: number;
  reactionTime: number;
  movementQuality: number;
  compensationIndex: number;
  fatigueIndex: number;
  createdAt: string;
}

export interface SmartRehabInsight {
  digitalTwin: SmartRehabDigitalTwinProfile;
  compensation: RehabCompensationMetric;
  safeProgression: RehabSafeProgressionScore;
  adaptiveProtocol: RehabAdaptiveProtocol;
  recoveryTrajectories: RehabRecoveryTrajectory[];
  neuroGame: RehabNeuroGameResult;
  patientChecks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck };
  weeklyReport: string;
}

@Injectable({ providedIn: 'root' })
export class SmartRehabDigitalTwinService {
  defaultCheck(phase: 'pre' | 'post'): RehabPainFatigueCheck {
    return { painScore: 0, fatigueScore: phase === 'pre' ? 1 : 2, dizziness: false, shortnessOfBreath: false, numbnessOrWeakness: false, readyToContinue: true, phase };
  }

  buildInsight(session: RehabilitationSession, history: RehabilitationSession[], checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, neuroGame?: RehabNeuroGameResult | null): SmartRehabInsight {
    const now = new Date().toISOString();
    const exercise = session.exercises[0] ?? null;
    const compensation = this.compensation(session, exercise, checks.post, now);
    const safeProgression = this.safeProgression(session, compensation, checks, now);
    const adaptiveProtocol = this.protocol(session, safeProgression, compensation, now);
    const recoveryTrajectories = ([7, 14, 30] as const).map((days) => this.trajectory(session, history, days, now));
    const digitalTwin = this.digitalTwin(session, history, compensation, checks, recoveryTrajectories[0], now);
    const neuroGameResult = neuroGame ?? this.neuroGame(session, compensation, now);
    return { digitalTwin, compensation, safeProgression, adaptiveProtocol, recoveryTrajectories, neuroGame: neuroGameResult, patientChecks: checks, weeklyReport: `${recoveryTrajectories[0].progressSummary} ${adaptiveProtocol.patientMessage}` };
  }

  private digitalTwin(session: RehabilitationSession, history: RehabilitationSession[], compensation: RehabCompensationMetric, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, trajectory: RehabRecoveryTrajectory, now: string): SmartRehabDigitalTwinProfile {
    const all = [session, ...history].slice(0, 30);
    const baseline = all.at(-1) ?? session;
    const weakJoints = this.weakJoints(session.exercises);
    return {
      id: `smart-rehab-twin-${session.patientId ?? 'guest'}`,
      patientId: session.patientId,
      doctorId: session.doctorId,
      baselineProfile: { totalScore: baseline.totalScore, movementQuality: baseline.movementQualityScore, symmetry: baseline.symmetryIndex, rangeOfMotion: baseline.exercises[0]?.rangeOfMotion ?? 0 },
      currentProfile: { totalScore: session.totalScore, movementQuality: session.movementQualityScore, symmetry: session.symmetryIndex, fatigue: session.fatigueIndex, pain: checks.post.painScore },
      movementSignature: `Sifat ${session.movementQualityScore}%, simmetriya ${session.symmetryIndex}%, kompensatsiya ${compensation.compensationIndex}%`,
      weakJoints,
      commonErrors: this.commonErrors(all),
      compensationPatterns: [compensation.compensationType],
      fatiguePattern: session.fatigueIndex > 65 || checks.post.fatigueScore > 6 ? 'Mashq oxirida charchash kuchayadi' : 'Charchash nazorat ostida',
      painPattern: checks.post.painScore > checks.pre.painScore ? 'Mashqdan keyin og‘riq oshgan' : 'Og‘riq xavfi keskin oshmagan',
      recoveryStage: trajectory.progressValues.at(-1)! > 75 ? 'Faol tiklanish' : trajectory.progressValues.at(-1)! > 55 ? 'Barqaror tiklanish' : 'Ehtiyotkor monitoring',
      updatedAt: now
    };
  }

  private compensation(session: RehabilitationSession, exercise: RehabilitationExerciseResult | null, post: RehabPainFatigueCheck, now: string): RehabCompensationMetric {
    const compensationIndex = this.clamp((100 - session.symmetryIndex) * 0.55 + session.fatigueIndex * 0.18 + (exercise?.tremorScore ?? 0) * 0.18 + post.painScore * 2.4);
    const compensationType = session.symmetryIndex < 65 ? 'Gavdani qiyshaytirish yoki chap-o‘ng simmetriya kompensatsiyasi' : (exercise?.averageSpeed ?? 0) > 70 ? 'Tezlik orqali nazoratni yashirish' : compensationIndex > 55 ? 'Yelka/gavda yordamida yashirin kompensatsiya' : 'Kompensatsiya past';
    return { id: `rehab-comp-${session.id}`, sessionId: session.id, patientId: session.patientId, exerciseId: exercise?.id ?? null, compensationIndex, compensationType, affectedBodyPart: exercise?.targetBodyPart ?? 'Umumiy harakat zanjiri', severity: compensationIndex > 70 ? 'high' : compensationIndex > 40 ? 'moderate' : 'low', correctionAdvice: compensationIndex > 55 ? 'Tanani markazda ushlang, harakatni sekinlashtiring va bo‘g‘imni alohida nazorat qiling.' : 'Harakat sifatini saqlang va kompensator qiyshayishni kuzatishda davom eting.', clinicalNote: `Kompensator indeks ${compensationIndex}%. ${compensationType}.`, createdAt: now };
  }

  private safeProgression(session: RehabilitationSession, compensation: RehabCompensationMetric, checks: { pre: RehabPainFatigueCheck; post: RehabPainFatigueCheck }, now: string): RehabSafeProgressionScore {
    const redFlagPenalty = [checks.post.dizziness, checks.post.shortnessOfBreath, checks.post.numbnessOrWeakness, !checks.post.readyToContinue].filter(Boolean).length * 18;
    const score = this.clamp(session.totalScore * 0.25 + session.accuracyPercent * 0.2 + session.symmetryIndex * 0.15 + (100 - session.fatigueIndex) * 0.15 + (100 - compensation.compensationIndex) * 0.15 - checks.post.painScore * 3 - checks.post.fatigueScore * 2 - redFlagPenalty);
    const riskLevel: RehabSafeProgressionScore['riskLevel'] = score >= 80 ? 'low' : score >= 60 ? 'caution' : score >= 40 ? 'reduce' : 'stop';
    const recommendation = score >= 80 ? 'Ertangi mashqni nazorat bilan biroz kuchaytirish mumkin.' : score >= 60 ? 'Mashq darajasini saqlash va ehtiyotkorlik bilan davom etish kerak.' : score >= 40 ? 'Mashqni yengillashtirish, takrorlarni kamaytirish va dam olishni oshirish kerak.' : 'Shifokor nazorati kerak yoki mashqni vaqtincha to‘xtatish tavsiya qilinadi.';
    return { id: `rehab-safe-${session.id}`, sessionId: session.id, patientId: session.patientId, score, painScore: checks.post.painScore, fatigueScore: checks.post.fatigueScore, riskLevel, recommendation, createdAt: now };
  }

  private protocol(session: RehabilitationSession, safe: RehabSafeProgressionScore, compensation: RehabCompensationMetric, now: string): RehabAdaptiveProtocol {
    const currentLevel = this.clamp(Math.round(session.rehabilitationProgress / 10), 1, 10);
    const nextLevel = safe.score >= 80 ? Math.min(10, currentLevel + 1) : safe.score < 60 ? Math.max(1, currentLevel - 1) : currentLevel;
    const recommendationType: RehabAdaptiveProtocol['recommendationType'] = safe.score >= 80 ? 'progress' : safe.score >= 60 ? 'maintain' : safe.score >= 40 ? 'reduce' : compensation.severity === 'high' ? 'doctor_review' : 'temporary_limit';
    return { id: `rehab-protocol-${session.id}`, patientId: session.patientId, doctorId: session.doctorId, currentLevel, nextLevel, recommendationType, reason: `${safe.recommendation} Asos: kompensatsiya ${compensation.compensationIndex}%, charchash ${session.fatigueIndex}%.`, exerciseAdjustments: recommendationType === 'progress' ? ['Amplitudani 5–8% oshirish', 'Takrorni 1–2 taga oshirish'] : recommendationType === 'maintain' ? ['Joriy amplitudani saqlash', 'Nazoratli ritmni davom ettirish'] : ['Takrorlarni 20% kamaytirish', 'Dam olish oralig‘ini uzaytirish'], safetyLimitations: ['Og‘riq kuchaysa to‘xtatish', 'Bosh aylanishi yoki nafas qisishida shifokorga murojaat qilish'], patientMessage: safe.recommendation, doctorMessage: `Reja darajasi ${currentLevel} → ${nextLevel}. ${compensation.clinicalNote}`, createdAt: now, updatedAt: now };
  }

  private trajectory(session: RehabilitationSession, history: RehabilitationSession[], periodDays: 7 | 14 | 30, now: string): RehabRecoveryTrajectory {
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const values = [session, ...history].filter((item) => new Date(item.createdAt).getTime() >= cutoff).map((item) => item.totalScore).reverse();
    const progressValues = values.length ? values : [Math.max(10, session.totalScore - 8), session.totalScore];
    const delta = progressValues.at(-1)! - progressValues[0];
    return { id: `rehab-trajectory-${session.patientId ?? 'guest'}-${periodDays}`, patientId: session.patientId, doctorId: session.doctorId, periodDays, progressSummary: delta >= 4 ? `${periodDays} kun ichida progress ijobiy: +${Math.round(delta)} ball.` : delta <= -4 ? `${periodDays} kun ichida pasayish kuzatildi: ${Math.round(delta)} ball.` : `${periodDays} kunlik progress barqaror saqlanmoqda.`, slowRecoveryAreas: this.weakJoints(session.exercises), improvedAreas: session.exercises.filter((exercise) => exercise.score >= 75).map((exercise) => exercise.targetBodyPart).slice(0, 3), predictedNextStatus: delta >= 4 ? 'Shu tempda 2 haftada funksional sifat oshishi kutiladi.' : 'Keyingi 2 haftada reja va charchash nazorati muhim.', doctorRecommendation: delta < 0 || session.fatigueIndex > 65 ? 'Reabilitatsiya rejasi intensivligini qayta baholash tavsiya etiladi.' : 'Joriy protokolni klinik kuzatuv bilan davom ettirish mumkin.', progressValues, createdAt: now };
  }

  private neuroGame(session: RehabilitationSession, compensation: RehabCompensationMetric, now: string): RehabNeuroGameResult {
    return { id: `rehab-game-${session.id}`, patientId: session.patientId, sessionId: session.id, gameName: 'Yulduzlarni yig‘ish', targetBodyPart: session.exercises[0]?.targetBodyPart ?? 'Qo‘l koordinatsiyasi', score: this.clamp(session.totalScore - compensation.compensationIndex * 0.15), accuracy: session.accuracyPercent, reactionTime: 1.2, movementQuality: session.movementQualityScore, compensationIndex: compensation.compensationIndex, fatigueIndex: session.fatigueIndex, createdAt: now };
  }

  private weakJoints(exercises: RehabilitationExerciseResult[]): string[] {
    const joints = [...new Set(exercises.flatMap((exercise) => exercise.jointMetrics.filter((metric) => metric.deviation > 25).map((metric) => metric.jointName)))];
    return joints.length ? joints.slice(0, 4) : ['Yelka', 'Tirsak'];
  }

  private commonErrors(sessions: RehabilitationSession[]): string[] {
    const errors = [...new Set(sessions.flatMap((session) => session.exercises.flatMap((exercise) => exercise.errors)))];
    return errors.length ? errors.slice(0, 5) : ['Kuchli xato tendensiyasi aniqlanmadi'];
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
