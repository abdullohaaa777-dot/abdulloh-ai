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
  };
}

@Injectable({ providedIn: 'root' })
export class NeuroMotorStorageService {
  private readonly localKey = 'neuromotor-sessions';
  private supabase = inject(SupabaseService);

  async listSessions(): Promise<NeuroMotorSession[]> {
    // Demo-first fallback to keep module usable without backend setup.
    const local = this.readLocal();
    return local.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async saveSession(session: NeuroMotorSession): Promise<{ error: null | { message: string } }> {
    try {
      const sessions = this.readLocal();
      sessions.unshift(session);
      localStorage.setItem(this.localKey, JSON.stringify(sessions.slice(0, 40)));

      // Optional future persistence hook.
      if (this.supabase.isConfigured()) {
        console.info('[Neuromotor] Supabase configured. Local-first persistence active; backend sync can be enabled later.');
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
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse neuromotor sessions:', error);
      return [];
    }
  }
}
