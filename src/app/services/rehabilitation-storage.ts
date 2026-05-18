import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import type { SmartRehabInsight } from './smart-rehab-digital-twin';

export type RehabilitationExerciseType = 'standard' | 'fine-motor' | 'coordination' | 'balance';
export type RehabilitationAiAnalysisStatus = 'pending' | 'completed' | 'failed';

export interface RehabilitationExerciseDefinition {
  id: string;
  nameUz: string;
  type: RehabilitationExerciseType;
  targetBodyPart: string;
  repetitionsTarget: number;
  durationSec: number;
  instructionUz: string;
  idealAngles: Record<string, number>;
  safetyNoteUz: string;
}

export interface RehabilitationJointMetric {
  jointName: string;
  minAngle: number;
  maxAngle: number;
  averageAngle: number;
  idealAngle: number;
  deviation: number;
}

export interface RehabilitationAiAnalysis {
  id: string;
  sessionId: string;
  patientId: string | null;
  doctorId: string | null;
  aiProvider: string;
  analysisStatus: RehabilitationAiAnalysisStatus;
  overallSummary: string;
  overallRehabStatus?: string;
  digitalTwinSummary?: string;
  movementQualityAnalysis: string;
  jointProblemAnalysis: string;
  compensationAnalysis?: string;
  safeProgressionAnalysis?: string;
  painFatigueAnalysis?: string;
  recoveryTrajectoryAnalysis?: string;
  adaptiveProtocolRecommendation?: string;
  neurogamePerformanceSummary?: string;
  symmetryAnalysis: string;
  fatigueAnalysis: string;
  progressComparison: string;
  riskWarnings: string[];
  patientAdvice: string;
  patientSimpleAdvice?: string;
  doctorClinicalNote: string;
  nextExerciseRecommendation: string;
  nextSessionPlan?: string;
  safetyNote: string;
  rawAiResponse: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface RehabilitationExerciseResult {
  id: string;
  exerciseName: string;
  exerciseType: RehabilitationExerciseType;
  targetBodyPart: string;
  repetitionsDone: number;
  repetitionsCorrect: number;
  repetitionsWrong: number;
  score: number;
  accuracyPercent: number;
  rangeOfMotion: number;
  averageSpeed: number;
  tremorScore: number;
  symmetryIndex: number;
  fatigueIndex: number;
  movementQualityScore: number;
  errors: string[];
  feedbackHistory: string[];
  jointMetrics: RehabilitationJointMetric[];
  clinicalSummary: string;
  patientAdvice: string;
  doctorRecommendation: string;
  trajectory: { ideal: { x: number; y: number }[]; real: { x: number; y: number }[] };
  createdAt: string;
}

export interface RehabilitationSession {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  startedAt: string;
  endedAt: string;
  totalScore: number;
  accuracyPercent: number;
  fatigueIndex: number;
  symmetryIndex: number;
  movementQualityScore: number;
  rehabilitationProgress: number;
  clinicalSummary: string;
  patientAdvice: string;
  doctorNote: string;
  aiAnalysis?: RehabilitationAiAnalysis | null;
  smartRehab?: SmartRehabInsight | null;
  exercises: RehabilitationExerciseResult[];
  chartData: {
    progress: number[];
    exerciseScores: { label: string; value: number }[];
    jointAngles: { joint: string; value: number; ideal: number }[];
    symmetry: { label: string; value: number }[];
    fatigue: number[];
    repetitions: { label: string; correct: number; wrong: number }[];
    trajectory: { x: number; y: number }[];
  };
  createdAt: string;
}

export interface RehabilitationPlan {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  title: string;
  description: string;
  exercises: string[];
  frequency: string;
  durationDays: number;
  precautions: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RehabilitationStorageService {
  private readonly sessionsKey = 'abdullohAI_rehabilitationSessions';
  private readonly plansKey = 'abdullohAI_rehabilitationPlans';
  private readonly smartRehabKey = 'abdullohAI_smartRehabInsights';
  private supabase = inject(SupabaseService);

  rehabilitationListSessions(patientId?: string | null): RehabilitationSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.sessionsKey);
      const list = raw ? JSON.parse(raw) : [];
      const sessions = Array.isArray(list) ? list as RehabilitationSession[] : [];
      return patientId ? sessions.filter((session) => session.patientId === patientId) : sessions;
    } catch (error) {
      console.error('Rehabilitation sessions parse error:', error);
      return [];
    }
  }

  async rehabilitationSaveSession(session: RehabilitationSession): Promise<{ error: { message: string } | null }> {
    const normalized: RehabilitationSession = {
      ...session,
      id: session.id || `rehab-session-${Date.now()}`,
      createdAt: session.createdAt || new Date().toISOString(),
      exercises: Array.isArray(session.exercises) ? session.exercises : []
    };

    this.rehabilitationPersistSessionLocally(normalized);

    if (this.supabase.isConfigured()) {
      try {
        const { error } = await this.supabase.client.from('rehabilitation_sessions').upsert({
          id: normalized.id,
          patient_id: normalized.patientId,
          doctor_id: normalized.doctorId,
          user_id: this.supabase.user()?.id ?? null,
          started_at: normalized.startedAt,
          ended_at: normalized.endedAt,
          total_score: normalized.totalScore,
          accuracy_percent: normalized.accuracyPercent,
          fatigue_index: normalized.fatigueIndex,
          symmetry_index: normalized.symmetryIndex,
          movement_quality_score: normalized.movementQualityScore,
          clinical_summary: normalized.clinicalSummary,
          patient_advice: normalized.patientAdvice,
          doctor_note: normalized.doctorNote,
          raw_session: normalized
        });
        if (error) return { error: { message: error.message } };
        await this.rehabilitationSaveExerciseRows(normalized);
      } catch (error) {
        return { error: { message: error instanceof Error ? error.message : 'Reabilitatsiya sessiyasini saqlashda xatolik' } };
      }
    }

    return { error: null };
  }

  async rehabilitationAttachAiAnalysis(session: RehabilitationSession, analysis: RehabilitationAiAnalysis): Promise<{ error: { message: string } | null }> {
    const updated: RehabilitationSession = { ...session, aiAnalysis: analysis };
    this.rehabilitationPersistSessionLocally(updated);

    if (this.supabase.isConfigured()) {
      try {
        const { error } = await this.supabase.client.from('rehabilitation_ai_analyses').upsert({
          id: analysis.id,
          session_id: analysis.sessionId,
          patient_id: analysis.patientId,
          doctor_id: analysis.doctorId,
          ai_provider: analysis.aiProvider,
          analysis_status: analysis.analysisStatus,
          overall_summary: analysis.overallSummary,
          movement_quality_analysis: analysis.movementQualityAnalysis,
          joint_problem_analysis: analysis.jointProblemAnalysis,
          symmetry_analysis: analysis.symmetryAnalysis,
          fatigue_analysis: analysis.fatigueAnalysis,
          progress_comparison: analysis.progressComparison,
          risk_warnings: analysis.riskWarnings,
          patient_advice: analysis.patientAdvice,
          doctor_clinical_note: analysis.doctorClinicalNote,
          next_exercise_recommendation: analysis.nextExerciseRecommendation,
          safety_note: analysis.safetyNote,
          raw_ai_response: analysis.rawAiResponse,
          updated_at: analysis.updatedAt
        });
        if (error) return { error: { message: error.message } };
      } catch (error) {
        return { error: { message: error instanceof Error ? error.message : 'AI tahlilini saqlashda xatolik' } };
      }
    }

    return { error: null };
  }


  async rehabilitationSaveSmartRehabInsight(insight: SmartRehabInsight): Promise<{ error: { message: string } | null }> {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.smartRehabKey);
        const list = raw ? JSON.parse(raw) : [];
        const insights = Array.isArray(list) ? list as SmartRehabInsight[] : [];
        const filtered = insights.filter((item) => item.safeProgression.sessionId !== insight.safeProgression.sessionId);
        filtered.unshift(insight);
        localStorage.setItem(this.smartRehabKey, JSON.stringify(filtered.slice(0, 200)));
      } catch (error) {
        console.error('Smart rehab insight local save error:', error);
      }
    }

    if (!this.supabase.isConfigured()) return { error: null };

    try {
      const twin = insight.digitalTwin;
      await this.supabase.client.from('smart_rehab_digital_twins').upsert({ id: twin.id, patient_id: twin.patientId, doctor_id: twin.doctorId, baseline_profile: twin.baselineProfile, current_profile: twin.currentProfile, movement_signature: twin.movementSignature, weak_joints: twin.weakJoints, common_errors: twin.commonErrors, compensation_patterns: twin.compensationPatterns, fatigue_pattern: twin.fatiguePattern, pain_pattern: twin.painPattern, recovery_stage: twin.recoveryStage, updated_at: twin.updatedAt });
      const protocol = insight.adaptiveProtocol;
      await this.supabase.client.from('rehab_adaptive_protocols').upsert({ id: protocol.id, patient_id: protocol.patientId, doctor_id: protocol.doctorId, current_level: protocol.currentLevel, next_level: protocol.nextLevel, recommendation_type: protocol.recommendationType, reason: protocol.reason, exercise_adjustments: protocol.exerciseAdjustments, safety_limitations: protocol.safetyLimitations, updated_at: protocol.updatedAt });
      const compensation = insight.compensation;
      await this.supabase.client.from('rehab_compensation_metrics').upsert({ id: compensation.id, session_id: compensation.sessionId, patient_id: compensation.patientId, exercise_id: compensation.exerciseId, compensation_index: compensation.compensationIndex, compensation_type: compensation.compensationType, affected_body_part: compensation.affectedBodyPart, severity: compensation.severity, correction_advice: compensation.correctionAdvice });
      const safe = insight.safeProgression;
      await this.supabase.client.from('rehab_safe_progression_scores').upsert({ id: safe.id, session_id: safe.sessionId, patient_id: safe.patientId, score: safe.score, pain_score: safe.painScore, fatigue_score: safe.fatigueScore, risk_level: safe.riskLevel, recommendation: safe.recommendation });
      const trajectories = insight.recoveryTrajectories.map((item) => ({ id: item.id, patient_id: item.patientId, doctor_id: item.doctorId, period_days: item.periodDays, progress_summary: item.progressSummary, slow_recovery_areas: item.slowRecoveryAreas, improved_areas: item.improvedAreas, predicted_next_status: item.predictedNextStatus, doctor_recommendation: item.doctorRecommendation }));
      if (trajectories.length) await this.supabase.client.from('rehab_recovery_trajectories').upsert(trajectories);
      const game = insight.neuroGame;
      await this.supabase.client.from('rehab_neurogame_results').upsert({ id: game.id, patient_id: game.patientId, session_id: game.sessionId, game_name: game.gameName, target_body_part: game.targetBodyPart, score: game.score, accuracy: game.accuracy, reaction_time: game.reactionTime, movement_quality: game.movementQuality, compensation_index: game.compensationIndex, fatigue_index: game.fatigueIndex });
      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Smart Rehab Digital Twin ma’lumotlarini saqlashda xatolik' } };
    }
  }

  rehabilitationListPlans(patientId?: string | null): RehabilitationPlan[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.plansKey);
      const list = raw ? JSON.parse(raw) : [];
      const plans = Array.isArray(list) ? list as RehabilitationPlan[] : [];
      return patientId ? plans.filter((plan) => plan.patientId === patientId) : plans;
    } catch (error) {
      console.error('Rehabilitation plans parse error:', error);
      return [];
    }
  }

  rehabilitationSavePlan(plan: RehabilitationPlan): void {
    if (typeof window === 'undefined') return;
    const normalized: RehabilitationPlan = {
      ...plan,
      id: plan.id || `rehab-plan-${Date.now()}`,
      createdAt: plan.createdAt || new Date().toISOString()
    };
    const list = this.rehabilitationListPlans().filter((item) => item.id !== normalized.id);
    list.unshift(normalized);
    localStorage.setItem(this.plansKey, JSON.stringify(list.slice(0, 120)));
  }

  private rehabilitationPersistSessionLocally(session: RehabilitationSession): void {
    if (typeof window === 'undefined') return;
    const list = this.rehabilitationListSessions().filter((item) => item.id !== session.id);
    list.unshift(session);
    localStorage.setItem(this.sessionsKey, JSON.stringify(list.slice(0, 200)));
  }

  private async rehabilitationSaveExerciseRows(session: RehabilitationSession): Promise<void> {
    const exercises = session.exercises.map((exercise) => ({
      id: exercise.id,
      session_id: session.id,
      exercise_name: exercise.exerciseName,
      exercise_type: exercise.exerciseType,
      target_body_part: exercise.targetBodyPart,
      repetitions_done: exercise.repetitionsDone,
      repetitions_correct: exercise.repetitionsCorrect,
      repetitions_wrong: exercise.repetitionsWrong,
      score: exercise.score,
      accuracy_percent: exercise.accuracyPercent,
      range_of_motion: exercise.rangeOfMotion,
      average_speed: exercise.averageSpeed,
      tremor_score: exercise.tremorScore,
      error_summary: exercise.errors
    }));
    if (exercises.length) await this.supabase.client.from('rehabilitation_exercises').upsert(exercises);

    const jointMetrics = session.exercises.flatMap((exercise) => exercise.jointMetrics.map((metric, index) => ({
      id: `${exercise.id}-joint-${index}`,
      exercise_id: exercise.id,
      joint_name: metric.jointName,
      min_angle: metric.minAngle,
      max_angle: metric.maxAngle,
      average_angle: metric.averageAngle,
      ideal_angle: metric.idealAngle,
      deviation: metric.deviation
    })));
    if (jointMetrics.length) await this.supabase.client.from('rehabilitation_joint_metrics').upsert(jointMetrics);
  }
}
