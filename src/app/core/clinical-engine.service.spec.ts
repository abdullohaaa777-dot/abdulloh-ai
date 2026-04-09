import { describe, expect, it } from 'vitest';
import { ClinicalEngineService } from './clinical-engine.service';

describe('ClinicalEngineService', () => {
  const service = new ClinicalEngineService();

  it('analyzes urine basic with transparent constraints', () => {
    const result = service.analyzeUrineBasic({ brightness: 40, blur: 1, reflection: 1.5, containerVisible: true, calibrationCard: false });
    expect(result.qualityScore).toBeGreaterThan(0);
    expect(result.explanation[0]).toContain('Makroskopik');
  });

  it('parses strip and returns confidence', () => {
    const result = service.analyzeUrineStrip(7, true);
    expect(result.protein).toBeTypeOf('string');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('calculates transplant twin result and next best test', () => {
    const result = service.calculateTwin({ creatinine: 1.4, egfr: 60, crp: 8, tacrolimus: 6, urineOutput: 850, systolicBp: 140 });
    expect(result.modelVersion).toContain('v1');
    expect(result.nextBestTest.length).toBeGreaterThan(2);
  });

  it('runs counterfactual scenarios', () => {
    const scenarios = service.simulate({ creatinine: 1.2, egfr: 70, tacrolimus: 5.5, adherence: 72 });
    expect(scenarios.length).toBeGreaterThanOrEqual(5);
  });
});
