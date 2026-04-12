import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export type NeuroMotorTestType =
  | 'rest_tremor'
  | 'finger_tapping'
  | 'open_close'
  | 'pinch_precision'
  | 'finger_sequence'
  | 'target_touch'
  | 'hold_still';

export interface NeuroMotorInterpretation {
  qisqa_xulosa: string;
  topilgan_motor_belgilar: string[];
  nega_shunday_xulosa: string[];
  ehtimoliy_klinik_yonalishlar: string[];
  xavf_darajasi: 'past' | 'orta' | 'yuqori';
  holatni_yaxshilash_tavsiyalari: string[];
  reabilitatsion_mashqlar: string[];
  qachon_shifokorga_murojaat: string[];
  keyingi_kuzatuv_tavsiyasi: string;
}

export interface NeuroMotorTestResult {
  test: NeuroMotorTestType;
  startedAt: string;
  completedAt: string;
  hand: 'left' | 'right' | 'unknown';
  metrics: Record<string, number | string>;
  summary: {
    harakat_barqarorligi: number;
    harakat_tezligi: number;
    koordinatsiya: number;
    aniqlik: number;
    ritm_muntazamligi: number;
    charchashga_moyillik: number;
  };
  note: string;
  interpretation?: NeuroMotorInterpretation;
}

export interface NeuroMotorSession {
  id: string;
  createdAt: string;
  hand: 'left' | 'right' | 'unknown';
  tests: NeuroMotorTestResult[];
  overall: {
    speed: number;
    accuracy: number;
    stability: number;
    coordination: number;
    fatigue: number;
    rhythm?: number;
  };
  version?: number;
}

@Injectable({ providedIn: 'root' })
export class NeuroMotorStorageService {
  private readonly localKey = 'neuromotor-sessions';
  private supabase = inject(SupabaseService);

  async listSessions(): Promise<NeuroMotorSession[]> {
    const local = this.readLocal();
    return local.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async saveSession(session: NeuroMotorSession): Promise<{ error: null | { message: string } }> {
    try {
      const sessions = this.readLocal();
      const normalized: NeuroMotorSession = {
        ...session,
        version: 2,
        overall: {
          ...session.overall,
          rhythm: session.overall.rhythm ?? this.estimateRhythm(session.tests)
        }
      };

      sessions.unshift(normalized);
      localStorage.setItem(this.localKey, JSON.stringify(sessions.slice(0, 50)));

      if (this.supabase.isConfigured()) {
        // Future backend sync point. Local-first remains source of truth in demo mode.
      }

      return { error: null };
    } catch (error) {
      console.error('Failed to save neuromotor session:', error);
      return { error: { message: 'Natijani saqlashda xatolik yuz berdi.' } };
    }
  }

  private readLocal(): NeuroMotorSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.localKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];
      return arr.map((item) => this.normalizeLegacySession(item));
    } catch (error) {
      console.error('Failed to parse neuromotor sessions:', error);
      return [];
    }
  }

  private normalizeLegacySession(input: unknown): NeuroMotorSession {
    const session = (input ?? {}) as Partial<NeuroMotorSession>;
    const tests = Array.isArray(session.tests) ? session.tests : [];

    return {
      id: session.id || crypto.randomUUID(),
      createdAt: session.createdAt || new Date().toISOString(),
      hand: session.hand || 'unknown',
      tests: tests.map((t) => {
        const existing = t as Partial<NeuroMotorTestResult>;
        return {
          ...(existing as NeuroMotorTestResult),
          note: existing.note || 'Natija skrining/monitoring uchun. Mustaqil tashxis emas.',
          hand: existing.hand || 'unknown',
          metrics: existing.metrics || {},
          startedAt: existing.startedAt || session.createdAt || new Date().toISOString(),
          completedAt: existing.completedAt || session.createdAt || new Date().toISOString(),
          summary: {
            harakat_barqarorligi: existing.summary?.harakat_barqarorligi ?? 50,
            harakat_tezligi: existing.summary?.harakat_tezligi ?? 50,
            koordinatsiya: existing.summary?.koordinatsiya ?? 50,
            aniqlik: existing.summary?.aniqlik ?? 50,
            ritm_muntazamligi: existing.summary?.ritm_muntazamligi ?? 50,
            charchashga_moyillik: existing.summary?.charchashga_moyillik ?? 50
          }
        } as NeuroMotorTestResult;
      }),
      overall: {
        speed: session.overall?.speed ?? 0,
        accuracy: session.overall?.accuracy ?? 0,
        stability: session.overall?.stability ?? 0,
        coordination: session.overall?.coordination ?? 0,
        fatigue: session.overall?.fatigue ?? 0,
        rhythm: session.overall?.rhythm ?? this.estimateRhythm(tests as NeuroMotorTestResult[])
      },
      version: session.version ?? 1
    };
  }

  private estimateRhythm(tests: NeuroMotorTestResult[]): number {
    if (!tests.length) return 0;
    return Math.round(tests.reduce((sum, t) => sum + (t.summary?.ritm_muntazamligi || 0), 0) / tests.length);
  }
}
