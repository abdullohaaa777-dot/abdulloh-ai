import {
  ConfidenceLevel,
  InternalIndexes,
  OrganBioelectricResult,
  OrganNetworkEdge,
  OrganScores,
  OrganSignalInputs,
  TopProblem
} from '../models/organ-bioelectric';
import { BIOELECTRIC_DISCLAIMER_UZ, INDIRECT_SIGNAL_NOTE_UZ } from './organ-bioelectric.constants';

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const weightedAverage = (items: [number, number][]) => {
  const totalWeight = items.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return 0;
  return clampScore(items.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight);
};

const confidenceFromQuality = (quality: OrganSignalInputs['signalQuality']): ConfidenceLevel => {
  if (quality === 'yuqori') return 'yuqori';
  if (quality === 'o‘rtacha') return 'o‘rtacha';
  return 'past';
};

const buildEdges = (scores: OrganScores, indexes: Omit<InternalIndexes, 'ionl'>): OrganNetworkEdge[] => [
  {
    from: 'heart',
    to: 'kidney',
    score: weightedAverage([[scores.heart, 0.55], [scores.kidney, 0.35], [indexes.bss, 0.1]]),
    interpretationUz: 'Yurak ritmik yuklamasi buyrak perfuziyasi va suyuqlik muvozanatiga bosim berishi mumkin.'
  },
  {
    from: 'kidney',
    to: 'bloodPressure',
    score: weightedAverage([[scores.kidney, 0.55], [scores.heart, 0.2], [indexes.ari, 0.25]]),
    interpretationUz: 'Buyrak funksional bosimi qon bosimi va vegetativ tizim orqali yurak yuklamasini kuchaytirishi mumkin.'
  },
  {
    from: 'brain',
    to: 'heart',
    score: weightedAverage([[scores.brain, 0.5], [scores.heart, 0.25], [indexes.ari, 0.25]]),
    interpretationUz: 'Miya-vegetativ regulyatsiya belgilarida yurak ritmik boshqaruviga ta’sir ehtimoli bor.'
  },
  {
    from: 'brain',
    to: 'endocrine',
    score: weightedAverage([[scores.brain, 0.45], [scores.endocrine, 0.35], [indexes.ari, 0.2]]),
    interpretationUz: 'Stress va vegetativ signal endokrin javob bilan bog‘liq bo‘lishi mumkin.'
  },
  {
    from: 'endocrine',
    to: 'heart',
    score: weightedAverage([[scores.endocrine, 0.45], [scores.heart, 0.35], [indexes.icap, 0.2]]),
    interpretationUz: 'Endokrin-ion signal yurak qo‘zg‘aluvchanligi va ritmik sezgirlikka indirekt ta’sir ko‘rsatishi mumkin.'
  },
  {
    from: 'endocrine',
    to: 'ionChannels',
    score: weightedAverage([[scores.endocrine, 0.5], [indexes.icap, 0.4], [scores.brain, 0.1]]),
    interpretationUz: 'Ion kanallar faolligi bevosita o‘lchanmaydi; tremor, ovoz va nafas ritmidan indirekt baholanadi.'
  },
  {
    from: 'lung',
    to: 'heart',
    score: weightedAverage([[scores.lung, 0.5], [scores.heart, 0.35], [indexes.bss, 0.15]]),
    interpretationUz: 'Nafas va akustik yuklama yurak-o‘pka funksional bog‘lanishida bosim belgisi bo‘lishi mumkin.'
  },
  {
    from: 'lung',
    to: 'brain',
    score: weightedAverage([[scores.lung, 0.45], [scores.brain, 0.35], [indexes.ari, 0.2]]),
    interpretationUz: 'Nafas ritmi beqarorligi miya-vegetativ javob bilan birga kechishi mumkin.'
  },
  {
    from: 'liver',
    to: 'metabolicSystem',
    score: weightedAverage([[scores.liver, 0.55], [scores.endocrine, 0.25], [indexes.msp, 0.2]]),
    interpretationUz: 'Jigar-metabolik signal ehtimoli umumiy charchoq, tiklanish va ovoz kuchi orqali indirekt baholanadi.'
  },
  {
    from: 'liver',
    to: 'heart',
    score: weightedAverage([[scores.liver, 0.45], [scores.heart, 0.25], [indexes.msp, 0.3]]),
    interpretationUz: 'Metabolik yuklama yurak energiya talabi va umumiy chidamlilikka bosim berishi mumkin.'
  }
];

