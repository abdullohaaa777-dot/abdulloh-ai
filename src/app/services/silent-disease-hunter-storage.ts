import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export interface SdhOrganRisk {
  key: 'heart' | 'lungs' | 'brain' | 'metabolic' | 'stress' | 'cellular';
  nameUz: string;
  percent: number;
  levelUz: string;
  trendUz: string;
  reasons: string[];
}

export interface SdhInputSnapshot {
  patientId: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  wearableProvided: boolean;
  labProvided: boolean;
  questionnaireProvided: boolean;
  heartRate: number | null;
  hrv: number | null;
  spo2: number | null;
  sleepHours: number | null;
  glucose: number | null;
  hbA1c: number | null;
  hemoglobin: number | null;
  crp: number | null;
  creatinine: number | null;
  alt: number | null;
  fatigue: number;
  dyspnea: number;
  stress: number;
  sleepQuality: number;
  chestDiscomfort: boolean;
  neurologicalAsymmetry: boolean;
}

export interface SdhFeatureSet {
  facialFatigueScore: number;
  pallorCyanosisSuspicionScore: number;
  microExpressionVariability: number;
  motorSymmetryScore: number;
  respiratoryMotionPattern: number;
  voiceStressIndex: number;
  speechPauseFrequency: number;
  breathPressureDuringSpeech: number;
  hrvTrend: number;
  restingHeartRateTrend: number;
  spo2Instability: number;
  sleepRecoveryScore: number;
  activityDeclineScore: number;
  inflammatoryBurdenScore: number;
  metabolicStressScore: number;
  anemiaRiskSignal: number;
  renalStressSignal: number;
  hepaticStressSignal: number;
  fatigueIndex: number;
  dyspneaIndex: number;
  stressLoadScore: number;
  neurologicalSymptomScore: number;
}

export interface SdhResult {
  id: string;
  patientId: string;
  createdAt: string;
  overallRisk: number;
  physiologicalStability: number;
  confidence: number;
  signalQuality: number;
  emergencyWarning: boolean;
  usedInputs: string[];
  inputSnapshot: SdhInputSnapshot;
  features: SdhFeatureSet;
  organRisks: SdhOrganRisk[];
  differentialReasoning: { titleUz: string; percent: number; systemUz: string }[];
  timeline: number[];
  aiSummary: string;
  aiFindings: string[];
  patientExplanation: string;
  doctorNote: string;
  recommendations: string[];
}

@Injectable({ providedIn: 'root' })
export class SilentDiseaseHunterStorageService {
  private readonly sdhLocalKey = 'abdullohAI_silentDiseaseHunterResults';
  private supabase = inject(SupabaseService);

  sdhListLocal(): SdhResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.sdhLocalKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Silent Disease Hunter localStorage parse error:', error);
      return [];
    }
  }

  async sdhList(patientId?: string): Promise<SdhResult[]> {
    if (this.supabase.isConfigured()) {
      try {
        let query = this.supabase.client
          .from('silent_disease_hunter_results')
          .select('*')
          .order('created_at', { ascending: false });
        if (patientId) query = query.eq('patient_id', patientId);
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map((row) => this.sdhFromDbRow(row));
        }
        console.warn('Silent Disease Hunter Supabase list fallback:', error);
      } catch (error) {
        console.warn('Silent Disease Hunter Supabase list failed, local fallback used:', error);
      }
    }

    const local = this.sdhListLocal();
    return patientId ? local.filter((x) => x.patientId === patientId) : local;
  }

  async sdhSave(result: SdhResult): Promise<{ error: { message: string } | null }> {
    const normalized = this.sdhNormalize(result);
    if (typeof window !== 'undefined') {
      const list = this.sdhListLocal().filter((x) => x.id !== normalized.id);
      list.unshift(normalized);
      localStorage.setItem(this.sdhLocalKey, JSON.stringify(list.slice(0, 120)));
    }

    if (this.supabase.isConfigured()) {
      try {
        const { error } = await this.supabase.client
          .from('silent_disease_hunter_results')
          .upsert(this.sdhToDbRow(normalized));
        if (error) return { error: { message: error.message } };
      } catch (error) {
        return { error: { message: error instanceof Error ? error.message : 'Silent Disease Hunter saqlashda xatolik' } };
      }
    }

    return { error: null };
  }

  private sdhNormalize(result: SdhResult): SdhResult {
    return {
      ...result,
      id: result.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sdh-${Date.now()}`),
      createdAt: result.createdAt || new Date().toISOString(),
      organRisks: Array.isArray(result.organRisks) ? result.organRisks : [],
      differentialReasoning: Array.isArray(result.differentialReasoning) ? result.differentialReasoning : [],
      timeline: Array.isArray(result.timeline) ? result.timeline : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
    };
  }

  private sdhToDbRow(result: SdhResult) {
    return {
      id: result.id,
      patient_id: result.patientId,
      user_id: this.supabase.user()?.id ?? null,
      created_at: result.createdAt,
      overall_risk: result.overallRisk,
      physiological_stability: result.physiologicalStability,
      confidence: result.confidence,
      signal_quality: result.signalQuality,
      emergency_warning: result.emergencyWarning,
      used_inputs: result.usedInputs,
      input_snapshot: result.inputSnapshot,
      features: result.features,
      organ_risks: result.organRisks,
      differential_reasoning: result.differentialReasoning,
      timeline: result.timeline,
      ai_summary: result.aiSummary,
      ai_findings: result.aiFindings,
      patient_explanation: result.patientExplanation,
      doctor_note: result.doctorNote,
      recommendations: result.recommendations
    };
  }

  private sdhFromDbRow(row: Record<string, unknown>): SdhResult {
    return {
      id: String(row['id'] ?? `sdh-${Date.now()}`),
      patientId: String(row['patient_id'] ?? 'umumiy'),
      createdAt: String(row['created_at'] ?? new Date().toISOString()),
      overallRisk: Number(row['overall_risk'] ?? 0),
      physiologicalStability: Number(row['physiological_stability'] ?? 0),
      confidence: Number(row['confidence'] ?? 0),
      signalQuality: Number(row['signal_quality'] ?? 0),
      emergencyWarning: Boolean(row['emergency_warning']),
      usedInputs: Array.isArray(row['used_inputs']) ? row['used_inputs'] as string[] : [],
      inputSnapshot: row['input_snapshot'] as SdhInputSnapshot,
      features: row['features'] as SdhFeatureSet,
      organRisks: Array.isArray(row['organ_risks']) ? row['organ_risks'] as SdhOrganRisk[] : [],
      differentialReasoning: Array.isArray(row['differential_reasoning']) ? row['differential_reasoning'] as { titleUz: string; percent: number; systemUz: string }[] : [],
      timeline: Array.isArray(row['timeline']) ? row['timeline'] as number[] : [],
      aiSummary: String(row['ai_summary'] ?? ''),
      aiFindings: Array.isArray(row['ai_findings']) ? row['ai_findings'] as string[] : [],
      patientExplanation: String(row['patient_explanation'] ?? ''),
      doctorNote: String(row['doctor_note'] ?? ''),
      recommendations: Array.isArray(row['recommendations']) ? row['recommendations'] as string[] : []
    };
  }
}
