import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface CaseUpload {
  id: string;
  file_path: string;
  created_at: string;
}

export interface CaseData {
  id: string;
  full_name: string;
  location: string;
  living_conditions: string;
  air_quality: string;
  ecological_cleanliness: string;
  age: number;
  gender: string;
  symptoms: string;
  history?: string;
  bp: number; // SBP
  dbp?: number;
  height?: number;
  weight?: number;
  cholesterol: number;
  smoking: boolean;
  // Laboratory values
  hemoglobin?: number;
  wbc?: number;
  platelets?: number;
  glucose?: number;
  creatinine?: number;
  creatinine_unit?: 'mg/dL' | 'umol/L';
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  crp?: number;
  troponin?: number;
  alt?: number;
  ast?: number;
  sodium?: number;
  potassium?: number;
  chloride?: number;
  bicarbonate?: number;
  albumin?: number;
  calcium?: number;
  bilirubin?: number;
  inr?: number;
  bun?: number;
  // Anemia specific markers
  mcv?: number;
  mch?: number;
  mchc?: number;
  ferritin?: number;
  iron?: number;
  tibc?: number;
  vitamin_b12?: number;
  folate?: number;
  reticulocytes?: number;
  ldh?: number;
  haptoglobin?: number;
  
  measured_osmolality?: number;
  urine_na?: number;
  urine_creatinine?: number;
  // Clinical signs
  ascites?: 'none' | 'mild' | 'moderate-severe';
  encephalopathy?: 'none' | 'grade 1-2' | 'grade 3-4';
  rr?: number;
  gcs_less_15?: boolean;
  // History flags
  chf?: boolean;
  hypertension?: boolean;
  stroke_history?: boolean;
  vascular_disease?: boolean;
  diabetes_history?: boolean;
  
  lab_text?: string;
  created_at: string;
  uploads?: CaseUpload[];
  chats?: ChatMessage[];
}

export interface ComputedFormula {
  name: string;
  formula: string;
  inputs: Record<string, unknown>;
  result: unknown;
  units: string;
  interpretation: string;
}

export interface AnalysisResult {
  risk_score: {
    formula: string;
    z_value: string;
    risk_percent: string;
    risk_category: string;
  };
  laboratory_analysis: {
    marker: string;
    value: string;
    reference_range: string;
    status: 'normal' | 'high' | 'low';
    interpretation: string;
  }[];
  five_year_risks: {
    heart: number;
    kidney: number;
    lung: number;
    liver: number;
    cancer: number;
    diabetes: number;
    anemia: number;
    sepsis: number;
    rehospitalization: number;
    nutritional_deficiency: number;
    chronic_inflammation: number;
    quality_of_life_decline: number;
  };
  computed_formulas: ComputedFormula[];
  anemia_analysis?: {
    type: string;
    pathogenesis: string;
    evidence: string[];
    severity: 'mild' | 'moderate' | 'severe';
  };
  cf_analysis?: {
    likelihood: 'low' | 'moderate' | 'high';
    pathogenesis: string;
    differential_diagnosis_questions: string[];
    supporting_evidence: string[];
  };
  missing_inputs_needed: string[];
  notes: string[];
  clinical_summary: string;
  treatment_plan: {
    lifestyle: string[];
    medications: {
      name: string;
      dosage: string;
      indication: string;
    }[];
  };
  differential_diagnosis: string[];
  recommended_tests: string[];
  red_flags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    const key = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async analyzeCase(caseData: CaseData, mode: 'patient' | 'doctor', locale: 'uz' | 'ru' | 'en' = 'uz'): Promise<AnalysisResult> {
    if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
      throw new Error('Gemini API kaliti topilmadi. Iltimos, sozlamalarni tekshiring.');
    }

