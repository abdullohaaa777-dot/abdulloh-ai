import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

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
  movementQualityAnalysis: string;
  jointProblemAnalysis: string;
  symmetryAnalysis: string;
  fatigueAnalysis: string;
  progressComparison: string;
  riskWarnings: string[];
  patientAdvice: string;
  doctorClinicalNote: string;
  nextExerciseRecommendation: string;
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
