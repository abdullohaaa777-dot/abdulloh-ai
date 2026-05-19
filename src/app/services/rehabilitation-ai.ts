import { Injectable } from '@angular/core';
import { RehabilitationAiAnalysis, RehabilitationSession } from './rehabilitation-storage';

const REHABILITATION_SAFETY_NOTE = 'Bu tahlil reabilitatsiya jarayonini kuzatishga yordam beruvchi yordamchi AI xulosadir. Og‘riq, bosh aylanishi, nafas qisishi, yurak urishining kuchayishi, uvishish yoki kuchli holsizlik bo‘lsa, mashqni to‘xtating va shifokorga murojaat qiling.';

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
      overallRehabStatus: `Smart Rehab holati: umumiy ball ${session.totalScore}%, xavfsiz rivojlanish ${session.smartRehab?.safeProgression.score ?? session.rehabilitationProgress}%.`,
      digitalTwinSummary: session.smartRehab ? `${session.smartRehab.digitalTwin.recoveryStage}: ${session.smartRehab.digitalTwin.movementSignature}` : 'Raqamli egizak sessiya natijalari bilan yaratiladi.',
      movementQualityAnalysis: `Harakat sifati ${session.movementQualityScore}%: silliqlik, amplituda va trayektoriya nazorati asosida baholandi.`,
      jointProblemAnalysis: mainExercise ? `${mainExercise.targetBodyPart} bo‘yicha burchak va amplituda kuzatuvi davom ettiriladi.` : 'Bo‘g‘imlar bo‘yicha yetarli mashq natijasi mavjud emas.',
      compensationAnalysis: session.smartRehab?.compensation.clinicalNote ?? `Chap-o‘ng simmetriya indeksi ${session.symmetryIndex}%.`,
      safeProgressionAnalysis: session.smartRehab?.safeProgression.recommendation ?? `Progress ko‘rsatkichi ${session.rehabilitationProgress}%.`,
      painFatigueAnalysis: session.smartRehab ? `Og‘riq ${session.smartRehab.safeProgression.painScore}/10, charchoq ${session.smartRehab.safeProgression.fatigueScore}/10.` : `Nevromotor charchash indeksi ${session.fatigueIndex}%.`,
      recoveryTrajectoryAnalysis: session.smartRehab?.recoveryTrajectories[0]?.progressSummary ?? `Progress ko‘rsatkichi ${session.rehabilitationProgress}%.`,
      adaptiveProtocolRecommendation: session.smartRehab?.adaptiveProtocol.patientMessage ?? 'Adaptive protokol uchun sessiya tarixi yig‘ilmoqda.',
      neurogamePerformanceSummary: session.smartRehab ? `${session.smartRehab.neuroGame.gameName}: ${session.smartRehab.neuroGame.score}% score, aniqlik ${session.smartRehab.neuroGame.accuracy}%.` : 'NeuroGame natijasi hali mavjud emas.',
      symmetryAnalysis: `Chap-o‘ng simmetriya indeksi ${session.symmetryIndex}%.`,
      fatigueAnalysis: `Nevromotor charchash indeksi ${session.fatigueIndex}%.`,
      progressComparison: `Progress ko‘rsatkichi ${session.rehabilitationProgress}%. Oldingi sessiyalar bilan solishtirish uchun tarix saqlanadi.`,
      riskWarnings,
      patientAdvice: session.patientAdvice,
      patientSimpleAdvice: session.smartRehab?.adaptiveProtocol.patientMessage ?? session.patientAdvice,
      doctorClinicalNote: session.doctorNote,
      nextExerciseRecommendation: session.totalScore > 75 ? 'Keyingi sessiyada shu mashqni nazoratli amplitudada davom ettiring.' : 'Keyingi sessiyada kamroq takror, sekinroq ritm va ko‘proq dam olish tavsiya etiladi.',
      nextSessionPlan: session.smartRehab?.adaptiveProtocol.exerciseAdjustments.join(', ') ?? 'Keyingi sessiya individual holatga qarab moslashtiriladi.',
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
      overallSummary: stringValue('overall_summary', stringValue('overall_rehab_status', fallback.overallSummary)),
      overallRehabStatus: stringValue('overall_rehab_status', fallback.overallRehabStatus ?? fallback.overallSummary),
      digitalTwinSummary: stringValue('digital_twin_summary', fallback.digitalTwinSummary ?? fallback.overallSummary),
      movementQualityAnalysis: stringValue('movement_quality_analysis', fallback.movementQualityAnalysis),
      jointProblemAnalysis: stringValue('joint_problem_analysis', fallback.jointProblemAnalysis),
      compensationAnalysis: stringValue('compensation_analysis', fallback.compensationAnalysis ?? fallback.symmetryAnalysis),
      safeProgressionAnalysis: stringValue('safe_progression_analysis', fallback.safeProgressionAnalysis ?? fallback.progressComparison),
      painFatigueAnalysis: stringValue('pain_fatigue_analysis', fallback.painFatigueAnalysis ?? fallback.fatigueAnalysis),
      recoveryTrajectoryAnalysis: stringValue('recovery_trajectory_analysis', fallback.recoveryTrajectoryAnalysis ?? fallback.progressComparison),
      adaptiveProtocolRecommendation: stringValue('adaptive_protocol_recommendation', fallback.adaptiveProtocolRecommendation ?? fallback.nextExerciseRecommendation),
      neurogamePerformanceSummary: stringValue('neurogame_performance_summary', fallback.neurogamePerformanceSummary ?? 'NeuroGame natijasi mavjud emas.'),
      symmetryAnalysis: stringValue('symmetry_analysis', fallback.symmetryAnalysis),
      fatigueAnalysis: stringValue('fatigue_analysis', fallback.fatigueAnalysis),
      progressComparison: stringValue('progress_comparison', fallback.progressComparison),
      riskWarnings: warnings,
      patientAdvice: stringValue('patient_advice', stringValue('patient_simple_advice', fallback.patientAdvice)),
      patientSimpleAdvice: stringValue('patient_simple_advice', fallback.patientSimpleAdvice ?? fallback.patientAdvice),
      doctorClinicalNote: stringValue('doctor_clinical_note', fallback.doctorClinicalNote),
      nextExerciseRecommendation: stringValue('next_exercise_recommendation', stringValue('next_session_plan', fallback.nextExerciseRecommendation)),
      nextSessionPlan: stringValue('next_session_plan', fallback.nextSessionPlan ?? fallback.nextExerciseRecommendation),
      safetyNote: stringValue('safety_note', REHABILITATION_SAFETY_NOTE),
      rawAiResponse: payload,
      updatedAt: new Date().toISOString()
    };
  }
}