const buildTopProblems = (scores: OrganScores, indexes: InternalIndexes): TopProblem[] => {
  const candidates: TopProblem[] = [
    {
      titleUz: 'Vegetativ regulyatsiya zo‘riqishi',
      probability: weightedAverage([[indexes.ari, 0.65], [scores.brain, 0.2], [scores.heart, 0.15]]),
      explanationUz: 'Miya, yurak, nafas va mimika signallarida vegetativ boshqaruv zo‘riqishi ehtimoli baholandi.'
    },
    {
      titleUz: 'Yurak-o‘pka funksional yuklamasi',
      probability: weightedAverage([[scores.heart, 0.45], [scores.lung, 0.45], [indexes.bss, 0.1]]),
      explanationUz: 'Nafas/akustik ritm va yurak bioelektr stressi orasida funksional bog‘lanish ehtimoli bor.'
    },
    {
      titleUz: 'Metabolik/endokrin signal nomutanosibligi',
      probability: weightedAverage([[scores.endocrine, 0.4], [scores.liver, 0.35], [indexes.msp, 0.25]]),
      explanationUz: 'Jigar va endokrin tizim bo‘yicha natija indirekt biofizik signal belgilariga asoslanadi.'
    },
    {
      titleUz: 'Ion kanal faolligi ehtimoliy disbalansi',
      probability: weightedAverage([[indexes.icap, 0.7], [scores.endocrine, 0.2], [scores.brain, 0.1]]),
      explanationUz: 'Tremor, mikroharakat, ovoz beqarorligi va nafas ritmi orqali indirekt baholandi.'
    },
    {
      titleUz: 'Buyrak-yurak bosim yo‘nalishi',
      probability: weightedAverage([[scores.kidney, 0.45], [scores.heart, 0.35], [indexes.ionl, 0.2]]),
      explanationUz: 'Buyrak funksional bosimi yurak-qon tomir yuklamasi bilan birga baholandi.'
    }
  ];

  return candidates
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map(item => ({ ...item, probability: clampScore(item.probability) }));
};

const buildSummary = (overallIndex: number, scores: OrganScores, topProblems: TopProblem[], confidence: ConfidenceLevel) => {
  const highestOrgan = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  const organName = {
    heart: 'yurak',
    kidney: 'buyrak',
    brain: 'miya-vegetativ tizim',
    liver: 'jigar-metabolik yo‘nalish',
    endocrine: 'endokrin-ion yo‘nalish',
    lung: 'o‘pka-nafas tizimi'
  }[highestOrgan[0] as keyof OrganScores];

  return `Organlararo Bioelektr Indeks ${overallIndex}% darajada baholandi. Eng ko‘p yuklama ${organName} yo‘nalishida kuzatilmoqda (${highestOrgan[1]}%). Asosiy ehtimoliy muammo: ${topProblems[0].titleUz.toLowerCase()} (${topProblems[0].probability}%). Natija kamera, ovoz, nafas, yo‘tal va neuromotor testlardan olingan indirekt signal belgilariga asoslangan. Ishonchlilik darajasi: ${confidence}. ${INDIRECT_SIGNAL_NOTE_UZ}`;
};

