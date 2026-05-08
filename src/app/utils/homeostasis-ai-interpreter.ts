import { HomeostasisAIAnalysis, HomeostasisInputData, HomeostasisRiskLevel, HomeostasisScores } from '../models/homeostasis';

const allowedRiskLevels: HomeostasisRiskLevel[] = ['Past xavf', 'O‘rta xavf', 'Yuqori xavf', 'Kritik signal'];

export async function requestHomeostasisAIAnalysis(inputData: HomeostasisInputData, calculatedScores: HomeostasisScores): Promise<HomeostasisAIAnalysis | null> {
  try {
    const response = await fetch('/api/homeostasis-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputData, calculatedScores })
    });
    if (!response.ok) return null;
    const payload = await response.json() as { analysis?: Partial<HomeostasisAIAnalysis> };
    const analysis = payload.analysis;
    if (!analysis?.summary || !analysis.riskLevel || !allowedRiskLevels.includes(analysis.riskLevel)) return null;

    return {
      summary: analysis.summary,
      riskLevel: analysis.riskLevel,
      keyFindings: Array.isArray(analysis.keyFindings) ? analysis.keyFindings : [],
      possibleDirections: Array.isArray(analysis.possibleDirections) ? analysis.possibleDirections : [],
      organInteractions: Array.isArray(analysis.organInteractions) ? analysis.organInteractions : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      monitoringPlan: Array.isArray(analysis.monitoringPlan) ? analysis.monitoringPlan : [],
      urgentWarnings: Array.isArray(analysis.urgentWarnings) ? analysis.urgentWarnings : [],
      explanationForPatient: analysis.explanationForPatient || analysis.summary,
      explanationForDoctor: analysis.explanationForDoctor || analysis.summary
    };
  } catch (error) {
    console.warn('Homeostaz AI server tahlili ishlamadi, lokal fallback ishlatiladi.', error);
    return null;
  }
}
