export type OrganKey = 'heart' | 'kidney' | 'brain' | 'liver' | 'endocrine' | 'lung';
export type ConfidenceLevel = 'past' | 'o‘rtacha' | 'yuqori';
export type SignalQuality = 'past' | 'o‘rtacha' | 'yuqori';

export interface OrganSignalInputs {
  facialSymmetry: number;
  facialFatigue: number;
  breathingRhythm: number;
  breathingLoad: number;
  voiceStability: number;
  coughAcousticLoad: number;
  neuromotorTremor: number;
  coordinationStability: number;
  recoveryTolerance: number;
  signalQuality: SignalQuality;
  includePreviousHeartSignal: boolean;
}

export interface OrganScores {
  heart: number;
  kidney: number;
  brain: number;
  liver: number;
  endocrine: number;
  lung: number;
}

export interface InternalIndexes {
  bss: number;
  ari: number;
  icap: number;
  msp: number;
  ionl: number;
}

export interface OrganNetworkEdge {
  from: OrganKey;
  to: OrganKey | 'bloodPressure' | 'ionChannels' | 'metabolicSystem';
  score: number;
  interpretationUz: string;
}

export interface TopProblem {
  titleUz: string;
  probability: number;
  explanationUz: string;
}

export interface OrganBioelectricResult {
  id?: string;
  patient_id?: string | null;
  doctor_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  overallIndex: number;
  organScores: OrganScores;
  internalIndexes: InternalIndexes;
  networkEdges: OrganNetworkEdge[];
  topProblems: TopProblem[];
  confidence: ConfidenceLevel;
  aiSummaryUz: string;
  recommendationsUz: string[];
  rawTestSummary: string;
  disclaimerUz: string;
  disclaimerShown: true;
}
