import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { CaseData } from '../../services/ai';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Yangi holat yaratish</h2>
        <p class="text-medical-text-muted font-medium">Bemor ma'lumotlarini tizimga kiriting</p>
      </div>

      <form [formGroup]="caseForm" (ngSubmit)="onSubmit()" class="space-y-12 bg-white p-10 rounded-3xl shadow-xl border border-medical-border">
        
        <!-- Section 1: Basic Info -->
        <section>
          <div class="border-b border-slate-100 pb-4 mb-8">
            <h3 class="text-xl font-bold text-medical-text flex items-center gap-2">
              <mat-icon class="text-medical-primary">person</mat-icon>
              Asosiy ma'lumotlar
            </h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-3">
              <label for="full_name" class="block text-sm font-bold text-medical-text mb-2">Ism familiyasi <span class="text-red-500">*</span></label>
              <input id="full_name" type="text" formControlName="full_name" class="w-full input-field" placeholder="Masalan: Abdulloh Alisherov">
            </div>
            <div class="md:col-span-2">
              <label for="location" class="block text-sm font-bold text-medical-text mb-2">Yashash joyi (Manzil) <span class="text-red-500">*</span></label>
              <input id="location" type="text" formControlName="location" class="w-full input-field" placeholder="Viloyat, tuman, mahalla...">
            </div>
            <div>
              <label for="age" class="block text-sm font-bold text-medical-text mb-2">Yosh <span class="text-red-500">*</span></label>
              <input id="age" type="number" formControlName="age" class="w-full input-field">
            </div>
            <div>
              <label for="gender" class="block text-sm font-bold text-medical-text mb-2">Jins <span class="text-red-500">*</span></label>
              <select id="gender" formControlName="gender" class="w-full input-field">
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label for="living_conditions" class="block text-sm font-bold text-medical-text mb-2">Yashash sharoiti <span class="text-red-500">*</span></label>
              <input id="living_conditions" type="text" formControlName="living_conditions" class="w-full input-field" placeholder="Masalan: Shahar markazi, ko'p qavatli uy, hovli...">
            </div>
            <div>
              <label for="air_quality" class="block text-sm font-bold text-medical-text mb-2">Havosi tozaligi <span class="text-red-500">*</span></label>
              <select id="air_quality" formControlName="air_quality" class="w-full input-field">
                <option value="toza">Toza</option>
                <option value="ortacha">O'rtacha</option>
                <option value="ifloslangan">Ifloslangan</option>
              </select>
            </div>
            <div>
              <label for="ecological_cleanliness" class="block text-sm font-bold text-medical-text mb-2">Ekologiyasi tozaligi <span class="text-red-500">*</span></label>
              <select id="ecological_cleanliness" formControlName="ecological_cleanliness" class="w-full input-field">
                <option value="yaxshi">Yaxshi</option>
                <option value="qoniqarli">Qoniqarli</option>
                <option value="yomon">Yomon</option>
              </select>
            </div>
            <div>
              <label for="bp" class="block text-sm font-bold text-medical-text mb-2">SBP (Sistolik) <span class="text-red-500">*</span></label>
              <input id="bp" type="number" formControlName="bp" class="w-full input-field">
            </div>
            <div>
              <label for="dbp" class="block text-sm font-bold text-medical-text mb-2">DBP (Diastolik)</label>
              <input id="dbp" type="number" formControlName="dbp" class="w-full input-field">
            </div>
            <div>
              <label for="height" class="block text-sm font-bold text-medical-text mb-2">Bo'y (cm)</label>
              <input id="height" type="number" formControlName="height" class="w-full input-field">
            </div>
            <div>
              <label for="weight" class="block text-sm font-bold text-medical-text mb-2">Vazn (kg)</label>
              <input id="weight" type="number" formControlName="weight" class="w-full input-field">
            </div>
            <div>
              <label for="cholesterol" class="block text-sm font-bold text-medical-text mb-2">Xolesterin (mg/dL) <span class="text-red-500">*</span></label>
              <input id="cholesterol" type="number" formControlName="cholesterol" class="w-full input-field">
            </div>
          </div>
        </section>

        <!-- Section 2: Symptoms & History -->
        <section>
          <div class="border-b border-slate-100 pb-4 mb-8">
            <h3 class="text-xl font-bold text-medical-text flex items-center gap-2">
              <mat-icon class="text-medical-primary">description</mat-icon>
              Simptomlar va Kasallik tarixi
            </h3>
          </div>
          <div class="space-y-6">
            <div class="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
              <label for="symptoms" class="block text-sm font-bold text-medical-text mb-2 flex items-center gap-2">
                Simptomlar va shikoyatlar <span class="text-red-500 font-black">*</span>
                <span class="text-[10px] text-indigo-500 uppercase tracking-widest font-black">(Majburiy)</span>
              </label>
              <textarea id="symptoms" formControlName="symptoms" rows="4" 
                        class="w-full input-field bg-white" 
                        placeholder="Bemor shikoyatlarini batafsil yozing (masalan: yo'tal, hansirash, ko'krak qafasidagi og'riq)..."></textarea>
              @if (caseForm.get('symptoms')?.invalid && caseForm.get('symptoms')?.touched) {
                <p class="text-xs text-red-500 mt-2 font-bold flex items-center gap-1">
                  <mat-icon class="text-xs h-4 w-4">error</mat-icon>
                  Iltimos, bemor shikoyatlarini kiriting
                </p>
              }
            </div>
            <div>
              <label for="history" class="block text-sm font-bold text-medical-text mb-2">Anamnez (Kasallik tarixi)</label>
              <textarea id="history" formControlName="history" rows="2" 
                        class="w-full input-field" 
                        placeholder="Surunkali kasalliklar, oldingi davolanishlar, oilaviy anamnez..."></textarea>
            </div>
          </div>
        </section>

        <!-- Section 3: Laboratory Results -->
        <section>
          <div class="border-b border-slate-100 pb-4 mb-8">
            <h3 class="text-xl font-bold text-medical-text flex items-center gap-2">
              <mat-icon class="text-medical-primary">biotech</mat-icon>
              Laboratoriya tahlillari
            </h3>
          </div>
          
          <div class="space-y-10">
            <!-- Sub-section: Blood & Metabolic -->
            <div>
              <h4 class="text-xs font-black text-medical-text-muted uppercase tracking-widest mb-4">Qon va Metabolizm</h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label for="hemoglobin" class="block text-xs font-bold text-medical-text mb-1">Gemoglobin (g/dL)</label>
                  <input id="hemoglobin" type="number" formControlName="hemoglobin" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="wbc" class="block text-xs font-bold text-medical-text mb-1">WBC (x10⁹/L)</label>
                  <input id="wbc" type="number" formControlName="wbc" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="platelets" class="block text-xs font-bold text-medical-text mb-1">Trombotsitlar</label>
                  <input id="platelets" type="number" formControlName="platelets" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="glucose" class="block text-xs font-bold text-medical-text mb-1">Glyukoza (mmol/L)</label>
                  <input id="glucose" type="number" formControlName="glucose" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="creatinine" class="block text-xs font-bold text-medical-text mb-1">Kreatinin</label>
                  <div class="flex gap-1">
                    <input id="creatinine" type="number" formControlName="creatinine" class="flex-1 input-field py-2 text-sm">
                    <select formControlName="creatinine_unit" class="w-20 input-field py-2 text-[10px]">
                      <option value="umol/L">µmol/L</option>
                      <option value="mg/dL">mg/dL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label for="bun" class="block text-xs font-bold text-medical-text mb-1">BUN (mg/dL)</label>
                  <input id="bun" type="number" formControlName="bun" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="sodium" class="block text-xs font-bold text-medical-text mb-1">Natriy (Na, mEq/L)</label>
                  <input id="sodium" type="number" formControlName="sodium" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="potassium" class="block text-xs font-bold text-medical-text mb-1">Kaliy (K, mEq/L)</label>
                  <input id="potassium" type="number" formControlName="potassium" class="w-full input-field py-2 text-sm">
                </div>
              </div>
            </div>

            <!-- Sub-section: Anemia Panel -->
            <div class="bg-red-50/30 p-6 rounded-3xl border border-red-100/50">
              <h4 class="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <mat-icon class="text-sm h-4 w-4">opacity</mat-icon>
                Anemiya paneli
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label for="mcv" class="block text-xs font-bold text-medical-text mb-1">MCV (fL)</label>
                  <input id="mcv" type="number" formControlName="mcv" class="w-full input-field py-2 text-sm bg-white" placeholder="80-100">
                </div>
                <div>
                  <label for="mch" class="block text-xs font-bold text-medical-text mb-1">MCH (pg)</label>
                  <input id="mch" type="number" formControlName="mch" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="ferritin" class="block text-xs font-bold text-medical-text mb-1">Ferritin (ng/mL)</label>
                  <input id="ferritin" type="number" formControlName="ferritin" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="iron" class="block text-xs font-bold text-medical-text mb-1">Zardob temiri</label>
                  <input id="iron" type="number" formControlName="iron" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="vitamin_b12" class="block text-xs font-bold text-medical-text mb-1">Vitamin B12</label>
                  <input id="vitamin_b12" type="number" formControlName="vitamin_b12" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="folate" class="block text-xs font-bold text-medical-text mb-1">Foliy kislotasi</label>
                  <input id="folate" type="number" formControlName="folate" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="reticulocytes" class="block text-xs font-bold text-medical-text mb-1">Retikulotsitlar (%)</label>
                  <input id="reticulocytes" type="number" step="0.1" formControlName="reticulocytes" class="w-full input-field py-2 text-sm bg-white">
                </div>
                <div>
                  <label for="ldh" class="block text-xs font-bold text-medical-text mb-1">LDH (U/L)</label>
                  <input id="ldh" type="number" formControlName="ldh" class="w-full input-field py-2 text-sm bg-white">
                </div>
              </div>
            </div>

            <!-- Sub-section: Lipids & Liver -->
            <div>
              <h4 class="text-xs font-black text-medical-text-muted uppercase tracking-widest mb-4">Lipidlar va Jigar</h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label for="ldl" class="block text-xs font-bold text-medical-text mb-1">LDL (mg/dL)</label>
                  <input id="ldl" type="number" formControlName="ldl" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="hdl" class="block text-xs font-bold text-medical-text mb-1">HDL (mg/dL)</label>
                  <input id="hdl" type="number" formControlName="hdl" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="triglycerides" class="block text-xs font-bold text-medical-text mb-1">Triglitseridlar</label>
                  <input id="triglycerides" type="number" formControlName="triglycerides" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="alt" class="block text-xs font-bold text-medical-text mb-1">ALT (U/L)</label>
                  <input id="alt" type="number" formControlName="alt" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="ast" class="block text-xs font-bold text-medical-text mb-1">AST (U/L)</label>
                  <input id="ast" type="number" formControlName="ast" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="bilirubin" class="block text-xs font-bold text-medical-text mb-1">Bilirubin (mg/dL)</label>
                  <input id="bilirubin" type="number" formControlName="bilirubin" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="albumin" class="block text-xs font-bold text-medical-text mb-1">Albumin (g/dL)</label>
                  <input id="albumin" type="number" formControlName="albumin" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="inr" class="block text-xs font-bold text-medical-text mb-1">INR</label>
                  <input id="inr" type="number" step="0.1" formControlName="inr" class="w-full input-field py-2 text-sm">
                </div>
              </div>
            </div>

            <!-- Sub-section: Other Labs -->
            <div>
              <h4 class="text-xs font-black text-medical-text-muted uppercase tracking-widest mb-4">Boshqa tahlillar</h4>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <label for="crp" class="block text-xs font-bold text-medical-text mb-1">CRP (mg/L)</label>
                  <input id="crp" type="number" formControlName="crp" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="troponin" class="block text-xs font-bold text-medical-text mb-1">Troponin (ng/mL)</label>
                  <input id="troponin" type="number" step="0.01" formControlName="troponin" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="calcium" class="block text-xs font-bold text-medical-text mb-1">Kalsiy (mg/dL)</label>
                  <input id="calcium" type="number" formControlName="calcium" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="measured_osmolality" class="block text-xs font-bold text-medical-text mb-1">Osmolyallik</label>
                  <input id="measured_osmolality" type="number" formControlName="measured_osmolality" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="urine_na" class="block text-xs font-bold text-medical-text mb-1">Siydik Na (mEq/L)</label>
                  <input id="urine_na" type="number" formControlName="urine_na" class="w-full input-field py-2 text-sm">
                </div>
                <div>
                  <label for="urine_creatinine" class="block text-xs font-bold text-medical-text mb-1">Siydik Kreatinin</label>
                  <input id="urine_creatinine" type="number" formControlName="urine_creatinine" class="w-full input-field py-2 text-sm">
                </div>
              </div>

              <div class="bg-indigo-900/5 p-6 rounded-3xl border border-indigo-100">
                <label for="lab_text" class="block text-sm font-bold text-medical-text mb-2 flex items-center gap-2">
                  <mat-icon class="text-indigo-600">subject</mat-icon>
                  Tahlil natijalarini matn ko'rinishida kiriting
                </label>
                <textarea id="lab_text" formControlName="lab_text" rows="4" 
                          class="w-full input-field bg-white" 
                          placeholder="Laboratoriya tahlillarini bu yerga nusxalab qo'yishingiz mumkin (AI ularni tahlil qiladi)..."></textarea>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Clinical Signs & History Flags -->
        <section>
          <div class="border-b border-slate-100 pb-4 mb-8">
            <h3 class="text-xl font-bold text-medical-text flex items-center gap-2">
              <mat-icon class="text-medical-primary">medical_services</mat-icon>
              Klinik belgilar va Surunkali kasalliklar
            </h3>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Clinical Signs -->
            <div class="space-y-6">
              <h4 class="text-xs font-black text-medical-text-muted uppercase tracking-widest">Klinik belgilar</h4>
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label for="ascites" class="block text-sm font-bold text-medical-text mb-2">Assit</label>
                  <select id="ascites" formControlName="ascites" class="w-full input-field">
                    <option value="none">Yo'q</option>
                    <option value="mild">Yengil</option>
                    <option value="moderate-severe">O'rta/Og'ir</option>
                  </select>
                </div>
                <div>
                  <label for="encephalopathy" class="block text-sm font-bold text-medical-text mb-2">Ensefalopatiya</label>
                  <select id="encephalopathy" formControlName="encephalopathy" class="w-full input-field">
                    <option value="none">Yo'q</option>
                    <option value="grade 1-2">1-2 daraja</option>
                    <option value="grade 3-4">3-4 daraja</option>
                  </select>
                </div>
                <div>
                  <label for="rr" class="block text-sm font-bold text-medical-text mb-2">Nafas chastotasi (RR)</label>
                  <input id="rr" type="number" formControlName="rr" class="w-full input-field">
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({gcs_less_15: !caseForm.get('gcs_less_15')?.value})"
                     (keyup.space)="caseForm.patchValue({gcs_less_15: !caseForm.get('gcs_less_15')?.value})"
                     (keyup.enter)="caseForm.patchValue({gcs_less_15: !caseForm.get('gcs_less_15')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="gcs_less_15" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">GCS < 15 (Ong darajasi pasaygan)</span>
                </div>
              </div>
            </div>

            <!-- History Flags -->
            <div class="space-y-6">
              <h4 class="text-xs font-black text-medical-text-muted uppercase tracking-widest">Surunkali kasalliklar</h4>
              <div class="grid grid-cols-1 gap-3">
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({chf: !caseForm.get('chf')?.value})"
                     (keyup.space)="caseForm.patchValue({chf: !caseForm.get('chf')?.value})"
                     (keyup.enter)="caseForm.patchValue({chf: !caseForm.get('chf')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="chf" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">Yurak yetishmovchiligi (CHF)</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({hypertension: !caseForm.get('hypertension')?.value})"
                     (keyup.space)="caseForm.patchValue({hypertension: !caseForm.get('hypertension')?.value})"
                     (keyup.enter)="caseForm.patchValue({hypertension: !caseForm.get('hypertension')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="hypertension" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">Gipertoniya</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({stroke_history: !caseForm.get('stroke_history')?.value})"
                     (keyup.space)="caseForm.patchValue({stroke_history: !caseForm.get('stroke_history')?.value})"
                     (keyup.enter)="caseForm.patchValue({stroke_history: !caseForm.get('stroke_history')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="stroke_history" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">Insult / TIA tarixi</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({vascular_disease: !caseForm.get('vascular_disease')?.value})"
                     (keyup.space)="caseForm.patchValue({vascular_disease: !caseForm.get('vascular_disease')?.value})"
                     (keyup.enter)="caseForm.patchValue({vascular_disease: !caseForm.get('vascular_disease')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="vascular_disease" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">Vaskulyar kasallik (MI/PAD)</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer" 
                     (click)="caseForm.patchValue({diabetes_history: !caseForm.get('diabetes_history')?.value})"
                     (keyup.space)="caseForm.patchValue({diabetes_history: !caseForm.get('diabetes_history')?.value})"
                     (keyup.enter)="caseForm.patchValue({diabetes_history: !caseForm.get('diabetes_history')?.value})"
                     tabindex="0" role="button">
                  <input type="checkbox" formControlName="diabetes_history" class="w-5 h-5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary">
                  <span class="text-sm font-bold text-medical-text">Qandli diabet tarixi</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-medical-border cursor-pointer group hover:bg-indigo-50 transition-colors" 
                     (click)="toggleSmoking()"
                     (keyup.space)="toggleSmoking()"
                     (keyup.enter)="toggleSmoking()"
                     tabindex="0" role="button">
                  <div class="w-6 h-6 rounded-md border-2 border-slate-300 flex items-center justify-center transition-colors"
                       [class.bg-medical-primary]="caseForm.get('smoking')?.value"
                       [class.border-medical-primary]="caseForm.get('smoking')?.value">
                    @if (caseForm.get('smoking')?.value) {
                      <mat-icon class="text-white text-sm h-4 w-4">check</mat-icon>
                    }
                  </div>
                  <span class="text-sm font-bold text-medical-text">Chekish (Smoking)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="pt-10 flex gap-6">
          <button type="button" (click)="goBack()" class="flex-1 btn-secondary py-4 text-lg">
            Bekor qilish
          </button>
          <button type="submit" [disabled]="loading()" class="flex-[2] btn-primary py-4 text-xl shadow-2xl shadow-medical-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
            @if (!loading()) {
              <mat-icon class="text-2xl">analytics</mat-icon>
              <span>Saqlash va tahlil qilish</span>
            }
            @if (loading()) {
              <mat-icon class="animate-spin text-2xl">sync</mat-icon>
              <span>Saqlanmoqda...</span>
            }
          </button>
        </div>
        @if (caseForm.invalid && caseForm.touched) {
          <p class="text-sm text-red-500 font-bold text-center mt-4 bg-red-50 p-3 rounded-xl border border-red-100">Iltimos, barcha majburiy maydonlarni to'ldiring (*)</p>
        }
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseFormComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  caseForm = this.fb.group({
    full_name: ['', Validators.required],
    location: ['', Validators.required],
    living_conditions: ['', Validators.required],
    air_quality: ['toza', Validators.required],
    ecological_cleanliness: ['yaxshi', Validators.required],
    age: [30, [Validators.required, Validators.min(0)]],
    gender: ['male', Validators.required],
    bp: [120, [Validators.required]],
    dbp: [80],
    height: [170],
    weight: [70],
    cholesterol: [200, [Validators.required]],
    symptoms: ['', Validators.required],
    history: [''],
    smoking: [false],
    // Laboratory values
    hemoglobin: [null],
    wbc: [null],
    platelets: [null],
    glucose: [null],
    creatinine: [null],
    creatinine_unit: ['umol/L'],
    ldl: [null],
    hdl: [null],
    triglycerides: [null],
    crp: [null],
    troponin: [null],
    alt: [null],
    ast: [null],
    sodium: [null],
    potassium: [null],
    chloride: [null],
    bicarbonate: [null],
    albumin: [null],
    calcium: [null],
    bilirubin: [null],
    inr: [null],
    bun: [null],
    // Anemia
    mcv: [null],
    mch: [null],
    mchc: [null],
    ferritin: [null],
    iron: [null],
    tibc: [null],
    vitamin_b12: [null],
    folate: [null],
    reticulocytes: [null],
    ldh: [null],
    haptoglobin: [null],
    
    measured_osmolality: [null],
    urine_na: [null],
    urine_creatinine: [null],
    // Clinical signs
    ascites: ['none'],
    encephalopathy: ['none'],
    rr: [null],
    gcs_less_15: [false],
    // History flags
    chf: [false],
    hypertension: [false],
    stroke_history: [false],
    vascular_disease: [false],
    diabetes_history: [false],
    lab_text: ['']
  });

  loading = signal(false);
  
  toggleSmoking() {
    const current = this.caseForm.get('smoking')?.value;
    this.caseForm.patchValue({ smoking: !current });
  }

  async onSubmit() {
    if (this.caseForm.invalid) {
      this.caseForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.createCase(this.caseForm.value as Partial<CaseData>);
      
      if (error) {
        console.error('Save error:', error);
        alert('Xatolik yuz berdi: ' + error.message);
      } else if (data) {
        this.router.navigate(['/app/case', data.id]);
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      alert('Kutilmagan xatolik yuz berdi');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/app/dashboard']);
  }
}
