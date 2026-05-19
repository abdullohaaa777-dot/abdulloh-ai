import { Injectable } from '@angular/core';

export interface RespiratoryVoiceMetrics {
  breathingRate: number;
  breathingRhythmVariability: number;
  breathIntervalVariability: number;
  pauseFrequency: number;
  pauseDurationBurden: number;
  chestMotionAmplitude: number;
  chestMotionRegularity: number;
  visibleRespiratoryEffort: number;
  chestMotionSymmetryScore: number;
  speechRate: number;
  speechRateVariability: number;
  speechBreathInterruptions: number;
  phraseContinuityScore: number;
  readingBreathEfficiency: number;
  coughIntensityPattern: number;
  coughRepetitionPattern: number;
  coughBurdenIndex: number;
  audioIrregularityScore: number;
  recoveryTime: number;
  recoverySlope: number;
  symptomBurdenScore: number;
  overallRespiratoryStability: number;
  overallFunctionalRecovery: number;
  overallSpeechBreathEfficiency: number;
  overallRespiratoryPerformance: number;
  normalityProximityScore: number;
  concernIndex: number;
}

export interface RespiratoryVoiceInterpretation {
  qisqaXulosa: string;
  topilganBelgilar: string[];
  negaXulosa: string[];
  metrikSabablar: string[];
  ehtimoliyYonalislar: string[];
  negaMos: string[];
  skriningXavfDarajasi: 'past' | 'o\'rta' | 'yuqori';
  normagaYaqinlikBahosi: string;
  chuqurTavsiyalar: string[];
  uySharoitidaOzgarishlar: string[];
  followUpRejasi: string[];
  shifokorgaQachon: string[];
}

export interface RespiratoryVoiceQuestionnaire {
  cough: 'yoq' | 'yengil' | 'orta' | 'kuchli';
  sputum: 'yoq' | 'kam' | 'kop';
  fever: 'yoq' | 'bor';
  breathlessness: 'yoq' | 'faollikda' | 'damdaHam';
  chestPain: 'yoq' | 'yengil' | 'sezilarli';
  asthmaHistory: 'yoq' | 'bor';
  allergyHistory: 'yoq' | 'bor';
  smokingHistory: 'yoq' | 'oldin' | 'hozir';
  recentViralIllness: 'yoq' | '1oyIchida';
  symptomDurationDays: number;
  exertionalWorsening: 'yoq' | 'bor';
  nighttimeSymptoms: 'yoq' | 'ba\'zan' | 'tez-tez';
}

export interface RespiratoryVoiceSession {
  id: string;
  createdAt: string;
  metrics: RespiratoryVoiceMetrics;
  questionnaire: RespiratoryVoiceQuestionnaire;
  waveform: number[];
  motionSeries?: number[];
  interpretation: RespiratoryVoiceInterpretation;
  riskPercent: number;
  normalityPercent: number;
  source: 'local' | 'ai';
}

@Injectable({ providedIn: 'root' })
export class RespiratoryVoiceStorageService {
  private readonly key = 'respiratory-voice-sessions-v1';

