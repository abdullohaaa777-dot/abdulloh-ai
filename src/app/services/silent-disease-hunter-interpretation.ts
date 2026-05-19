import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { SdhFinalAnalysisResponse, SdhTestCompletionState } from './silent-disease-hunter-storage';

export interface SdhAdvancedGeminiPayload {
  patientId: string;
  signalQuality: number;
  completedTests: string[];
  testStats: Record<string, number>;
  organRisks: { nameUz: string; percent: number; levelUz: string }[];
  emergencyFlags: string[];
  previousTrend: number[];
}

export interface SdhAdvancedGeminiAnalysis {
  source: 'gemini' | 'local';
  umumiyFiziologikHolat: string;
  testlarBoyichaNatija: string[];
  nafasTizimiTahlili: string;
  yuzMimikaNevrologikSignalTahlili: string;
  qolMotorikasiTremorTahlili: string;
  yotalOvozNutqTahlili: string;
  yurakRiskSignallari: string;
  organlarBoyichaRiskFoizlari: { nameUz: string; percent: number; levelUz: string }[];
  signalSifatiTasiri: string;
  engMuhimTopilmalar: string[];
  bemorUchunXulosa: string;
  shifokorUchunXulosa: string;
  keyingiTavsiyalar: string[];
  emergencyWarningBor: boolean;
  disclaimer: string;
}

export interface SdhFinalAnalysisPayload {
  meta: {
    platform: 'Abdulloh AI';
    module: 'Silent Disease Hunter';
    analysisType: 'multimodal_final_analysis';
    createdAt: string;
    patientId: string | null;
    guestSession: boolean;
    source: 'auto' | 'manual';
    language: 'uz';
  };
  completedTests: SdhTestCompletionState;
  signalQuality: Record<string, number>;
  breathingResults: Record<string, number | string | boolean>;
  facialMimicResults: Record<string, number | string | boolean>;
  handMotorResults: Record<string, number | string | boolean>;
  coughVoiceReadingResults: Record<string, number | string | boolean>;
  cardiacResults: Record<string, number | string | boolean>;
  manualInputs: Record<string, number | string | boolean | null>;
  labInputs: Record<string, number | string | boolean | null>;
  wearableInputs: Record<string, number | string | boolean | null>;
  previousResultForTrend: {
    exists: boolean;
    previousCreatedAt: string | null;
    previousOverallRisk: number | null;
    previousOrganRisks: Record<string, number> | null;
    previousMainFindings: string[];
  };
}

export interface SdhFinalAnalysisServiceResult {
  source: 'gemini' | 'local';
  analysis: SdhFinalAnalysisResponse;
}

