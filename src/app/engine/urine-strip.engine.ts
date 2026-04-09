import { UrineStripInput, UrineStripResult } from '../models/clinical.models';

const mapBand = (v: number, labels: string[]): string => labels[Math.max(0, Math.min(labels.length - 1, Math.floor(v * labels.length)))];

export function analyzeUrineStrip(input: UrineStripInput): UrineStripResult {
  const timingValid = input.timingSeconds >= 45 && input.timingSeconds <= 120;
  const qualityPenalty = input.calibrationCardDetected ? 0 : 20;
  const qualityScore = Math.max(0, Math.min(100, 88 - qualityPenalty - (timingValid ? 0 : 25)));

  return {
    timingValid,
    qualityScore,
    proteinResult: mapBand(input.padSignals['protein'] ?? 0, ['negative', 'trace', '+', '++', '+++']),
    bloodResult: mapBand(input.padSignals['blood'] ?? 0, ['negative', 'trace', '+', '++', '+++']),
    glucoseResult: mapBand(input.padSignals['glucose'] ?? 0, ['negative', 'trace', '+', '++', '+++']),
    ketoneResult: mapBand(input.padSignals['ketone'] ?? 0, ['negative', 'trace', '+', '++']),
    nitriteResult: (input.padSignals['nitrite'] ?? 0) > 0.55 ? 'positive' : 'negative',
    leukocyteResult: mapBand(input.padSignals['leukocyte'] ?? 0, ['negative', 'trace', '+', '++', '+++']),
    phResult: mapBand(input.padSignals['ph'] ?? 0, ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0']),
    sgResult: mapBand(input.padSignals['sg'] ?? 0, ['1.005', '1.010', '1.015', '1.020', '1.025', '1.030']),
    confidenceBand: qualityScore > 75 ? 'high' : qualityScore > 50 ? 'medium' : 'low',
    explanation: [
      'Dipstik natijalari semi-quantitative talqinda berildi.',
      timingValid ? 'Strip o‘qish vaqti me’yorga mos.' : 'O‘qish vaqti me’yordan tashqari bo‘lishi mumkin.',
      input.calibrationCardDetected ? 'Kalibratsiya kartasi topildi.' : 'Kalibratsiya kartasi topilmadi; xatolik ehtimoli yuqori.'
    ]
  };
}
