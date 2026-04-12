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
      return Array.isArray(arr) ? arr : [];
    } catch (error) {
      console.error('Respiratory sessions parse error:', error);
      return [];
    }
  }

  saveSession(session: RespiratoryVoiceSession) {
    if (typeof window === 'undefined') return;
    const current = this.listSessions();
    current.unshift(session);
    localStorage.setItem(this.key, JSON.stringify(current.slice(0, 80)));
  }
}
