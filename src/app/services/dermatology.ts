import { Injectable, signal } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class DermatologyService {
  cases = signal<DermatologyCase[]>([]);

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dermatologyCases');
      if (saved) {
        try {
          this.cases.set(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse dermatologyCases from localStorage:', error);
          this.cases.set([]);
        }
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermatologyCases', JSON.stringify(this.cases()));
    }
  }

  getCases() {
    return this.cases();
  }

  createCase(): DermatologyCase {
    const newCase: DermatologyCase = {
      id: Math.random().toString(36).substring(7),
      userId: 'current-user',
      role: 'patient',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      images: [],
      files: [],
      chatHistory: [],
      currentQuestionIndex: 0,
      answers: {},
      monitoringLogs: []
    };
    
    this.cases.update(c => [newCase, ...c]);
    this.save();
    return newCase;
  }

  updateCase(dCase: DermatologyCase) {
    this.cases.update(list => list.map(c => c.id === dCase.id ? dCase : c));
    this.save();
  }

  async analyzeImage(base64: string): Promise<string> {
    const model = "gemini-3-flash-preview";
    const prompt = "Ushbu teri muammosi tasvirlangan rasmda nimalarni ko'ryapsiz? Faqat klinik belgilarni ayting.";
    
    try {
      const response = await fetch('/api/ai/dermatology/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, base64 })
      });
      if (!response.ok) throw new Error(`Dermatology image endpoint failed: ${response.status}`);
      const payload = await response.json() as { text?: string };
      return payload.text || '';
    } catch (error) {
      console.error('AI Analysis error:', error);
      return 'Rasm tahlilida xatolik yuz berdi.';
    }
  }

  async getNextQuestion(dCase: DermatologyCase): Promise<string> {
    const model = "gemini-3-flash-preview";
    const prompt = `Siz dermatolog yordamchisiz. Bemor bilan muloqot qilyapsiz.
    Hozirgi holat:
    - Yuklangan rasmlar soni: ${dCase.images.length}
    - Yuklangan fayllar: ${dCase.files.map(f => f.name).join(', ')}
    - Oldingi savol-javoblar: ${JSON.stringify(dCase.chatHistory)}
    - Anatomik joylashuv: ${dCase.bodyLocation || 'Noma\'lum'}
    
    Vazifa: Bemorga keyingi eng muhim klinik savolni bering. Savol o'zbek tilida, professional va hamdard bo'lsin. 
    Faqat bitta savol bering. Agar barcha kerakli ma'lumotlar yig'ilgan bo'lsa, "DIAGNOSIS_READY" deb javob bering.`;

    try {
      const response = await fetch('/api/ai/dermatology/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt })
      });
      if (!response.ok) throw new Error(`Dermatology question endpoint failed: ${response.status}`);
      const payload = await response.json() as { text?: string };
      return (payload.text || '').trim() || "Savol generatsiya qilinmadi. Iltimos, qayta urinib ko'ring.";
    } catch (error) {
      console.error('Dermatology question generation error:', error);
      return "AI savol yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
    }
  }

  async generateDiagnosis(dCase: DermatologyCase): Promise<DermatologyDiagnosisResult> {
    const model = "gemini-3-flash-preview";
    const prompt = `Barcha ma'lumotlar asosida to'liq dermatologik tahlil bering.
    Ma'lumotlar:
    - Rasmlar: ${dCase.images.length} ta
    - Fayl tahlillari: ${dCase.files.map(f => f.insights).join('; ')}
    - Savol-javoblar: ${JSON.stringify(dCase.chatHistory)}
    - Anatomik joylashuv: ${dCase.bodyLocation}
    
    Natija JSON formatida bo'lsin.`;

    try {
      const response = await fetch('/api/ai/dermatology/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt })
      });
      if (!response.ok) throw new Error(`Dermatology diagnosis endpoint failed: ${response.status}`);
      const payload = await response.json() as { text?: string };
      return JSON.parse(payload.text || '{}');
    } catch (error) {
      console.error('Dermatology diagnosis generation error:', error);
      throw new Error('Dermatology AI tashxisini yaratishda xatolik yuz berdi.');
    }
  }
}
