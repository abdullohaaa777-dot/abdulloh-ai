import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AiService, CaseData, ChatMessage, AnalysisResult } from '../../services/ai';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LabChartComponent } from '../lab-chart/lab-chart';
import { RiskChartComponent } from '../risk-chart/risk-chart';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, LabChartComponent, RiskChartComponent],
  template: `
    @if (caseLoading()) {
      <div class="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div class="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin"></div>
        <p class="text-medical-text-muted font-bold animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    } @else if (caseError()) {
      <div class="max-w-md mx-auto mt-20 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center">
        <mat-icon class="text-red-500 text-5xl h-12 w-12 mb-4">error_outline</mat-icon>
        <h2 class="text-xl font-black text-medical-text mb-2">Xatolik yuz berdi</h2>
        <p class="text-medical-text-muted font-medium mb-6">{{ caseError() }}</p>
        <div class="flex flex-col gap-3">
          <button (click)="retryLoad()" class="btn-primary w-full">
            <mat-icon>refresh</mat-icon>
            <span>Qayta urinish</span>
          </button>
          <button routerLink="/" class="btn-secondary w-full">
            <mat-icon>home</mat-icon>
            <span>Bosh sahifaga qaytish</span>
          </button>
        </div>
      </div>
    } @else if (caseData(); as case) {
      <div class="max-w-7xl mx-auto pb-12">
        <div class="flex flex-col lg:flex-row gap-8">
          
          <!-- Left Column: Patient Info & Risk -->
          <div class="lg:w-1/3 space-y-8">
            <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-14 h-14 rounded-2xl bg-medical-primary/10 flex items-center justify-center text-medical-primary">
                  <mat-icon class="text-3xl">person</mat-icon>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-medical-text">Bemor ma'lumotlari</h2>
                  @if (editing()) {
                    <input type="text" [(ngModel)]="editData().full_name" class="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold mt-1" placeholder="Ism familiyasi">
                  } @else {
                    <p class="text-sm font-bold text-medical-text mt-1">{{ case.full_name || 'Ism kiritilmagan' }}</p>
                  }
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">ID: {{ case.id.slice(0, 8) }}</p>
                </div>
                <div class="ml-auto">
                  @if (!editing()) {
                    <div class="flex gap-2">
                      <button (click)="toggleEdit()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-medical-primary" title="Tahrirlash">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button (click)="deleteCase()" class="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500" title="O'chirish">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  } @else {
                    <div class="flex gap-2">
                      <button (click)="saveChanges()" [disabled]="saving()" class="p-2 bg-medical-primary text-white rounded-xl shadow-lg shadow-medical-primary/20 hover:bg-indigo-700 transition-all disabled:opacity-50">
                        @if (!saving()) {
                          <mat-icon>save</mat-icon>
                        } @else {
                          <mat-icon class="animate-spin">sync</mat-icon>
                        }
                      </button>
                      <button (click)="toggleEdit()" class="p-2 bg-slate-100 text-medical-text-muted rounded-xl hover:bg-slate-200 transition-all">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Manzil</span>
                  @if (editing()) {
                    <input type="text" [(ngModel)]="editData().location" class="w-40 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold text-right truncate max-w-[150px]">{{ case.location || '--' }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Yashash sharoiti</span>
                  @if (editing()) {
                    <input type="text" [(ngModel)]="editData().living_conditions" class="w-40 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold text-right truncate max-w-[150px]">{{ case.living_conditions || '--' }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Havosi tozaligi</span>
                  @if (editing()) {
                    <select [(ngModel)]="editData().air_quality" class="px-2 py-1 border border-slate-200 rounded-lg text-sm">
                      <option value="toza">Toza</option>
                      <option value="ortacha">O'rtacha</option>
                      <option value="ifloslangan">Ifloslangan</option>
                    </select>
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.air_quality || '--' }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Ekologiyasi</span>
                  @if (editing()) {
                    <select [(ngModel)]="editData().ecological_cleanliness" class="px-2 py-1 border border-slate-200 rounded-lg text-sm">
                      <option value="yaxshi">Yaxshi</option>
                      <option value="qoniqarli">Qoniqarli</option>
                      <option value="yomon">Yomon</option>
                    </select>
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.ecological_cleanliness || '--' }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Yosh</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().age" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.age }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Jins</span>
                  @if (editing()) {
                    <select [(ngModel)]="editData().gender" class="px-2 py-1 border border-slate-200 rounded-lg text-sm">
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                    </select>
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.gender === 'male' ? 'Erkak' : 'Ayol' }}</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Qon bosimi (S/D)</span>
                  @if (editing()) {
                    <div class="flex gap-1 items-center">
                      <input type="number" [(ngModel)]="editData().bp" class="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                      <span>/</span>
                      <input type="number" [(ngModel)]="editData().dbp" class="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                    </div>
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.bp }}/{{ case.dbp || '--' }} mmHg</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Bo'y / Vazn</span>
                  @if (editing()) {
                    <div class="flex gap-1 items-center">
                      <input type="number" [(ngModel)]="editData().height" class="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                      <span>/</span>
                      <input type="number" [(ngModel)]="editData().weight" class="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                    </div>
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.height || '--' }} cm / {{ case.weight || '--' }} kg</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Xolesterin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().cholesterol" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.cholesterol }} mg/dL</span>
                  }
                </div>
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Chekish</span>
                  @if (editing()) {
                    <input type="checkbox" [(ngModel)]="editData().smoking" class="w-5 h-5 accent-medical-primary">
                  } @else {
                    <span class="text-medical-text font-bold">{{ smokingText }}</span>
                  }
                </div>
                
                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Gemoglobin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().hemoglobin" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.hemoglobin || '--' }} g/dL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">MCV</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().mcv" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.mcv || '--' }} fL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Ferritin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().ferritin" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.ferritin || '--' }} ng/mL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Vit B12</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().vitamin_b12" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.vitamin_b12 || '--' }} pg/mL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Retikulotsitlar</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().reticulocytes" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.reticulocytes || '--' }}%</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">LDH</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().ldh" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.ldh || '--' }} U/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">WBC</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().wbc" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.wbc || '--' }} x10⁹/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Glyukoza</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().glucose" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.glucose || '--' }} mmol/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Kreatinin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().creatinine" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.creatinine || '--' }} µmol/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">CRP</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().crp" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.crp || '--' }} mg/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Troponin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().troponin" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.troponin || '--' }} ng/mL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Natriy (Na)</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().sodium" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.sodium || '--' }} mEq/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Kaliy (K)</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().potassium" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.potassium || '--' }} mEq/L</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Bilirubin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().bilirubin" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.bilirubin || '--' }} mg/dL</span>
                  }
                </div>

                <div class="flex justify-between py-3 border-b border-slate-50 items-center">
                  <span class="text-medical-text-muted font-medium">Albumin</span>
                  @if (editing()) {
                    <input type="number" [(ngModel)]="editData().albumin" class="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right">
                  } @else {
                    <span class="text-medical-text font-bold">{{ case.albumin || '--' }} g/dL</span>
                  }
                </div>
              </div>
            </div>

            <!-- Risk Score Card -->
            <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-medical-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 class="text-lg font-bold text-medical-text mb-6">Xavf darajasi</h3>
              <div class="flex items-center justify-center py-4">
                <div class="relative w-40 h-40">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="3" />
                    <circle cx="18" cy="18" r="16" fill="none" 
                            [class.stroke-medical-primary]="riskScore() < 50"
                            [class.stroke-amber-500]="riskScore() >= 50 && riskScore() < 75"
                            [class.stroke-red-500]="riskScore() >= 75"
                            stroke-width="3" 
                            stroke-linecap="round" 
                            [style.stroke-dasharray]="riskScore() + ', 100'" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center flex-col">
                    <span class="text-4xl font-black text-medical-text">{{ riskScore() }}%</span>
                    <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Umumiy xavf</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-medical-text-muted text-center font-medium mt-4">Ushbu ko'rsatkich logistik regressiya modeli asosida hisoblangan.</p>
            </div>

            <!-- File Upload -->
            <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
              <h3 class="text-lg font-bold text-medical-text mb-6">Hujjatlar</h3>
              <div class="space-y-3 mb-6">
                @for (upload of case.uploads; track upload.id) {
                  <div class="flex items-center gap-3 p-3 bg-slate-50 border border-medical-border rounded-2xl text-sm group hover:bg-white transition-all">
                    <mat-icon class="text-medical-primary">description</mat-icon>
                    <span class="text-medical-text font-semibold truncate flex-1">{{ upload.file_path.split('/').pop() }}</span>
                    <mat-icon class="text-slate-300 group-hover:text-medical-primary cursor-pointer">download</mat-icon>
                  </div>
                }
              </div>
              <label class="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-medical-primary hover:bg-medical-primary/5 cursor-pointer transition-all">
                <mat-icon class="text-slate-400 mb-2 text-3xl h-8 w-8">cloud_upload</mat-icon>
                <span class="text-sm font-bold text-medical-text">PDF yoki Rasm yuklash</span>
                <span class="text-[10px] text-medical-text-muted mt-1 uppercase tracking-wider">Maksimal 10MB</span>
                <input type="file" class="hidden" (change)="onFileUpload($event)">
              </label>
            </div>
          </div>

          <!-- Right Column: AI Analysis & Chat -->
          <div class="lg:w-2/3 space-y-8">
            <!-- Analysis Mode & Locale Toggle -->
            <div class="flex flex-wrap gap-4 items-center justify-between">
              <div class="flex gap-2 p-1.5 bg-white border border-medical-border rounded-2xl w-fit shadow-sm">
                <button (click)="setMode('patient')" 
                        [class.bg-medical-primary]="mode() === 'patient'"
                        [class.text-white]="mode() === 'patient'"
                        [class.shadow-lg]="mode() === 'patient'"
                        [class.shadow-medical-primary/30]="mode() === 'patient'"
                        class="px-8 py-2.5 rounded-xl text-sm font-bold transition-all text-medical-text-muted hover:bg-slate-50">
                  Bemor rejimi
                </button>
                <button (click)="setMode('doctor')" 
                        [class.bg-medical-primary]="mode() === 'doctor'"
                        [class.text-white]="mode() === 'doctor'"
                        [class.shadow-lg]="mode() === 'doctor'"
                        [class.shadow-medical-primary/30]="mode() === 'doctor'"
                        class="px-8 py-2.5 rounded-xl text-sm font-bold transition-all text-medical-text-muted hover:bg-slate-50">
                  Shifokor rejimi
                </button>
              </div>

              <div class="flex gap-2 p-1.5 bg-white border border-medical-border rounded-2xl w-fit shadow-sm">
                <button (click)="setLocale('uz')" 
                        [class.bg-medical-secondary]="locale() === 'uz'"
                        [class.text-white]="locale() === 'uz'"
                        class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-medical-text-muted hover:bg-slate-50">
                  UZ
                </button>
                <button (click)="setLocale('ru')" 
                        [class.bg-medical-secondary]="locale() === 'ru'"
                        [class.text-white]="locale() === 'ru'"
                        class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-medical-text-muted hover:bg-slate-50">
                  RU
                </button>
                <button (click)="setLocale('en')" 
                        [class.bg-medical-secondary]="locale() === 'en'"
                        [class.text-white]="locale() === 'en'"
                        class="px-4 py-2 rounded-xl text-xs font-bold transition-all text-medical-text-muted hover:bg-slate-50">
                  EN
                </button>
              </div>
            </div>

            <!-- AI Analysis Result -->
            <div class="bg-white border border-medical-border p-10 rounded-3xl shadow-xl relative overflow-hidden">
              <div class="absolute top-0 right-0 w-64 h-64 bg-medical-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div class="flex items-center justify-between mb-8 relative z-10">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-medical-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-medical-secondary/20">
                    <mat-icon>psychology</mat-icon>
                  </div>
                  <h3 class="text-2xl font-black text-medical-text tracking-tight">AI Tahlili</h3>
                </div>
                <button (click)="generateAnalysis()" [disabled]="analyzing()" class="btn-primary px-6">
                  <mat-icon [class.animate-spin]="analyzing()">refresh</mat-icon>
                  <span>Yangilash</span>
                </button>
              </div>

              @if (analysis(); as result) {
                <div class="space-y-10 relative z-10">
                  <!-- 5-Year Risk Estimation -->
                  <div class="bg-indigo-900/5 border border-indigo-100 p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div class="flex items-center gap-4 mb-8 relative z-10">
                      <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <mat-icon>trending_up</mat-icon>
                      </div>
                      <div>
                        <h4 class="text-xl font-black text-medical-text tracking-tight">Yaqin 5 yillikdagi kasalliklar ehtimoli</h4>
                        <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Klinik bashorat modeli</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                      <!-- Progress Bars Column -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Heart -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-red-500 text-sm h-4 w-4">favorite</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Yurak</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.heart }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-red-500" [style.width.%]="result.five_year_risks.heart"></div>
                          </div>
                        </div>
                        <!-- Kidney -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-blue-500 text-sm h-4 w-4">opacity</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Buyrak</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.kidney }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-blue-500" [style.width.%]="result.five_year_risks.kidney"></div>
                          </div>
                        </div>
                        <!-- Lung -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-slate-500 text-sm h-4 w-4">air</mat-icon>
                              <span class="text-sm font-bold text-medical-text">O'pka</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.lung }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-slate-500" [style.width.%]="result.five_year_risks.lung"></div>
                          </div>
                        </div>
                        <!-- Liver -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-orange-500 text-sm h-4 w-4">medication</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Jigar</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.liver }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-orange-500" [style.width.%]="result.five_year_risks.liver"></div>
                          </div>
                        </div>
                        <!-- Cancer -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-purple-500 text-sm h-4 w-4">biotech</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Rak / O'sma</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.cancer }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-purple-500" [style.width.%]="result.five_year_risks.cancer"></div>
                          </div>
                        </div>
                        <!-- Diabetes -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-emerald-500 text-sm h-4 w-4">water_drop</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Qandli diabet</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.diabetes }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-emerald-500" [style.width.%]="result.five_year_risks.diabetes"></div>
                          </div>
                        </div>
                        <!-- Anemia -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-red-600 text-sm h-4 w-4">opacity</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Anemiya</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.anemia }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-red-600" [style.width.%]="result.five_year_risks.anemia"></div>
                          </div>
                        </div>
                        <!-- Sepsis -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-red-900 text-sm h-4 w-4">warning</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Sepsis</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.sepsis }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-red-900" [style.width.%]="result.five_year_risks.sepsis"></div>
                          </div>
                        </div>
                        <!-- Rehospitalization -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-indigo-900 text-sm h-4 w-4">hotel</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Gospitalizatsiya</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.rehospitalization }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-indigo-900" [style.width.%]="result.five_year_risks.rehospitalization"></div>
                          </div>
                        </div>
                        <!-- Nutritional Deficiency -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-amber-600 text-sm h-4 w-4">restaurant</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Nutritiv tanqislik</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.nutritional_deficiency }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-amber-600" [style.width.%]="result.five_year_risks.nutritional_deficiency"></div>
                          </div>
                        </div>
                        <!-- Chronic Inflammation -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-red-700 text-sm h-4 w-4">thermostat</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Yallig'lanish</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.chronic_inflammation }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-red-700" [style.width.%]="result.five_year_risks.chronic_inflammation"></div>
                          </div>
                        </div>
                        <!-- Quality of Life -->
                        <div class="bg-white/80 backdrop-blur-sm border border-indigo-50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                              <mat-icon class="text-slate-600 text-sm h-4 w-4">sentiment_satisfied</mat-icon>
                              <span class="text-sm font-bold text-medical-text">Hayot sifati</span>
                            </div>
                            <span class="text-sm font-black text-indigo-600">{{ result.five_year_risks.quality_of_life_decline }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-indigo-600 h-full transition-all duration-1000 group-hover:bg-slate-600" [style.width.%]="result.five_year_risks.quality_of_life_decline"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Chart Column -->
                      <app-risk-chart [risks]="result.five_year_risks"></app-risk-chart>
                    </div>
                  </div>

                  <!-- Anemia Analysis Section -->
                  @if (result.anemia_analysis) {
                    <div class="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 relative overflow-hidden">
                      <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <div class="flex items-center gap-4 mb-6 relative z-10">
                        <div class="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                          <mat-icon>opacity</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-xl font-black text-red-900 tracking-tight">Anemiya Tahlili</h4>
                          <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest">Differensial diagnoz natijasi</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div class="space-y-4">
                          <div class="bg-white p-5 rounded-3xl border border-red-50 shadow-sm">
                            <span class="text-[10px] text-red-500 font-bold uppercase tracking-widest block mb-1">Anemiya turi</span>
                            <h5 class="text-xl font-black text-medical-text">{{ result.anemia_analysis.type }}</h5>
                            <div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                 [class.bg-red-100]="result.anemia_analysis.severity === 'severe'"
                                 [class.text-red-700]="result.anemia_analysis.severity === 'severe'"
                                 [class.bg-amber-100]="result.anemia_analysis.severity === 'moderate'"
                                 [class.text-amber-700]="result.anemia_analysis.severity === 'moderate'"
                                 [class.bg-blue-100]="result.anemia_analysis.severity === 'mild'"
                                 [class.text-blue-700]="result.anemia_analysis.severity === 'mild'">
                              {{ result.anemia_analysis.severity }} daraja
                            </div>
                          </div>
                          
                          <div class="bg-white p-5 rounded-3xl border border-red-50 shadow-sm">
                            <span class="text-[10px] text-red-500 font-bold uppercase tracking-widest block mb-2">Dalillar (Evidence)</span>
                            <div class="flex flex-wrap gap-2">
                              @for (ev of result.anemia_analysis.evidence; track ev) {
                                <span class="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-medical-text">
                                  {{ ev }}
                                </span>
                              }
                            </div>
                          </div>
                        </div>

                        <div class="bg-white p-6 rounded-3xl border border-red-50 shadow-sm">
                          <span class="text-[10px] text-red-500 font-bold uppercase tracking-widest block mb-2">Patogenez (Mexanizm)</span>
                          <p class="text-sm font-medium text-medical-text leading-relaxed">
                            {{ result.anemia_analysis.pathogenesis }}
                          </p>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Mukovitsidoz (Cystic Fibrosis) Analysis Section -->
                  @if (result.cf_analysis) {
                    <div class="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                      <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <div class="flex items-center gap-4 mb-6 relative z-10">
                        <div class="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <mat-icon>medical_services</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-xl font-black text-blue-900 tracking-tight">Mukovitsidoz (Cystic Fibrosis) Tahlili</h4>
                          <p class="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Ixtisoslashgan differensial diagnoz</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div class="space-y-4">
                          <div class="bg-white p-5 rounded-3xl border border-blue-50 shadow-sm">
                            <span class="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">Ehtimollik darajasi</span>
                            <h5 class="text-xl font-black text-medical-text uppercase">{{ result.cf_analysis.likelihood }}</h5>
                            <div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                 [class.bg-red-100]="result.cf_analysis.likelihood === 'high'"
                                 [class.text-red-700]="result.cf_analysis.likelihood === 'high'"
                                 [class.bg-amber-100]="result.cf_analysis.likelihood === 'moderate'"
                                 [class.text-amber-700]="result.cf_analysis.likelihood === 'moderate'"
                                 [class.bg-blue-100]="result.cf_analysis.likelihood === 'low'"
                                 [class.text-blue-700]="result.cf_analysis.likelihood === 'low'">
                              {{ result.cf_analysis.likelihood === 'high' ? 'Yuqori' : result.cf_analysis.likelihood === 'moderate' ? "O'rtacha" : 'Past' }} ehtimollik
                            </div>
                          </div>
                          
                          <div class="bg-white p-5 rounded-3xl border border-blue-50 shadow-sm">
                            <span class="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-2">Klinik dalillar</span>
                            <div class="flex flex-wrap gap-2">
                              @for (ev of result.cf_analysis.supporting_evidence; track ev) {
                                <span class="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-medical-text">
                                  {{ ev }}
                                </span>
                              }
                            </div>
                          </div>
                        </div>

                        <div class="space-y-4">
                          <div class="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm">
                            <span class="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-2">Molekulyar patogenez</span>
                            <p class="text-sm font-medium text-medical-text leading-relaxed">
                              {{ result.cf_analysis.pathogenesis }}
                            </p>
                          </div>

                          @if (result.cf_analysis.differential_diagnosis_questions.length > 0) {
                            <div class="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
                              <span class="text-[10px] text-amber-600 font-bold uppercase tracking-widest block mb-3 flex items-center gap-1">
                                <mat-icon class="text-xs h-3 w-3">help</mat-icon>
                                Diagnozni aniqlashtirish uchun savollar
                              </span>
                              <ul class="space-y-2">
                                @for (q of result.cf_analysis.differential_diagnosis_questions; track q) {
                                  <li class="text-xs font-bold text-amber-900 flex items-start gap-2">
                                    <span class="text-amber-400">•</span>
                                    {{ q }}
                                  </li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Clinical Summary / Pathogenesis -->
                  <div class="bg-slate-50 p-8 rounded-[2rem] border border-medical-border relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-medical-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <h4 class="text-sm font-bold text-medical-text-muted uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                      <mat-icon class="text-medical-secondary">description</mat-icon>
                      Kasallik va Patogenez tahlili
                    </h4>
                    <div class="text-medical-text font-medium leading-relaxed relative z-10 whitespace-pre-wrap">
                      {{ result.clinical_summary }}
                    </div>
                  </div>

                  <!-- Treatment Plan Section -->
                  @if (result.treatment_plan) {
                    <div class="bg-emerald-900/5 border border-emerald-100 p-8 rounded-[2.5rem] relative overflow-hidden">
                      <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      
                      <div class="flex items-center gap-4 mb-8 relative z-10">
                        <div class="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                          <mat-icon>medication</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-xl font-black text-medical-text tracking-tight">Davolash va Tavsiyalar</h4>
                          <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Klinik tavsiyalar majmuasi</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                        <!-- Lifestyle -->
                        <div class="bg-white/80 backdrop-blur-sm border border-emerald-50 p-6 rounded-3xl shadow-sm">
                          <h5 class="text-sm font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <mat-icon class="text-sm h-4 w-4">eco</mat-icon>
                            Hayot tarzini yaxshilash
                          </h5>
                          <ul class="space-y-3">
                            @for (item of result.treatment_plan.lifestyle; track item) {
                              <li class="flex items-start gap-3 text-sm text-medical-text font-medium">
                                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                                {{ item }}
                              </li>
                            }
                          </ul>
                        </div>

                        <!-- Medications -->
                        <div class="bg-white/80 backdrop-blur-sm border border-emerald-50 p-6 rounded-3xl shadow-sm">
                          <h5 class="text-sm font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <mat-icon class="text-sm h-4 w-4">pill</mat-icon>
                            Dori vositalari
                          </h5>
                          <div class="space-y-4">
                            @for (med of result.treatment_plan.medications; track med.name) {
                              <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div class="flex justify-between items-start mb-1">
                                  <span class="text-sm font-black text-medical-text">{{ med.name }}</span>
                                  <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{{ med.dosage }}</span>
                                </div>
                                <p class="text-xs text-medical-text-muted font-medium italic">{{ med.indication }}</p>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Visual Analysis (Charts) -->
                  @if (result.laboratory_analysis.length > 0) {
                    <app-lab-chart [data]="result.laboratory_analysis"></app-lab-chart>
                  }

                  <!-- Laboratory Analysis Table -->
                  @if (result.laboratory_analysis.length > 0) {
                    <div>
                      <h4 class="text-sm font-bold text-medical-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                        <mat-icon class="text-medical-primary">biotech</mat-icon>
                        Laboratoriya tahlili
                      </h4>
                      <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                          <thead>
                            <tr class="border-b border-slate-100">
                              <th class="py-3 px-4 text-xs font-bold text-medical-text-muted uppercase">Ko'rsatkich</th>
                              <th class="py-3 px-4 text-xs font-bold text-medical-text-muted uppercase">Qiymat</th>
                              <th class="py-3 px-4 text-xs font-bold text-medical-text-muted uppercase">Referens</th>
                              <th class="py-3 px-4 text-xs font-bold text-medical-text-muted uppercase">Holat</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (lab of result.laboratory_analysis; track lab.marker) {
                              <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td class="py-4 px-4 font-bold text-medical-text">{{ lab.marker }}</td>
                                <td class="py-4 px-4 font-mono text-sm">{{ lab.value }}</td>
                                <td class="py-4 px-4 text-xs text-medical-text-muted">{{ lab.reference_range }}</td>
                                <td class="py-4 px-4">
                                  <span [class.bg-red-100]="lab.status === 'high' || lab.status === 'low'"
                                        [class.text-red-700]="lab.status === 'high' || lab.status === 'low'"
                                        [class.bg-green-100]="lab.status === 'normal'"
                                        [class.text-green-700]="lab.status === 'normal'"
                                        class="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {{ lab.status }}
                                  </span>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }

                  <!-- Differential Diagnosis & Plan -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    @if (result.differential_diagnosis.length > 0) {
                      <div class="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
                        <h4 class="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <mat-icon class="text-indigo-600">troubleshoot</mat-icon>
                          Differensial diagnoz
                        </h4>
                        <div class="space-y-4">
                          <!-- Main Diagnosis -->
                          <div class="p-5 bg-white rounded-2xl border-2 border-indigo-200 shadow-md relative overflow-hidden">
                            <div class="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Asosiy</div>
                            <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest block mb-1">Taxminiy tashxis</span>
                            <p class="text-lg font-black text-medical-text">{{ result.differential_diagnosis[0] }}</p>
                          </div>
                          
                          <!-- Other Differentials -->
                          <div class="space-y-2">
                            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest block px-2">Muqobil variantlar</span>
                            @for (ddx of result.differential_diagnosis.slice(1); track ddx) {
                              <div class="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-indigo-50 text-sm text-indigo-800 font-bold">
                                <mat-icon class="text-indigo-300 text-sm h-4 w-4">analytics</mat-icon>
                                {{ ddx }}
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    }
                    @if (result.recommended_tests.length > 0) {
                      <div class="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
                        <h4 class="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <mat-icon class="text-emerald-600">biotech</mat-icon>
                          Tavsiya etilgan testlar
                        </h4>
                        <ul class="space-y-3">
                          @for (test of result.recommended_tests; track test) {
                            <li class="flex items-start gap-4 p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm group hover:border-emerald-200 transition-all">
                              <div class="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <mat-icon class="text-sm">science</mat-icon>
                              </div>
                              <span class="text-sm font-bold text-emerald-800">{{ test }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  </div>

                  <!-- Red Flags -->
                  @if (result.red_flags.length > 0) {
                    <div class="bg-red-50 p-6 rounded-2xl border border-red-100">
                      <h4 class="text-sm font-bold text-red-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <mat-icon class="text-red-600">warning</mat-icon>
                        Xavfli belgilar (Red Flags)
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @for (flag of result.red_flags; track flag) {
                          <div class="flex items-center gap-3 p-3 bg-white/50 rounded-xl text-sm text-red-700 font-bold border border-red-200">
                            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {{ flag }}
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Computed Clinical Formulas -->
                  @if (result.computed_formulas && result.computed_formulas.length > 0) {
                    <div class="bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100">
                      <h4 class="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <mat-icon class="text-indigo-600">calculate</mat-icon>
                        Hisoblangan klinik formulalar
                      </h4>
                      <div class="grid grid-cols-1 gap-6">
                        @for (formula of result.computed_formulas; track formula.name) {
                          <div class="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm">
                            <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
                              <div>
                                <h5 class="text-lg font-black text-medical-text">{{ formula.name }}</h5>
                                <code class="text-[10px] text-indigo-500 font-mono">{{ formula.formula }}</code>
                              </div>
                              <div class="text-right">
                                <span class="text-2xl font-black text-indigo-600">{{ formula.result }}</span>
                                <span class="text-xs font-bold text-medical-text-muted ml-1">{{ formula.units }}</span>
                              </div>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-xl text-sm text-medical-text font-medium border-l-4 border-indigo-400">
                              {{ formula.interpretation }}
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Missing Inputs & Notes -->
                  @if ((result.missing_inputs_needed && result.missing_inputs_needed.length > 0) || (result.notes && result.notes.length > 0)) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      @if (result.missing_inputs_needed && result.missing_inputs_needed.length > 0) {
                        <div class="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                          <h4 class="text-sm font-bold text-amber-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <mat-icon class="text-amber-600">help_outline</mat-icon>
                            Qo'shimcha ma'lumotlar zarur
                          </h4>
                          <ul class="space-y-2">
                            @for (input of result.missing_inputs_needed; track input) {
                              <li class="flex items-center gap-2 text-sm text-amber-800 font-bold">
                                <mat-icon class="text-xs h-4 w-4">add_circle_outline</mat-icon>
                                {{ input }}
                              </li>
                            }
                          </ul>
                          <p class="text-[10px] text-amber-700 mt-4 italic">Ushbu ma'lumotlar aniqroq hisob-kitoblar uchun kerak.</p>
                        </div>
                      }
                      @if (result.notes && result.notes.length > 0) {
                        <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                          <h4 class="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <mat-icon class="text-blue-600">info</mat-icon>
                            Eslatmalar
                          </h4>
                          <ul class="space-y-2">
                            @for (note of result.notes; track note) {
                              <li class="flex items-start gap-2 text-sm text-blue-800 font-medium">
                                <mat-icon class="text-xs h-4 w-4 mt-0.5">info_outline</mat-icon>
                                {{ note }}
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
              @if (analysisError(); as error) {
                <div class="text-center py-12 bg-red-50 rounded-3xl border border-red-100">
                  <mat-icon class="text-red-500 text-5xl h-12 w-12 mb-4">error_outline</mat-icon>
                  <p class="text-red-700 font-bold mb-4">{{ error }}</p>
                  <button (click)="generateAnalysis()" class="btn-primary px-6 mx-auto">
                    <mat-icon>refresh</mat-icon>
                    <span>Qayta urinish</span>
                  </button>
                </div>
              }
              @if (!analysis() && !analyzing() && !analysisError()) {
                <div class="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <mat-icon class="text-slate-300 text-5xl h-12 w-12 mb-4">analytics</mat-icon>
                  <p class="text-medical-text-muted font-bold">Tahlilni boshlash uchun tugmani bosing</p>
                </div>
              }
              @if (analyzing()) {
                <div class="space-y-6">
                  <div class="h-5 bg-slate-100 rounded-full animate-pulse w-3/4"></div>
                  <div class="h-5 bg-slate-100 rounded-full animate-pulse w-full"></div>
                  <div class="h-5 bg-slate-100 rounded-full animate-pulse w-5/6"></div>
                  <div class="h-5 bg-slate-100 rounded-full animate-pulse w-2/3"></div>
                </div>
              }
            </div>

            <!-- AI Chat Panel -->
            <div class="bg-white border border-medical-border rounded-3xl shadow-xl flex flex-col h-[600px] overflow-hidden">
              <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <mat-icon>chat</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-black text-medical-text">Abdulloh AI Chat</h3>
                    <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Mukovitsidoz bo'yicha mutaxassis</p>
                  </div>
                </div>
              </div>

              <div #chatContainer class="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                @for (msg of chatMessages(); track msg.id) {
                  <div [class.justify-end]="msg.role === 'user'" class="flex">
                    <div [class.bg-medical-primary]="msg.role === 'user'"
                         [class.text-white]="msg.role === 'user'"
                         [class.shadow-medical-primary/20]="msg.role === 'user'"
                         [class.bg-white]="msg.role === 'assistant'"
                         [class.text-medical-text]="msg.role === 'assistant'"
                         [class.border]="msg.role === 'assistant'"
                         [class.border-medical-border]="msg.role === 'assistant'"
                         [class.rounded-tr-none]="msg.role === 'user'"
                         [class.rounded-tl-none]="msg.role === 'assistant'"
                         class="max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-md">
                      {{ msg.message }}
                    </div>
                  </div>
                }
                @if (chatLoading()) {
                  <div class="flex">
                    <div class="bg-white border border-medical-border p-4 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                }
              </div>

              <div class="p-6 bg-white border-t border-slate-50">
                <div class="flex gap-3">
                  <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()"
                         placeholder="Savolingizni yozing..." 
                         class="flex-1 input-field py-3 text-sm font-semibold">
                  <button (click)="sendMessage()" [disabled]="!newMessage.trim() || chatLoading()" 
                          class="w-12 h-12 bg-medical-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-medical-primary/30 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private ai = inject(AiService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  caseData = signal<CaseData | null>(null);
  caseLoading = signal(true);
  caseError = signal<string | null>(null);
  riskScore = signal(0);
  mode = signal<'patient' | 'doctor'>('patient');
  locale = signal<'uz' | 'ru' | 'en'>('uz');
  analysis = signal<AnalysisResult | null>(null);
  analyzing = signal(false);
  analysisError = signal<string | null>(null);
  
  chatMessages = signal<ChatMessage[]>([]);
  newMessage = '';
  chatLoading = signal(false);

  editing = signal(false);
  editData = signal<Partial<CaseData>>({});
  saving = signal(false);

  get smokingText() {
    return this.caseData()?.smoking ? 'Ha' : "Yo'q";
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadCase(id);
    } else {
      this.caseError.set('ID topilmadi');
      this.caseLoading.set(false);
    }
  }

  retryLoad() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCase(id);
    }
  }

  async loadCase(id: string) {
    this.caseLoading.set(true);
    this.caseError.set(null);
    try {
      const { data, error } = await this.supabase.getCaseById(id);
      if (error) {
        this.caseError.set('Ma\'lumotlarni yuklashda xatolik: ' + error.message);
      } else if (data) {
        this.caseData.set(data);
        this.riskScore.set(this.ai.calculateRisk(data.age, data.bp, data.smoking));
        this.chatMessages.set(data.chats || []);
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Automatically generate analysis on load
        this.generateAnalysis().catch(console.error);
      } else {
        this.caseError.set('Bemor ma\'lumotlari topilmadi');
      }
    } catch (e) {
      console.error('Load error:', e);
      this.caseError.set('Kutilmagan xatolik yuz berdi');
    } finally {
      this.caseLoading.set(false);
    }
  }

  setMode(mode: 'patient' | 'doctor') {
    this.mode.set(mode);
    if (this.analysis()) {
      this.generateAnalysis().catch(console.error);
    }
  }

  setLocale(locale: 'uz' | 'ru' | 'en') {
    this.locale.set(locale);
    if (this.analysis()) {
      this.generateAnalysis().catch(console.error);
    }
  }

  async generateAnalysis() {
    const data = this.caseData();
    if (!data) return;
    
    this.analyzing.set(true);
    this.analysisError.set(null);
    try {
      const result = await this.ai.analyzeCase(data, this.mode(), this.locale());
      if (result && Object.keys(result).length > 0) {
        this.analysis.set(result);
      } else {
        throw new Error('AI tahlili bo\'sh natija qaytardi');
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : 'AI tahlilini yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
      this.analysisError.set(errorMsg);
    } finally {
      this.analyzing.set(false);
    }
  }

  toggleEdit() {
    if (this.editing()) {
      this.editing.set(false);
    } else {
      const data = this.caseData();
      if (data) {
        this.editData.set({ ...data });
        this.editing.set(true);
      }
    }
  }

  async saveChanges() {
    const data = this.caseData();
    if (!data) return;

    this.saving.set(true);
    try {
      const { error } = await this.supabase.updateCase(data.id, this.editData());
      if (error) throw error;
      
      await this.loadCase(data.id);
      this.editing.set(false);
    } catch (e) {
      console.error('Save error:', e);
      alert('Ma\'lumotlarni saqlashda xatolik yuz berdi');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteCase() {
    const data = this.caseData();
    if (!data) return;

    if (confirm('Haqiqatan ham ushbu bemor ma\'lumotlarini o\'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo\'lmaydi.')) {
      try {
        const { error } = await this.supabase.deleteCase(data.id);
        if (error) throw error;
        this.router.navigate(['/']);
      } catch (e) {
        console.error('Delete error:', e);
        alert('Ma\'lumotlarni o\'chirishda xatolik yuz berdi');
      }
    }
  }

  async onFileUpload(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    const data = this.caseData();
    if (file && data) {
      await this.supabase.uploadFile(data.id, file);
      await this.loadCase(data.id);
    }
  }

  async sendMessage() {
    const data = this.caseData();
    if (!this.newMessage.trim() || this.chatLoading() || !data) return;

    const msg = this.newMessage;
    this.newMessage = '';
    
    // Add user message to DB
    const { data: userMsg } = await this.supabase.addChatMessage(data.id, 'user', msg);
    if (userMsg) {
      this.chatMessages.update(msgs => [...msgs, userMsg as ChatMessage]);
      this.scrollToBottom();
    }

    this.chatLoading.set(true);
    try {
      const aiResponse = await this.ai.chat(data.id, this.chatMessages(), msg);
      const { data: assistantMsg } = await this.supabase.addChatMessage(data.id, 'assistant', aiResponse || '');
      if (assistantMsg) {
        this.chatMessages.update(msgs => [...msgs, assistantMsg as ChatMessage]);
        this.scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
    this.chatLoading.set(false);
  }

  private scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }
}
