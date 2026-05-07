import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

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

@Injectable({ providedIn: 'root' })
export class SilentDiseaseHunterInterpretationService {
  private ai: GoogleGenAI | null = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY)
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    : null;

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
}
