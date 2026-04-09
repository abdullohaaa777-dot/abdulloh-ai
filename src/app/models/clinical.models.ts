export type AppRole = 'patient' | 'doctor' | 'admin';

export interface Profile {
  id: string;
  role: AppRole;
  fullName: string;
  email: string;
}

export interface CaseRecord {
  id: string;
  patientId: string;
  createdBy: string;
  caseType: 'general' | 'transplant';
  status: 'new' | 'in_review' | 'closed';
  chiefComplaint: string;
  symptoms: string[];
  notes?: string;
  createdAt: string;
}

export interface UrineBasicInput {
  brightness: number;
  blurScore: number;
  turbiditySignal: number;
  redHueSignal: number;
  foamSignal: number;
  calibrationCardDetected: boolean;
}

export interface UrineBasicResult {
  qualityScore: number;
  colorClass: 'very-light' | 'straw' | 'amber' | 'dark';
  turbidityClass: 'clear' | 'slightly-cloudy' | 'cloudy';
  visibleBloodSuspicion: 'low' | 'medium' | 'high';
  foamSuspicion: 'low' | 'medium' | 'high';
  hydrationSignal: 'possible-overhydration' | 'likely-adequate' | 'possible-dehydration';
  confidenceBand: 'low' | 'medium' | 'high';
  explanation: string[];
}

export interface UrineStripInput {
  timingSeconds: number;
  calibrationCardDetected: boolean;
  padSignals: Record<string, number>;
}

export interface UrineStripResult {
  timingValid: boolean;
  qualityScore: number;
  proteinResult: string;
  bloodResult: string;
  glucoseResult: string;
  ketoneResult: string;
  nitriteResult: string;
  leukocyteResult: string;
  phResult: string;
  sgResult: string;
  confidenceBand: 'low' | 'medium' | 'high';
  explanation: string[];
}

export interface TwinInput {
  creatinine?: number;
  egfr?: number;
  crp?: number;
  albumin?: number;
  systolicBp?: number;
  weightDeltaKg?: number;
  urineOutputMlDay?: number;
  tacrolimusLevel?: number;
  dsaStatus?: 'positive' | 'negative';
  ddCfDna?: number;
  medicationAdherencePercent?: number;
  proteinuria?: number;
  temperature?: number;
}

export interface TwinResult {
  modelVersion: string;
  graftReserveScore: number;
  inflammatoryReserveScore: number;
  microvascularReserveScore: number;
  metabolicReserveScore: number;
  recoveryReserveScore: number;
  immuneQuietnessIndex: number;
  silentRejectionRisk: number;
  drugToxicitySuspicion: number;
  infectionOverlapSuspicion: number;
  hemodynamicStressScore: number;
  likelyMechanism: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  nextBestTest: string;
  confidenceBand: 'low' | 'medium' | 'high';
  rationale: string[];
}

export interface CounterfactualScenario {
  name: string;
  delta: Partial<TwinInput>;
}
