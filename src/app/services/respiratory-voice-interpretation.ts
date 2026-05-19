import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import {
  RespiratoryVoiceInterpretation,
  RespiratoryVoiceMetrics,
  RespiratoryVoiceQuestionnaire
} from './respiratory-voice-storage';

@Injectable({ providedIn: 'root' })
export class RespiratoryVoiceInterpretationService {
  private ai: GoogleGenAI | null = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY)
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    : null;

  async interpret(
    metrics: RespiratoryVoiceMetrics,
    questionnaire: RespiratoryVoiceQuestionnaire
  ): Promise<{ interpretation: RespiratoryVoiceInterpretation; riskPercent: number; normalityPercent: number; source: 'local' | 'ai' }> {
    const local = this.buildLocal(metrics, questionnaire);
    const riskPercent = this.estimateRisk(metrics);
    const normalityPercent = Math.max(0, 100 - riskPercent);

    if (!this.ai) {
      return { interpretation: local, riskPercent, normalityPercent, source: 'local' };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{
            text: `Siz respirator skrining yordamchisiz. Faqat skrining va monitoring tili ishlating. Qat'iy tashxis yo'q. Dori/doza yo'q.
Quyidagi metriclar va anketa asosida individual, takrorlanmaydigan JSON qaytaring.

metrics: ${JSON.stringify(metrics)}
questionnaire: ${JSON.stringify(questionnaire)}

Qattiq JSON format:
{
  "qisqaXulosa": string,
  "topilganBelgilar": string[],
  "negaXulosa": string[],
  "metrikSabablar": string[],
  "ehtimoliyYonalislar": string[],
  "negaMos": string[],
  "skriningXavfDarajasi": "past"|"o'rta"|"yuqori",
  "normagaYaqinlikBahosi": string,
  "chuqurTavsiyalar": string[],
  "uySharoitidaOzgarishlar": string[],
  "followUpRejasi": string[],
  "shifokorgaQachon": string[],
  "riskPercent": number,
  "normalityPercent": number
}`
          }]
        }],
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}') as Partial<RespiratoryVoiceInterpretation> & { riskPercent?: number; normalityPercent?: number };
      const merged = this.applySafety({
        ...local,
        ...parsed,
        topilganBelgilar: parsed.topilganBelgilar ?? local.topilganBelgilar,
        negaXulosa: parsed.negaXulosa ?? local.negaXulosa,
        metrikSabablar: parsed.metrikSabablar ?? local.metrikSabablar,
        ehtimoliyYonalislar: parsed.ehtimoliyYonalislar ?? local.ehtimoliyYonalislar,
        negaMos: parsed.negaMos ?? local.negaMos,
        chuqurTavsiyalar: parsed.chuqurTavsiyalar ?? local.chuqurTavsiyalar,
        uySharoitidaOzgarishlar: parsed.uySharoitidaOzgarishlar ?? local.uySharoitidaOzgarishlar,
        followUpRejasi: parsed.followUpRejasi ?? local.followUpRejasi,
        shifokorgaQachon: parsed.shifokorgaQachon ?? local.shifokorgaQachon
      });

      const safeRisk = typeof parsed.riskPercent === 'number' ? this.clamp(parsed.riskPercent, 1, 99) : riskPercent;
      const safeNormality = typeof parsed.normalityPercent === 'number'
        ? this.clamp(parsed.normalityPercent, 1, 99)
        : Math.max(1, 100 - safeRisk);

      return {
        interpretation: merged,
        riskPercent: safeRisk,
        normalityPercent: safeNormality,
        source: 'ai'
      };
    } catch (error) {
      console.error('Respiratory AI fallback:', error);
      return { interpretation: local, riskPercent, normalityPercent, source: 'local' };
    }
  }

  private applySafety(input: RespiratoryVoiceInterpretation): RespiratoryVoiceInterpretation {
    const banned = [
      /aniq tashxis/i,
      /sizda aniq/i,
      /mutlaqo sog'lom/i,
      /definitive/i,
      /retsept/i,
      /mg\b/i,
      /kuniga\s*\d+/i,
      /antibiotik/i,
      /prednizolon/i
    ];

    const rewrite = (text: string) => {
      if (banned.some((pattern) => pattern.test(text))) {
        return 'Skrining bo\'yicha mos keluvchi belgilar qayd etildi, aniq tashxis uchun shifokor ko\'rigi zarur.';
      }
      return text;
    };

    return {
      ...input,
      qisqaXulosa: rewrite(input.qisqaXulosa),
      topilganBelgilar: input.topilganBelgilar.map(rewrite),
      negaXulosa: input.negaXulosa.map(rewrite),
      metrikSabablar: input.metrikSabablar.map(rewrite),
      ehtimoliyYonalislar: input.ehtimoliyYonalislar.map(rewrite),
      negaMos: input.negaMos.map(rewrite),
      normagaYaqinlikBahosi: rewrite(input.normagaYaqinlikBahosi),
      chuqurTavsiyalar: input.chuqurTavsiyalar.map(rewrite),
      uySharoitidaOzgarishlar: input.uySharoitidaOzgarishlar.map(rewrite),
      followUpRejasi: input.followUpRejasi.map(rewrite),
      shifokorgaQachon: input.shifokorgaQachon.map(rewrite)
    };
  }

  private buildLocal(metrics: RespiratoryVoiceMetrics, q: RespiratoryVoiceQuestionnaire): RespiratoryVoiceInterpretation {
    const signs: string[] = [];
    if (metrics.breathingRate > 24 || metrics.breathingRate < 10) signs.push('Nafas olish tezligi odatiy diapazondan chetga chiqmoqda.');
    if (metrics.breathingRhythmVariability > 55) signs.push('Nafas ritmida notekislik kuchliroq ko\'rindi.');
    if (metrics.speechBreathInterruptions > 45) signs.push('Gapirish jarayonida nafas uzilishlari ko\'p.');
    if (metrics.coughBurdenIndex > 55) signs.push('Yo\'tal yuklamasi skrining bo\'yicha yuqoriroq.');
    if (q.breathlessness !== 'yoq') signs.push('Anketada hansirash belgisi qayd etildi.');
    if (!signs.length) signs.push('Ko\'rsatkichlarning katta qismi normaga yaqin diapazonda.');

    const risk = this.estimateRisk(metrics);
    const riskLevel: 'past' | 'o\'rta' | 'yuqori' = risk >= 70 ? 'yuqori' : risk >= 40 ? 'o\'rta' : 'past';

    return {
      qisqaXulosa: 'Respirator skrining natijasi multimodal signal (video, audio, simptom) asosida hisoblandi. Bu mustaqil tashxis emas.',
      topilganBelgilar: signs,
      negaXulosa: [
        'Video nafas harakati, audio signal va simptom anketa birgalikda tahlil qilindi.',
        'Ritm barqarorligi, gapirishdagi nafas uzilishi va yo\'tal patterni xavf indeksiga qo\'shildi.'
      ],
      metrikSabablar: [
        `breathingRate=${metrics.breathingRate}`,
        `breathingRhythmVariability=${metrics.breathingRhythmVariability}`,
        `speechBreathInterruptions=${metrics.speechBreathInterruptions}`,
        `coughBurdenIndex=${metrics.coughBurdenIndex}`,
        `recoveryTime=${metrics.recoveryTime}`,
        `symptomBurdenScore=${metrics.symptomBurdenScore}`
      ],
      ehtimoliyYonalislar: [
        'Astma/allergik respirator yo\'nalishiga mos keluvchi patternlar bo\'lishi mumkin.',
        'Post-viral tiklanishdagi funksional nafas notekisligi ehtimoli bo\'lishi mumkin.',
        'Funksional nafas-buzilish patterni kuzatilishi mumkin.'
      ],
      negaMos: [
        'Ritm variabilligi va pause ko\'rsatkichlari respirator barqarorlikni pasaytirishi mumkin.',
        'Gapirish paytida breath interruption ortishi nafas-quvvat koordinatsiyasi pasayganini ko\'rsatadi.',
        'Anketa natijalarida simptom yuklamasi yuqori bo\'lsa concern indeksi oshadi.'
      ],
      skriningXavfDarajasi: riskLevel,
      normagaYaqinlikBahosi: `Normaga yaqinlik taxminan ${Math.max(5, 100 - risk)}% atrofida (skrining bo'yicha).`,
      chuqurTavsiyalar: [
        'Kuniga 2-3 marta nazoratli diafragmal nafas mashqlari (4-2-6 ritm) bajaring.',
        'Uyqudan oldin 10 daqiqa sekin pacing bilan nafasni tinchlantiring.',
        'Gapirish testlarida uzun iborani qisqa segmentlarga bo\'lib, nafasni zo\'riqtirmasdan davom ettiring.'
      ],
      uySharoitidaOzgarishlar: [
        'Xona namligi va chang nazoratini yaxshilang, tirnash beruvchi omillarni kamaytiring.',
        'Suyuqlik rejimini me\'yorlang va ovozga zo\'riqish beradigan faoliyatni cheklang.',
        'Yengil jismoniy yuklamani sekin oshiring, keskin zo\'riqishdan saqlaning.'
      ],
      followUpRejasi: [
        '48-72 soat ichida qayta o\'lchov qilib trendni taqqoslang.',
        '1 hafta davomida yo\'tal soni, kechki simptom va nafas tezligini qayd qiling.',
        'Recovery testidagi tiklanish vaqtini haftalik kuzatib boring.'
      ],
      shifokorgaQachon: [
        'Dam holatida hansirash kuchaysa yoki ko\'krak og\'rig\'i ortsa.',
        'Qizil bayroq belgilar (lab ko\'karishi, hush pasayishi) bo\'lsa shoshilinch murojaat qiling.',
        '7-10 kun ichida simptom va ko\'rsatkichlar yaxshilanmasa pulmonolog ko\'rigidan o\'ting.'
      ]
    };
  }

  private estimateRisk(m: RespiratoryVoiceMetrics): number {
    const raw =
      (Math.abs(m.breathingRate - 16) * 3) +
      m.breathingRhythmVariability * 0.16 +
      m.pauseFrequency * 0.08 +
      m.visibleRespiratoryEffort * 0.12 +
      m.speechBreathInterruptions * 0.12 +
      m.coughBurdenIndex * 0.1 +
      m.audioIrregularityScore * 0.1 +
      (100 - m.overallRespiratoryStability) * 0.16 +
      m.symptomBurdenScore * 0.16;

    return this.clamp(Math.round(raw / 1.8), 1, 99);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(v)));
  }
}
