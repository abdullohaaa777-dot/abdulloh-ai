export type HomeostasisRiskLevel = 'Past xavf' | 'O‘rta xavf' | 'Yuqori xavf' | 'Kritik signal';
export type HomeostasisTrendStatus = 'barqaror' | 'sekin yomonlashish' | 'tez yomonlashish' | 'tiklanish ehtimoli bor';

export interface HomeostasisInputData {
  age: number | null;
  gender: 'male' | 'female';
  heightCm: number | null;
  weightKg: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  temperature: number | null;
  sleepHours: number | null;
  stressLevel: number;
  nutritionQuality: number;
  physicalActivity: number;
  fatigue: number;
  thirst: boolean;
  dizziness: boolean;
  palpitations: boolean;
  weakness: boolean;
  sweating: boolean;
  sleepDisturbance: boolean;
  glucose: number | null;
  insulin: number | null;
  hba1c: number | null;
  cortisol: number | null;
  totalCholesterol: number | null;
  ldl: number | null;
  hdl: number | null;
  triglyceride: number | null;
  creatinine: number | null;
  egfr: number | null;
  alt: number | null;
  ast: number | null;
  bilirubin: number | null;
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  magnesium: number | null;
  crp: number | null;
  hemoglobin: number | null;
  wearableSummary: string;
}

export interface HomeostasisScores {
  homeostasisStabilityIndex: number;
  metabolicRiskIndex: number;
  cortisolStressLoadIndex: number;
  energyRecoveryIndex: number;
  electrolyteBalanceIndex: number;
}

export interface HomeostasisProjection {
  years: 5 | 10;
  status: HomeostasisTrendStatus;
  riskPercent: number;
  explanationUz: string;
}

export interface HomeostasisOrganInteraction {
  from: 'heart' | 'kidney' | 'liver' | 'endocrine' | 'brain';
  to: 'heart' | 'kidney' | 'liver' | 'endocrine' | 'brain';
  score: number;
  labelUz: string;
}

export interface HomeostasisDirection {
  titleUz: string;
  probability: number;
  explanationUz: string;
}

export interface HomeostasisAIAnalysis {
  summary: string;
  riskLevel: HomeostasisRiskLevel;
  keyFindings: string[];
  possibleDirections: HomeostasisDirection[];
  organInteractions: string[];
  recommendations: string[];
  monitoringPlan: string[];
  urgentWarnings: string[];
  explanationForPatient: string;
  explanationForDoctor: string;
}

export interface HomeostasisResult {
  inputData: HomeostasisInputData;
  calculatedScores: HomeostasisScores;
  riskLevel: HomeostasisRiskLevel;
  trendStatus: HomeostasisTrendStatus;
  missingData: string[];
  fiveYearProjection: HomeostasisProjection;
  tenYearProjection: HomeostasisProjection;
  organInteractionMap: HomeostasisOrganInteraction[];
  aiAnalysis: HomeostasisAIAnalysis;
  recommendations: string[];
  createdAt: string;
}
