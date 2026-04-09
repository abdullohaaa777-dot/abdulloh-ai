import { Injectable, signal } from '@angular/core';
import { CaseRecord } from '../models/clinical.models';

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly cases = signal<CaseRecord[]>(this.read<CaseRecord[]>('abdulloh-cases', []));

  createCase(input: Omit<CaseRecord, 'id' | 'createdAt'>) {
    const next: CaseRecord = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [next, ...this.cases()];
    this.cases.set(updated);
    this.write('abdulloh-cases', updated);
    return next;
  }

  getCase(id: string) {
    return this.cases().find(c => c.id === id) ?? null;
  }

  private read<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  }

  private write<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }
}
