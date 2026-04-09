import { TwinInput, TwinResult } from '../models/clinical.models';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function runTransplantTwin(input: TwinInput): TwinResult {
  const creatinineRisk = input.creatinine ? Math.max(0, (input.creatinine - 1.2) * 25) : 12;
  const egfrRisk = input.egfr ? Math.max(0, (65 - input.egfr) * 1.1) : 15;
  const inflammatoryRisk = (input.crp ?? 2) * 3 + (input.temperature && input.temperature > 37.7 ? 12 : 0);
  const immuneRisk = (input.dsaStatus === 'positive' ? 24 : 4) + ((input.ddCfDna ?? 0.4) > 1 ? 18 : 3);
  const toxRisk = input.tacrolimusLevel ? Math.max(0, (input.tacrolimusLevel - 11) * 5) : 8;
  const hemoRisk = (input.systolicBp && input.systolicBp > 145 ? 18 : 6) + (input.urineOutputMlDay && input.urineOutputMlDay < 700 ? 20 : 5);
  const adherencePenalty = input.medicationAdherencePercent ? Math.max(0, 100 - input.medicationAdherencePercent) * 0.35 : 12;

  const silentRejectionRisk = clamp(immuneRisk + egfrRisk * 0.35 + creatinineRisk * 0.25 + adherencePenalty);
  const drugToxicitySuspicion = clamp(toxRisk + creatinineRisk * 0.45);
  const infectionOverlapSuspicion = clamp(inflammatoryRisk + (input.albumin && input.albumin < 3.2 ? 15 : 3));
  const hemodynamicStressScore = clamp(hemoRisk + (input.weightDeltaKg && input.weightDeltaKg > 2 ? 12 : 0));

  const graftReserveScore = clamp(100 - (creatinineRisk + egfrRisk));
  const inflammatoryReserveScore = clamp(100 - inflammatoryRisk);
  const microvascularReserveScore = clamp(100 - hemodynamicStressScore);
  const metabolicReserveScore = clamp(100 - ((input.proteinuria ?? 0.2) * 20 + creatinineRisk));
  const recoveryReserveScore = clamp((graftReserveScore + inflammatoryReserveScore + microvascularReserveScore) / 3 - adherencePenalty * 0.5);
  const immuneQuietnessIndex = clamp(100 - immuneRisk - inflammatoryRisk * 0.5);

  const highSignals = [silentRejectionRisk, drugToxicitySuspicion, infectionOverlapSuspicion, hemodynamicStressScore].filter(v => v >= 65).length;
  const urgencyLevel = highSignals >= 2 ? 'high' : highSignals === 1 ? 'medium' : 'low';

  const mechanisms = [
    { key: 'alloimmune rejection suspicion', score: silentRejectionRisk },
    { key: 'drug toxicity suspicion', score: drugToxicitySuspicion },
    { key: 'infection overlap suspicion', score: infectionOverlapSuspicion },
    { key: 'hemodynamic stress', score: hemodynamicStressScore },
    { key: 'mixed/uncertain pattern', score: 40 }
  ];
  const likelyMechanism = mechanisms.sort((a, b) => b.score - a.score)[0].key;

  const missing = ['creatinine', 'egfr', 'dsaStatus', 'ddCfDna'].filter(k => input[k as keyof TwinInput] == null).length;
  const confidenceBand = missing >= 3 ? 'low' : missing >= 1 ? 'medium' : 'high';

  const nextBestTest = silentRejectionRisk > 65 ? 'dd-cfDNA + DSA panel' :
    drugToxicitySuspicion > 60 ? 'Tacrolimus trough level (repeat)' :
    infectionOverlapSuspicion > 60 ? 'Infection panel + CRP/procalcitonin' : 'Urine ACR + blood pressure trend';

  return {
    modelVersion: 'twin-rule-v1.0.0',
    graftReserveScore,
    inflammatoryReserveScore,
    microvascularReserveScore,
    metabolicReserveScore,
    recoveryReserveScore,
    immuneQuietnessIndex,
    silentRejectionRisk,
    drugToxicitySuspicion,
    infectionOverlapSuspicion,
    hemodynamicStressScore,
    likelyMechanism,
    urgencyLevel,
    nextBestTest,
    confidenceBand,
    rationale: [
      'Bu modul tashxis emas, xavf va mexanizm signalini baholaydi.',
      `Asosiy signal: ${likelyMechanism}.`,
      `Missing data soni: ${missing}.`
    ]
  };
}

export function recommendNextBestTests(result: TwinResult): { primary: string; secondary: string[]; reason: string } {
  const secondary = ['Urine ACR', 'Tacrolimus trough', 'Renal ultrasound'];
  if (result.silentRejectionRisk > 65) {
    return { primary: 'DSA + dd-cfDNA', secondary, reason: 'Alloimmune signal yuqori bo‘lgani uchun noaniqlikni eng tez kamaytiradi.' };
  }
  if (result.infectionOverlapSuspicion > 65) {
    return { primary: 'Infeksiya paneli', secondary, reason: 'Infeksiya bilan overlap ehtimoli yuqori.' };
  }
  return { primary: result.nextBestTest, secondary, reason: 'Eng katta xavf drayverini aniqlashtirish uchun tanlandi.' };
}

export function simulateScenario(base: TwinInput, scenario: Partial<TwinInput>) {
  const current = runTransplantTwin(base);
  const projected = runTransplantTwin({ ...base, ...scenario });
  return {
    current,
    projected,
    deltaRisk: projected.silentRejectionRisk - current.silentRejectionRisk
  };
}
