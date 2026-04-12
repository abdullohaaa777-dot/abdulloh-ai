import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface RespiratoryQuestionnaire {
  cough: number;
  sputum: number;
  fever: number;
  dyspnea: number;
  chestPain: number;
  asthmaHistory: boolean;
  allergyHistory: boolean;
  smokingHistory: boolean;
  recentViralIllness: boolean;
  symptomDurationDays: number;
  exertionalWorsening: boolean;
  nighttimeSymptoms: boolean;
}

export interface RespiratoryMetrics {
  breathingRate: number;
  breathingRhythmVariability: number;
  pauseFrequency: number;
  chestMotionAmplitude: number;
  chestMotionRegularity: number;
  visibleRespiratoryEffort: number;
  speechBreathInterruptions: number;
  readingContinuity: number;
  speechRate: number;
  speechRateVariability: number;
  coughIntensityPattern: number;
  coughRepetitionPattern: number;
  recoveryTime: number;
  symptomBurdenScore: number;
  audioIrregularityScore: number;
  overallRespiratoryStability: number;
  overallFunctionalRecovery: number;
  overallSpeechBreathEfficiency: number;
}

export interface RespiratoryInterpretation {
  qisqaXulosa: string;
  topilganBelgilar: string[];
  negaXulosa: string;
  mosYonalislar: string[];
  negaMos: string;
  xavfDarajasiFoiz: string;
  barqarorlikBahosi: string;
  chuqurTavsiyalar: string[];
  uyKuzatuv: string[];
  followUpReja: string[];
  qachonShifokor: string[];
  disclaimer: string[];
}

export interface RespiratoryHistoryEntry {
  id: string;
  timestamp: string;
  rawSummary: {
    restBreathingSeconds: number;
    restAudioSeconds: number;
    speechSeconds: number;
    coughEvents: number;
    recoverySeconds: number;
  };
  questionnaire: RespiratoryQuestionnaire;
  metrics: RespiratoryMetrics;
  interpretation: RespiratoryInterpretation;
}

@Injectable({ providedIn: 'root' })
export class RespiratoryVoiceService {
  private ai = new GoogleGenAI({ apiKey: typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '' });
  private readonly storageKey = 'respiratoryVoiceModuleHistoryV1';

