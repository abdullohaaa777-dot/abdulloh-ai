import { Injectable } from '@angular/core';
import { RehabilitationAiAnalysis, RehabilitationSession } from './rehabilitation-storage';

const REHABILITATION_SAFETY_NOTE = 'Bu tahlil reabilitatsiya jarayonini kuzatishga yordam beruvchi yordamchi AI xulosadir. Og‘riq, bosh aylanishi, nafas qisishi, yurak urishining kuchayishi yoki holsizlik bo‘lsa, mashqni to‘xtating va shifokorga murojaat qiling.';

@Injectable({ providedIn: 'root' })
export class RehabilitationAiService {
  async analyzeSession(session: RehabilitationSession, previousSession?: RehabilitationSession | null): Promise<RehabilitationAiAnalysis> {
    const fallback = this.buildFallbackAnalysis(session, 'pending');
    if (typeof fetch === 'undefined') return this.buildFallbackAnalysis(session, 'failed');

    try {
      const response = await fetch('/api/rehabilitation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, previousSession: previousSession ?? null })
      });
      if (!response.ok) return this.buildFallbackAnalysis(session, 'failed');
      const payload = await response.json();
      const analysisPayload = payload?.analysis ?? payload;
      return this.normalizeAnalysis(session, analysisPayload, 'completed');
    } catch (error) {
      console.warn('Abdulloh AI rehabilitation analysis unavailable:', error);
      return { ...fallback, analysisStatus: 'failed', updatedAt: new Date().toISOString() };
    }
  }

  buildFallbackAnalysis(session: RehabilitationSession, status: 'pending' | 'completed' | 'failed' = 'failed'): RehabilitationAiAnalysis {
    const mainExercise = session.exercises[0];
    const riskWarnings = session.fatigueIndex > 65 || session.totalScore < 55
      ? ['Charchash yoki past sifat belgisi bor: mashq intensivligini shifokor bilan qayta ko‘rib chiqing.']
      : ['Xavfli belgi aniqlanmadi, lekin og‘riq yoki bosh aylanishi bo‘lsa mashq to‘xtatiladi.'];
    return {
      id: `rehab-ai-${session.id}`,
      sessionId: session.id,
      patientId: session.patientId,
      doctorId: session.doctorId,
      aiProvider: 'abdulloh-ai-server',
      analysisStatus: status,
      overallSummary: status === 'failed' ? 'AI tahlil vaqtincha mavjud emas, asosiy natijalar saqlandi.' : `Umumiy reabilitatsiya balli ${session.totalScore}%.`,
      movementQualityAnalysis: `Harakat sifati ${session.movementQualityScore}%: silliqlik, amplituda va trayektoriya nazorati asosida baholandi.`,
      jointProblemAnalysis: mainExercise ? `${mainExercise.targetBodyPart} bo‘yicha burchak va amplituda kuzatuvi davom ettiriladi.` : 'Bo‘g‘imlar bo‘yicha yetarli mashq natijasi mavjud emas.',
      symmetryAnalysis: `Chap-o‘ng simmetriya indeksi ${session.symmetryIndex}%.`,
      fatigueAnalysis: `Nevromotor charchash indeksi ${session.fatigueIndex}%.`,
      progressComparison: `Progress ko‘rsatkichi ${session.rehabilitationProgress}%. Oldingi sessiyalar bilan solishtirish uchun tarix saqlanadi.`,
      riskWarnings,
      patientAdvice: session.patientAdvice,
      doctorClinicalNote: session.doctorNote,
      nextExerciseRecommendation: session.totalScore > 75 ? 'Keyingi sessiyada shu mashqni nazoratli amplitudada davom ettiring.' : 'Keyingi sessiyada kamroq takror, sekinroq ritm va ko‘proq dam olish tavsiya etiladi.',
      safetyNote: REHABILITATION_SAFETY_NOTE,
      rawAiResponse: { fallback: true, status },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private normalizeAnalysis(session: RehabilitationSession, payload: Partial<Record<string, unknown>>, status: 'completed' | 'failed'): RehabilitationAiAnalysis {
    const fallback = this.buildFallbackAnalysis(session, status);
    const stringValue = (key: string, fallbackValue: string) => typeof payload?.[key] === 'string' && String(payload[key]).trim() ? String(payload[key]) : fallbackValue;
    const warnings = Array.isArray(payload?.['risk_warnings']) ? payload['risk_warnings'].map(String) : fallback.riskWarnings;
    return {
      ...fallback,
      analysisStatus: status,
      overallSummary: stringValue('overall_summary', fallback.overallSummary),
      movementQualityAnalysis: stringValue('movement_quality_analysis', fallback.movementQualityAnalysis),
      jointProblemAnalysis: stringValue('joint_problem_analysis', fallback.jointProblemAnalysis),
      symmetryAnalysis: stringValue('symmetry_analysis', fallback.symmetryAnalysis),
      fatigueAnalysis: stringValue('fatigue_analysis', fallback.fatigueAnalysis),
      progressComparison: stringValue('progress_comparison', fallback.progressComparison),
      riskWarnings: warnings,
      patientAdvice: stringValue('patient_advice', fallback.patientAdvice),
      doctorClinicalNote: stringValue('doctor_clinical_note', fallback.doctorClinicalNote),
      nextExerciseRecommendation: stringValue('next_exercise_recommendation', fallback.nextExerciseRecommendation),
      safetyNote: stringValue('safety_note', REHABILITATION_SAFETY_NOTE),
      rawAiResponse: payload,
      updatedAt: new Date().toISOString()
    };
  }
}
