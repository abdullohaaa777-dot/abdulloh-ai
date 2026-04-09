import { Injectable, signal } from '@angular/core';
import { CaseRecord } from '../models';

const KEY = 'abdulloh-ai-cases';

@Injectable({ providedIn: 'root' })
export class CaseStoreService {
  readonly cases = signal<CaseRecord[]>(this.restore());

  create(input: Pick<CaseRecord, 'chiefComplaint' | 'caseType' | 'notes' | 'symptoms' | 'patientId' | 'createdBy'>): CaseRecord {
    const now = new Date().toISOString();
    const record: CaseRecord = {
      id: crypto.randomUUID(),
      status: 'new',
      createdAt: now,
      updatedAt: now,
      ...input
    };
    const updated = [record, ...this.cases()];
    this.cases.set(updated);
    localStorage.setItem(KEY, JSON.stringify(updated));
    return record;
  }

  getById(id: string): CaseRecord | undefined { return this.cases().find((c) => c.id === id); }

  private restore(): CaseRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CaseRecord[]; } catch { return []; }
  }
}
