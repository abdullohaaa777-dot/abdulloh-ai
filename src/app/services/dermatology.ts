import { Injectable, signal, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { SupabaseService } from './supabase';
import { DermatologyCase, DermatologyDiagnosisResult } from '../models/dermatology';

@Injectable({
  providedIn: 'root'
})
export class DermatologyService {
  private supabase = inject(SupabaseService);
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  cases = signal<DermatologyCase[]>([]);
  
  constructor() {
    this.init();
  }

  private async init() {
    const { data } = await this.supabase.getDermatologyCases();
    if (data) {
      this.cases.set(data as DermatologyCase[]);
    }
  }

  getCases() {
    return this.cases();
  }

  async createCase(): Promise<DermatologyCase> {
    const newCase: DermatologyCase = {
      id: Math.random().toString(36).substring(2, 15),
      userId: this.supabase.user()?.id || 'anonymous',
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
    
    const { data } = await this.supabase.createDermatologyCase(newCase);
    if (data) {
      this.cases.update(c => [data as DermatologyCase, ...c]);
    }
    return newCase;
  }

  async updateCase(dCase: DermatologyCase) {
    const { data } = await this.supabase.updateDermatologyCase(dCase.id, dCase);
    if (data) {
      this.cases.update(list => list.map(c => c.id === dCase.id ? data as DermatologyCase : c));
    }
  }

  async analyzeImage(base64: string): Promise<{ quality: 'good' | 'blurry', feedback: string }> {
    const model = "gemini-3-flash-preview";
    const prompt = "Ushbu dermatologik rasmni tahlil qiling. Rasm sifati yaxshimi (tashxis qo'yish uchun yetarlimi)? Agar yo'q bo'lsa, nima xato (yorug'lik, fokus va h.k.)? Javobni o'zbek tilida bering.";
    
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quality: { type: Type.STRING, enum: ['good', 'blurry'] },
              feedback: { type: Type.STRING }
            },
            required: ['quality', 'feedback']
          }
        }
      });
      
      const text = response.text || '{}';
      return JSON.parse(text) as { quality: 'good' | 'blurry', feedback: string };
    } catch (err) {
      console.error('Image analysis failed:', err);
      return { quality: 'good', feedback: "Rasm qabul qilindi, lekin tahlil qilishda texnik muammo yuz berdi. Davom etaveramiz." };
    }
  }

  async getNextQuestion(dCase: DermatologyCase): Promise<string> {
    const model = "gemini-3-flash-preview";
    const prompt = `Siz dermatologik AI yordamchisiz. Bemorga bitta-bitta savol berib, uning holatini aniqlashtirishingiz kerak.
    Hozirgi holat:
    - Yuklangan rasmlar soni: ${dCase.images.length}
    - Yuklangan fayllar: ${dCase.files.map(f => f.name).join(', ')}
    - Oldingi savol-javoblar: ${JSON.stringify(dCase.chatHistory)}
    - Anatomik joylashuv: ${dCase.bodyLocation || 'Noma\'lum'}
    
    Vazifa: Bemorga keyingi eng muhim klinik savolni bering. Savol o'zbek tilida, professional va hamdard bo'lsin. 
    Faqat bitta savol bering. Agar barcha kerakli ma'lumotlar yig'ilgan bo'lsa, "DIAGNOSIS_READY" deb javob bering.
    
    Savollar quyidagilarni qamrab olishi kerak (agar hali so'ralmagan bo'lsa):
    - Qachondan beri bor?
    - Qichishish, og'riq, achishish darajasi?
    - Isitma bormi?
    - Allergiya tarixi?
    - Dori tarixi?
    - Tarqalishi?`;

    const response = await this.ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    return (response.text || '').trim();
  }

  async generateDiagnosis(dCase: DermatologyCase): Promise<DermatologyDiagnosisResult> {
    const model = "gemini-3-flash-preview";
    const prompt = `Barcha ma'lumotlar asosida to'liq dermatologik tahlil bering.
    Ma'lumotlar:
    - Rasmlar: ${dCase.images.length} ta
    - Fayl tahlillari: ${dCase.files.map(f => f.insights).join('; ')}
    - Savol-javoblar: ${JSON.stringify(dCase.chatHistory)}
    - Anatomik joylashuv: ${dCase.bodyLocation}
    
    Natija JSON formatida bo'lsin va quyidagilarni o'z ichiga olsin:
    - main: Asosiy tashxis nomi
    - mainProbability: Foizda (0-100)
    - differentials: Top 3 differensial tashxis (nomi va foizi)
    - description: Kasallik haqida sodda o'zbekcha tushuntirish
    - reasoning: Nima uchun shu tashxis qo'yildi?
    - supportingSigns: Qo'llab-quvvatlovchi belgilar
    - opposingSigns: Qarshi belgilar
    - recommendedTests: Tavsiya etilgan tekshiruvlar
    - urgency: low | medium | high | emergency
    - clinicalNote: Shifokor uchun klinik izoh
    - pathogenesis: Rivojlanish mexanizmi (shifokor uchun)
    - molecularMechanism: Molekulyar mexanizm (shifokor uchun)
    - redFlags: Xavf belgilari
    - treatmentPlan: { medications: [{ name, dosage, frequency, duration, instruction, reason, form, adherenceProofs: [] }], generalCare: [], followUpDate: string, urgentContactSigns: [] }
    
    Tashxis va davolash rejasi O'zbek tilida bo'lsin.`;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text || '{}';
      return JSON.parse(text) as DermatologyDiagnosisResult;
    } catch (err) {
      console.error('Diagnosis generation failed:', err);
      throw err;
    }
  }
}