  history = signal<RespiratoryHistoryEntry[]>([]);

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      this.history.set(JSON.parse(raw) as RespiratoryHistoryEntry[]);
    } catch {
      this.history.set([]);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.history()));
  }

  saveEntry(entry: RespiratoryHistoryEntry) {
    this.history.update((prev) => [entry, ...prev].slice(0, 50));
    this.persist();
  }

  computeMetrics(input: {
    restAudioLevels: number[];
    motionLevels: number[];
    speechAudioLevels: number[];
    coughAudioLevels: number[];
    coughEvents: number;
    restBreathingSeconds: number;
    restAudioSeconds: number;
    speechSeconds: number;
    recoverySeconds: number;
    questionnaire: RespiratoryQuestionnaire;
  }): RespiratoryMetrics {
    const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const std = (arr: number[]) => {
      if (!arr.length) return 0;
      const m = mean(arr);
      return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / arr.length);
    };
    const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

    const restMean = mean(input.restAudioLevels);
    const restStd = std(input.restAudioLevels);
    const motionMean = mean(input.motionLevels);
    const motionStd = std(input.motionLevels);
    const speechMean = mean(input.speechAudioLevels);
    const speechStd = std(input.speechAudioLevels);
    const coughMean = mean(input.coughAudioLevels);

    const breathPeaks = input.restAudioLevels.filter((x, i, arr) => i > 0 && i < arr.length - 1 && x > arr[i - 1] && x > arr[i + 1] && x > restMean * 1.15).length;
    const breathingRate = input.restBreathingSeconds > 0 ? (breathPeaks * 60) / input.restBreathingSeconds : 0;

    const pauses = input.restAudioLevels.filter((x) => x < restMean * 0.55).length;
    const speechPauses = input.speechAudioLevels.filter((x) => x < speechMean * 0.55).length;

    const symptomBurdenScore = clamp(
      input.questionnaire.cough * 8 +
      input.questionnaire.sputum * 7 +
      input.questionnaire.fever * 8 +
      input.questionnaire.dyspnea * 10 +
      input.questionnaire.chestPain * 9 +
      (input.questionnaire.asthmaHistory ? 7 : 0) +
      (input.questionnaire.allergyHistory ? 4 : 0) +
      (input.questionnaire.smokingHistory ? 10 : 0) +
      (input.questionnaire.recentViralIllness ? 8 : 0) +
      (input.questionnaire.exertionalWorsening ? 10 : 0) +
      (input.questionnaire.nighttimeSymptoms ? 8 : 0) +
      Math.min(input.questionnaire.symptomDurationDays / 2, 10)
    );

    const recoveryPenalty = clamp((input.recoverySeconds - 30) * 1.2, 0, 50);
    const speechRate = input.speechSeconds > 0 ? (74 / input.speechSeconds) * 60 : 0; // sample text words

    return {
      breathingRate: Number(breathingRate.toFixed(1)),
      breathingRhythmVariability: Number(clamp(restStd * 120).toFixed(1)),
      pauseFrequency: Number(clamp((pauses / Math.max(input.restAudioLevels.length, 1)) * 100).toFixed(1)),
      chestMotionAmplitude: Number(clamp(motionMean * 100).toFixed(1)),
      chestMotionRegularity: Number(clamp(100 - motionStd * 140).toFixed(1)),
      visibleRespiratoryEffort: Number(clamp((restMean + motionStd) * 120).toFixed(1)),
      speechBreathInterruptions: Number(clamp((speechPauses / Math.max(input.speechAudioLevels.length, 1)) * 100).toFixed(1)),
      readingContinuity: Number(clamp(100 - speechStd * 150).toFixed(1)),
      speechRate: Number(clamp(speechRate, 40, 220).toFixed(1)),
      speechRateVariability: Number(clamp(speechStd * 160).toFixed(1)),
      coughIntensityPattern: Number(clamp(coughMean * 130).toFixed(1)),
      coughRepetitionPattern: Number(clamp((input.coughEvents / 3) * 100).toFixed(1)),
      recoveryTime: Number(input.recoverySeconds.toFixed(1)),
      symptomBurdenScore: Number(symptomBurdenScore.toFixed(1)),
      audioIrregularityScore: Number(clamp((restStd + speechStd) * 120).toFixed(1)),
      overallRespiratoryStability: Number(clamp(100 - (restStd * 110 + symptomBurdenScore * 0.35)).toFixed(1)),
      overallFunctionalRecovery: Number(clamp(100 - recoveryPenalty - symptomBurdenScore * 0.2).toFixed(1)),
      overallSpeechBreathEfficiency: Number(clamp(100 - ((speechPauses / Math.max(input.speechAudioLevels.length, 1)) * 100 * 0.6 + speechStd * 100 * 0.5)).toFixed(1)),
    };
  }

  async buildInterpretation(metrics: RespiratoryMetrics, questionnaire: RespiratoryQuestionnaire): Promise<RespiratoryInterpretation> {
    const fallback = this.localInterpretation(metrics);
    if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
      return fallback;
    }

    const prompt = `Quyidagi mahalliy o'lchangan skrining ko'rsatkichlariga asoslanib, faqat o'zbek tilida JSON qaytaring.

Ko'rsatkichlar: ${JSON.stringify(metrics)}
So'rovnoma: ${JSON.stringify(questionnaire)}

Majburiy bo'limlar:
- qisqaXulosa
- topilganBelgilar (array)
- negaXulosa
- mosYonalislar (array, ehtimoliy kasallik yo'nalishlari yoki klinik patternlar)
- negaMos
- xavfDarajasiFoiz (skrining bo'yicha past/o'rta/yuqori + foiz)
- barqarorlikBahosi
- chuqurTavsiyalar (array)
- uyKuzatuv (array)
- followUpReja (array)
- qachonShifokor (array)

Qoidalar:
- Bu mustaqil tashxis emasligini saqlang.
- Dori nomi, doza, qat'iy tashxis bermang.
- Matn takroriy va umumiy bo'lmasin, aynan ko'rsatkichlar sababini tushuntiring.
- Ehtimoliy va skrining tili bilan yozing.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });
      const raw = (response.text || '{}').trim();
      const parsed = JSON.parse(raw) as Partial<RespiratoryInterpretation>;
      const merged: RespiratoryInterpretation = {
        ...fallback,
        ...parsed,
        topilganBelgilar: parsed.topilganBelgilar ?? fallback.topilganBelgilar,
        mosYonalislar: parsed.mosYonalislar ?? fallback.mosYonalislar,
        chuqurTavsiyalar: parsed.chuqurTavsiyalar ?? fallback.chuqurTavsiyalar,
        uyKuzatuv: parsed.uyKuzatuv ?? fallback.uyKuzatuv,
        followUpReja: parsed.followUpReja ?? fallback.followUpReja,
        qachonShifokor: parsed.qachonShifokor ?? fallback.qachonShifokor,
        disclaimer: fallback.disclaimer,
      };
      return this.applySafetyFilter(merged);
    } catch {
      return fallback;
    }
  }

  private localInterpretation(metrics: RespiratoryMetrics): RespiratoryInterpretation {
    const riskScore = Math.round((100 - metrics.overallRespiratoryStability) * 0.45 + metrics.symptomBurdenScore * 0.4 + metrics.audioIrregularityScore * 0.15);
    const riskLevel = riskScore < 35 ? 'Past' : riskScore < 65 ? 'O\'rta' : 'Yuqori';

    return {
      qisqaXulosa: `Skrining bo'yicha nafas va ovoz holati ${riskLevel.toLowerCase()} xavf yo'nalishida ko'rinmoqda.`,
      topilganBelgilar: [
        `Nafas tezligi: ${metrics.breathingRate}/daq`,
        `Ritm o'zgaruvchanligi: ${metrics.breathingRhythmVariability}%`,
        `Nutqda nafas uzilishi: ${metrics.speechBreathInterruptions}%`,
        `Yo'tal patterni: ${metrics.coughRepetitionPattern}%`,
      ],
      negaXulosa: 'Xulosa so\'rovnoma ballari, audio notekisligi, video harakat barqarorligi va tiklanish vaqtining qo\'shma tahliliga asoslangan.',
      mosYonalislar: [
        'Obstruktiv nafas yo\'li patterni (astma/COPD yo\'nalishiga mos bo\'lishi mumkin)',
        'Post-viral tiklanishning cho\'zilgan patterni',
        'Allergik yoki irritativ nafaslanish patterni',
      ],
      negaMos: 'Nafas ritmi va pauza chastotasi o\'zgarishi, nutq paytidagi uzilishlar hamda simptom yuki ushbu yo\'nalishlarga mos keluvchi signal beradi.',
      xavfDarajasiFoiz: `${riskLevel} xavf (${Math.max(8, Math.min(92, riskScore))}%)`,
      barqarorlikBahosi: `Funksional barqarorlik: ${metrics.overallRespiratoryStability}% | Tiklanish: ${metrics.overallFunctionalRecovery}%`,
      chuqurTavsiyalar: [
        'Kuniga 2 marta 5-7 daqiqa diafragmal nafas mashqlari bajaring, natijani nafas tezligi bilan solishtiring.',
        'Xona havosini namligini 40-60% oralig\'ida ushlang va chang/yallig\'lantiruvchi triggerlarni kamaytiring.',
        'Nutqdan oldin qisqa nafas tayyorgarligi qiling: 4 soniya nafas olish, 6 soniya chiqarish.',
      ],
      uyKuzatuv: [
        'Har 2-3 kunda skriningni takrorlang va yo\'tal, nafas yetishmasligi, tungi simptomlarni belgilang.',
        'Jismoniy faollikdan keyingi tiklanish vaqtini sekundlarda yozib boring.',
      ],
      followUpReja: [
        '1 hafta davomida trend kuzatilsin: nafas tezligi, nutq uzilishi, yo\'tal takrori.',
        'Agar ko\'rsatkichlar yomonlashsa, 24-72 soat ichida shifokor bilan masofaviy konsultatsiya rejalashtiring.',
      ],
      qachonShifokor: [
        'Dam holatda kuchli nafas qisilishi yoki ko\'krak og\'rig\'i kuchaysa.',
        'Isitma yuqori bo\'lib 3 kundan ortiq saqlansa yoki qonda kislorod pasayishi kuzatilsa.',
      ],
      disclaimer: [
        'Bu modul skrining va kuzatuv uchun mo\'ljallangan.',
        'Bu mustaqil tashxis emas.',
        'Aniq tashxis uchun shifokor ko\'rigi zarur.',
      ],
    };
  }

  private applySafetyFilter(input: RespiratoryInterpretation): RespiratoryInterpretation {
    const banned = [
      /definitive|aniq tashxis|sizda aniq/i,
      /to'liq sog'lom|completely healthy/i,
      /doza|mg|tablet|capsule|kuniga [0-9]/i,
      /you definitely have|sizda aniq.*bor/i,
    ];

    const scrub = (text: string) => {
      let safe = text;
      if (banned.some((re) => re.test(safe))) {
        safe = safe
          .replace(/aniq tashxis/gi, 'skrining yo\'nalishi')
          .replace(/you definitely have/gi, 'skrining bo\'yicha mos kelishi mumkin')
          .replace(/to'liq sog'lom/gi, 'normaga yaqin ko\'rsatkichlar');
      }
      return safe;
    };

    return {
      ...input,
      qisqaXulosa: scrub(input.qisqaXulosa),
      negaXulosa: scrub(input.negaXulosa),
      negaMos: scrub(input.negaMos),
      xavfDarajasiFoiz: scrub(input.xavfDarajasiFoiz),
      barqarorlikBahosi: scrub(input.barqarorlikBahosi),
      topilganBelgilar: input.topilganBelgilar.map(scrub),
      mosYonalislar: input.mosYonalislar.map(scrub),
      chuqurTavsiyalar: input.chuqurTavsiyalar.map(scrub),
      uyKuzatuv: input.uyKuzatuv.map(scrub),
      followUpReja: input.followUpReja.map(scrub),
      qachonShifokor: input.qachonShifokor.map(scrub),
      disclaimer: input.disclaimer,
    };
  }
}
