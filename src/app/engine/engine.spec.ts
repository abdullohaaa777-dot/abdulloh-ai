import { describe, expect, it } from 'vitest';
import { analyzeUrineBasic } from './urine-basic.engine';
import { analyzeUrineStrip } from './urine-strip.engine';
import { recommendNextBestTests, runTransplantTwin, simulateScenario } from './transplant-twin.engine';

describe('urine basic engine', () => {
  it('returns macro-only explainable output', () => {
    const out = analyzeUrineBasic({ brightness: 0.4, blurScore: 0.1, turbiditySignal: 0.5, redHueSignal: 0.2, foamSignal: 0.1, calibrationCardDetected: true });
    expect(out.colorClass).toBe('amber');
    expect(out.explanation[0]).toContain('makroskopik');
  });
});

describe('urine strip engine', () => {
  it('validates timing and maps strips', () => {
    const out = analyzeUrineStrip({ timingSeconds: 60, calibrationCardDetected: true, padSignals: { protein: 0.8, blood: 0.1, glucose: 0, ketone: 0, nitrite: 0.8, leukocyte: 0.5, ph: 0.4, sg: 0.6 } });
    expect(out.timingValid).toBe(true);
    expect(out.nitriteResult).toBe('positive');
  });
});

describe('transplant twin', () => {
  it('generates risk and next best tests', () => {
    const result = runTransplantTwin({ creatinine: 2.1, egfr: 34, dsaStatus: 'positive', ddCfDna: 1.7, medicationAdherencePercent: 60, systolicBp: 155, urineOutputMlDay: 550 });
    expect(result.silentRejectionRisk).toBeGreaterThan(50);
    const rec = recommendNextBestTests(result);
    expect(rec.primary.length).toBeGreaterThan(3);
  });

  it('runs counterfactual simulation', () => {
    const sim = simulateScenario({ creatinine: 1.7, egfr: 45, medicationAdherencePercent: 70, dsaStatus: 'positive', ddCfDna: 1.4 }, { medicationAdherencePercent: 95, ddCfDna: 0.4 });
    expect(sim.projected.silentRejectionRisk).toBeLessThanOrEqual(sim.current.silentRejectionRisk);
  });
});
