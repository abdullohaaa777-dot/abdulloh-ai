import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HomeostasisInputData } from '../../models/homeostasis';
import { calculateBmi } from '../../utils/homeostasis-score-engine';

@Component({
  selector: 'app-homeostasis-input-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <form class="space-y-6" (ngSubmit)="analyzeRequested.emit()">
      <section class="rounded-3xl border border-medical-border bg-white p-5 md:p-6 shadow-xl">
        <div class="flex items-center justify-between gap-4 mb-5">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-medical-primary">Qo‘lda kiritish</p>
            <h3 class="text-xl font-black text-medical-text">Klinik va hayot tarzi parametrlari</h3>
          </div>
          <span class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-black">BMI: {{ bmi() ?? '—' }}</span>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          <label class="field"><span>Yosh</span><input type="number" [(ngModel)]="model.age" name="age" min="0"></label>
          <label class="field"><span>Jins</span><select [(ngModel)]="model.gender" name="gender"><option value="male">Erkak</option><option value="female">Ayol</option></select></label>
          <label class="field"><span>Bo‘y (sm)</span><input type="number" [(ngModel)]="model.heightCm" name="heightCm"></label>
          <label class="field"><span>Vazn (kg)</span><input type="number" [(ngModel)]="model.weightKg" name="weightKg"></label>
          <label class="field"><span>Sistolik bosim</span><input type="number" [(ngModel)]="model.systolicBp" name="systolicBp"></label>
          <label class="field"><span>Diastolik bosim</span><input type="number" [(ngModel)]="model.diastolicBp" name="diastolicBp"></label>
          <label class="field"><span>Puls</span><input type="number" [(ngModel)]="model.pulse" name="pulse"></label>
          <label class="field"><span>Tana harorati</span><input type="number" step="0.1" [(ngModel)]="model.temperature" name="temperature"></label>
          <label class="field"><span>Uyqu davomiyligi</span><input type="number" step="0.5" [(ngModel)]="model.sleepHours" name="sleepHours"></label>
        </div>
        <div class="grid md:grid-cols-4 gap-4 mt-5">
          <label class="range-field"><span>Stress darajasi</span><input type="range" min="0" max="100" [(ngModel)]="model.stressLevel" name="stressLevel"><b>{{ model.stressLevel }}%</b></label>
          <label class="range-field"><span>Ovqatlanish sifati</span><input type="range" min="0" max="100" [(ngModel)]="model.nutritionQuality" name="nutritionQuality"><b>{{ model.nutritionQuality }}%</b></label>
          <label class="range-field"><span>Jismoniy faollik</span><input type="range" min="0" max="100" [(ngModel)]="model.physicalActivity" name="physicalActivity"><b>{{ model.physicalActivity }}%</b></label>
          <label class="range-field"><span>Charchoq</span><input type="range" min="0" max="100" [(ngModel)]="model.fatigue" name="fatigue"><b>{{ model.fatigue }}%</b></label>
        </div>
        <div class="grid sm:grid-cols-3 gap-3 mt-5">
          @for (symptom of symptoms; track symptom.key) {
            <label class="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3 text-sm font-bold text-medical-text">
              <input type="checkbox" [(ngModel)]="model[symptom.key]" [name]="symptom.key" class="accent-indigo-600 w-4 h-4">
              {{ symptom.label }}
            </label>
          }
        </div>
      </section>

      <section class="rounded-3xl border border-medical-border bg-white p-5 md:p-6 shadow-xl">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-medical-primary mb-2">Laborator ma’lumotlar</p>
        <h3 class="text-xl font-black text-medical-text mb-5">Glyukoza-insulin, lipid, buyrak, jigar va elektrolitlar</h3>
        <div class="grid md:grid-cols-4 gap-4">
          @for (field of labFields; track field.key) {
            <label class="field"><span>{{ field.label }}</span><input type="number" step="0.01" [(ngModel)]="model[field.key]" [name]="field.key"></label>
          }
        </div>
      </section>

      <section class="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-5 md:p-6">
        <div class="flex gap-3 items-start">
          <mat-icon class="text-medical-primary">sensors</mat-icon>
          <div class="flex-1">
            <h3 class="font-black text-medical-text">Wearable/sensor/API integratsiyasi uchun tayyor arxitektura</h3>
            <p class="text-sm text-medical-text-muted mt-1">Smartwatch, smart ring, glucose sensor, HRV sensor va sleep tracker ma’lumotlari keyingi integratsiya uchun shu maydonda saqlanadi.</p>
            <textarea [(ngModel)]="model.wearableSummary" name="wearableSummary" class="mt-4 w-full rounded-2xl border border-indigo-100 bg-white/80 p-3 text-sm outline-none focus:border-medical-primary" rows="3"></textarea>
          </div>
        </div>
      </section>

      <button type="submit" class="btn-primary w-full py-4 text-base" aria-label="Homeostaz AI tahlilini boshlash">
        <mat-icon>auto_awesome</mat-icon>
        Abdulloh AI bilan tahlil qilish
      </button>
    </form>
  `,
  styles: [`
    .field, .range-field { display: grid; gap: .45rem; font-size: .72rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
    .field input, .field select { width: 100%; border-radius: .9rem; border: 1px solid #e2e8f0; background: #f8fafc; padding: .82rem .95rem; color: #1e293b; font-weight: 700; outline: none; }
    .field input:focus, .field select:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.1); background: white; }
    .range-field { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 1rem; padding: .9rem; }
    .range-field input { accent-color: #4f46e5; }
    .range-field b { color: #4f46e5; font-size: .8rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeostasisInputFormComponent {
  @Input({ required: true }) model!: HomeostasisInputData;
  @Output() analyzeRequested = new EventEmitter<void>();

  readonly symptoms: { key: 'thirst' | 'dizziness' | 'palpitations' | 'weakness' | 'sweating' | 'sleepDisturbance'; label: string }[] = [
    { key: 'thirst', label: 'Chanqash' },
    { key: 'dizziness', label: 'Bosh aylanishi' },
    { key: 'palpitations', label: 'Yurak urishi' },
    { key: 'weakness', label: 'Holsizlik' },
    { key: 'sweating', label: 'Terlash' },
    { key: 'sleepDisturbance', label: 'Uyqu buzilishi' }
  ];

  readonly labFields: { key: keyof HomeostasisInputData; label: string }[] = [
    { key: 'glucose', label: 'Glyukoza' }, { key: 'insulin', label: 'Insulin' }, { key: 'hba1c', label: 'HbA1c' }, { key: 'cortisol', label: 'Kortizol' },
    { key: 'totalCholesterol', label: 'Umumiy xolesterin' }, { key: 'ldl', label: 'LDL' }, { key: 'hdl', label: 'HDL' }, { key: 'triglyceride', label: 'Triglitserid' },
    { key: 'creatinine', label: 'Kreatinin' }, { key: 'egfr', label: 'eGFR' }, { key: 'alt', label: 'ALT' }, { key: 'ast', label: 'AST' },
    { key: 'bilirubin', label: 'Bilirubin' }, { key: 'sodium', label: 'Na⁺' }, { key: 'potassium', label: 'K⁺' }, { key: 'calcium', label: 'Ca²⁺' },
    { key: 'magnesium', label: 'Mg²⁺' }, { key: 'crp', label: 'CRP' }, { key: 'hemoglobin', label: 'Gemoglobin' }
  ];

  bmi() {
    return calculateBmi(this.model);
  }
}
