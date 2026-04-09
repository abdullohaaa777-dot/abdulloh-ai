import { UrineBasicInput, UrineBasicResult } from '../models/clinical.models';

export function analyzeUrineBasic(input: UrineBasicInput): UrineBasicResult {
  const qualityScore = Math.max(0, Math.min(100, 100 - input.blurScore * 40 - Math.abs(0.55 - input.brightness) * 80));
  const colorClass = input.brightness > 0.75 ? 'very-light' : input.brightness > 0.52 ? 'straw' : input.brightness > 0.35 ? 'amber' : 'dark';
  const turbidityClass = input.turbiditySignal < 0.3 ? 'clear' : input.turbiditySignal < 0.6 ? 'slightly-cloudy' : 'cloudy';
  const visibleBloodSuspicion = input.redHueSignal < 0.3 ? 'low' : input.redHueSignal < 0.55 ? 'medium' : 'high';
  const foamSuspicion = input.foamSignal < 0.25 ? 'low' : input.foamSignal < 0.55 ? 'medium' : 'high';
  const hydrationSignal = colorClass === 'very-light' ? 'possible-overhydration' : colorClass === 'dark' ? 'possible-dehydration' : 'likely-adequate';
  const confidenceBand = qualityScore > 75 ? 'high' : qualityScore > 50 ? 'medium' : 'low';

  const explanation = [
    'Oddiy siydik rasmi faqat makroskopik screening uchun ishlatiladi.',
    'Kimyoviy biomarkerlar faqat dipstik moduli orqali baholanadi.',
    input.calibrationCardDetected ? 'Kalibratsiya kartasi topildi, rang bahosi barqarorroq.' : 'Kalibratsiya kartasi yo‘q, rang bahosi noaniqroq.'
  ];

  return {
    qualityScore,
    colorClass,
    turbidityClass,
    visibleBloodSuspicion,
    foamSuspicion,
    hydrationSignal,
    confidenceBand,
    explanation
  };
}