    const systemInstruction = `You are "Abdulloh AI", a professional clinical decision support system.
    Your task is to analyze laboratory results and integrate them with existing risk calculations and clinical reasoning.
    
    SPECIAL FOCUS: Differential diagnosis of Anemias. You MUST distinguish between:
    1. Iron Deficiency Anemia (Temir tanqisligi anemiyasi) - microcytic, low ferritin.
    2. Vitamin B12/Folate Deficiency Anemia (B12/Foliy kislotasi tanqisligi anemiyasi) - macrocytic.
    3. Hemolytic Anemia (Gemolitik anemiya) - high bilirubin, high LDH, reticulocytosis.
    4. Aplastic Anemia (Aplastik anemiya) - pancytopenia (low WBC, low Platelets, low Hb).
    
    SPECIAL FOCUS: Differential diagnosis of Cystic Fibrosis (Mukovitsidoz). 
    You MUST evaluate the likelihood of Cystic Fibrosis and differentiate it from:
    1. Primary Ciliary Dyskinesia (Birlamchi siliar diskineziya) - situs inversus, chronic sinusitis.
    2. Bronchiectasis (Bronxoektaziya) - localized vs diffuse.
    3. Asthma (Astma) - reversible airway obstruction.
    4. Celiac Disease (Seliakiya) - malabsorption without respiratory involvement.
    5. Immunodeficiency (Immun tanqisligi) - recurrent infections without exocrine pancreatic insufficiency.
    
    If Cystic Fibrosis is suspected, you MUST ask targeted, clinically relevant questions in Uzbek to help differentiate it. 
    These questions MUST be scientific and clinical in nature.
    Examples: "Ekzokrin pankreatik yetishmovchilik belgilari (steatoreya) bormi?", "Ter testida xloridlar miqdori aniqlanganmi?", "Surunkali yo'tal va balg'am ajralishi bormi?".
    Place these in the "cf_analysis.differential_diagnosis_questions" array.
    
    NEVER claim absolute certainty. Provide likelihood and clinical interpretation.
    Language must follow the selected locale: ${locale}.
    
    PART 1 — CLINICAL FORMULAS
    When clinical data is provided, you MUST compute relevant clinical formulas.
    Always state EXACTLY which formula you used, show substituted values, and final results.
    If required inputs are missing, ask ONLY for the missing variables needed for that formula in the "missing_inputs_needed" array.
    Never invent patient values. Never invent formula coefficients.
    Use appropriate units and specify them.
    
    FORMULAS TO COMPUTE (if inputs exist):
    (1) Logistic risk model: Z = -7 + 0.06*age + 0.02*sbp + 0.8*smoking. Risk = 1 / (1 + exp(-Z)).
    (2) BMI = weight(kg) / (height(m)^2)
    (3) MAP = (SBP + 2*DBP) / 3
    (4) LDL (Friedewald) = Total Cholesterol - HDL - (Triglycerides / 5) [valid if TG < 400 mg/dL]
    (5) Anion Gap = Na - (Cl + HCO3)
    (6) eGFR (CKD-EPI 2021): eGFR = 142 × min(Scr/k, 1)^α × max(Scr/k, 1)^(-1.200) × 0.9938^Age × (1.012 if female)
        [k = 0.7 (F) or 0.9 (M); α = -0.241 (F) or -0.302 (M)]
    (7) Creatinine Clearance (Cockcroft–Gault): CrCl = ((140 − Age) × Weight) / (72 × Scr) × (0.85 if female)
    (8) Corrected Calcium = Measured Ca + 0.8 × (4.0 − Albumin)
    (9) Serum Osmolality (calculated) = 2×Na + (Glucose/18) + (BUN/2.8)
    (10) Osmolal Gap = Measured Osm − Calculated Osm
    (11) FENa(%) = (UNa × PCr) / (PNa × UCr) × 100
    (12) Child–Pugh Score (cirrhosis severity): Sum points for Bilirubin, Albumin, INR, Ascites, Encephalopathy.
    (13) MELD-Na: MELD(i) = 3.78×ln(bilirubin) + 11.2×ln(INR) + 9.57×ln(creatinine) + 6.43; MELD-Na = MELD(i) + 1.32×(137 − Na) − 0.033×MELD(i)×(137 − Na)
    (14) qSOFA: RR ≥ 22 (+1), SBP ≤ 100 (+1), GCS < 15 (+1).
    (15) CHA₂DS₂-VASc: CHF(1), HTN(1), Age>=75(2), DM(1), Stroke(2), Vascular(1), Age 65-74(1), Female(1).
    
    PART 2 — LABORATORY DIAGNOSTIC INTERPRETATION
    Reference ranges:
    - Hemoglobin (g/dL): Male 13–17, Female 12–15
    - MCV (fL): 80–100 (Microcytic < 80, Macrocytic > 100)
    - Ferritin (ng/mL): 20–250
    - Vitamin B12 (pg/mL): 200–900
    - Folate (ng/mL): 2–20
    - Reticulocytes (%): 0.5–1.5
    - LDH (U/L): 140–280
    - WBC (x10⁹/L): 4–10
    - Platelets (x10⁹/L): 150–400
    - Glucose fasting (mmol/L): 3.9–5.5
    - Creatinine (µmol/L): Male 62–115, Female 53–97
    - CRP (mg/L): <5
    - Troponin (ng/mL): <0.04
    - ALT (U/L): 7–56
    - AST (U/L): 10–40
    
    PART 3 — 5-YEAR RISK ESTIMATION
    Estimate the probability (0-100%) of developing the following conditions within the next 5 years:
    - Heart failure, Kidney failure, Lung disease, Liver failure, Cancer/Tumor, Diabetes, Anemia, Sepsis/Severe Infection, Rehospitalization, Nutritional Deficiency, Chronic Inflammation, Quality of Life Decline.
    
    PART 4 — CLINICAL SYNTHESIS & PATHOGENESIS
    Combine Symptoms, History, Risk score, and Lab abnormalities.
    
    DIFFERENTIAL DIAGNOSIS:
    You MUST provide exactly 1 main diagnosis and exactly 3 differential diagnoses.
    The "differential_diagnosis" array should contain exactly 4 items: [Main Diagnosis, Diff 1, Diff 2, Diff 3].
    Assign a percentage likelihood to each, ensuring the total sum is exactly 100%.
    Format: "Diagnosis Name (Likelihood%)"
    
    ENVIRONMENTAL & DEMOGRAPHIC ANALYSIS:
    You MUST analyze how the patient's location (${caseData.location || 'N/A'}), living conditions (${caseData.living_conditions || 'N/A'}), 
    air quality (${caseData.air_quality || 'N/A'}), and ecological cleanliness (${caseData.ecological_cleanliness || 'N/A'}) 
    impact their current health status and future risks. 
    Consider regional diseases, pollution-related respiratory issues, and socioeconomic factors related to living conditions.
    
    ANEMIA ANALYSIS:
    If hemoglobin is low, you MUST provide a detailed "anemia_analysis" object.
    - type: One of the 4 types mentioned or "Other".
    - pathogenesis: Detailed mechanism.
    - evidence: List specific lab values (e.g., "MCV 72 fL", "Ferritin 5 ng/mL") that support this type.
    - severity: Based on Hb levels.

    CYSTIC FIBROSIS (MUKOVITSIDOZ) ANALYSIS:
    If symptoms (chronic cough, salty skin, malabsorption) or history suggest it, provide a "cf_analysis" object.
    - likelihood: low | moderate | high.
    - pathogenesis: Detailed molecular mechanism (CFTR mutation, chloride channel dysfunction).
    - differential_diagnosis_questions: Targeted clinical questions in Uzbek to help differentiate from other conditions.
    - supporting_evidence: Clinical signs or lab values from the case that support the suspicion.
    
    For each potential condition identified:
    - Explain the PATHOGENESIS (rivojlanish mexanizmi) in extreme detail.
    - If mode is "doctor", include pathophysiological and molecular mechanisms (e.g., cell receptor changes, enzyme deficiencies, genetic mutations like CFTR for Mukovitsidoz).
    - Describe how the patient's specific lab values reflect this pathogenesis.
    - Provide a clear clinical reasoning for the suspected diagnosis.

    PART 5 — TREATMENT RECOMMENDATIONS
    Provide a structured "treatment_plan" object:
    - lifestyle: List specific lifestyle improvements (diet, activity, habits).
    - medications: List specific medication names, typical dosages, and why they are indicated for this patient.
    
    If unit mismatch is suspected (e.g., creatinine mg/dL vs µmol/L), ask a single clarifying question in "notes".
    
    Return ONLY JSON:
    {
      "risk_score": {
        "formula": "string",
        "z_value": "string",
        "risk_percent": "string",
        "risk_category": "string"
      },
      "laboratory_analysis": [
        {
          "marker": "string",
          "value": "string",
          "reference_range": "string",
          "status": "normal | high | low",
          "interpretation": "string"
        }
      ],
      "five_year_risks": {
        "heart": number,
        "kidney": number,
        "lung": number,
        "liver": number,
        "cancer": number,
        "diabetes": number,
        "anemia": number,
        "sepsis": number,
        "rehospitalization": number,
        "nutritional_deficiency": number,
        "chronic_inflammation": number,
        "quality_of_life_decline": number
      },
      "computed_formulas": [
        {
          "name": "string",
          "formula": "string",
          "inputs": {},
          "result": {},
          "units": "string",
          "interpretation": "string"
        }
      ],
      "anemia_analysis": {
        "type": "string",
        "pathogenesis": "string",
        "evidence": ["string"],
        "severity": "mild | moderate | severe"
      },
      "cf_analysis": {
        "likelihood": "low | moderate | high",
        "pathogenesis": "string",
        "differential_diagnosis_questions": ["string"],
        "supporting_evidence": ["string"]
      },
      "missing_inputs_needed": ["string"],
      "notes": ["string"],
      "clinical_summary": "string",
      "treatment_plan": {
        "lifestyle": ["string"],
        "medications": [
          { "name": "string", "dosage": "string", "indication": "string" }
        ]
      },
      "differential_diagnosis": ["string"],
      "recommended_tests": ["string"],
      "red_flags": ["string"]
    }`;