  listSessions(): RespiratoryVoiceSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return (Array.isArray(arr) ? arr : []).map((item) => this.normalize(item));
    } catch (error) {
      console.error('Respiratory sessions parse error:', error);
      return [];
    }
  }

  saveSession(session: RespiratoryVoiceSession) {
    if (typeof window === 'undefined') return;
    const current = this.listSessions();
    current.unshift(this.normalize(session));
    localStorage.setItem(this.key, JSON.stringify(current.slice(0, 80)));
  }

  private normalize(input: unknown): RespiratoryVoiceSession {
    const item = (input ?? {}) as Partial<RespiratoryVoiceSession>;
    const metrics = item.metrics ?? ({} as RespiratoryVoiceMetrics);

    return {
      id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `resp-${Date.now()}`),
      createdAt: item.createdAt || new Date().toISOString(),
      metrics: {
        breathingRate: metrics.breathingRate ?? 16,
        breathingRhythmVariability: metrics.breathingRhythmVariability ?? 40,
        breathIntervalVariability: metrics.breathIntervalVariability ?? 40,
        pauseFrequency: metrics.pauseFrequency ?? 20,
        pauseDurationBurden: metrics.pauseDurationBurden ?? 20,
        chestMotionAmplitude: metrics.chestMotionAmplitude ?? 50,
        chestMotionRegularity: metrics.chestMotionRegularity ?? 50,
        visibleRespiratoryEffort: metrics.visibleRespiratoryEffort ?? 35,
        chestMotionSymmetryScore: metrics.chestMotionSymmetryScore ?? 55,
        speechRate: metrics.speechRate ?? 120,
        speechRateVariability: metrics.speechRateVariability ?? 35,
        speechBreathInterruptions: metrics.speechBreathInterruptions ?? 25,
        phraseContinuityScore: metrics.phraseContinuityScore ?? 60,
        readingBreathEfficiency: metrics.readingBreathEfficiency ?? 60,
        coughIntensityPattern: metrics.coughIntensityPattern ?? 35,
        coughRepetitionPattern: metrics.coughRepetitionPattern ?? 25,
        coughBurdenIndex: metrics.coughBurdenIndex ?? 30,
        audioIrregularityScore: metrics.audioIrregularityScore ?? 35,
        recoveryTime: metrics.recoveryTime ?? 20,
        recoverySlope: metrics.recoverySlope ?? 60,
        symptomBurdenScore: metrics.symptomBurdenScore ?? 20,
        overallRespiratoryStability: metrics.overallRespiratoryStability ?? 60,
        overallFunctionalRecovery: metrics.overallFunctionalRecovery ?? 60,
        overallSpeechBreathEfficiency: metrics.overallSpeechBreathEfficiency ?? 60,
        overallRespiratoryPerformance: metrics.overallRespiratoryPerformance ?? 60,
        normalityProximityScore: metrics.normalityProximityScore ?? 60,
        concernIndex: metrics.concernIndex ?? 30
      },
      questionnaire: {
        cough: item.questionnaire?.cough ?? 'yoq',
        sputum: item.questionnaire?.sputum ?? 'yoq',
        fever: item.questionnaire?.fever ?? 'yoq',
        breathlessness: item.questionnaire?.breathlessness ?? 'yoq',
        chestPain: item.questionnaire?.chestPain ?? 'yoq',
        asthmaHistory: item.questionnaire?.asthmaHistory ?? 'yoq',
        allergyHistory: item.questionnaire?.allergyHistory ?? 'yoq',
        smokingHistory: item.questionnaire?.smokingHistory ?? 'yoq',
        recentViralIllness: item.questionnaire?.recentViralIllness ?? 'yoq',
        symptomDurationDays: item.questionnaire?.symptomDurationDays ?? 0,
        exertionalWorsening: item.questionnaire?.exertionalWorsening ?? 'yoq',
        nighttimeSymptoms: item.questionnaire?.nighttimeSymptoms ?? 'yoq'
      },
      waveform: Array.isArray(item.waveform) ? item.waveform : [],
      motionSeries: Array.isArray(item.motionSeries) ? item.motionSeries : [],
      interpretation: item.interpretation ?? {
        qisqaXulosa: 'Natija skrining va kuzatuv uchun.',
        topilganBelgilar: [],
        negaXulosa: [],
        metrikSabablar: [],
        ehtimoliyYonalislar: [],
        negaMos: [],
        skriningXavfDarajasi: 'past',
        normagaYaqinlikBahosi: 'Normaga yaqin.',
        chuqurTavsiyalar: [],
        uySharoitidaOzgarishlar: [],
        followUpRejasi: [],
        shifokorgaQachon: []
      },
      riskPercent: typeof item.riskPercent === 'number' ? item.riskPercent : 30,
      normalityPercent: typeof item.normalityPercent === 'number' ? item.normalityPercent : 70,
      source: item.source === 'ai' ? 'ai' : 'local'
    };
  }
}
