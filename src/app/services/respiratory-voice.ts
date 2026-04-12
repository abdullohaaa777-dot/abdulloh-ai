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
  breathIntervalVariability: number;
  pauseFrequency: number;
  pauseDurationBurden: number;
  chestMotionAmplitude: number;
  chestMotionRegularity: number;
  visibleRespiratoryEffort: number;
  chestMotionSymmetryScore: number;
  speechRate: number;
  speechRateVariability: number;
  speechBreathInterruptions: number;
  phraseContinuityScore: number;
  readingBreathEfficiency: number;
  coughIntensityPattern: number;
  coughRepetitionPattern: number;
  coughBurdenIndex: number;
  audioIrregularityScore: number;
  recoveryTime: number;
  recoverySlope: number;
  symptomBurdenScore: number;
  overallRespiratoryStability: number;
  overallFunctionalRecovery: number;
  overallSpeechBreathEfficiency: number;
  overallRespiratoryPerformance: number;
  normalityProximityScore: number;
  concernIndex: number;
}

export interface RespiratoryDirectionScore {
  yonalish: string;
  foiz: number;
  izoh: string;
}

export interface RespiratoryInterpretation {
  qisqaXulosa: string;
  topilganBelgilar: string[];
  negaXulosa: string;
  sababKorsatkichlar: string[];
  mosYonalislar: string[];
  yonalishFoizlari: RespiratoryDirectionScore[];
  negaMos: string;
  xavfDarajasiFoiz: string;
  barqarorlikBahosi: string;
  chuqurTavsiyalar: string[];
  uyOzgarishlari: string[];
  followUpReja: string[];
  qachonShifokor: string[];
  disclaimer: string[];
}

export interface RespiratoryChartData {
  respiratoryWaveform: number[];
  speechWaveform: number[];
  coughWaveform: number[];
  timelineLabels: string[];
  timelinePerformance: number[];
  timelineConcern: number[];
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
  chartData: RespiratoryChartData;
  interpretation: RespiratoryInterpretation;
  fallbackInterpretation: RespiratoryInterpretation;
}

@Injectable({ providedIn: 'root' })
export class RespiratoryVoiceService {
  private ai = new GoogleGenAI({ apiKey: typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '' });
  private readonly storageKey = 'respiratoryVoiceModuleHistoryV2';
  private readonly legacyKey = 'respiratoryVoiceModuleHistoryV1';

  history = signal<RespiratoryHistoryEntry[]>([]);

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;

    const rawCurrent = localStorage.getItem(this.storageKey);
    if (rawCurrent) {
      try {
        this.history.set(JSON.parse(rawCurrent) as RespiratoryHistoryEntry[]);
        return;
      } catch {
        this.history.set([]);
      }
    }

    const legacy = localStorage.getItem(this.legacyKey);
    if (!legacy) return;