@Injectable({ providedIn: 'root' })
export class SilentDiseaseHunterInterpretationService {
  private ai: GoogleGenAI | null = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY)
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    : null;

  async sdhInterpretFinal(payload: SdhFinalAnalysisPayload): Promise<SdhFinalAnalysisServiceResult> {
    const local = this.sdhBuildFinalFallback(payload);
    if (!this.ai) return { source: 'local', analysis: local };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{
            text: `Siz Abdulloh AI platformasidagi Silent Disease Hunter yakuniy tahlil qatlamisiz. Faqat o‘zbek tilida yozing. Yakuniy tashxis qo‘ymang, dori/doza yozmang. Xom video/audio yuborilmagan; faqat markerlar, scorelar, signal sifati va test statistikasi berilgan.

sdhAnalysisPayload=${JSON.stringify(payload)}

JSON schema bo‘yicha faqat valid JSON qaytaring:
{
  "overallRiskPercent": number,
  "overallStabilityPercent": number,
  "confidencePercent": number,
  "testScores": {"breathing": number, "facialMimic": number, "handMotor": number, "coughVoiceReading": number, "cardiac": number},
  "organRisks": {"cardiovascular": number, "respiratory": number, "neuromotor": number, "psychophysiologicalStress": number, "metabolic": number, "cellularInflammatory": number},
  "mainFindings": string[],
  "riskExplanation": string,
  "breathingAnalysis": string,
  "facialMimicAnalysis": string,
  "handMotorAnalysis": string,
  "voiceCoughReadingAnalysis": string,
  "cardiacAnalysis": string,
  "trendComparison": {"hasPrevious": boolean, "riskChange": "increased"|"decreased"|"stable"|"unknown", "summary": string},
  "patientSummary": string,
  "doctorSummary": string,
  "recommendations": string[],
  "emergencyWarning": {"active": boolean, "message": string},
  "limitations": string[],
  "disclaimer": string
}`
          }]
        }],
        config: { responseMimeType: 'application/json' }
      });
      return { source: 'gemini', analysis: this.sdhNormalizeFinalAnalysis(JSON.parse(response.text || '{}'), local) };
    } catch (error) {
      console.warn('Silent Disease Hunter final analysis fallback:', error);
      return { source: 'local', analysis: local };
    }
  }

  async sdhInterpretAdvanced(payload: SdhAdvancedGeminiPayload): Promise<SdhAdvancedGeminiAnalysis> {
    const local = this.sdhLocalAnalysis(payload);
    if (!this.ai) return local;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{
            text: `Siz Abdulloh AI ichidagi Silent Disease Hunter modulining tibbiy AI izohlovchisisiz. Faqat o‘zbek tilida yozing. Yakuniy tashxis qo‘ymang, dori/doza yozmang. Xom video/audio emas, faqat markerlar va signal statistikasi berilgan.

markerlar=${JSON.stringify(payload)}

Qattiq JSON schema:
{
  "umumiyFiziologikHolat": string,
  "testlarBoyichaNatija": string[],
  "nafasTizimiTahlili": string,
  "yuzMimikaNevrologikSignalTahlili": string,
  "qolMotorikasiTremorTahlili": string,
  "yotalOvozNutqTahlili": string,
  "yurakRiskSignallari": string,
  "organlarBoyichaRiskFoizlari": [{"nameUz": string, "percent": number, "levelUz": string}],
  "signalSifatiTasiri": string,
  "engMuhimTopilmalar": string[],
  "bemorUchunXulosa": string,
  "shifokorUchunXulosa": string,
  "keyingiTavsiyalar": string[],
  "emergencyWarningBor": boolean,
  "disclaimer": string
}`
          }]
        }],
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text || '{}') as Partial<SdhAdvancedGeminiAnalysis>;
      return {
        source: 'gemini',
        umumiyFiziologikHolat: parsed.umumiyFiziologikHolat || local.umumiyFiziologikHolat,
        testlarBoyichaNatija: parsed.testlarBoyichaNatija || local.testlarBoyichaNatija,
        nafasTizimiTahlili: parsed.nafasTizimiTahlili || local.nafasTizimiTahlili,
        yuzMimikaNevrologikSignalTahlili: parsed.yuzMimikaNevrologikSignalTahlili || local.yuzMimikaNevrologikSignalTahlili,
        qolMotorikasiTremorTahlili: parsed.qolMotorikasiTremorTahlili || local.qolMotorikasiTremorTahlili,
        yotalOvozNutqTahlili: parsed.yotalOvozNutqTahlili || local.yotalOvozNutqTahlili,
        yurakRiskSignallari: parsed.yurakRiskSignallari || local.yurakRiskSignallari,
        organlarBoyichaRiskFoizlari: parsed.organlarBoyichaRiskFoizlari || local.organlarBoyichaRiskFoizlari,
        signalSifatiTasiri: parsed.signalSifatiTasiri || local.signalSifatiTasiri,
        engMuhimTopilmalar: parsed.engMuhimTopilmalar || local.engMuhimTopilmalar,
        bemorUchunXulosa: parsed.bemorUchunXulosa || local.bemorUchunXulosa,
        shifokorUchunXulosa: parsed.shifokorUchunXulosa || local.shifokorUchunXulosa,
        keyingiTavsiyalar: parsed.keyingiTavsiyalar || local.keyingiTavsiyalar,
        emergencyWarningBor: parsed.emergencyWarningBor ?? local.emergencyWarningBor,
        disclaimer: parsed.disclaimer || local.disclaimer
      };
    } catch (error) {
      console.warn('Silent Disease Hunter Gemini tahlili lokal fallbackga o‘tdi:', error);
      return local;
    }
  }

  private sdhBuildFinalFallback(payload: SdhFinalAnalysisPayload): SdhFinalAnalysisResponse {
    const testScores = {
      breathing: this.sdhClamp(Number(payload.breathingResults['respiratoryRhythmScore'] ?? payload.breathingResults['sdhRespiratoryRhythmScore'] ?? 55)),
      facialMimic: this.sdhClamp(Number(payload.facialMimicResults['facialSymmetryScore'] ?? payload.facialMimicResults['sdhFacialSymmetryScore'] ?? 55)),
      handMotor: this.sdhClamp(Number(payload.handMotorResults['gestureAccuracyScore'] ?? payload.handMotorResults['sdhGestureAccuracyScore'] ?? 55)),
      coughVoiceReading: this.sdhClamp(Number(payload.coughVoiceReadingResults['voiceStabilityScore'] ?? payload.coughVoiceReadingResults['sdhVoiceStabilityScore'] ?? 55)),
      cardiac: this.sdhClamp(Number(payload.cardiacResults['pulseStabilityScore'] ?? payload.cardiacResults['sdhPulseStabilityScore'] ?? 55))
    };
    const stability = this.sdhClamp(Object.values(testScores).reduce((sum, x) => sum + x, 0) / 5);
    const risk = this.sdhClamp(100 - stability);
    const signalOverall = this.sdhClamp(Number(payload.signalQuality['overall'] ?? 55));
    const previousRisk = payload.previousResultForTrend.previousOverallRisk;
    const riskChange = previousRisk == null ? 'unknown' : risk > previousRisk + 3 ? 'increased' : risk < previousRisk - 3 ? 'decreased' : 'stable';
    const emergencyActive = Boolean(payload.cardiacResults['emergencyCardiacFlag']) || risk >= 82;

    return {
      overallRiskPercent: risk,
      overallStabilityPercent: stability,
      confidencePercent: this.sdhClamp(signalOverall * 0.7 + Object.values(payload.completedTests).filter((x) => x !== 'pending' && x !== 'failed').length * 6),
      testScores,
      organRisks: {
        cardiovascular: this.sdhClamp(100 - testScores.cardiac),
        respiratory: this.sdhClamp(100 - testScores.breathing),
        neuromotor: this.sdhClamp((100 - testScores.handMotor + 100 - testScores.facialMimic) / 2),
        psychophysiologicalStress: this.sdhClamp(100 - testScores.coughVoiceReading),
        metabolic: this.sdhClamp(risk * 0.65 + 15),
        cellularInflammatory: this.sdhClamp(risk * 0.55 + 12)
      },
      mainFindings: [
        `Umumiy risk ${risk}% va stabilitet ${stability}% atrofida baholandi.`,
        `Signal sifati ${signalOverall}% bo‘lgani uchun xulosa monitoring signali sifatida talqin qilinadi.`,
        riskChange === 'unknown' ? 'Oldingi yakuniy SDH tahlil topilmadi.' : `Oldingi natijaga nisbatan trend: ${riskChange}.`,
        emergencyActive ? 'Shoshilinch ogohlantirish markerlari bor.' : 'Shoshilinch markerlar kuchli ko‘rinmadi.',
        'Natija yakuniy tashxis emas, shifokor ko‘rigi bilan solishtirilishi kerak.'
      ],
      riskExplanation: 'Abdulloh AI lokal baholash rejimida mavjud test scorelari, signal sifati, manual/wearable/lab markerlar va trendni birlashtirdi.',
      breathingAnalysis: 'Nafas markerlari ritm, barqarorlik, dyspnea signali va tiklanish scorelari bilan baholandi.',
      facialMimicAnalysis: 'Yuz mimika markerlari simmetriya va mushak nazorati bo‘yicha kuzatuv signali sifatida baholandi.',
      handMotorAnalysis: 'Qo‘l motorikasi skeleton sifati, gesture aniqligi, tremor va harakat tezligi orqali baholandi.',
      voiceCoughReadingAnalysis: 'Yo‘tal, ovoz va o‘qish markerlari ovoz stabiliteti, pauza chastotasi va stress indeksini ko‘rsatdi.',
      cardiacAnalysis: 'Yurak markerlari HR/HRV/SpO2, cardiac motion va simptomlar bilan ehtiyotkor risk signali sifatida birlashtirildi.',
      trendComparison: {
        hasPrevious: payload.previousResultForTrend.exists,
        riskChange,
        summary: previousRisk == null ? 'Oldingi yakuniy natija yo‘q.' : `Oldingi risk ${previousRisk}%, hozirgi risk ${risk}%.`
      },
      patientSummary: 'Abdulloh AI lokal baholash rejimida natija chiqardi. Bu monitoring natijasi bo‘lib, yakuniy tashxis emas.',
      doctorSummary: 'Markerlar multimodal skrining sifatida ko‘rib chiqildi; klinik baholash, laborator va instrumental tekshiruvlar bilan solishtirish tavsiya etiladi.',
      recommendations: ['Signal sifati yaxshi sharoitda testni takrorlang.', 'Yuqori risk yoki emergency warning bo‘lsa shifokor ko‘rigini rejalashtiring.', 'Natijani oldingi trend va simptomlar kundaligi bilan solishtiring.'],
      emergencyWarning: {
        active: emergencyActive,
        message: emergencyActive ? 'Bu AI baholash yakuniy tashxis emas. Lekin kiritilgan belgilar shoshilinch tibbiy baholashni talab qilishi mumkin. Agar kuchli ko‘krak og‘rig‘i, nafas yetishmovchiligi, hushdan ketish, nutq buzilishi yoki tananing bir tomonida kuchsizlik bo‘lsa, darhol shoshilinch tibbiy yordamga murojaat qiling.' : ''
      },
      limitations: ['Kamera/mikrofon sifati past bo‘lsa aniqlik kamayadi.', 'Xom video/audio yuborilmagan; tahlil extracted markerlarga asoslangan.', 'Bu tizim shifokor ko‘rigini almashtirmaydi.'],
      disclaimer: 'Bu tizim AI asosidagi fiziologik baholash va monitoring vositasidir. U yakuniy tashxis qo‘ymaydi, shifokor ko‘rigini almashtirmaydi va davolashni mustaqil belgilamaydi. Natijalar shifokor tomonidan klinik baholanishi kerak.'
    };
  }

  private sdhNormalizeFinalAnalysis(raw: Partial<SdhFinalAnalysisResponse>, fallback: SdhFinalAnalysisResponse): SdhFinalAnalysisResponse {
    return {
      overallRiskPercent: this.sdhClamp(Number(raw.overallRiskPercent ?? fallback.overallRiskPercent)),
      overallStabilityPercent: this.sdhClamp(Number(raw.overallStabilityPercent ?? fallback.overallStabilityPercent)),
      confidencePercent: this.sdhClamp(Number(raw.confidencePercent ?? fallback.confidencePercent)),
      testScores: { ...fallback.testScores, ...(raw.testScores ?? {}) },
      organRisks: { ...fallback.organRisks, ...(raw.organRisks ?? {}) },
      mainFindings: Array.isArray(raw.mainFindings) ? raw.mainFindings.slice(0, 8) : fallback.mainFindings,
      riskExplanation: raw.riskExplanation || fallback.riskExplanation,
      breathingAnalysis: raw.breathingAnalysis || fallback.breathingAnalysis,
      facialMimicAnalysis: raw.facialMimicAnalysis || fallback.facialMimicAnalysis,
      handMotorAnalysis: raw.handMotorAnalysis || fallback.handMotorAnalysis,
      voiceCoughReadingAnalysis: raw.voiceCoughReadingAnalysis || fallback.voiceCoughReadingAnalysis,
      cardiacAnalysis: raw.cardiacAnalysis || fallback.cardiacAnalysis,
      trendComparison: raw.trendComparison || fallback.trendComparison,
      patientSummary: raw.patientSummary || fallback.patientSummary,
      doctorSummary: raw.doctorSummary || fallback.doctorSummary,
      recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : fallback.recommendations,
      emergencyWarning: raw.emergencyWarning || fallback.emergencyWarning,
      limitations: Array.isArray(raw.limitations) ? raw.limitations : fallback.limitations,
      disclaimer: raw.disclaimer || fallback.disclaimer
    };
  }

  private sdhLocalAnalysis(payload: SdhAdvancedGeminiPayload): SdhAdvancedGeminiAnalysis {
    const topOrgan = [...payload.organRisks].sort((a, b) => b.percent - a.percent)[0];
    const values = Object.values(payload.testStats);
    const avg = values.reduce((sum, x) => sum + x, 0) / Math.max(1, values.length);
    const signalNote = payload.signalQuality < 45
      ? 'Signal sifati past bo‘lgani uchun confidence kamaytirildi va xulosani ehtiyotkor talqin qilish kerak.'
      : 'Signal sifati markerlarni skrining darajasida talqin qilish uchun yetarli ko‘rindi.';

    return {
      source: 'local',
      umumiyFiziologikHolat: `Lokal baholash bo‘yicha umumiy test barqarorligi ${Math.round(100 - avg)}% atrofida. Eng ko‘proq e’tibor talab qilayotgan tizim: ${topOrgan?.nameUz || 'aniqlanmadi'}.`,
      testlarBoyichaNatija: payload.completedTests.map((name) => `${name} bo‘yicha markerlar skrining va monitoring darajasida hisoblandi.`),
      nafasTizimiTahlili: 'Nafas natijalari ritm, dyspnea signali, gapirganda nafas uzilishi va tiklanish scorelari orqali baholandi.',
      yuzMimikaNevrologikSignalTahlili: 'Mimika natijalari yuz simmetriyasi, lab/ko‘z/qosh nazorati va mikroifoda variabelligi bo‘yicha tashxis emas, kuzatuv signali sifatida talqin qilindi.',
      qolMotorikasiTremorTahlili: 'Qo‘l motorikasi skeleton sifati, gesture aniqligi, nozik motorika va tremor monitoring signallari bilan baholandi.',
      yotalOvozNutqTahlili: 'Yo‘tal, “Aa” tovushi va o‘qish testi ovoz stabiliteti, pauza chastotasi, nafas bosimi va stress markerlarini berdi.',
      yurakRiskSignallari: 'Yurak bo‘yicha HR/HRV/SpO2 manual input, kamera mikroharakati va simptomlar risk signali sifatida birlashtirildi; yakuniy tashxis qo‘yilmadi.',
      organlarBoyichaRiskFoizlari: payload.organRisks,
      signalSifatiTasiri: signalNote,
      engMuhimTopilmalar: [
        `Signal sifati ${payload.signalQuality}%: natija ishonchliligiga bevosita ta’sir qiladi.`,
        `Eng yuqori organ risk signali: ${topOrgan?.nameUz || 'aniqlanmadi'} ${topOrgan?.percent ?? 0}%.`,
        payload.emergencyFlags.length ? 'Shoshilinch ogohlantirish markerlari mavjud.' : 'Shoshilinch markerlar kuchli ko‘rinmadi.',
        'Bitta signalga haddan tashqari tayanmasdan multimodal markerlar birlashtirildi.',
        'Trend uchun oldingi SDH advanced natijalari mavjud bo‘lsa solishtirildi.'
      ],
      bemorUchunXulosa: 'Bu natija yashirin fiziologik og‘ishlarni erta sezish uchun skrining signalidir. U yakuniy tashxis emas.',
      shifokorUchunXulosa: 'Klinik tasdiq uchun simptomlar, instrumental tekshiruvlar, laborator natijalar va shifokor ko‘rigi bilan solishtirish tavsiya etiladi.',
      keyingiTavsiyalar: ['Signal sifati yaxshi sharoitda testni takrorlang.', 'Yuqori risk yoki emergency flag bo‘lsa shifokor ko‘rigini rejalashtiring.', 'Natijani bemorning oldingi trendi bilan solishtiring.'],
      emergencyWarningBor: payload.emergencyFlags.length > 0,
      disclaimer: 'Bu tizim AI asosidagi fiziologik baholash va monitoring vositasidir. U yakuniy tashxis qo‘ymaydi, shifokor ko‘rigini almashtirmaydi va davolashni mustaqil belgilamaydi. Natijalar shifokor tomonidan klinik baholanishi kerak.'
    };
  }

  private sdhClamp(value: number): number {
    return Math.max(1, Math.min(99, Math.round(Number.isFinite(value) ? value : 50)));
  }
}
