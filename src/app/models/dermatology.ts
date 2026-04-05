export interface DermatologyCase {
  id: string;
  userId: string;
  patientId?: string;
  role: 'patient' | 'doctor';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'urgent';
  
  // Input data
  images: { url: string; quality: 'good' | 'blurry'; timestamp: string }[];
  files: { name: string; type: string; content?: string; insights?: string }[];
  bodyLocation?: string;
  
  // Chat history
  chatHistory: { role: 'user' | 'assistant'; text: string; timestamp: string }[];
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  
  // Analysis results
  diagnosis?: {
    main: string;
    mainProbability: number;
    differentials: { name: string; probability: number }[];
    description: string;
    reasoning: string;
    supportingSigns: string[];
    opposingSigns: string[];
    recommendedTests: string[];
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    clinicalNote: string;
    pathogenesis?: string; // For doctors
    molecularMechanism?: string; // For doctors
    redFlags: string[];
  };
  
  // Treatment plan
  treatmentPlan?: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instruction: string;
      reason: string;
      form: 'cream' | 'ointment' | 'gel' | 'tablet' | 'other';
      adherenceProofs: { timestamp: string; imageUrl: string; note: string }[];
    }[];
    generalCare: string[];
    followUpDate?: string;
    urgentContactSigns: string[];
  };
  
  // Monitoring
  monitoringLogs: {
    timestamp: string;
    symptoms: {
      itching: number; // 0-10
      pain: number; // 0-10
      spread: 'improving' | 'stable' | 'worsening';
    };
    imageUrl?: string;
    note: string;
    aiAssessment?: 'improving' | 'stable' | 'worsening';
  }[];
  
  doctorNotes?: string;
}

export interface DermatologyDiagnosisResult {
  main: string;
  mainProbability: number;
  differentials: { name: string; probability: number }[];
  description: string;
  reasoning: string;
  supportingSigns: string[];
  opposingSigns: string[];
  recommendedTests: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  clinicalNote: string;
  pathogenesis?: string;
  molecularMechanism?: string;
  redFlags: string[];
  treatmentPlan: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instruction: string;
      reason: string;
      form: 'cream' | 'ointment' | 'gel' | 'tablet' | 'other';
      adherenceProofs: { timestamp: string; imageUrl: string; note: string }[];
    }[];
    generalCare: string[];
    followUpDate?: string;
    urgentContactSigns: string[];
  };
}
