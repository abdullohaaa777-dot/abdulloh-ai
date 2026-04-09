import { Injectable } from '@angular/core';
import { TwinInput, TwinResult, UrineBasicInput, UrineBasicResult, UrineStripResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ClinicalEngineService {
  analyzeUrineBasic(input: UrineBasicInput): UrineBasicResult {
    const qualityScore = Math.max(0, 100 - input.blur * 20 - input.reflection * 15 - Math.abs(50 - input.brightness));
    const colorClass = input.brightness > 70 ? 'very_light' : input.brightness > 50 ? 'straw' : input.brightness > 30 ? 'amber' : 'dark';
    const turbidityClass = input.reflection > 3 ? 'cloudy' : input.reflection > 1 ? 'slightly_cloudy' : 'clear';
    return {
      qualityScore,
      colorClass,
      turbidityClass,
      visibleBloodSuspicion: colorClass === 'amber' && input.reflection > 2,
      foamSuspicion: input.reflection > 2.5,
      hydrationSignal: colorClass === 'dark' ? 'possible_dehydration' : colorClass === 'amber' ? 'watch' : 'good',
      explanation: [
        'Makroskopik screening natijasi: kimyoviy tashxis emas.',
        input.calibrationCard ? 'Kalibratsiya kartasi aniqlandi, rang bahosi ishonchliroq.' : 'Kalibratsiya kartasi yo‘q, ishonch diapazoni pasaydi.',
      ]
    };
  }

  analyzeUrineStrip(signalStrength: number, timingValid: boolean): UrineStripResult {
    const confidence = Math.max(20, Math.min(95, signalStrength * 10 + (timingValid ? 20 : -20)));
    return {
      protein: signalStrength > 6 ? '1+' : 'negative',
      blood: signalStrength > 7 ? 'trace' : 'negative',
      glucose: signalStrength > 8 ? 'trace' : 'negative',
      ketone: signalStrength > 8 ? 'trace' : 'negative',
      nitrite: signalStrength > 6 ? 'possible positive' : 'negative',
      leukocyte: signalStrength > 5 ? 'trace' : 'negative',
      ph: signalStrength > 5 ? '6.5' : '6.0',
      specificGravity: signalStrength > 5 ? '1.020' : '1.015',
      confidence,
      explanation: [
        'Strip semi-quantitative tahlil, laboratoriya testini almashtirmaydi.',
        timingValid ? 'Vaqt oynasi mos.' : 'Vaqt oynasi mos emas, qayta o‘lchash tavsiya etiladi.'
      ]
    };
  }

  calculateTwin(input: TwinInput): TwinResult {
    const graft = 100 - ((input.creatinine ?? 1.2) * 20 + Math.max(0, 90 - (input.egfr ?? 75)) * 0.8 + (input.proteinuria ?? 0.2) * 12);
    const inflammatory = 100 - ((input.crp ?? 4) * 4 + Math.max(0, 3.8 - (input.albumin ?? 4)) * 18);
    const microvascular = 100 - (Math.max(0, (input.systolicBp ?? 125) - 120) * 0.7 + Math.max(0, 500 - (input.urineOutput ?? 1200)) * 0.04);
    const metabolic = 100 - (Math.max(0, (input.weightDelta ?? 0)) * 4 + Math.max(0, (input.temperature ?? 36.8) - 37.2) * 15);
    const recovery = 100 - Math.max(0, 100 - (input.adherence ?? 85)) * 0.6;
    const immuneQuietness = 100 - ((input.dsaPositive ? 25 : 0) + (input.ddcfDna ?? 0.4) * 12 + Math.max(0, 8 - (input.tacrolimus ?? 7)) * 5);

    const silentRejectionRisk = this.bound(100 - ((graft + immuneQuietness) / 2), 0, 100);
    const drugToxicitySuspicion = this.bound(Math.max(0, (input.tacrolimus ?? 7) - 10) * 9 + (input.creatinine ?? 1.2) * 8, 0, 100);
    const infectionOverlapSuspicion = this.bound((input.crp ?? 4) * 7 + Math.max(0, (input.temperature ?? 36.8) - 37.5) * 20, 0, 100);
    const hemodynamicStressScore = this.bound(Math.max(0, (input.systolicBp ?? 125) - 135) * 2 + Math.max(0, 800 - (input.urineOutput ?? 1200)) * 0.06, 0, 100);

    const urgency: 'low' | 'medium' | 'high' = silentRejectionRisk > 65 || infectionOverlapSuspicion > 65 ? 'high' : silentRejectionRisk > 40 ? 'medium' : 'low';
    const likelyMechanism = this.pickMechanism(silentRejectionRisk, drugToxicitySuspicion, infectionOverlapSuspicion, hemodynamicStressScore);
    const nextBestTest = this.nextBestTest(input, likelyMechanism);

    return {
      modelVersion: 'twin-rule-v1.0.0',
      graftReserveScore: this.bound(graft, 0, 100),
      inflammatoryReserveScore: this.bound(inflammatory, 0, 100),
      microvascularReserveScore: this.bound(microvascular, 0, 100),
      metabolicReserveScore: this.bound(metabolic, 0, 100),
      recoveryReserveScore: this.bound(recovery, 0, 100),
      immuneQuietnessIndex: this.bound(immuneQuietness, 0, 100),
      silentRejectionRisk,
      drugToxicitySuspicion,
      infectionOverlapSuspicion,
      hemodynamicStressScore,
      likelyMechanism,
      nextBestTest,
      urgency,
      confidenceBand: input.ddcfDna === undefined ? 'medium' : 'high',
      rationale: [
        'Bu modul tashxis qo‘ymaydi; risk va signal beradi.',
        'Missing biomarkerlar confidence darajasini pasaytiradi.',
        `Likely mechanism: ${likelyMechanism}`
      ]
    };
  }

  simulate(input: TwinInput): Array<{ name: string; deltaRisk: number }> {
    const baseline = this.calculateTwin(input).silentRejectionRisk;
    const scenarios: Array<{ name: string; patched: TwinInput }> = [
      { name: 'Tacrolimus normal range', patched: { ...input, tacrolimus: 7.5 } },
      { name: 'Proteinuria increase', patched: { ...input, proteinuria: (input.proteinuria ?? 0.2) + 0.8 } },
      { name: 'BP controlled', patched: { ...input, systolicBp: 120 } },
      { name: 'Creatinine slight rise', patched: { ...input, creatinine: (input.creatinine ?? 1.2) + 0.4 } },
      { name: 'Adherence improves', patched: { ...input, adherence: 95 } },
    ];
    return scenarios.map((s) => ({ name: s.name, deltaRisk: Number((this.calculateTwin(s.patched).silentRejectionRisk - baseline).toFixed(1)) }));
  }

  private nextBestTest(input: TwinInput, mechanism: string): string {
    if (!input.ddcfDna) return 'dd-cfDNA';
    if (!input.dsaPositive && mechanism.includes('alloimmune')) return 'DSA panel';
    if (!input.tacrolimus) return 'Tacrolimus trough level';
    if ((input.crp ?? 0) > 10) return 'Infection panel';
    return 'Urine ACR + graft ultrasound';
  }

  private pickMechanism(reject: number, tox: number, inf: number, hemo: number): string {
    const ranked = [
      { label: 'alloimmune rejection suspicion', score: reject },
      { label: 'drug toxicity suspicion', score: tox },
      { label: 'infection overlap suspicion', score: inf },
      { label: 'hemodynamic stress', score: hemo }
    ].sort((a, b) => b.score - a.score);
    return ranked[0].score - ranked[1].score < 8 ? 'mixed/uncertain pattern' : ranked[0].label;
  }

  private bound(value: number, min: number, max: number): number {
    return Number(Math.min(max, Math.max(min, value)).toFixed(1));
  }
}
