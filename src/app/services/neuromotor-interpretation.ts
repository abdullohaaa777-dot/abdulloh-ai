import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { NeuroMotorInterpretation, NeuroMotorTestResult } from './neuromotor-storage';

interface NeuromotorMetrics {
  tappingSpeed: number;
  tappingRhythmVariability: number;
  openCloseSpeed: number;
  openCloseAmplitudeConsistency: number;
  pinchAccuracy: number;
  pinchHoldStability: number;
  sequencingErrors: number;
  holdStillDrift: number;
  tremorAmplitudeProxy: number;
  fatigueTrend: number;
  overallMotorStability: number;
  overallCoordination: number;
  overallFineMotorControl: number;
}

@Injectable({ providedIn: 'root' })
export class NeuromotorInterpretationService {
  private ai: GoogleGenAI | null = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY)
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    : null;

  async interpret(results: NeuroMotorTestResult[], metrics: NeuromotorMetrics): Promise<{ interpretation: NeuroMotorInterpretation; riskPercent: number; source: 'local' | 'ai' }> {
    const local = this.buildLocal(results, metrics);
    if (!this.ai) return { interpretation: local, riskPercent: this.estimateRisk(metrics), source: 'local' };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{
            text: `Siz neyromotor skrining yordamchisisiz. Qat'iy tashxis qo'ymang. Quyidagi metrics bo'yicha faqat konservativ skrining xulosasi qaytaring: ${JSON.stringify(metrics)}.
Qattiq JSON qaytaring:
{
  "qisqa_xulosa": string,
  "topilgan_motor_belgilar": string[],
  "nega_shunday_xulosa": string[],
  "ehtimoliy_klinik_yonalishlar": string[],
  "xavf_darajasi": "past"|"orta"|"yuqori",
  "holatni_yaxshilash_tavsiyalari": string[],
  "reabilitatsion_mashqlar": string[],
  "qachon_shifokorga_murojaat": string[],
  "keyingi_kuzatuv_tavsiyasi": string,
  "xavf_foizi": number
}
` 
          }]
        }],
        config: { responseMimeType: 'application/json' }
      });

      const raw = response.text || '{}';
      const parsed = JSON.parse(raw) as Partial<NeuroMotorInterpretation> & { xavf_foizi?: number };

      const safe = this.applySafetyFilter({
        ...local,
        ...parsed,
        topilgan_motor_belgilar: parsed.topilgan_motor_belgilar ?? local.topilgan_motor_belgilar,
        nega_shunday_xulosa: parsed.nega_shunday_xulosa ?? local.nega_shunday_xulosa,
        ehtimoliy_klinik_yonalishlar: parsed.ehtimoliy_klinik_yonalishlar ?? local.ehtimoliy_klinik_yonalishlar,
        holatni_yaxshilash_tavsiyalari: parsed.holatni_yaxshilash_tavsiyalari ?? local.holatni_yaxshilash_tavsiyalari,
        reabilitatsion_mashqlar: parsed.reabilitatsion_mashqlar ?? local.reabilitatsion_mashqlar,
        qachon_shifokorga_murojaat: parsed.qachon_shifokorga_murojaat ?? local.qachon_shifokorga_murojaat
      });

      const risk = typeof parsed.xavf_foizi === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.xavf_foizi))) : this.estimateRisk(metrics);
      return { interpretation: safe, riskPercent: risk, source: 'ai' };
    } catch (error) {
      console.error('Neuromotor AI interpretation fallback:', error);
      return { interpretation: local, riskPercent: this.estimateRisk(metrics), source: 'local' };
    }
  }

  private applySafetyFilter(input: NeuroMotorInterpretation): NeuroMotorInterpretation {
    const banned = [/parkinson/i, /aniq tashxis/i, /definitive/i, /dori/i, /mg\b/i, /kuniga/i, /retsept/i, /davolash rejimi/i];
    const cleanText = (text: string) => {
      let t = text;
      for (const p of banned) {
        if (p.test(t)) {
          t = 'Skrining bo‘yicha mos keluvchi belgilar qayd etildi, qo‘shimcha nevrologik baholash tavsiya etiladi.';
          break;
        }
      }
      return t;
    };

    return {
      ...input,
      qisqa_xulosa: cleanText(input.qisqa_xulosa),
      topilgan_motor_belgilar: input.topilgan_motor_belgilar.map(cleanText),
      nega_shunday_xulosa: input.nega_shunday_xulosa.map(cleanText),
      ehtimoliy_klinik_yonalishlar: input.ehtimoliy_klinik_yonalishlar.map(cleanText),
      holatni_yaxshilash_tavsiyalari: input.holatni_yaxshilash_tavsiyalari.map(cleanText),
      reabilitatsion_mashqlar: input.reabilitatsion_mashqlar.map(cleanText),
      qachon_shifokorga_murojaat: input.qachon_shifokorga_murojaat.map(cleanText),
      keyingi_kuzatuv_tavsiyasi: cleanText(input.keyingi_kuzatuv_tavsiyasi)
    };
  }

  private buildLocal(results: NeuroMotorTestResult[], m: NeuromotorMetrics): NeuroMotorInterpretation {
    const signs: string[] = [];
    if (m.tappingRhythmVariability > 45) signs.push('Finger tapping ritmida notekislik kuzatildi.');
    if (m.holdStillDrift > 40) signs.push('Hold-still testida drift ortgan.');
    if (m.pinchAccuracy < 55) signs.push('Pinch aniqligi nisbatan pasaygan.');
    if (m.fatigueTrend > 60) signs.push('Test davomida charchashga moyillik oshgan.');
    if (signs.length === 0) signs.push('Ko‘rsatkichlar ko‘p testlarda nisbatan barqaror diapazonda.');

    const risk = this.estimateRisk(m);
    const riskLevel: 'past' | 'orta' | 'yuqori' = risk > 70 ? 'yuqori' : risk > 40 ? 'orta' : 'past';

    return {
      qisqa_xulosa: `AI skrining tahlili: ${results.length} ta test asosida motor faoliyat baholandi. Bu mustaqil tashxis emas.`,
      topilgan_motor_belgilar: signs,
      nega_shunday_xulosa: [
        `Tapping speed: ${m.tappingSpeed}`,
        `Rhythm variability: ${m.tappingRhythmVariability}`,
        `Open-close speed: ${m.openCloseSpeed}`,
        `Pinch accuracy: ${m.pinchAccuracy}`,
        `Sequencing errors: ${m.sequencingErrors}`,
        `Hold-still drift: ${m.holdStillDrift}`,
        `Overall coordination: ${m.overallCoordination}`
      ],
      ehtimoliy_klinik_yonalishlar: [
        'Skrining bo‘yicha funksional motor monitoringni davom ettirish',
        'Qo‘shimcha nevrologik baholash ehtimoli bo‘lishi mumkin',
        'Reabilitatsion mashqlar bilan dinamik kuzatuv'
      ],
      xavf_darajasi: riskLevel,
      holatni_yaxshilash_tavsiyalari: [
        'Uyqu rejimini me’yorlash va stressni kamaytirish.',
        'Kunlik yengil qo‘l motorika mashqlarini bajarish.',
        'Bir xil sharoitda haftalik qayta skrining qilish.'
      ],
      reabilitatsion_mashqlar: [
        'Finger tapping: 60 soniyadan 3 set.',
        'Open-close hand: 2 daqiqa nazoratli ritm.',
        'Pinch hold: 10-15 takror, 1-2 soniya ushlash.'
      ],
      qachon_shifokorga_murojaat: [
        'Belgilar saqlansa yoki kuchaysa.',
        'To‘satdan kuchsizlik, nutq buzilishi, yuz assimetriyasi bo‘lsa zudlik bilan murojaat qiling.',
        'Kunlik faoliyatga sezilarli ta’sir qilsa.'
      ],
      keyingi_kuzatuv_tavsiyasi: '7-14 kun ichida testlarni qayta o‘tkazib trendni solishtiring.'
    };
  }

  private estimateRisk(m: NeuromotorMetrics): number {
    const raw =
      (100 - m.tappingSpeed) * 0.12 +
      m.tappingRhythmVariability * 0.16 +
      (100 - m.openCloseAmplitudeConsistency) * 0.1 +
      (100 - m.pinchAccuracy) * 0.14 +
      Math.min(100, m.sequencingErrors * 10) * 0.14 +
      m.holdStillDrift * 0.12 +
      m.fatigueTrend * 0.1 +
      (100 - m.overallCoordination) * 0.12;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }
}