    const prompt = `INPUT VARIABLES:
      mode: ${mode}
      locale: ${locale}
      
      Basic risk variables:
      full_name: ${caseData.full_name || 'N/A'}
      location: ${caseData.location || 'N/A'}
      living_conditions: ${caseData.living_conditions || 'N/A'}
      air_quality: ${caseData.air_quality || 'N/A'}
      ecological_cleanliness: ${caseData.ecological_cleanliness || 'N/A'}
      age: ${caseData.age}
      gender: ${caseData.gender}
      sbp: ${caseData.bp}
      dbp: ${caseData.dbp || 'N/A'}
      height: ${caseData.height || 'N/A'}
      weight: ${caseData.weight || 'N/A'}
      smoking: ${caseData.smoking}
      
      Symptoms: ${caseData.symptoms}
      History: ${caseData.history || 'Noma\'lum'}
      
      Laboratory values:
      hemoglobin: ${caseData.hemoglobin || 'N/A'}
      wbc: ${caseData.wbc || 'N/A'}
      platelets: ${caseData.platelets || 'N/A'}
      glucose: ${caseData.glucose || 'N/A'}
      creatinine: ${caseData.creatinine || 'N/A'} (${caseData.creatinine_unit || 'umol/L'})
      cholesterol: ${caseData.cholesterol || 'N/A'}
      ldl: ${caseData.ldl || 'N/A'}
      hdl: ${caseData.hdl || 'N/A'}
      triglycerides: ${caseData.triglycerides || 'N/A'}
      crp: ${caseData.crp || 'N/A'}
      troponin: ${caseData.troponin || 'N/A'}
      alt: ${caseData.alt || 'N/A'}
      ast: ${caseData.ast || 'N/A'}
      sodium: ${caseData.sodium || 'N/A'}
      potassium: ${caseData.potassium || 'N/A'}
      chloride: ${caseData.chloride || 'N/A'}
      bicarbonate: ${caseData.bicarbonate || 'N/A'}
      albumin: ${caseData.albumin || 'N/A'}
      calcium: ${caseData.calcium || 'N/A'}
      bilirubin: ${caseData.bilirubin || 'N/A'}
      inr: ${caseData.inr || 'N/A'}
      bun: ${caseData.bun || 'N/A'}
      
      Anemia markers:
      mcv: ${caseData.mcv || 'N/A'}
      mch: ${caseData.mch || 'N/A'}
      mchc: ${caseData.mchc || 'N/A'}
      ferritin: ${caseData.ferritin || 'N/A'}
      iron: ${caseData.iron || 'N/A'}
      tibc: ${caseData.tibc || 'N/A'}
      vitamin_b12: ${caseData.vitamin_b12 || 'N/A'}
      folate: ${caseData.folate || 'N/A'}
      reticulocytes: ${caseData.reticulocytes || 'N/A'}
      ldh: ${caseData.ldh || 'N/A'}
      haptoglobin: ${caseData.haptoglobin || 'N/A'}
      
      measured_osmolality: ${caseData.measured_osmolality || 'N/A'}
      urine_na: ${caseData.urine_na || 'N/A'}
      urine_creatinine: ${caseData.urine_creatinine || 'N/A'}
      
      Clinical signs:
      ascites: ${caseData.ascites || 'N/A'}
      encephalopathy: ${caseData.encephalopathy || 'N/A'}
      rr: ${caseData.rr || 'N/A'}
      gcs_less_15: ${caseData.gcs_less_15 || 'N/A'}
      
      History flags:
      chf: ${caseData.chf || 'N/A'}
      hypertension: ${caseData.hypertension || 'N/A'}
      stroke_history: ${caseData.stroke_history || 'N/A'}
      vascular_disease: ${caseData.vascular_disease || 'N/A'}
      diabetes_history: ${caseData.diabetes_history || 'N/A'}
      
      lab_text: ${caseData.lab_text || 'Yo\'q'}
      
      Iltimos, ushbu ma'lumotlar asosida tahlil bering.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      },
    });

    try {
      let text = response.text || '{}';
      // Strip markdown code blocks if the model included them
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0];
      } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0];
      }
      
      return JSON.parse(text.trim()) as AnalysisResult;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.log('Raw AI response:', response.text);
      throw new Error('AI javobini qayta ishlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  }

  async chat(_caseId: string, _history: unknown[], message: string) {
    const chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `Siz "Abdulloh AI" tibbiy tahlilchi va diagnostika bo'yicha mutaxassisiz. O'zbek tilida gapirasiz. 
        Sizning asosiy vazifalaringiz:
        1. Mukovitsidoz (Cystic Fibrosis) kasalligini aniqlash uchun bemor bilan muloqot qilish. 
           - Bemorning shikoyatlariga qarab, ushbu kasallikka xos bo'lgan savollarni (masalan: sho'r ter, surunkali yo'tal, hazm qilish muammolari) bering.
           - Agar bemor javob bermasa yoki noaniq javob bersa, savolni boshqacha yondashuv bilan qayta bering (masalan: "Farzandingizni o'pganingizda terisi sho'r emasmi?").
           - Proaktiv bo'ling, diagnozni aniqlashtirish uchun kerakli barcha klinik belgilarni so'rang.
        2. Anemiyaning 4 xil turini (Temir tanqisligi, B12 tanqisligi, Gemolitik va Aplastik) laboratoriya tahlillari asosida ajratib berish.
        3. Yakuniy xulosa: Muloqot oxirida aniq tashxis qo'ying va davolash uchun kerakli dori vositalarini (nomlari va dozalari bilan) tavsiya qiling.
        
        Muloqot uslubingiz: Professional, hamdard va natijaga yo'naltirilgan.`,
      },
    });

    // We can't easily pass history in this simplified version without mapping, 
    // but we can send the current message context.
    const response = await chat.sendMessage({ message });
    return response.text;
  }

  calculateRisk(age: number, sbp: number, smoking: boolean): number {
    const smokingVal = smoking ? 1 : 0;
    const z = -7 + 0.06 * age + 0.02 * sbp + 0.8 * smokingVal;
    const risk = 1 / (1 + Math.exp(-z));
    return Math.round(risk * 100);
  }
}
