export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface CaseRecord {
  id: string;
  patientId: string;
  createdBy: string;
  caseType: string;
  status: 'new' | 'in_review' | 'stable' | 'urgent';
  chiefComplaint: string;
  symptoms: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface UrineBasicInput {
  brightness: number;
  blur: number;
  reflection: number;
  containerVisible: boolean;
  calibrationCard: boolean;
}

export interface UrineBasicResult {
  qualityScore: number;
  colorClass: 'very_light' | 'straw' | 'amber' | 'dark';
  turbidityClass: 'clear' | 'slightly_cloudy' | 'cloudy';
  visibleBloodSuspicion: boolean;
  foamSuspicion: boolean;
  hydrationSignal: 'good' | 'watch' | 'possible_dehydration';
  explanation: string[];
}

export interface UrineStripResult {
  protein: string;
  blood: string;
  glucose: string;
  ketone: string;
  nitrite: string;
  leukocyte: string;
  ph: string;
  specificGravity: string;
  confidence: number;
  explanation: string[];
}

export interface TwinInput {
  creatinine?: number;
  egfr?: number;
  proteinuria?: number;
  tacrolimus?: number;
  crp?: number;
  albumin?: number;
  systolicBp?: number;
  weightDelta?: number;
  urineOutput?: number;
  temperature?: number;
  adherence?: number;
  dsaPositive?: boolean;
  ddcfDna?: number;
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
  nextBestTest: string;
  urgency: 'low' | 'medium' | 'high';
  confidenceBand: 'low' | 'medium' | 'high';
  rationale: string[];
}
