import { HomeostasisAIAnalysis, HomeostasisInputData, HomeostasisOrganInteraction, HomeostasisResult, HomeostasisRiskLevel, HomeostasisScores } from '../models/homeostasis';

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);
const riskFromRange = (value: number | null, low: number, high: number, severeLow: number, severeHigh: number) => {
  if (!isNumber(value)) return 18;
  if (value >= low && value <= high) return 0;
  if (value < low) return clamp(((low - value) / Math.max(1, low - severeLow)) * 100);
  return clamp(((value - high) / Math.max(1, severeHigh - high)) * 100);
};
const average = (values: number[]) => clamp(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

export const defaultHomeostasisInput = (): HomeostasisInputData => ({
  age: 42,
  gender: 'male',
  heightCm: 172,
  weightKg: 78,
  systolicBp: 128,
  diastolicBp: 82,
  pulse: 76,
  temperature: 36.7,
  sleepHours: 6.5,
  stressLevel: 42,
  nutritionQuality: 64,
  physicalActivity: 48,
  fatigue: 38,
  thirst: false,
  dizziness: false,
  palpitations: false,
  weakness: false,
  sweating: false,
  sleepDisturbance: true,
  glucose: 5.7,
  insulin: 12,
  hba1c: 5.6,
  cortisol: 390,
  totalCholesterol: 190,
  ldl: 112,
  hdl: 45,
  triglyceride: 150,
  creatinine: 88,
  egfr: 92,
  alt: 34,
  ast: 29,
  bilirubin: 14,
  sodium: 140,
  potassium: 4.2,
  calcium: 2.3,
  magnesium: 0.84,
  crp: 3,
  hemoglobin: 14,
  wearableSummary: 'Smartwatch, smart ring, glucose sensor, HRV sensor va sleep tracker integratsiyasi uchun tayyor maydon.'
});

export const calculateBmi = (input: HomeostasisInputData) => {
  if (!isNumber(input.heightCm) || !isNumber(input.weightKg) || input.heightCm <= 0) return null;
  return Number((input.weightKg / ((input.heightCm / 100) ** 2)).toFixed(1));
};

export const getMissingHomeostasisData = (input: HomeostasisInputData) => {
  const labels: [keyof HomeostasisInputData, string][] = [
    ['age', 'yosh'], ['heightCm', 'bo‘y'], ['weightKg', 'vazn'], ['systolicBp', 'sistolik qon bosimi'], ['diastolicBp', 'diastolik qon bosimi'],
    ['glucose', 'glyukoza'], ['hba1c', 'HbA1c'], ['cortisol', 'kortizol'], ['sodium', 'natriy'], ['potassium', 'kaliy'], ['calcium', 'kalsiy'], ['magnesium', 'magniy']
  ];
  return labels.filter(([key]) => !isNumber(input[key] as number | null)).map(([, label]) => label);
};

export function calculateHomeostasisScores(input: HomeostasisInputData): HomeostasisScores {
  const bmi = calculateBmi(input);
  const bmiRisk = isNumber(bmi) ? riskFromRange(bmi, 18.5, 24.9, 14, 38) : 20;
  const bpRisk = average([riskFromRange(input.systolicBp, 90, 129, 75, 180), riskFromRange(input.diastolicBp, 60, 84, 45, 120)]);
  const glucoseRisk = average([riskFromRange(input.glucose, 3.9, 5.5, 2.5, 10), riskFromRange(input.hba1c, 4.5, 5.6, 3.6, 8.5), riskFromRange(input.insulin, 2, 18, 0, 45)]);
  const lipidRisk = average([riskFromRange(input.ldl, 0, 115, 0, 210), riskFromRange(input.triglyceride, 0, 150, 0, 380), riskFromRange(input.hdl, input.gender === 'female' ? 50 : 40, 90, 20, 110)]);
  const cortisolRisk = average([riskFromRange(input.cortisol, 140, 690, 40, 950), input.stressLevel, riskFromRange(input.sleepHours, 7, 9, 3, 12), riskFromRange(input.pulse, 55, 90, 40, 135), input.sleepDisturbance ? 55 : 8]);
  const energyRisk = average([input.fatigue, 100 - input.physicalActivity, 100 - input.nutritionQuality, riskFromRange(input.sleepHours, 7, 9, 3, 12), input.weakness ? 65 : 10]);
  const electrolyteRisk = average([
    riskFromRange(input.sodium, 135, 145, 124, 155), riskFromRange(input.potassium, 3.5, 5.1, 2.8, 6.4), riskFromRange(input.calcium, 2.1, 2.6, 1.7, 3.1), riskFromRange(input.magnesium, 0.7, 1.0, 0.45, 1.35)
  ]);
  const renalLiverInflammationRisk = average([riskFromRange(input.creatinine, 53, 115, 35, 220), riskFromRange(input.egfr, 90, 140, 35, 160), riskFromRange(input.alt, 0, 56, 0, 140), riskFromRange(input.ast, 0, 40, 0, 130), riskFromRange(input.crp, 0, 5, 0, 55)]);
  const symptomsRisk = average([input.thirst ? 58 : 8, input.dizziness ? 55 : 8, input.palpitations ? 52 : 8, input.sweating ? 42 : 7]);
  const metabolicRiskIndex = average([glucoseRisk, lipidRisk, bmiRisk, 100 - input.physicalActivity, symptomsRisk]);
  const cortisolStressLoadIndex = cortisolRisk;
  const energyRecoveryIndex = clamp(100 - energyRisk);
  const electrolyteBalanceIndex = clamp(100 - electrolyteRisk);
  const homeostasisStabilityIndex = clamp(100 - average([metabolicRiskIndex, cortisolStressLoadIndex, 100 - energyRecoveryIndex, 100 - electrolyteBalanceIndex, bpRisk, renalLiverInflammationRisk]));

  return { homeostasisStabilityIndex, metabolicRiskIndex, cortisolStressLoadIndex, energyRecoveryIndex, electrolyteBalanceIndex };
}

export function buildOrganMetabolicMap(scores: HomeostasisScores, input: HomeostasisInputData): HomeostasisOrganInteraction[] {
  const glucosePressure = average([scores.metabolicRiskIndex, input.thirst ? 65 : 12, input.fatigue]);
  const stressPressure = average([scores.cortisolStressLoadIndex, input.palpitations ? 60 : 10]);
  const electrolytePressure = 100 - scores.electrolyteBalanceIndex;
  return [
    { from: 'endocrine', to: 'liver', score: average([glucosePressure, scores.metabolicRiskIndex]), labelUz: 'Endokrin tizim → jigar metabolik oqimi' },
    { from: 'liver', to: 'heart', score: average([scores.metabolicRiskIndex, riskFromRange(input.triglyceride, 0, 150, 0, 380)]), labelUz: 'Jigar → yurak metabolik stressi' },
    { from: 'kidney', to: 'heart', score: average([electrolytePressure, riskFromRange(input.egfr, 90, 140, 35, 160), riskFromRange(input.systolicBp, 90, 129, 75, 180)]), labelUz: 'Buyrak → yurak-qon tomir bosimi' },
    { from: 'brain', to: 'endocrine', score: stressPressure, labelUz: 'Miya/vegetativ tizim → kortizol-stress o‘qi' },
    { from: 'heart', to: 'brain', score: average([riskFromRange(input.pulse, 55, 90, 40, 135), stressPressure]), labelUz: 'Yurak ritmi → vegetativ regulyatsiya' },
    { from: 'kidney', to: 'endocrine', score: average([electrolytePressure, glucosePressure]), labelUz: 'Buyrak elektrolitlari → endokrin signal' }
  ];
}

export function riskLevelFromScores(scores: HomeostasisScores): HomeostasisRiskLevel {
  const risk = average([100 - scores.homeostasisStabilityIndex, scores.metabolicRiskIndex, scores.cortisolStressLoadIndex, 100 - scores.energyRecoveryIndex, 100 - scores.electrolyteBalanceIndex]);
  if (risk >= 82) return 'Kritik signal';
  if (risk >= 62) return 'Yuqori xavf';
  if (risk >= 36) return 'O‘rta xavf';
  return 'Past xavf';
}

export function buildFallbackAIAnalysis(input: HomeostasisInputData, scores: HomeostasisScores, interactions: HomeostasisOrganInteraction[]): HomeostasisAIAnalysis {
  const riskLevel = riskLevelFromScores(scores);
  const missing = getMissingHomeostasisData(input);
  const possibleDirections = [
    { titleUz: 'Prediabet/diabet ehtimoli', probability: average([scores.metabolicRiskIndex, riskFromRange(input.glucose, 3.9, 5.5, 2.5, 10), riskFromRange(input.hba1c, 4.5, 5.6, 3.6, 8.5)]), explanationUz: 'Glyukoza, HbA1c, BMI, chanqash va charchoq belgilariga asoslangan ehtimoliy yo‘nalish.' },
    { titleUz: 'Metabolik sindrom ehtimoli', probability: average([scores.metabolicRiskIndex, riskFromRange(input.triglyceride, 0, 150, 0, 380), riskFromRange(input.systolicBp, 90, 129, 75, 180)]), explanationUz: 'Lipidlar, qon bosimi, vazn va faollik belgilarining umumiy bosimi baholandi.' },
    { titleUz: 'Stress-kortizol disbalansi ehtimoli', probability: scores.cortisolStressLoadIndex, explanationUz: 'Kortizol, stress, uyqu, puls va vegetativ simptomlar asosida baholandi.' },
    { titleUz: 'Elektrolit disbalansi ehtimoli', probability: 100 - scores.electrolyteBalanceIndex, explanationUz: 'Na⁺, K⁺, Ca²⁺ va Mg²⁺ normal diapazondan og‘ishi bo‘yicha hisoblandi.' },
    { titleUz: 'Buyrak-metabolik yuklama ehtimoli', probability: interactions.find(item => item.from === 'kidney' && item.to === 'heart')?.score ?? 0, explanationUz: 'eGFR, kreatinin, qon bosimi va elektrolit muvozanati bilan bog‘liq ehtimoliy yo‘nalish.' },
    { titleUz: 'Jigar-metabolik yuklama ehtimoli', probability: interactions.find(item => item.from === 'liver')?.score ?? 0, explanationUz: 'ALT, AST, bilirubin, lipid va glyukoza-insulin dinamikasi bilan bog‘liq ehtimoliy yo‘nalish.' },
    { titleUz: 'Yurak-metabolik stress ehtimoli', probability: interactions.find(item => item.to === 'heart')?.score ?? 0, explanationUz: 'Puls, qon bosimi, lipidlar va metabolik bosimning yurak bilan aloqasi baholandi.' }
  ].map(item => ({ ...item, probability: clamp(item.probability) }));

  return {
    summary: `Homeostaz barqarorligi ${scores.homeostasisStabilityIndex}% deb baholandi. Umumiy xavf darajasi: ${riskLevel}. Bu yakuniy diagnoz emas, balki mavjud parametrlar asosidagi klinik-metabolik skriningdir.`,
    riskLevel,
    keyFindings: [
      `Metabolik xavf indeksi: ${scores.metabolicRiskIndex}%`,
      `Kortizol-stress yuklamasi: ${scores.cortisolStressLoadIndex}%`,
      `Elektrolit muvozanati: ${scores.electrolyteBalanceIndex}%`,
      missing.length ? `Yetishmayotgan ma’lumotlar: ${missing.join(', ')}` : 'Asosiy kiritilgan parametrlar yetarli darajada to‘ldirilgan.'
    ],
    possibleDirections,
    organInteractions: interactions.map(item => `${item.labelUz}: ${item.score}%`),
    recommendations: [
      'Glyukoza, HbA1c, lipid profili va elektrolitlarni dinamik kuzatish tavsiya etiladi.',
      'Uyqu, stress va jismoniy faollik ko‘rsatkichlarini 7–14 kun davomida qayd eting.',
      'Yuqori yoki kritik signal bo‘lsa, shifokor ko‘rigidan o‘tish tavsiya qilinadi.'
    ],
    monitoringPlan: ['Haftalik vazn va qon bosimi nazorati', 'Glyukoza va uyqu trendini solishtirish', 'Elektrolitlar va buyrak ko‘rsatkichlarini qayta baholash'],
    urgentWarnings: riskLevel === 'Yuqori xavf' || riskLevel === 'Kritik signal' ? ['Yuqori xavf belgisi aniqlandi. Bu yakuniy diagnoz emas. Shifokor ko‘rigidan o‘tish tavsiya qilinadi.'] : [],
    explanationForPatient: 'Natija organizmning energiya, stress, glyukoza-insulin va elektrolit muvozanati haqida taxminiy yo‘nalish beradi. Aniq tashxis uchun shifokor va laborator tekshiruvlar zarur.',
    explanationForDoctor: 'Formula-based scoring glyukoza-insulin, lipid, kortizol-stress, elektrolit va organ-metabolik bog‘lanish markerlarini birlashtirdi. Natija differensialga o‘xshash ehtimoliy yo‘nalish sifatida talqin qilinadi.'
  };
}

export function buildHomeostasisResult(input: HomeostasisInputData, previous: HomeostasisResult[] = [], aiAnalysis?: HomeostasisAIAnalysis): HomeostasisResult {
  const calculatedScores = calculateHomeostasisScores(input);
  const organInteractionMap = buildOrganMetabolicMap(calculatedScores, input);
  const localAnalysis = aiAnalysis ?? buildFallbackAIAnalysis(input, calculatedScores, organInteractionMap);
  const missingData = getMissingHomeostasisData(input);
  const baseRisk = 100 - calculatedScores.homeostasisStabilityIndex;
  const previousRisk = previous[0] ? 100 - previous[0].calculatedScores.homeostasisStabilityIndex : baseRisk;
  const trendStatus = baseRisk > previousRisk + 12 ? 'tez yomonlashish' : baseRisk > previousRisk + 4 ? 'sekin yomonlashish' : baseRisk < previousRisk - 6 ? 'tiklanish ehtimoli bor' : 'barqaror';
  return {
    inputData: input,
    calculatedScores,
    riskLevel: localAnalysis.riskLevel,
    trendStatus,
    missingData,
    fiveYearProjection: { years: 5, status: trendStatus, riskPercent: clamp(baseRisk + (trendStatus.includes('yomonlashish') ? 8 : 0)), explanationUz: '5 yillik prognoz klinik diagnoz emas, risk trend modeli sifatida talqin qilinadi.' },
    tenYearProjection: { years: 10, status: trendStatus, riskPercent: clamp(baseRisk + (trendStatus.includes('yomonlashish') ? 16 : 6)), explanationUz: '10 yillik prognoz mavjud parametrlar va oldingi natija bilan solishtirishga asoslangan taxminiy trenddir.' },
    organInteractionMap,
    aiAnalysis: localAnalysis,
    recommendations: localAnalysis.recommendations,
    createdAt: new Date().toISOString()
  };
}
