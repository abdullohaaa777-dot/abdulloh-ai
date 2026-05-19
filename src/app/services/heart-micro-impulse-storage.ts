import { Injectable } from '@angular/core';

export interface HeartMicroImpulseFeatures {
  rhythmIrregularity: number;
  motionEnergyAsymmetry: number;
  acousticTurbulence: number;
  electromechanicalTimingProxy: number;
  cycleStabilityProxy: number;
  chestMicroMotionAmplitude: number;
  vibroacousticResonanceShift: number;
  perfusionInstabilityProxy: number;
  autonomicStressProxy: number;
  signalQuality: number;
  confidence: number;
  urgency: number;
  rezonansAsimmetriyaIndeksi: number;
  mexanikTarqalishKechikishi: number;
  prekordialDispersiyaSkori: number;
  mikrosinxronlikIndeksi: number;
  turbulentVibroakustikEhtimol: number;
}

export interface DiagnosisProb {
  name: string;
  percent: number;
}

export interface HeartMicroImpulseNarrative {
  qisqaXulosa: string;
  bolishiMumkinHolatlar: string[];
  otkirVaSurunkaliXavfBelgisi: string[];
  shoshilinchXavfBelgisi: string[];
  tavsiyaTekshiruvlar: string[];
  patogenez: string[];
  molekulyarMexanizm: string[];
  biofizikMexanizm: string[];
  biokimyoviyMexanizm: string[];
  klinikInterpretatsiya: string[];
  keyingiQadamlar: string[];
  soddaIzoh: string[];
  chuqurIlmiyIzoh: string[];
  otaChuqurMexanistikIzoh: string[];
  topografikXaritaIzohi: string[];
  individualYurakModelIzohi: string[];
}

export interface HeartMicroImpulseSession {
  id: string;
  createdAt: string;
  targetZone: 'chest' | 'neck' | 'face';
  waveform: number[];
  motionTrace: number[];
  features: HeartMicroImpulseFeatures;
  topDiagnoses: DiagnosisProb[];
  mainDiagnosis: DiagnosisProb;
  narrative: HeartMicroImpulseNarrative;
  scanMode?: 'standard' | 'topography' | 'cardio-provocation';
  topographyGrid?: number[];
  heartVisualProfile?: {
    pulseLevel: number;
    leftRightBias: number;
    kineticDelay: number;
  };
  cardioProvocation?: {
    phaseTimeline: { phase: 'baseline' | 'breathing' | 'hold' | 'recovery'; seconds: number; skipped?: boolean }[];
    baselineWaveform: number[];
    provocationWaveform: number[];
    recoveryWaveform: number[];
    baselineMotion: number[];
    provocationMotion: number[];
    recoveryMotion: number[];
    cardiacReserveScore: number;
    provokedMechanicalRecoveryTime: number;
    autonomicRecoverySlope: number;
    respiratoryCardiacCouplingFlexibility: number;
    loadAdaptationScore: number;
    hiddenDecompensationRisk: number;
    recoveryStabilityIndex: number;
    provocationResponseBalance: number;
  };
}

@Injectable({ providedIn: 'root' })
export class HeartMicroImpulseStorageService {
  private readonly key = 'heart-micro-impulse-sessions-v1';

  list(): HeartMicroImpulseSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (Array.isArray(parsed) ? parsed : []).map((x) => this.normalize(x));
    } catch (error) {
      console.error('Heart sessions parse error:', error);
      return [];
    }
  }

  save(session: HeartMicroImpulseSession) {
    if (typeof window === 'undefined') return;
    const list = this.list();
    list.unshift(this.normalize(session));
    localStorage.setItem(this.key, JSON.stringify(list.slice(0, 80)));
  }

  private normalize(input: unknown): HeartMicroImpulseSession {
    const x = (input ?? {}) as Partial<HeartMicroImpulseSession>;
    return {
      id: x.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `heart-${Date.now()}`),
      createdAt: x.createdAt || new Date().toISOString(),
      targetZone: x.targetZone || 'chest',
      waveform: Array.isArray(x.waveform) ? x.waveform : [],
      motionTrace: Array.isArray(x.motionTrace) ? x.motionTrace : [],
      features: {
        rhythmIrregularity: x.features?.rhythmIrregularity ?? 40,
        motionEnergyAsymmetry: x.features?.motionEnergyAsymmetry ?? 35,
        acousticTurbulence: x.features?.acousticTurbulence ?? 30,
        electromechanicalTimingProxy: x.features?.electromechanicalTimingProxy ?? 40,
        cycleStabilityProxy: x.features?.cycleStabilityProxy ?? 60,
        chestMicroMotionAmplitude: x.features?.chestMicroMotionAmplitude ?? 45,
        vibroacousticResonanceShift: x.features?.vibroacousticResonanceShift ?? 30,
        perfusionInstabilityProxy: x.features?.perfusionInstabilityProxy ?? 35,
        autonomicStressProxy: x.features?.autonomicStressProxy ?? 40,
        signalQuality: x.features?.signalQuality ?? 70,
        confidence: x.features?.confidence ?? 70,
        urgency: x.features?.urgency ?? 20,
        rezonansAsimmetriyaIndeksi: x.features?.rezonansAsimmetriyaIndeksi ?? 35,
        mexanikTarqalishKechikishi: x.features?.mexanikTarqalishKechikishi ?? 30,
        prekordialDispersiyaSkori: x.features?.prekordialDispersiyaSkori ?? 40,
        mikrosinxronlikIndeksi: x.features?.mikrosinxronlikIndeksi ?? 60,
        turbulentVibroakustikEhtimol: x.features?.turbulentVibroakustikEhtimol ?? 28
      },
      topDiagnoses: Array.isArray(x.topDiagnoses) ? x.topDiagnoses : [],
      mainDiagnosis: x.mainDiagnosis || { name: 'Aritmiya yo‘nalishi', percent: 34 },
      narrative: x.narrative || {
        qisqaXulosa: 'Yurak mikro impuls skriningi yakunlandi.',
        bolishiMumkinHolatlar: [],
        otkirVaSurunkaliXavfBelgisi: [],
        shoshilinchXavfBelgisi: [],
        tavsiyaTekshiruvlar: [],
        patogenez: [],
        molekulyarMexanizm: [],
        biofizikMexanizm: [],
        biokimyoviyMexanizm: [],
        klinikInterpretatsiya: [],
        keyingiQadamlar: [],
        soddaIzoh: [],
        chuqurIlmiyIzoh: [],
        otaChuqurMexanistikIzoh: [],
        topografikXaritaIzohi: [],
        individualYurakModelIzohi: []
      },
      scanMode: x.scanMode || 'standard',
      topographyGrid: Array.isArray(x.topographyGrid) ? x.topographyGrid : [],
      heartVisualProfile: x.heartVisualProfile || {
        pulseLevel: 50,
        leftRightBias: 0,
        kineticDelay: 30
      },
      cardioProvocation: x.cardioProvocation || {
        phaseTimeline: [],
        baselineWaveform: [],
        provocationWaveform: [],
        recoveryWaveform: [],
        baselineMotion: [],
        provocationMotion: [],
        recoveryMotion: [],
        cardiacReserveScore: 50,
        provokedMechanicalRecoveryTime: 20,
        autonomicRecoverySlope: 50,
        respiratoryCardiacCouplingFlexibility: 50,
        loadAdaptationScore: 50,
        hiddenDecompensationRisk: 30,
        recoveryStabilityIndex: 50,
        provocationResponseBalance: 50
      }
    };
  }
}