export function calculateOrganBioelectricIndex(inputs: OrganSignalInputs): OrganBioelectricResult {
  const bss = weightedAverage([
    [inputs.voiceStability, 0.2],
    [inputs.coughAcousticLoad, 0.18],
    [inputs.breathingLoad, 0.22],
    [inputs.neuromotorTremor, 0.22],
    [100 - inputs.coordinationStability, 0.18]
  ]);
  const ari = weightedAverage([
    [inputs.facialFatigue, 0.18],
    [inputs.facialSymmetry, 0.12],
    [inputs.breathingRhythm, 0.26],
    [inputs.voiceStability, 0.16],
    [inputs.recoveryTolerance, 0.28]
  ]);
  const icap = weightedAverage([
    [inputs.neuromotorTremor, 0.34],
    [100 - inputs.coordinationStability, 0.18],
    [inputs.voiceStability, 0.18],
    [inputs.breathingRhythm, 0.18],
    [inputs.facialFatigue, 0.12]
  ]);
  const msp = weightedAverage([
    [inputs.facialFatigue, 0.22],
    [inputs.voiceStability, 0.18],
    [inputs.breathingLoad, 0.18],
    [inputs.recoveryTolerance, 0.24],
    [100 - inputs.coordinationStability, 0.18]
  ]);

  const organScores: OrganScores = {
    heart: weightedAverage([[bss, 0.38], [ari, 0.2], [inputs.breathingLoad, 0.18], [inputs.includePreviousHeartSignal ? 58 : inputs.voiceStability, 0.24]]),
    kidney: weightedAverage([[bss, 0.22], [ari, 0.25], [msp, 0.28], [inputs.recoveryTolerance, 0.25]]),
    brain: weightedAverage([[ari, 0.46], [icap, 0.2], [inputs.facialFatigue, 0.18], [100 - inputs.coordinationStability, 0.16]]),
    liver: weightedAverage([[msp, 0.55], [inputs.facialFatigue, 0.18], [inputs.recoveryTolerance, 0.17], [inputs.voiceStability, 0.1]]),
    endocrine: weightedAverage([[icap, 0.42], [msp, 0.25], [ari, 0.2], [inputs.neuromotorTremor, 0.13]]),
    lung: weightedAverage([[inputs.breathingLoad, 0.36], [inputs.breathingRhythm, 0.26], [inputs.coughAcousticLoad, 0.22], [bss, 0.16]])
  };

  const partialIndexes = { bss, ari, icap, msp };
  const networkEdges = buildEdges(organScores, partialIndexes);
  const ionl = weightedAverage(networkEdges.map(edge => [edge.score, 1]));
  const internalIndexes: InternalIndexes = { ...partialIndexes, ionl };
  const overallIndex = weightedAverage([
    [bss, 0.2], [ari, 0.2], [icap, 0.17], [msp, 0.17], [ionl, 0.26]
  ]);
  const topProblems = buildTopProblems(organScores, internalIndexes);
  const confidence = confidenceFromQuality(inputs.signalQuality);

  return {
    overallIndex,
    organScores,
    internalIndexes,
    networkEdges,
    topProblems,
    confidence,
    aiSummaryUz: buildSummary(overallIndex, organScores, topProblems, confidence),
    recommendationsUz: [
      'Qon bosimi, puls, SpO2 va tana haroratini qayta nazorat qiling.',
      'Agar yurak-o‘pka yuklamasi yuqori bo‘lsa, EKG va nafas funksional tekshiruvini ko‘rib chiqing.',
      'Metabolik yoki endokrin signal yuqori bo‘lsa, laborator tekshiruvlar: glyukoza, elektrolitlar, kreatinin, ALT/AST va TSH tavsiya etiladi.',
      'Ko‘krak og‘rig‘i, hushdan ketish, keskin nafas qisishi yoki nevrologik belgilar bo‘lsa, darhol shifokorga murojaat qiling.'
    ],
    rawTestSummary: `Signal sifati: ${inputs.signalQuality}. Nafas ritmi: ${inputs.breathingRhythm}%, ovoz beqarorligi: ${inputs.voiceStability}%, yo‘tal akustik yuklamasi: ${inputs.coughAcousticLoad}%, neuromotor tremor: ${inputs.neuromotorTremor}%.`,
    disclaimerUz: BIOELECTRIC_DISCLAIMER_UZ,
    disclaimerShown: true
  };
}