    try {
      const list = JSON.parse(legacy) as Array<{
        id: string;
        timestamp: string;
        rawSummary: RespiratoryHistoryEntry['rawSummary'];
        questionnaire: RespiratoryQuestionnaire;
        metrics: RespiratoryMetrics;
        interpretation: RespiratoryInterpretation;
      }>;

      const migrated = list.map((item): RespiratoryHistoryEntry => ({
        ...item,
        chartData: {
          respiratoryWaveform: [item.metrics.breathingRate, item.metrics.pauseFrequency, item.metrics.breathingRhythmVariability],
          speechWaveform: [item.metrics.speechRate, item.metrics.speechBreathInterruptions, item.metrics.speechRateVariability],
          coughWaveform: [item.metrics.coughIntensityPattern, item.metrics.coughRepetitionPattern, item.metrics.coughBurdenIndex],
          timelineLabels: [new Date(item.timestamp).toLocaleDateString('uz-UZ')],
          timelinePerformance: [item.metrics.overallRespiratoryPerformance],
          timelineConcern: [item.metrics.concernIndex],
        },
        fallbackInterpretation: item.interpretation,
      }));

      this.history.set(migrated);
      this.persist();
    } catch {
      this.history.set([]);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.history()));
  }

  saveEntry(entry: RespiratoryHistoryEntry) {
    this.history.update((prev) => [entry, ...prev].slice(0, 60));
    this.persist();
  }

  computeMetrics(input: {
    restAudioLevels: number[];
    motionLevels: number[];
    speechAudioLevels: number[];
    coughAudioLevels: number[];
    coughEvents: number;
    faceCoverageScore: number;
    chestCoverageScore: number;
    restBreathingSeconds: number;
    speechSeconds: number;
    recoverySeconds: number;
    baselineAfterEffortGap: number;
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

    const peakIndexes = input.restAudioLevels
      .map((x, i, arr) => (i > 0 && i < arr.length - 1 && x > arr[i - 1] && x > arr[i + 1] && x > restMean * 1.12 ? i : -1))
      .filter((x) => x >= 0);
    const breathIntervals = peakIndexes.slice(1).map((idx, i) => (idx - peakIndexes[i]) * 0.25);

    const breathingRate = input.restBreathingSeconds > 0 ? (peakIndexes.length * 60) / input.restBreathingSeconds : 0;
    const breathIntervalVariability = clamp((std(breathIntervals) / Math.max(mean(breathIntervals), 0.1)) * 100);

    const pauseBursts = input.restAudioLevels.filter((x) => x < restMean * 0.5);
    const pauseFrequency = clamp((pauseBursts.length / Math.max(input.restAudioLevels.length, 1)) * 100);
    const pauseDurationBurden = clamp((pauseBursts.length * 0.25 * 100) / Math.max(input.restBreathingSeconds, 1));

    const speechPauses = input.speechAudioLevels.filter((x) => x < speechMean * 0.55);
    const speechRate = input.speechSeconds > 0 ? (74 / input.speechSeconds) * 60 : 0;

    const symptomBurdenScore = clamp(
      input.questionnaire.cough * 7 +
      input.questionnaire.sputum * 7 +
      input.questionnaire.fever * 8 +
      input.questionnaire.dyspnea * 11 +
      input.questionnaire.chestPain * 9 +
      (input.questionnaire.asthmaHistory ? 7 : 0) +
      (input.questionnaire.allergyHistory ? 6 : 0) +
      (input.questionnaire.smokingHistory ? 10 : 0) +
      (input.questionnaire.recentViralIllness ? 8 : 0) +
      (input.questionnaire.exertionalWorsening ? 10 : 0) +
      (input.questionnaire.nighttimeSymptoms ? 8 : 0) +
      Math.min(input.questionnaire.symptomDurationDays / 2, 9)
    );

    const chestMotionSymmetryScore = clamp((input.faceCoverageScore * 0.3 + input.chestCoverageScore * 0.7) * 100);
    const recoverySlope = clamp((1 - input.baselineAfterEffortGap) * 100);

    const overallRespiratoryStability = clamp(100 - (restStd * 95 + breathIntervalVariability * 0.45 + pauseDurationBurden * 0.35 + symptomBurdenScore * 0.25));
    const overallFunctionalRecovery = clamp(100 - (input.recoverySeconds - 20) * 1.2 - symptomBurdenScore * 0.28);
    const overallSpeechBreathEfficiency = clamp(100 - ((speechPauses.length / Math.max(input.speechAudioLevels.length, 1)) * 100 * 0.55 + speechStd * 90));
    const overallRespiratoryPerformance = clamp(overallRespiratoryStability * 0.42 + overallFunctionalRecovery * 0.33 + overallSpeechBreathEfficiency * 0.25);
    const concernIndex = clamp(100 - (overallRespiratoryPerformance * 0.62 + (100 - symptomBurdenScore) * 0.38));

    return {
      breathingRate: Number(breathingRate.toFixed(1)),
      breathingRhythmVariability: Number(clamp(restStd * 120).toFixed(1)),
      breathIntervalVariability: Number(breathIntervalVariability.toFixed(1)),
      pauseFrequency: Number(pauseFrequency.toFixed(1)),
      pauseDurationBurden: Number(pauseDurationBurden.toFixed(1)),
      chestMotionAmplitude: Number(clamp(motionMean * 100).toFixed(1)),
      chestMotionRegularity: Number(clamp(100 - motionStd * 140).toFixed(1)),
      visibleRespiratoryEffort: Number(clamp((restMean + motionStd) * 120).toFixed(1)),
      chestMotionSymmetryScore: Number(chestMotionSymmetryScore.toFixed(1)),
      speechRate: Number(clamp(speechRate, 40, 230).toFixed(1)),
      speechRateVariability: Number(clamp(speechStd * 165).toFixed(1)),
      speechBreathInterruptions: Number(clamp((speechPauses.length / Math.max(input.speechAudioLevels.length, 1)) * 100).toFixed(1)),
      phraseContinuityScore: Number(clamp(100 - speechStd * 145).toFixed(1)),
      readingBreathEfficiency: Number(clamp(100 - (speechPauses.length / Math.max(input.speechAudioLevels.length, 1)) * 100 * 0.7).toFixed(1)),
      coughIntensityPattern: Number(clamp(coughMean * 140).toFixed(1)),
      coughRepetitionPattern: Number(clamp((input.coughEvents / 3) * 100).toFixed(1)),
      coughBurdenIndex: Number(clamp((coughMean * 70) + (input.coughEvents * 10)).toFixed(1)),
      audioIrregularityScore: Number(clamp((restStd + speechStd) * 130).toFixed(1)),
      recoveryTime: Number(input.recoverySeconds.toFixed(1)),
      recoverySlope: Number(recoverySlope.toFixed(1)),
      symptomBurdenScore: Number(symptomBurdenScore.toFixed(1)),
      overallRespiratoryStability: Number(overallRespiratoryStability.toFixed(1)),
      overallFunctionalRecovery: Number(overallFunctionalRecovery.toFixed(1)),
      overallSpeechBreathEfficiency: Number(overallSpeechBreathEfficiency.toFixed(1)),
      overallRespiratoryPerformance: Number(overallRespiratoryPerformance.toFixed(1)),
      normalityProximityScore: Number(clamp(overallRespiratoryPerformance * 0.9 + chestMotionSymmetryScore * 0.1).toFixed(1)),
      concernIndex: Number(concernIndex.toFixed(1)),
    };
  }

  buildChartData(metrics: RespiratoryMetrics, traces: { respiratoryWaveform: number[]; speechWaveform: number[]; coughWaveform: number[]; }, history: RespiratoryHistoryEntry[]): RespiratoryChartData {
    const timeline = [
      ...history.slice(0, 5).reverse().map((h) => ({
        label: new Date(h.timestamp).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
        perf: h.metrics.overallRespiratoryPerformance,
        concern: h.metrics.concernIndex,
      })),
      {
        label: new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
        perf: metrics.overallRespiratoryPerformance,
        concern: metrics.concernIndex,
      },
    ];

    return {
      respiratoryWaveform: traces.respiratoryWaveform.slice(-120),
      speechWaveform: traces.speechWaveform.slice(-120),
      coughWaveform: traces.coughWaveform.slice(-120),
      timelineLabels: timeline.map((t) => t.label),
      timelinePerformance: timeline.map((t) => Number(t.perf.toFixed(1))),
      timelineConcern: timeline.map((t) => Number(t.concern.toFixed(1))),
    };
  }

  async buildInterpretation(metrics: RespiratoryMetrics, questionnaire: RespiratoryQuestionnaire): Promise<{ safe: RespiratoryInterpretation; fallback: RespiratoryInterpretation }> {
    const fallback = this.localInterpretation(metrics);

    if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
      return { safe: fallback, fallback };
    }

    const prompt = `Siz "Abdulloh AI" skrining interpretatsiya qatlami sifatida ishlaysiz.

Mahalliy ko'rsatkichlar (aniq JSON): ${JSON.stringify(metrics)}
So'rovnoma (aniq JSON): ${JSON.stringify(questionnaire)}

Qattiq qoidalar:
- Mustaqil tashxis bermang.
- Dori, doza, retsept, davolash rejimi yozmang.
- Matnni aynan ko'rsatkichlarga bog'lang, umumiy/repetitiv bo'lmasin.
- "skrining bo'yicha", "mos keluvchi belgilar", "ehtimoli bo'lishi mumkin" kabi ehtiyotkor tilda yozing.

Faqat JSON qaytaring:
{
  "qisqaXulosa": string,
  "topilganBelgilar": string[],
  "negaXulosa": string,
  "sababKorsatkichlar": string[],
  "mosYonalislar": string[],
  "yonalishFoizlari": [{"yonalish": string, "foiz": number, "izoh": string}],
  "negaMos": string,
  "xavfDarajasiFoiz": string,
  "barqarorlikBahosi": string,
  "chuqurTavsiyalar": string[],
  "uyOzgarishlari": string[],
  "followUpReja": string[],
  "qachonShifokor": string[]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse((response.text || '{}').trim()) as Partial<RespiratoryInterpretation>;
      const merged = this.applySafetyFilter({
        ...fallback,
        ...parsed,
        topilganBelgilar: parsed.topilganBelgilar ?? fallback.topilganBelgilar,
        sababKorsatkichlar: parsed.sababKorsatkichlar ?? fallback.sababKorsatkichlar,
        mosYonalislar: parsed.mosYonalislar ?? fallback.mosYonalislar,
        yonalishFoizlari: parsed.yonalishFoizlari ?? fallback.yonalishFoizlari,
        chuqurTavsiyalar: parsed.chuqurTavsiyalar ?? fallback.chuqurTavsiyalar,
        uyOzgarishlari: parsed.uyOzgarishlari ?? fallback.uyOzgarishlari,
        followUpReja: parsed.followUpReja ?? fallback.followUpReja,
        qachonShifokor: parsed.qachonShifokor ?? fallback.qachonShifokor,
        disclaimer: fallback.disclaimer,
      });
      return { safe: merged, fallback };
    } catch {
      return { safe: fallback, fallback };
    }
  }

  private localInterpretation(metrics: RespiratoryMetrics): RespiratoryInterpretation {
    const risk = Math.round(metrics.concernIndex);
    const riskLabel = risk < 35 ? 'Past' : risk < 65 ? 'O\'rta' : 'Yuqori';

    const directions: RespiratoryDirectionScore[] = [
      {
        yonalish: 'Astma yo‘nalishi',
        foiz: Math.round(Math.min(89, metrics.speechBreathInterruptions * 0.25 + metrics.pauseFrequency * 0.35 + metrics.symptomBurdenScore * 0.25)),
        izoh: 'Nafas uzilishlari va pause yuklamasi mos keluvchi belgilar bermoqda.',
      },
      {
        yonalish: 'Allergik respirator yo‘nalish',
        foiz: Math.round(Math.min(86, metrics.visibleRespiratoryEffort * 0.22 + metrics.audioIrregularityScore * 0.28 + metrics.symptomBurdenScore * 0.2)),
        izoh: 'Audio notekisligi va simptom burden allergik irritatsiya patterniga mos bo‘lishi mumkin.',
      },
      {
        yonalish: 'COPD / surunkali obstruktiv pattern',
        foiz: Math.round(Math.min(82, metrics.coughBurdenIndex * 0.35 + metrics.recoveryTime * 0.35 + metrics.speechBreathInterruptions * 0.2)),
        izoh: 'Yo‘tal burden va sekin tiklanish obstruktiv yo‘nalish ehtimolini oshiradi.',
      },
      {
        yonalish: 'Post-viral recovery muammolari',
        foiz: Math.round(Math.min(88, metrics.recoverySlope < 60 ? 58 : 34) + (metrics.symptomBurdenScore > 60 ? 16 : 6)),
        izoh: 'Recovery kinetics va umumiy simptom yuki post-viral yo‘nalishga mos kelishi mumkin.',
      },
      {
        yonalish: 'Yuqori nafas yo‘llari irritatsiyasi',
        foiz: Math.round(Math.min(79, metrics.coughIntensityPattern * 0.3 + metrics.audioIrregularityScore * 0.25 + metrics.pauseFrequency * 0.2)),
        izoh: 'Yo‘tal intensivligi va audio yuklamasi yuqori nafas yo‘llari irritatsiyasini ko‘rsatishi mumkin.',
      },
      {
        yonalish: 'Funksional nafas buzilishi',
        foiz: Math.round(Math.min(83, metrics.breathIntervalVariability * 0.35 + (100 - metrics.phraseContinuityScore) * 0.2 + metrics.concernIndex * 0.25)),
        izoh: 'Breath interval variabelligi va cadence notekisligi funksional patternga mos keladi.',
      },
      {
        yonalish: 'Infeksion flag',
        foiz: Math.round(Math.min(76, metrics.symptomBurdenScore * 0.35 + metrics.coughBurdenIndex * 0.2 + metrics.audioIrregularityScore * 0.15)),
        izoh: 'Simptom burden va yo‘tal burden infeksion flag ehtimolini ko‘rsatadi.',
      },
      {
        yonalish: 'Umumiy respirator distress flag',
        foiz: Math.round(Math.min(90, metrics.concernIndex * 0.65 + (100 - metrics.overallRespiratoryStability) * 0.2)),
        izoh: 'Integrallashgan concern indeksi umumiy distress signalini beradi.',
      },
    ];

    return {
      qisqaXulosa: `Skrining bo‘yicha nafas-ovoz funksiyasi ${riskLabel.toLowerCase()} xavf yo‘nalishida, dinamik kuzatuv tavsiya etiladi.`,
      topilganBelgilar: [
        `Nafas tezligi: ${metrics.breathingRate}/daq`,
        `Breath interval variabelligi: ${metrics.breathIntervalVariability}%`,
        `Nafas pauza burden: ${metrics.pauseDurationBurden}%`,
        `Nutqdagi nafas uzilishi: ${metrics.speechBreathInterruptions}%`,
        `Recovery vaqti: ${metrics.recoveryTime} soniya`,
      ],
      negaXulosa: 'Xulosa multimodal signal (audio+video+speech) va so‘rovnoma burdenining qo‘shma statistik profiliga tayangan.',
      sababKorsatkichlar: [
        `overallRespiratoryPerformance=${metrics.overallRespiratoryPerformance}%`,
        `normalityProximityScore=${metrics.normalityProximityScore}%`,
        `concernIndex=${metrics.concernIndex}%`,
        `overallSpeechBreathEfficiency=${metrics.overallSpeechBreathEfficiency}%`,
      ],
      mosYonalislar: directions.sort((a, b) => b.foiz - a.foiz).slice(0, 4).map((d) => `${d.yonalish} (${d.foiz}%)`),
      yonalishFoizlari: directions,
      negaMos: 'Ritm notekisligi, yo‘tal burdeni, recovery kinetics va speech-breath cadence indikatorlari yuqoridagi yo‘nalishlar bilan mos keluvchi pattern hosil qildi.',
      xavfDarajasiFoiz: `${riskLabel} xavf (${risk}%). Skrining bo‘yicha concern darajasi.`,
      barqarorlikBahosi: `Normaga yaqinlik: ${metrics.normalityProximityScore}% | Funksional barqarorlik: ${metrics.overallRespiratoryStability}%`,
      chuqurTavsiyalar: [
        'Har kuni ertalab-kechqurun 5-7 daqiqalik diafragmal nafas mashqlari (4-6 ritm) bilan trendni yozib boring.',
        'Trigger nazorati: chang, sovuq havo, keskin hid, tutun ta’sirini kamaytiring va xonani shamollating.',
        'Nutqdan oldin 1 daqiqa nazoratli nafas kirish-chiqish mashqi qilib speech-breath koordinatsiyasini yaxshilang.',
      ],
      uyOzgarishlari: [
        'Yotishdan oldin xona namligi va havosini tekshiring, tungi simptomlar jurnalini yuriting.',
        'Kunlik suyuqlik rejimini barqaror qiling, kuchli jismoniy zo‘riqishni bosqichma-bosqich oshiring.',
      ],
      followUpReja: [
        '3-4 kunda bir marotaba skriningni takrorlang va trend grafigini solishtiring.',
        'Agar 7-10 kun ichida concernIndex pasaymasa, shifokor bilan maqsadli ko‘rik rejalashtiring.',
      ],
      qachonShifokor: [
        'Dam holatda nafas qisilishi kuchaysa yoki ko‘krak og‘riq kuchli bo‘lsa.',
        'Isitma uzoq davom etsa, nafas olish keskin yomonlashsa yoki hushyorlik pasaysa.',
      ],
      disclaimer: [
        'Bu modul skrining va kuzatuv uchun mo‘ljallangan.',
        'Bu mustaqil tashxis emas.',
        'Aniq tashxis uchun shifokor ko‘rigi zarur.',
      ],
    };
  }

  private applySafetyFilter(input: RespiratoryInterpretation): RespiratoryInterpretation {
    const banned = [
      /aniq tashxis|definitive diagnosis|sizda aniq/i,
      /to'liq sog'lom|completely healthy|full healthy/i,
      /mg|tablet|capsule|kuniga [0-9]|retsept|doza/i,
      /definitely have|you have .* disease/i,
    ];

    const sanitize = (text: string) => {
      let safe = text;
      if (banned.some((re) => re.test(safe))) {
        safe = safe
          .replace(/aniq tashxis/gi, 'skrining xulosasi')
          .replace(/to'liq sog'lom/gi, 'normaga yaqin')
          .replace(/definitely have/gi, 'mos kelishi mumkin');
      }
      return safe;
    };

    return {
      ...input,
      qisqaXulosa: sanitize(input.qisqaXulosa),
      negaXulosa: sanitize(input.negaXulosa),
      negaMos: sanitize(input.negaMos),
      xavfDarajasiFoiz: sanitize(input.xavfDarajasiFoiz),
      barqarorlikBahosi: sanitize(input.barqarorlikBahosi),
      topilganBelgilar: input.topilganBelgilar.map(sanitize),
      sababKorsatkichlar: input.sababKorsatkichlar.map(sanitize),
      mosYonalislar: input.mosYonalislar.map(sanitize),
      yonalishFoizlari: input.yonalishFoizlari.map((x) => ({ ...x, yonalish: sanitize(x.yonalish), izoh: sanitize(x.izoh) })),
      chuqurTavsiyalar: input.chuqurTavsiyalar.map(sanitize),
      uyOzgarishlari: input.uyOzgarishlari.map(sanitize),
      followUpReja: input.followUpReja.map(sanitize),
      qachonShifokor: input.qachonShifokor.map(sanitize),
    };
  }
}
