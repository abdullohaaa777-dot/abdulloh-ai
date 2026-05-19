import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import {
  SdhFeatureSet,
  SdhFinalAnalysisResponse,
  SdhFinalAnalysisSession,
  SdhInputSnapshot,
  SdhOrganRisk,
  SdhResult,
  SdhTestCompletionState,
  SdhTestCompletionStatus,
  SilentDiseaseHunterStorageService
} from '../../services/silent-disease-hunter-storage';
import { HandTrackerService, NormalizedHandLandmarkerResult } from '../../services/hand-tracker';
import { SdhFinalAnalysisPayload, SilentDiseaseHunterInterpretationService } from '../../services/silent-disease-hunter-interpretation';

interface SdhPatientOption {
  id: string;
  name: string;
}

type SdhAdvancedTestId = 'breathing' | 'facial' | 'hand' | 'voice' | 'cardiac';
type SdhFeedbackTone = 'blue' | 'green' | 'yellow' | 'red';
type SdhFinalAnalysisSource = 'auto' | 'manual';

interface SdhProtocolStep {
  id: SdhAdvancedTestId;
  titleUz: string;
  durationSec: number;
  instructionUz: string;
  tasksUz: string[];
}

@Component({
  selector: 'app-silent-disease-hunter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="sdh-dashboard min-h-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <section class="sdh-hero relative p-6 md:p-8 overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(99,102,241,.18),transparent_28%),linear-gradient(135deg,#020617,#0f172a_48%,#111827)]"></div>
        <div class="absolute inset-0 pointer-events-none opacity-40">
          <svg viewBox="0 0 900 280" class="w-full h-full">
            <path d="M0 180 C110 120 180 220 295 160 C430 90 520 230 650 160 C760 100 820 145 910 95" fill="none" stroke="rgba(34,211,238,.5)" stroke-width="4"></path>
            <path d="M0 225 C120 170 240 250 350 205 C470 156 560 255 710 198 C790 168 850 178 910 150" fill="none" stroke="rgba(99,102,241,.42)" stroke-width="3"></path>
            <circle cx="720" cy="92" r="58" fill="none" stroke="rgba(16,185,129,.35)" stroke-width="2"></circle>
            <circle cx="720" cy="92" r="92" fill="none" stroke="rgba(16,185,129,.18)" stroke-width="1.5"></circle>
          </svg>
        </div>
        <div class="relative z-10 grid lg:grid-cols-[1.15fr_.85fr] gap-6 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm text-cyan-100">
              <mat-icon class="!text-[18px]">radar</mat-icon>
              <span>Yashirin fiziologik og‘ishlarni erta baholash</span>
            </div>
            <h1 class="mt-5 text-4xl md:text-5xl font-black tracking-tight">Yashirin kasalliklarni erta aniqlash</h1>
            <p class="mt-4 text-cyan-50/90 max-w-3xl text-lg">Organizmdagi yashirin fiziologik og‘ishlarni kamera, mikrofon, qo‘lda kiritilgan wearable, laborator ko‘rsatkichlar va savol-javob asosida ehtiyotkor multimodal baholash moduli.</p>
            <p class="mt-3 text-sm text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-2xl p-3 max-w-3xl">Bu tizim yakuniy tashxis qo‘ymaydi. Yuqori xavfli belgilar bo‘lsa, shifokor yoki shoshilinch tibbiy yordamga murojaat qiling.</p>
          </div>
          <div class="sdh-status-card rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md p-5 shadow-2xl">
            <p class="text-sm text-cyan-100">Umumiy fiziologik stabilitet</p>
            <div class="mt-3 flex items-end justify-between gap-3">
              <p class="text-5xl font-black">{{ latestResult()?.physiologicalStability ?? sdhLiveStability() }}%</p>
              <span class="px-3 py-1 rounded-full text-sm bg-emerald-400/15 text-emerald-100 border border-emerald-300/20">{{ sdhRiskLevel(latestResult()?.overallRisk ?? sdhLiveRisk()) }}</span>
            </div>
            <div class="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-400 to-cyan-300" [style.width.%]="latestResult()?.physiologicalStability ?? sdhLiveStability()"></div></div>
            <div class="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Risk</p><p class="font-bold text-lg">{{ latestResult()?.overallRisk ?? sdhLiveRisk() }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Ishonch</p><p class="font-bold text-lg">{{ latestResult()?.confidence ?? sdhLiveConfidence() }}%</p></div>
              <div class="rounded-xl bg-white/10 p-3"><p class="text-cyan-100">Signal</p><p class="font-bold text-lg">{{ latestResult()?.signalQuality ?? sdhSignalQuality() }}%</p></div>
            </div>
          </div>
        </div>
      </section>

      <section class="sdh-content p-5 md:p-7 space-y-6 bg-slate-950">

        <section class="sdh-advanced-grid rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-5 md:p-6 shadow-2xl">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <p class="text-xs uppercase tracking-[.22em] text-cyan-200">Silent Disease Hunter — kengaytirilgan protokol</p>
              <h2 class="text-2xl font-black mt-1">Real-time multimodal fiziologik monitoring</h2>
              <p class="text-sm text-slate-400 mt-1">Nafas, mimika, qo‘l motorikasi, yo‘tal/ovoz/o‘qish va yurak holati testlari mavjud modul ichida xavfsiz kengaytirildi.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="sdh-button-primary" (click)="sdhStartAutomaticProtocol()" [disabled]="sdhAdvancedRunning()">Avtomatik protokol</button>
              <button class="sdh-button-secondary" (click)="sdhStopAdvancedProtocol()" [disabled]="!sdhAdvancedRunning()">To‘xtatish</button>
              <button class="sdh-button-secondary" (click)="sdhRunFinalAnalysis({ source: 'manual', allowPartial: false })" [disabled]="sdhAnalysisLoading()">Tahlilni boshlash</button>
            </div>
          </div>

          <div class="grid xl:grid-cols-[1.05fr_.95fr] gap-5">
            <div class="sdh-camera-card rounded-3xl border border-slate-700 bg-slate-950/80 overflow-hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="sdh-status-dot" [class.sdh-status-dot-active]="sdhCameraReady()"></span>
                  <span class="font-bold">Live kamera oynasi</span>
                  <span class="text-xs text-slate-400">AI hisoblash anatomik real chap-o‘ngda qoladi</span>
                </div>
                <label class="sdh-toggle !py-2 !px-3">
                  <input type="checkbox" [(ngModel)]="sdhMirrorPreview">
                  <span>{{ sdhMirrorPreview ? 'Ko‘zgudek ko‘rsatish' : 'Real chap-o‘ng' }}</span>
                </label>
              </div>
              <div class="sdh-video-wrap">
                <video #sdhVideo autoplay muted playsinline class="sdh-video" [class.sdh-video-mirror]="sdhMirrorPreview"></video>
                <canvas #sdhCanvas class="sdh-overlay" [class.sdh-video-mirror]="sdhMirrorPreview"></canvas>
                <div class="sdh-camera-badges">
                  <span [class]="sdhFeedbackClass()">{{ sdhFeedbackMessage() }}</span>
                  <span class="sdh-badge-blue">Signal: {{ sdhAdvancedSignalQuality().camera }}%</span>
                  <span class="sdh-badge-green">Qo‘l: {{ sdhHandDetected() ? 'topildi' : 'topilmadi' }}</span>
                </div>
              </div>
              <div class="grid sm:grid-cols-4 gap-2 p-4 text-sm">
                <div class="sdh-mini-stat"><span>Kamera</span><strong>{{ sdhCameraReady() ? 'faol' : 'fallback' }}</strong></div>
                <div class="sdh-mini-stat"><span>Mikrofon</span><strong>{{ sdhMicReady() ? 'faol' : 'manual' }}</strong></div>
                <div class="sdh-mini-stat"><span>Skeleton</span><strong>{{ sdhHandSkeletonQuality() }}%</strong></div>
                <div class="sdh-mini-stat"><span>Progress</span><strong>{{ sdhAdvancedProgress() }}%</strong></div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-xl font-black">Test instruktsiyasi</h3>
                    <p class="text-sm text-slate-400">{{ sdhActiveStep()?.titleUz || 'Manual yoki avtomatik testni tanlang' }}</p>
                  </div>
                  <div class="text-right"><p class="text-4xl font-black text-cyan-200">{{ sdhCountdown() }}s</p><p class="text-xs text-slate-400">qolgan vaqt</p></div>
                </div>
                <p class="mt-4 text-slate-100">{{ sdhActiveStep()?.instructionUz || 'Kamera va mikrofon ruxsatlari bo‘lmasa ham testlar manual/fallback rejimida davom etadi.' }}</p>
                <div class="mt-4 h-3 rounded-full bg-slate-800 overflow-hidden"><div class="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" [style.width.%]="sdhAdvancedProgress()"></div></div>
                <ul class="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
                  @for (task of (sdhActiveStep()?.tasksUz || sdhProtocolOverview()); track task) { <li class="rounded-xl border border-slate-800 bg-slate-900/70 p-3">{{ task }}</li> }
                </ul>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                @for (step of sdhAdvancedProtocol; track step.id) {
                  <button class="sdh-test-card text-left" (click)="sdhStartManualTest(step.id)" [class.sdh-test-card-active]="sdhActiveTestId() === step.id">
                    <span class="text-xs text-cyan-200">{{ step.durationSec }} soniya</span>
                    <strong>{{ step.titleUz }}</strong>
                    <small>{{ sdhAdvancedCompletedTests().includes(step.id) ? 'Bajarildi' : 'Manual ishga tushirish' }}</small>
                  </button>
                }
              </div>
            </div>
          </div>

          @if (sdhAdvancedWarning()) {
            <div class="mt-5 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">{{ sdhAdvancedWarning() }}</div>
          }

          @if (sdhPatientChoicePanel()) {
            <div class="mt-5 rounded-3xl border border-cyan-300/25 bg-cyan-400/10 p-5 text-cyan-50">
              <h3 class="font-black text-lg">Natijani bemor profiliga bog‘lash</h3>
              <p class="text-sm mt-1 text-cyan-100/90">Natijani bemor profiliga bog‘lash uchun bemorni tanlang yoki mehmon sessiyasi sifatida davom eting.</p>
              <div class="grid md:grid-cols-[1fr_auto_auto] gap-3 mt-4 items-center">
                <select class="sdh-input" [(ngModel)]="sdhSelectedPatientId">
                  <option value="umumiy">Mehmon sessiyasi</option>
                  @for (patient of sdhPatients(); track patient.id) { <option [value]="patient.id">{{ patient.name }}</option> }
                </select>
                <button class="sdh-button-primary" (click)="sdhConfirmPatientAndRunAnalysis()" [disabled]="sdhAnalysisLoading()">Tanlangan profil bilan saqlash</button>
                <button class="sdh-button-secondary" (click)="sdhContinueAsGuest()" [disabled]="sdhAnalysisLoading()">Mehmon sessiyasi</button>
              </div>
            </div>
          }

          @if (sdhAnalysisLoading()) {
            <div class="sdh-analysis-loader mt-5 rounded-3xl border border-cyan-300/25 bg-slate-950/80 p-5">
              <div class="flex items-center gap-3">
                <div class="sdh-loader-ring"></div>
                <div>
                  <h3 class="font-black text-lg">Abdulloh AI chuqur tahlil qilmoqda...</h3>
                  <p class="text-sm text-cyan-100">{{ sdhAnalysisLoadingStep() }}</p>
                </div>
              </div>
              <div class="grid sm:grid-cols-5 gap-2 mt-4 text-xs text-slate-300">
                @for (step of sdhLoadingSteps(); track step) { <div class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">{{ step }}</div> }
              </div>
            </div>
          }

          @if (sdhFinalAnalysisResult(); as finalSession) {
            <section class="mt-5 rounded-3xl border border-emerald-300/20 bg-slate-950/85 p-5 space-y-5" id="sdh-final-result-panel">
              @if (finalSession.emergencyWarning.active) {
                <div class="rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-red-100 font-semibold">{{ finalSession.emergencyWarning.message }}</div>
              }
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-[.22em] text-emerald-200">SILENT DISEASE HUNTER — YAKUNIY TAHLIL</p>
                  <h2 class="text-2xl font-black mt-1">Abdulloh AI yakuniy natijasi</h2>
                  <p class="text-sm text-slate-400">{{ finalSession.createdAt | date:'medium' }} · {{ finalSession.guestSession ? 'Mehmon sessiyasi' : sdhPatientName(finalSession.patientId || 'umumiy') }} · Dashboardga saqlandi</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button class="sdh-button-secondary" (click)="sdhRetryFinalAnalysis()" [disabled]="sdhAnalysisLoading()">Qayta AI tahlil qilish</button>
                  <button class="sdh-button-primary" (click)="sdhGoToDashboard()">Dashboardga o‘tish</button>
                </div>
              </div>
              <div class="grid sm:grid-cols-4 gap-3">
                <div class="sdh-metric"><p>Umumiy risk</p><strong>{{ finalSession.finalAnalysis.overallRiskPercent }}%</strong></div>
                <div class="sdh-metric"><p>Stabilitet</p><strong>{{ finalSession.finalAnalysis.overallStabilityPercent }}%</strong></div>
                <div class="sdh-metric"><p>AI ishonchliligi</p><strong>{{ finalSession.finalAnalysis.confidencePercent }}%</strong></div>
                <div class="sdh-metric"><p>Signal sifati</p><strong>{{ finalSession.signalQuality['overall'] }}%</strong></div>
              </div>
              <div class="grid lg:grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Har test bo‘yicha score</h3>@for (row of sdhFinalTestRows(finalSession); track row.label) { <div class="mt-3"><div class="flex justify-between text-sm"><span>{{ row.label }}</span><span>{{ row.value }}%</span></div><div class="h-2 rounded-full bg-slate-800"><div class="h-full rounded-full bg-emerald-400" [style.width.%]="row.value"></div></div></div> }</div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Organlar bo‘yicha risk</h3>@for (row of sdhFinalOrganRows(finalSession); track row.label) { <div class="mt-3"><div class="flex justify-between text-sm"><span>{{ row.label }}</span><span>{{ row.value }}%</span></div><div class="h-2 rounded-full bg-slate-800"><div class="h-full rounded-full bg-cyan-400" [style.width.%]="row.value"></div></div></div> }</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h3 class="font-black">Trend solishtirish</h3>
                <p class="text-sm text-slate-300 mt-2">{{ sdhTrendArrow(finalSession.finalAnalysis.trendComparison.riskChange) }} {{ finalSession.finalAnalysis.trendComparison.summary }}</p>
              </div>
              <div class="grid lg:grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Eng muhim topilmalar</h3><ul class="list-disc pl-5 text-sm mt-2 space-y-1">@for (finding of finalSession.finalAnalysis.mainFindings.slice(0, 5); track finding) { <li>{{ finding }}</li> }</ul></div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Tavsiyalar</h3><ul class="list-disc pl-5 text-sm mt-2 space-y-1">@for (rec of finalSession.recommendations; track rec) { <li>{{ rec }}</li> }</ul></div>
              </div>
              <div class="grid lg:grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Bemor uchun sodda xulosa</h3><p class="text-sm text-slate-300 mt-2">{{ finalSession.patientSummary }}</p></div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 class="font-black">Shifokor uchun professional xulosa</h3><p class="text-sm text-slate-300 mt-2">{{ finalSession.doctorSummary }}</p></div>
              </div>
              <div class="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">{{ finalSession.finalAnalysis.disclaimer }}</div>
            </section>
          }

          <div class="grid lg:grid-cols-3 gap-4 mt-5">
            <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 class="font-black">Test scorelari</h3>
              @for (row of sdhScoreRows(); track row.label) {
                <div class="mt-3"><div class="flex justify-between text-sm"><span>{{ row.label }}</span><span>{{ row.value }}%</span></div><div class="h-2 bg-slate-800 rounded-full"><div class="h-full rounded-full bg-cyan-400" [style.width.%]="row.value"></div></div></div>
              }
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 class="font-black">Radar chart</h3>
              <div class="grid grid-cols-6 gap-2 mt-4">
                @for (row of sdhScoreRows(); track row.label) { <div class="rounded-xl border border-slate-700 bg-cyan-400/10 flex items-end h-32"><div class="w-full rounded-b-xl bg-gradient-to-t from-cyan-400 to-emerald-300" [style.height.%]="row.value"></div></div> }
              </div>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 class="font-black">Abdulloh AI chuqur tahlil paneli</h3>
              <p class="text-sm text-slate-300 mt-2">{{ sdhAdvancedAnalysis()?.umumiyFiziologikHolat || 'Yakuniy tahlil bosilganda markerlar Abdulloh AI oqimiga yuboriladi. Xom video/audio yuborilmaydi.' }}</p>
              <ul class="list-disc pl-5 text-sm text-slate-300 mt-3 space-y-1">
                @for (finding of (sdhAdvancedAnalysis()?.engMuhimTopilmalar || []); track finding) { <li>{{ finding }}</li> }
              </ul>
            </div>
          </div>
        </section>
        <div class="grid xl:grid-cols-[.95fr_1.05fr] gap-5">
          <div class="sdh-panel rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-black">Ma’lumot yig‘ish qatlami</h2>
                <p class="text-sm text-slate-400">Har bir manba ixtiyoriy. Yetishmagan ma’lumotlar fallback rejimida belgilanadi.</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-200 border border-cyan-300/20">SDH</span>
            </div>

            <div class="block text-sm text-slate-300">Bemor profili</div>
            <select class="sdh-input w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white" [(ngModel)]="sdhSelectedPatientId">
              <option value="umumiy">Umumiy profil</option>
              @for (patient of sdhPatients(); track patient.id) {
                <option [value]="patient.id">{{ patient.name }}</option>
              }
            </select>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.cameraEnabled"><span>Kamera signali</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.microphoneEnabled"><span>Mikrofon signali</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.wearableProvided"><span>Wearable qo‘lda kiritildi</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.labProvided"><span>Laborator ko‘rsatkichlar bor</span></div>
            </div>

            <div class="grid sm:grid-cols-3 gap-3">
              <div><div class="sdh-label">Yurak urishi</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.heartRate" placeholder="72"></div>
              <div><div class="sdh-label">HRV</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hrv" placeholder="45"></div>
              <div><div class="sdh-label">SpO2</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.spo2" placeholder="98"></div>
              <div><div class="sdh-label">Uyqu soati</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.sleepHours" placeholder="7"></div>
              <div><div class="sdh-label">Glyukoza</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.glucose" placeholder="5.4"></div>
              <div><div class="sdh-label">HbA1c</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hbA1c" placeholder="5.6"></div>
              <div><div class="sdh-label">Gemoglobin</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.hemoglobin" placeholder="135"></div>
              <div><div class="sdh-label">CRP</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.crp" placeholder="3"></div>
              <div><div class="sdh-label">Kreatinin</div><input class="sdh-input" type="number" [(ngModel)]="sdhInput.creatinine" placeholder="80"></div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div><div class="sdh-label">Charchoq darajasi: {{ sdhInput.fatigue }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.fatigue" class="w-full"></div>
              <div><div class="sdh-label">Nafas qisishi: {{ sdhInput.dyspnea }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.dyspnea" class="w-full"></div>
              <div><div class="sdh-label">Stress yuklamasi: {{ sdhInput.stress }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.stress" class="w-full"></div>
              <div><div class="sdh-label">Uyqu sifati: {{ sdhInput.sleepQuality }}%</div><input type="range" min="0" max="100" [(ngModel)]="sdhInput.sleepQuality" class="w-full"></div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.chestDiscomfort"><span>Ko‘krak noqulayligi bor</span></div>
              <div class="sdh-toggle"><input type="checkbox" [(ngModel)]="sdhInput.neurologicalAsymmetry"><span>Nevrologik asimmetriya sezilgan</span></div>
            </div>

            @if (sdhWarnings().length) {
              <div class="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                @for (warning of sdhWarnings(); track warning) { <p>• {{ warning }}</p> }
              </div>
            }

            <div class="flex flex-wrap gap-3">
              <button class="sdh-button-primary" (click)="sdhStartMonitoring()" [disabled]="sdhMonitoring()">Monitoringni boshlash</button>
              <button class="sdh-button-secondary" (click)="sdhStopMonitoring()" [disabled]="!sdhMonitoring()">Monitoringni to‘xtatish</button>
              <button class="sdh-button-secondary" (click)="sdhRunAnalysis()">Tahlilni hisoblash</button>
            </div>
          </div>

          <div class="space-y-5">
            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              @for (item of sdhMonitoringCards(); track item.name) {
                <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-400]="item.active" [class.bg-amber-400]="!item.active"></span><p class="font-bold">{{ item.name }}</p></div>
                  <p class="text-sm text-slate-400 mt-1">{{ item.status }}</p>
                </div>
              }
            </div>

            <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div class="flex items-center justify-between gap-3 mb-4">
                <h2 class="text-xl font-black">Organlar bo‘yicha og‘ish xaritasi</h2>
                <span class="text-xs text-slate-400">Risk foizi va asosiy markerlar</span>
              </div>
              <div class="grid md:grid-cols-2 gap-3">
                @for (organ of sdhCurrentOrganRisks(); track organ.key) {
                  <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <p class="font-bold">{{ organ.nameUz }}</p>
                      <span class="text-sm" [class.text-emerald-300]="organ.percent <= 30" [class.text-amber-300]="organ.percent > 30 && organ.percent <= 60" [class.text-rose-300]="organ.percent > 60">{{ organ.percent }}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-800 overflow-hidden mt-3"><div class="h-full" [class.bg-emerald-400]="organ.percent <= 30" [class.bg-amber-400]="organ.percent > 30 && organ.percent <= 60" [class.bg-rose-500]="organ.percent > 60" [style.width.%]="organ.percent"></div></div>
                    <p class="text-xs text-slate-400 mt-2">{{ organ.levelUz }} · {{ organ.trendUz }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-5">
              <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 class="font-black">Risk vaqt chizig‘i</h3>
                <svg viewBox="0 0 420 150" class="w-full h-40 mt-3">
                  <polyline [attr.points]="sdhTimelinePoints()" fill="none" stroke="#22d3ee" stroke-width="3"></polyline>
                  <line x1="0" y1="115" x2="420" y2="115" stroke="rgba(148,163,184,.25)"></line>
                  <line x1="0" y1="75" x2="420" y2="75" stroke="rgba(148,163,184,.25)"></line>
                </svg>
              </div>
              <div class="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 class="font-black">Fiziologik radar xarita</h3>
                <div class="grid grid-cols-6 gap-2 mt-4">
                  @for (organ of sdhCurrentOrganRisks(); track organ.key) {
                    <div class="h-24 rounded-xl border border-slate-800" [style.background]="sdhHeatColor(organ.percent)" [title]="organ.nameUz"></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        @if (latestResult(); as result) {
          <section class="sdh-result rounded-3xl border border-slate-800 bg-slate-900/85 p-5 md:p-6 space-y-5">
            @if (result.emergencyWarning) {
              <div class="rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-red-100 font-semibold">Bu natija shoshilinch tibbiy baholashni talab qilishi mumkin. Agar kuchli ko‘krak og‘rig‘i, nafas yetishmovchiligi, hushdan ketish, nutq buzilishi yoki tananing bir tomonida kuchsizlik bo‘lsa, darhol shoshilinch tibbiy yordamga murojaat qiling.</div>
            }
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-2xl font-black">Silent Disease Hunter natijasi</h2>
                <p class="text-sm text-slate-400">{{ result.createdAt | date:'medium' }} · Bemor: {{ sdhPatientName(result.patientId) }}</p>
              </div>
              <button class="sdh-button-secondary" (click)="sdhPrintReport()">Hisobotni chop etish</button>
            </div>

            <div class="grid sm:grid-cols-4 gap-3">
              <div class="sdh-metric"><p>Umumiy risk</p><strong>{{ result.overallRisk }}%</strong></div>
              <div class="sdh-metric"><p>Stabilitet</p><strong>{{ result.physiologicalStability }}%</strong></div>
              <div class="sdh-metric"><p>Ishonchlilik</p><strong>{{ result.confidence }}%</strong></div>
              <div class="sdh-metric"><p>Signal sifati</p><strong>{{ result.signalQuality }}%</strong></div>
            </div>

            <div class="grid lg:grid-cols-2 gap-4">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Tushuntiriladigan AI paneli</h3>
                <p class="mt-2 text-slate-200">{{ result.aiSummary }}</p>
                <ul class="list-disc pl-5 mt-3 text-sm text-slate-300 space-y-1">
                  @for (finding of result.aiFindings; track finding) { <li>{{ finding }}</li> }
                </ul>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Ehtimoliy fiziologik yo‘nalishlar</h3>
                @for (item of result.differentialReasoning; track item.titleUz) {
                  <div class="mt-3">
                    <div class="flex justify-between text-sm"><span>{{ item.titleUz }}</span><span>{{ item.percent }}%</span></div>
                    <div class="h-2 rounded-full bg-slate-800 mt-1"><div class="h-full bg-cyan-400 rounded-full" [style.width.%]="item.percent"></div></div>
                    <p class="text-xs text-slate-500 mt-1">{{ item.systemUz }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-4">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Bemor uchun sodda tushuntirish</h3>
                <p class="text-sm text-slate-300 mt-2">{{ result.patientExplanation }}</p>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Shifokor ko‘rigi paneli</h3>
                <textarea class="sdh-input min-h-24 mt-2" [(ngModel)]="sdhDoctorNote" placeholder="Shifokor izohi yoki follow-up rejasi"></textarea>
                <button class="sdh-button-secondary mt-3" (click)="sdhSaveDoctorNote(result)">Izohni saqlash</button>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 class="font-black">Keyingi tavsiyalar</h3>
                <ul class="list-disc pl-5 text-sm text-slate-300 mt-2 space-y-1">
                  @for (rec of result.recommendations; track rec) { <li>{{ rec }}</li> }
                </ul>
              </div>
            </div>

            <div class="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">Bu tizim AI asosidagi fiziologik baholash vositasidir. U yakuniy tashxis qo‘ymaydi va shifokor ko‘rigini almashtirmaydi.</div>
          </section>
        }
      </section>
    </div>
  `,
  styles: [`

    .sdh-advanced-grid { box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 24px 70px rgba(8,47,73,.22); }
    .sdh-video-wrap { position: relative; min-height: 280px; aspect-ratio: 16/10; background: radial-gradient(circle at 50% 35%, rgba(8,145,178,.18), #020617 62%); }
    .sdh-video, .sdh-overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .sdh-overlay { pointer-events: none; }
    .sdh-video-mirror { transform: scaleX(-1); }
    .sdh-camera-badges { position: absolute; left: 1rem; right: 1rem; top: 1rem; display: flex; flex-wrap: wrap; gap: .5rem; z-index: 3; }
    .sdh-badge-blue, .sdh-badge-green, .sdh-badge-yellow, .sdh-badge-red { border-radius: 999px; padding: .45rem .7rem; font-size: .78rem; font-weight: 800; border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); }
    .sdh-badge-blue { background: rgba(59,130,246,.22); color: #dbeafe; }
    .sdh-badge-green { background: rgba(16,185,129,.22); color: #d1fae5; }
    .sdh-badge-yellow { background: rgba(245,158,11,.24); color: #fef3c7; }
    .sdh-badge-red { background: rgba(239,68,68,.26); color: #fee2e2; }
    .sdh-status-dot { width: .65rem; height: .65rem; border-radius: 999px; background: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,.12); }
    .sdh-status-dot-active { background: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,.14); }
    .sdh-mini-stat { border: 1px solid rgb(51 65 85); border-radius: 1rem; background: rgba(2,6,23,.68); padding: .8rem; }
    .sdh-mini-stat span { display: block; color: rgb(148 163 184); font-size: .72rem; }
    .sdh-mini-stat strong { color: white; }
    .sdh-test-card { border: 1px solid rgb(51 65 85); border-radius: 1rem; background: rgba(15,23,42,.86); padding: 1rem; color: rgb(226 232 240); transition: .18s ease; }
    .sdh-test-card:hover, .sdh-test-card-active { border-color: rgb(34 211 238); transform: translateY(-1px); box-shadow: 0 16px 35px rgba(34,211,238,.1); }
    .sdh-test-card strong, .sdh-test-card small { display: block; }
    .sdh-test-card small { color: rgb(148 163 184); margin-top: .35rem; }
    .sdh-input { width: 100%; border-radius: 0.75rem; border: 1px solid rgb(51 65 85); background: rgba(2, 6, 23, .82); color: white; padding: .75rem 1rem; outline: none; }
    .sdh-input:focus { border-color: rgb(34 211 238); box-shadow: 0 0 0 4px rgba(34, 211, 238, .12); }
    .sdh-label { display: block; font-size: .75rem; color: rgb(203 213 225); margin-bottom: .35rem; }
    .sdh-toggle { display: flex; align-items: center; gap: .6rem; border: 1px solid rgb(51 65 85); border-radius: 1rem; padding: .85rem; background: rgba(15, 23, 42, .8); color: rgb(226 232 240); font-size: .9rem; }
    .sdh-button-primary { border-radius: .9rem; background: linear-gradient(90deg, #0891b2, #4f46e5); color: white; padding: .8rem 1.1rem; font-weight: 800; box-shadow: 0 14px 35px rgba(34, 211, 238, .16); }
    .sdh-button-primary:disabled, .sdh-button-secondary:disabled { opacity: .55; cursor: not-allowed; }
    .sdh-button-secondary { border-radius: .9rem; border: 1px solid rgb(51 65 85); background: rgba(15, 23, 42, .88); color: rgb(226 232 240); padding: .8rem 1.1rem; font-weight: 700; }
    .sdh-metric { border: 1px solid rgb(51 65 85); border-radius: 1rem; background: rgba(2, 6, 23, .65); padding: 1rem; }
    .sdh-metric p { color: rgb(148 163 184); font-size: .78rem; }
    .sdh-metric strong { display: block; color: white; font-size: 1.8rem; line-height: 1.1; margin-top: .25rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SilentDiseaseHunterComponent implements OnInit, OnDestroy {
  private sdhStorage = inject(SilentDiseaseHunterStorageService);
  private sdhSupabase = inject(SupabaseService);
  private sdhHandTracker = inject(HandTrackerService);
  private sdhInterpreter = inject(SilentDiseaseHunterInterpretationService);
  private sdhRouter = inject(Router);

  @ViewChild('sdhVideo') sdhVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('sdhCanvas') sdhCanvasRef?: ElementRef<HTMLCanvasElement>;

  sdhPatients = signal<SdhPatientOption[]>([]);
  sdhMonitoring = signal(false);
  sdhWarnings = signal<string[]>(['Kamera, mikrofon, wearable yoki laborator ma’lumotlar kiritilmasa ham fallback baholash ishlaydi.']);
  latestResult = signal<SdhResult | null>(null);
  sdhLiveRisk = signal(28);
  sdhLiveStability = signal(72);
  sdhLiveConfidence = signal(64);
  sdhSignalQuality = signal(70);
  sdhDoctorNote = '';
  sdhSelectedPatientId = 'umumiy';

  sdhMirrorPreview = false;
  sdhCameraReady = signal(false);
  sdhMicReady = signal(false);
  sdhAdvancedRunning = signal(false);
  sdhAdvancedTestMode: 'automatic' | 'manual' = 'manual';
  sdhActiveTestId = signal<SdhAdvancedTestId | null>(null);
  sdhCountdown = signal(0);
  sdhAdvancedProgress = signal(0);
  sdhAdvancedWarning = signal('');
  sdhFeedbackMessage = signal('Test boshlanishini kutyapti');
  sdhFeedbackTone = signal<SdhFeedbackTone>('blue');
  sdhHandDetected = signal(false);
  sdhHandSkeletonQuality = signal(0);
  sdhAdvancedCompletedTests = signal<SdhAdvancedTestId[]>([]);
  sdhTestCompletion = signal<SdhTestCompletionState>({ breathing: 'pending', facialMimic: 'pending', handMotor: 'pending', coughVoiceReading: 'pending', cardiac: 'pending' });
  sdhAnalysisStarted = false;
  sdhAnalysisLoading = signal(false);
  sdhAnalysisLoadingStep = signal('');
  sdhFinalAnalysisResult = signal<SdhFinalAnalysisSession | null>(null);
  sdhFinalAnalysisNotice = signal('');
  sdhPatientChoicePanel = signal(false);
  sdhPendingAnalysisSource = signal<SdhFinalAnalysisSource>('manual');
  sdhGuestSessionConfirmed = signal(false);
  sdhAdvancedAnalysis = signal<import('../../services/silent-disease-hunter-interpretation').SdhAdvancedGeminiAnalysis | null>(null);
  sdhAdvancedSignalQuality = signal({ camera: 58, microphone: 55, manual: 70, skeleton: 0 });
  sdhAdvancedScores = signal({
    breathing: 66, facial: 68, hand: 62, voice: 64, cardiac: 61, signal: 58, stability: 65
  });
  sdhAdvancedProtocol: SdhProtocolStep[] = [
    { id: 'breathing', titleUz: '1. Nafas testi', durationSec: 30, instructionUz: 'Oddiy nafas oling, keyin chuqur nafas chiqarish va 10 soniya xavfsiz nafas ushlab turish bosqichlari baholanadi.', tasksUz: ['Tinch nafas: 30 soniya', 'Chuqur nafas olib sekin chiqaring', '10 soniya xavfsiz ushlab turing', 'Qisqa jumlani o‘qing'] },
    { id: 'facial', titleUz: '2. Yuz mimika testi', durationSec: 35, instructionUz: 'Tabassum, qosh ko‘tarish, ko‘zni yumish, lab cho‘chchaytirish, og‘iz ochish va yonoq shishirish mashqlarini bajaring.', tasksUz: ['Tabassum 5 soniya', 'Qoshlarni ko‘taring', 'Ko‘zlarni mahkam yuming', 'Lab va yonoq nazorati'] },
    { id: 'hand', titleUz: '3. Qo‘l motorikasi testi', durationSec: 40, instructionUz: 'Qo‘lni kameraga ko‘rsating. Skeleton yashil chiziqlar bilan chiqadi; ochish-yopish, pinch, OK, thumbs-up va tremor monitoring bajariladi.', tasksUz: ['Kaftni ochish-yopish', 'Barmoqlarga tekkizish', 'OK / thumbs-up / pinch', '20 soniya stabil ushlash'] },
    { id: 'voice', titleUz: '4. Yo‘talish va ovoz testi', durationSec: 35, instructionUz: '3 marta yo‘taling, “Aa” tovushini 5 soniya cho‘zing va berilgan matnni bir maromda o‘qing.', tasksUz: ['3 marta yo‘talish', '“Aa” tovushini cho‘zish', 'Matnni o‘qish', 'Pauza va nutq ritmini kuzatish'] },
    { id: 'cardiac', titleUz: '5. Yurak holati testi', durationSec: 30, instructionUz: 'Tinch holatda turing. Ko‘krak/yelka mikroharakati, manual HR/HRV/SpO2 va simptom javoblari risk signali sifatida birlashtiriladi.', tasksUz: ['Ko‘krak mikroharakati', 'Barmoq kamera pulse demo signali', 'HR/HRV/SpO2 manual input', 'Ko‘krak og‘rig‘i va bosh aylanish savollari'] }
  ];

  private sdhAdvancedTimer: number | null = null;
  private sdhAdvancedRaf: number | null = null;
  private sdhAudioContext: AudioContext | null = null;
  private sdhAnalyser: AnalyserNode | null = null;
  private sdhAudioBuffer = new Uint8Array(128);
  private sdhFrameSamples: number[] = [];
  private sdhAutoQueue: SdhAdvancedTestId[] = [];

  sdhInput: SdhInputSnapshot = {
    patientId: 'umumiy',
    cameraEnabled: false,
    microphoneEnabled: false,
    wearableProvided: false,
    labProvided: false,
    questionnaireProvided: true,
    heartRate: null,
    hrv: null,
    spo2: null,
    sleepHours: null,
    glucose: null,
    hbA1c: null,
    hemoglobin: null,
    crp: null,
    creatinine: null,
    alt: null,
    fatigue: 35,
    dyspnea: 20,
    stress: 35,
    sleepQuality: 65,
    chestDiscomfort: false,
    neurologicalAsymmetry: false
  };

  private sdhTimer: number | null = null;
  private sdhMediaStream: MediaStream | null = null;
  private sdhTimeline = [22, 26, 24, 30, 28, 32];

  async ngOnInit() {
    await this.sdhLoadPatients();
    const list = await this.sdhStorage.sdhList();
    this.latestResult.set(list[0] ?? null);
  }

  ngOnDestroy() {
    this.sdhStopAdvancedProtocol();
    this.sdhStopMonitoring();
  }

  async sdhLoadPatients() {
    const { data } = await this.sdhSupabase.getCases();
    const cases = Array.isArray(data) ? data : [];
    this.sdhPatients.set(cases.map((item) => {
      const record = item as { id?: string; patient_name?: string; name?: string; title?: string };
      return {
        id: String(record.id ?? 'umumiy'),
        name: String(record.patient_name ?? record.name ?? record.title ?? 'Bemor profili')
      };
    }));
  }


  sdhProtocolOverview(): string[] {
    return this.sdhAdvancedProtocol.map((step) => step.titleUz);
  }

  sdhActiveStep(): SdhProtocolStep | null {
    const id = this.sdhActiveTestId();
    return this.sdhAdvancedProtocol.find((step) => step.id === id) ?? null;
  }

  sdhFeedbackClass(): string {
    return `sdh-badge-${this.sdhFeedbackTone()}`;
  }

  async sdhStartAutomaticProtocol() {
    this.sdhAutoQueue = this.sdhAdvancedProtocol.map((step) => step.id);
    await this.sdhRunNextAutomaticStep();
  }

  async sdhStartManualTest(id: SdhAdvancedTestId) {
    this.sdhAutoQueue = [];
    await this.sdhStartAdvancedTest(id, 'manual');
  }

  private async sdhRunNextAutomaticStep() {
    const next = this.sdhAutoQueue.shift();
    if (!next) {
      this.sdhAdvancedRunning.set(false);
      this.sdhActiveTestId.set(null);
      this.sdhFeedbackTone.set('green');
      this.sdhFeedbackMessage.set('Avtomatik protokol yakunlandi. Yakuniy tahlilni hisoblash mumkin.');
      return;
    }
    await this.sdhStartAdvancedTest(next, 'automatic');
  }

  private async sdhStartAdvancedTest(id: SdhAdvancedTestId, mode: 'automatic' | 'manual') {
    const step = this.sdhAdvancedProtocol.find((x) => x.id === id);
    if (!step) return;
    this.sdhAdvancedTestMode = mode;
    this.sdhAdvancedRunning.set(true);
    this.sdhActiveTestId.set(id);
    this.sdhCountdown.set(step.durationSec);
    this.sdhAdvancedProgress.set(0);
    this.sdhFrameSamples = [];
    this.sdhFeedbackTone.set('blue');
    this.sdhFeedbackMessage.set(`${step.titleUz} boshlandi. Instruktsiyani bajaring.`);
    await this.sdhEnsureAdvancedMedia();
    if (this.sdhAdvancedTimer) window.clearInterval(this.sdhAdvancedTimer);
    this.sdhAdvancedTimer = window.setInterval(() => {
      const left = this.sdhCountdown() - 1;
      this.sdhCountdown.set(Math.max(0, left));
      this.sdhAdvancedProgress.set(this.sdhClamp(((step.durationSec - Math.max(0, left)) / step.durationSec) * 100, 0, 100));
      this.sdhUpdateAdvancedScores(id);
      if (left <= 0) {
        if (this.sdhAdvancedTimer) window.clearInterval(this.sdhAdvancedTimer);
        this.sdhAdvancedTimer = null;
        this.sdhMarkCompleted(id);
        if (mode === 'automatic') void this.sdhRunNextAutomaticStep();
        else this.sdhAdvancedRunning.set(false);
      }
    }, 1000);
  }

  async sdhEnsureAdvancedMedia() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.sdhAdvancedWarning.set('Brauzer kamera/mikrofon APIlarini qo‘llab-quvvatlamaydi. Manual fallback ishlaydi.');
      return;
    }
    if (!this.sdhMediaStream) {
      try {
        this.sdhMediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      } catch {
        this.sdhAdvancedWarning.set('Signal sifati past. Kamera yoki mikrofon ruxsati berilmadi. Natija ishonchliligi kamayishi mumkin, lekin test davom etadi.');
        return;
      }
    }
    const video = this.sdhVideoRef?.nativeElement;
    if (video && video.srcObject !== this.sdhMediaStream) {
      video.srcObject = this.sdhMediaStream;
      await video.play().catch(() => undefined);
    }
    this.sdhCameraReady.set(this.sdhMediaStream.getVideoTracks().some((track) => track.readyState === 'live'));
    this.sdhMicReady.set(this.sdhMediaStream.getAudioTracks().some((track) => track.readyState === 'live'));
    if (this.sdhMicReady() && !this.sdhAnalyser) this.sdhSetupAudioAnalyser(this.sdhMediaStream);
    void this.sdhHandTracker.initialize();
    if (!this.sdhAdvancedRaf) this.sdhAdvancedLoop();
  }

  sdhStopAdvancedProtocol() {
    this.sdhAdvancedRunning.set(false);
    this.sdhActiveTestId.set(null);
    this.sdhCountdown.set(0);
    this.sdhAdvancedProgress.set(0);
    this.sdhAutoQueue = [];
    if (this.sdhAdvancedTimer) window.clearInterval(this.sdhAdvancedTimer);
    this.sdhAdvancedTimer = null;
    if (this.sdhAdvancedRaf) cancelAnimationFrame(this.sdhAdvancedRaf);
    this.sdhAdvancedRaf = null;
    this.sdhAudioContext?.close().catch(() => undefined);
    this.sdhAudioContext = null;
    this.sdhAnalyser = null;
  }

  private sdhSetupAudioAnalyser(stream: MediaStream) {
    try {
      this.sdhAudioContext = new AudioContext();
      const source = this.sdhAudioContext.createMediaStreamSource(stream);
      this.sdhAnalyser = this.sdhAudioContext.createAnalyser();
      this.sdhAnalyser.fftSize = 256;
      source.connect(this.sdhAnalyser);
    } catch {
      this.sdhMicReady.set(false);
      this.sdhAdvancedWarning.set('Mikrofon analizatori ishga tushmadi. Ovoz testi manual modega o‘tdi.');
    }
  }

  private sdhAdvancedLoop = () => {
    const video = this.sdhVideoRef?.nativeElement;
    const canvas = this.sdhCanvasRef?.nativeElement;
    if (video && canvas) {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 400;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(34,211,238,.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(12, 12, w - 24, h - 24);
        const handResult = this.sdhHandTracker.detect(video, performance.now());
        this.sdhDrawHandSkeleton(ctx, handResult, w, h);
        this.sdhSampleFrame(video, ctx);
      }
    }
    this.sdhAdvancedRaf = requestAnimationFrame(this.sdhAdvancedLoop);
  };

  private sdhDrawHandSkeleton(ctx: CanvasRenderingContext2D, handResult: NormalizedHandLandmarkerResult | null, w: number, h: number) {
    const hand = handResult?.landmarks?.[0];
    this.sdhHandDetected.set(!!hand?.length);
    this.sdhHandSkeletonQuality.set(hand?.length ? this.sdhClamp((handResult?.handedness?.[0]?.[0]?.score ?? .7) * 100, 1, 99) : 0);
    const quality = this.sdhHandSkeletonQuality();
    this.sdhAdvancedSignalQuality.update((q) => ({ ...q, skeleton: quality }));
    if (!hand?.length) {
      if (this.sdhActiveTestId() === 'hand') {
        this.sdhFeedbackTone.set('yellow');
        this.sdhFeedbackMessage.set('Qo‘lni kameraga yaqinroq tuting. Kaft to‘liq ko‘rinmayapti.');
      }
      return;
    }
    const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    for (const [a,b] of connections) {
      const p1 = hand[a]; const p2 = hand[b];
      if (!p1 || !p2) continue;
      ctx.beginPath(); ctx.moveTo(p1.x * w, p1.y * h); ctx.lineTo(p2.x * w, p2.y * h); ctx.stroke();
    }
    ctx.fillStyle = '#86efac';
    for (const p of hand) { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2); ctx.fill(); }
    if (this.sdhActiveTestId() === 'hand') {
      this.sdhFeedbackTone.set(quality > 55 ? 'green' : 'yellow');
      this.sdhFeedbackMessage.set(quality > 55 ? 'Mashq to‘g‘ri bajarilmoqda, skeleton aniqlanyapti.' : 'Barmoqlar yetarli aniqlanmadi. Qo‘lni yorug‘roq joyga olib keling.');
    }
  }

  private sdhSampleFrame(video: HTMLVideoElement, ctx: CanvasRenderingContext2D) {
    try {
      ctx.drawImage(video, 0, 0, 96, 60);
      const data = ctx.getImageData(0, 0, 96, 60).data;
      let light = 0;
      for (let i = 0; i < data.length; i += 16) light += (data[i] + data[i + 1] + data[i + 2]) / 3;
      const brightness = this.sdhClamp(light / (data.length / 16), 1, 255);
      const cameraQuality = this.sdhClamp((brightness / 255) * 70 + (video.readyState >= 2 ? 25 : 0), 5, 98);
      this.sdhFrameSamples.push(cameraQuality);
      this.sdhFrameSamples = this.sdhFrameSamples.slice(-90);
      let micQuality = this.sdhMicReady() ? 62 : 35;
      if (this.sdhAnalyser) {
        this.sdhAnalyser.getByteTimeDomainData(this.sdhAudioBuffer);
        const amp = this.sdhAudioBuffer.reduce((sum, x) => sum + Math.abs(x - 128), 0) / this.sdhAudioBuffer.length;
        micQuality = this.sdhClamp(amp * 4 + 35, 10, 98);
      }
      const avgCamera = this.sdhClamp(this.sdhFrameSamples.reduce((a,b)=>a+b, 0) / Math.max(1, this.sdhFrameSamples.length), 1, 98);
      this.sdhAdvancedSignalQuality.set({ camera: avgCamera, microphone: micQuality, manual: this.sdhInput.questionnaireProvided ? 78 : 45, skeleton: this.sdhHandSkeletonQuality() });
      if (avgCamera < 35 && this.sdhActiveTestId()) {
        this.sdhFeedbackTone.set('yellow');
        this.sdhFeedbackMessage.set('Signal sifati past. Natija ishonchliligi kamayishi mumkin. Davom etish mumkin, lekin ehtiyotkor talqin qiling.');
      }
    } catch { /* canvas may be unavailable before video metadata */ }
  }

  private sdhUpdateAdvancedScores(id: SdhAdvancedTestId) {
    const q = this.sdhAdvancedSignalQuality();
    const base = this.sdhClamp((q.camera + q.microphone + q.manual + Math.max(35, q.skeleton)) / 4, 1, 99);
    this.sdhAdvancedScores.update((scores) => {
      const next = { ...scores };
      if (id === 'breathing') next.breathing = this.sdhClamp(base - this.sdhInput.dyspnea * .18 + (this.sdhInput.spo2 ? Math.min(10, (this.sdhInput.spo2 - 94) * 2) : 0), 1, 99);
      if (id === 'facial') next.facial = this.sdhClamp(q.camera * .75 + (this.sdhInput.neurologicalAsymmetry ? 20 : 18), 1, 99);
      if (id === 'hand') next.hand = this.sdhClamp(q.skeleton * .72 + q.camera * .22 + (this.sdhHandDetected() ? 8 : -10), 1, 99);
      if (id === 'voice') next.voice = this.sdhClamp(q.microphone * .78 + (100 - this.sdhInput.stress) * .1, 1, 99);
      if (id === 'cardiac') next.cardiac = this.sdhClamp(q.camera * .25 + (this.sdhInput.heartRate ? 78 - Math.abs(this.sdhInput.heartRate - 72) * .6 : 58) + (this.sdhInput.hrv ? Math.min(12, this.sdhInput.hrv / 5) : 0), 1, 99);
      next.signal = this.sdhClamp((q.camera + q.microphone + q.manual + Math.max(0, q.skeleton)) / 4, 1, 99);
      next.stability = this.sdhClamp((next.breathing + next.facial + next.hand + next.voice + next.cardiac) / 5, 1, 99);
      return next;
    });
    this.sdhFeedbackTone.set(base > 60 ? 'green' : base > 35 ? 'yellow' : 'red');
    if (this.sdhActiveTestId() !== 'hand') this.sdhFeedbackMessage.set(base > 60 ? 'To‘g‘ri bajarildi, signal yetarli.' : 'Signal past yoki harakat aniqlanmadi. Instruktsiyani aniqroq bajaring.');
  }

  private sdhMarkCompleted(id: SdhAdvancedTestId) {
    this.sdhAdvancedCompletedTests.update((items) => items.includes(id) ? items : [...items, id]);
    this.sdhUpdateTestCompletion(id, 'completed');
    this.sdhFeedbackTone.set('green');
    this.sdhFeedbackMessage.set('Mini-test yakunlandi. Keyingi testga o‘tish mumkin.');
    void this.sdhAutoStartAnalysisIfReady();
  }

  sdhScoreRows() {
    const s = this.sdhAdvancedScores();
    return [
      { label: 'Nafas stabiliteti', value: s.breathing },
      { label: 'Mimika simmetriyasi', value: s.facial },
      { label: 'Qo‘l motorikasi', value: s.hand },
      { label: 'Ovoz/nutq', value: s.voice },
      { label: 'Yurak signali', value: s.cardiac },
      { label: 'Signal sifati', value: s.signal }
    ];
  }

  async sdhRunAdvancedAnalysis() {
    await this.sdhRunFinalAnalysis({ source: 'manual', allowPartial: true, force: true });
  }

  sdhLoadingSteps(): string[] {
    return [
      'Test markerlari yig‘ilmoqda...',
      'Signal sifati tekshirilmoqda...',
      'Abdulloh AI klinik-multimodal tahlil qilmoqda...',
      'Organlar bo‘yicha risk xaritasi tuzilmoqda...',
      'Natijalar dashboardga saqlanmoqda...'
    ];
  }

  sdhAreAllRequiredTestsCompleted(testState: SdhTestCompletionState): boolean {
    const finished: SdhTestCompletionStatus[] = ['completed', 'completedWithWarning', 'skipped'];
    return Boolean(
      finished.includes(testState?.breathing) &&
      finished.includes(testState?.facialMimic) &&
      finished.includes(testState?.handMotor) &&
      finished.includes(testState?.coughVoiceReading) &&
      finished.includes(testState?.cardiac)
    );
  }

  sdhIsProtocolFinished(): boolean {
    return this.sdhAreAllRequiredTestsCompleted(this.sdhTestCompletion());
  }

  sdhUpdateTestCompletion(id: SdhAdvancedTestId, status: SdhTestCompletionStatus) {
    const key = this.sdhCompletionKey(id);
    this.sdhTestCompletion.update((state) => ({ ...state, [key]: status }));
  }

  async sdhAutoStartAnalysisIfReady() {
    if (this.sdhAnalysisStarted || this.sdhAnalysisLoading()) return;
    if (!this.sdhIsProtocolFinished()) return;
    this.sdhAnalysisStarted = true;
    await this.sdhRunFinalAnalysis({ source: 'auto', allowPartial: false });
  }

  async sdhRunFinalAnalysis(options: { source: SdhFinalAnalysisSource; allowPartial?: boolean; force?: boolean }) {
    const state = this.sdhTestCompletion();
    const hasPending = Object.values(state).includes('pending');
    if (hasPending && !options.allowPartial) {
      this.sdhAdvancedWarning.set('Ba’zi testlar hali pending. “Mavjud natijalar bilan tahlil qilish” rejimida Tahlilni boshlash tugmasini qayta bosing.');
      return;
    }
    if (this.sdhAnalysisLoading()) return;
    if (!options.force && this.sdhFinalAnalysisResult() && options.source === 'manual') {
      this.sdhAdvancedWarning.set('Yakuniy natija allaqachon saqlandi. Qayta tahlil qilish uchun alohida tugmadan foydalaning.');
      return;
    }
    if (this.sdhSelectedPatientId === 'umumiy' && this.sdhPatients().length && !this.sdhGuestSessionConfirmed() && options.source === 'manual') {
      this.sdhPatientChoicePanel.set(true);
      this.sdhPendingAnalysisSource.set(options.source);
      return;
    }

    this.sdhPatientChoicePanel.set(this.sdhSelectedPatientId === 'umumiy' && this.sdhPatients().length > 0);
    this.sdhAnalysisLoading.set(true);
    this.sdhFinalAnalysisNotice.set('');
    const loadingSteps = this.sdhLoadingSteps();
    const createdAt = new Date().toISOString();

    try {
      for (const step of loadingSteps.slice(0, 2)) {
        this.sdhAnalysisLoadingStep.set(step);
        await this.sdhDelay(120);
      }
      const payload = this.sdhBuildFinalAnalysisPayload(options.source, createdAt);
      this.sdhAnalysisLoadingStep.set(loadingSteps[2]);
      const serviceResult = await this.sdhInterpreter.sdhInterpretFinal(payload);
      this.sdhAnalysisLoadingStep.set(loadingSteps[3]);
      const session = this.sdhBuildFinalAnalysisSession(payload, serviceResult.analysis, serviceResult.source, options.source, createdAt);
      await this.sdhDelay(120);
      this.sdhAnalysisLoadingStep.set(loadingSteps[4]);
      this.sdhStorage.sdhSaveFinalAnalysis(session);
      this.sdhFinalAnalysisResult.set(session);
      this.sdhAdvancedAnalysis.set(this.sdhMapFinalToAdvancedSummary(serviceResult.analysis, serviceResult.source));
      this.sdhFinalAnalysisNotice.set(serviceResult.source === 'local' ? 'Abdulloh AI lokal baholash rejimida natija chiqardi.' : 'Abdulloh AI yakuniy tahlili dashboardga saqlandi.');
      this.sdhAdvancedWarning.set(this.sdhFinalAnalysisNotice());
      setTimeout(() => document.getElementById('sdh-final-result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } finally {
      this.sdhAnalysisLoading.set(false);
      this.sdhAnalysisLoadingStep.set('');
    }
  }

  async sdhConfirmPatientAndRunAnalysis() {
    this.sdhGuestSessionConfirmed.set(this.sdhSelectedPatientId === 'umumiy');
    this.sdhPatientChoicePanel.set(false);
    await this.sdhRunFinalAnalysis({ source: this.sdhPendingAnalysisSource(), allowPartial: true, force: true });
  }

  async sdhContinueAsGuest() {
    this.sdhSelectedPatientId = 'umumiy';
    this.sdhGuestSessionConfirmed.set(true);
    this.sdhPatientChoicePanel.set(false);
    await this.sdhRunFinalAnalysis({ source: this.sdhPendingAnalysisSource(), allowPartial: true, force: true });
  }

  async sdhRetryFinalAnalysis() {
    this.sdhAnalysisStarted = false;
    await this.sdhRunFinalAnalysis({ source: 'manual', allowPartial: true, force: true });
  }

  sdhGoToDashboard() {
    this.sdhRouter.navigate(['/dashboard']);
  }

  sdhFinalTestRows(session: SdhFinalAnalysisSession) {
    const scores = session.finalAnalysis.testScores;
    return [
      { label: 'Nafas', value: scores.breathing },
      { label: 'Mimika', value: scores.facialMimic },
      { label: 'Qo‘l motorikasi', value: scores.handMotor },
      { label: 'Yo‘tal/ovoz/o‘qish', value: scores.coughVoiceReading },
      { label: 'Yurak', value: scores.cardiac }
    ];
  }

  sdhFinalOrganRows(session: SdhFinalAnalysisSession) {
    const risks = session.finalAnalysis.organRisks;
    return [
      { label: 'Yurak-qon tomir', value: risks.cardiovascular },
      { label: 'Nafas tizimi', value: risks.respiratory },
      { label: 'Asab/motorika', value: risks.neuromotor },
      { label: 'Psixofiziologik stress', value: risks.psychophysiologicalStress },
      { label: 'Metabolik', value: risks.metabolic },
      { label: 'Cellular/yallig‘lanish', value: risks.cellularInflammatory }
    ];
  }

  sdhTrendArrow(change: string): string {
    if (change === 'increased') return '↑ yomonlashgan';
    if (change === 'decreased') return '↓ yaxshilangan';
    if (change === 'stable') return '→ stabil';
    return 'oldingi natija yo‘q';
  }

  private sdhBuildFinalAnalysisPayload(source: SdhFinalAnalysisSource, createdAt: string): SdhFinalAnalysisPayload {
    const metrics = this.sdhBuildAdvancedMetrics();
    const signal = this.sdhBuildFinalSignalQuality();
    const previous = this.sdhPreviousFinalAnalysis();
    const guestSession = this.sdhSelectedPatientId === 'umumiy';
    return {
      meta: { platform: 'Abdulloh AI', module: 'Silent Disease Hunter', analysisType: 'multimodal_final_analysis', createdAt, patientId: guestSession ? null : this.sdhSelectedPatientId, guestSession, source, language: 'uz' },
      completedTests: this.sdhTestCompletion(),
      signalQuality: signal,
      breathingResults: metrics.breathingResults,
      facialMimicResults: metrics.facialMimicResults,
      handMotorResults: metrics.handMotorResults,
      coughVoiceReadingResults: metrics.coughVoiceReadingResults,
      cardiacResults: metrics.cardiacResults,
      manualInputs: metrics.manualInputs,
      labInputs: metrics.labInputs,
      wearableInputs: metrics.wearableInputs,
      previousResultForTrend: previous
    };
  }

  private sdhBuildFinalAnalysisSession(payload: SdhFinalAnalysisPayload, analysis: SdhFinalAnalysisResponse, source: 'gemini' | 'local', runSource: SdhFinalAnalysisSource, createdAt: string): SdhFinalAnalysisSession {
    const metrics = this.sdhBuildAdvancedMetrics();
    const radar = this.sdhFinalTestRows({ finalAnalysis: analysis } as SdhFinalAnalysisSession);
    const organRisk = this.sdhFinalOrganRows({ finalAnalysis: analysis } as SdhFinalAnalysisSession);
    return {
      id: `sdh-analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId: payload.meta.patientId,
      guestSession: payload.meta.guestSession,
      createdAt,
      module: 'Silent Disease Hunter',
      analysisVersion: 'advanced-final-v1',
      source: runSource,
      completedTests: payload.completedTests,
      skippedTests: Object.entries(payload.completedTests).filter(([, value]) => value === 'skipped').map(([key]) => key),
      signalQuality: payload.signalQuality,
      rawTestMetrics: { breathingResults: metrics.breathingResults, facialMimicResults: metrics.facialMimicResults, handMotorResults: metrics.handMotorResults, coughVoiceReadingResults: metrics.coughVoiceReadingResults, cardiacResults: metrics.cardiacResults },
      manualInputs: metrics.manualInputs,
      labInputs: metrics.labInputs,
      wearableInputs: metrics.wearableInputs,
      geminiAnalysis: source === 'gemini' ? analysis : null,
      fallbackAnalysis: source === 'local' ? analysis : null,
      finalAnalysis: analysis,
      riskScores: { overallRisk: analysis.overallRiskPercent, physiologicalStability: analysis.overallStabilityPercent, confidence: analysis.confidencePercent },
      organRisks: analysis.organRisks,
      trendComparison: analysis.trendComparison,
      patientSummary: analysis.patientSummary,
      doctorSummary: analysis.doctorSummary,
      recommendations: analysis.recommendations,
      emergencyWarning: analysis.emergencyWarning,
      chartData: { radar, bar: radar, timeline: [...this.sdhTimeline, analysis.overallRiskPercent], organRisk }
    };
  }

  private sdhBuildAdvancedMetrics() {
    const scores = this.sdhAdvancedScores();
    const q = this.sdhAdvancedSignalQuality();
    const features = this.sdhExtractFeatures(this.sdhBuildSnapshot());
    const breathingRisk = 100 - scores.breathing;
    const voiceRisk = 100 - scores.voice;
    const cardiacRisk = 100 - scores.cardiac;
    return {
      breathingResults: { respiratoryRhythmScore: scores.breathing, breathStabilityScore: scores.breathing, chestMotionScore: q.camera, dyspneaSignalScore: breathingRisk, breathRecoveryScore: scores.stability, notes: 'Nafas markerlari kamera/mikrofon/manual signallar asosida hisoblandi.' },
      facialMimicResults: { facialSymmetryScore: scores.facial, smileSymmetryScore: scores.facial, eyeClosureScore: scores.facial, browMovementScore: scores.facial, lipControlScore: scores.facial, cheekPuffScore: scores.facial, mouthOpeningScore: scores.facial, facialFatigueScore: 100 - scores.facial, notes: 'Mimika signallari tashxis emas, nevrologik kuzatuv signali.' },
      handMotorResults: { handDetected: this.sdhHandDetected(), handSkeletonQuality: q.skeleton, gestureAccuracyScore: scores.hand, fingerTappingScore: scores.hand, fineMotorScore: scores.hand, tremorSignalScore: 100 - scores.hand, movementSpeedScore: scores.hand, motorSymmetryScore: scores.hand, reactionTimeScore: scores.hand, neuromotorRiskSignal: 100 - scores.hand, notes: 'Qo‘l skeletoni va gesture signallari mavjud holatda baholandi.' },
      coughVoiceReadingResults: { coughPatternScore: scores.voice, voiceStabilityScore: scores.voice, voiceTremorScore: voiceRisk, speechSpeedScore: scores.voice, pauseFrequencyScore: voiceRisk, breathDuringSpeechScore: scores.breathing, vocalStressIndex: voiceRisk, respiratoryVoiceSignal: scores.voice, notes: 'Yo‘tal/ovoz/o‘qish markerlari mikrofon yoki fallback orqali baholandi.' },
      cardiacResults: { heartRateSignal: this.sdhInput.heartRate ?? 'manual kiritilmagan', hrvSignal: this.sdhInput.hrv ?? 'manual kiritilmagan', pulseStabilityScore: scores.cardiac, cardiacMotionScore: q.camera, arrhythmiaRiskSignal: cardiacRisk, cardiacSymptomScore: this.sdhInput.chestDiscomfort ? 78 : 24, cardiorespiratoryRiskScore: this.sdhClamp((cardiacRisk + breathingRisk) / 2, 1, 99), emergencyCardiacFlag: this.sdhAdvancedEmergencyFlags({ breathingRisk, facialRisk: 100 - scores.facial, handRisk: 100 - scores.hand, voiceRisk, cardiacRisk }, this.sdhFuseOrganRisks(features)).length > 0, notes: 'Yurak signali monitoring/risk signali bo‘lib, yakuniy tashxis emas.' },
      manualInputs: { symptoms: '', complaints: '', medicalHistory: '', medications: '', lifestyle: '', sleep: this.sdhInput.sleepHours, stress: this.sdhInput.stress, pain: this.sdhInput.chestDiscomfort, dyspnea: this.sdhInput.dyspnea, chestPain: this.sdhInput.chestDiscomfort, dizziness: false, fainting: false, fatigue: this.sdhInput.fatigue, neurologicalAsymmetry: this.sdhInput.neurologicalAsymmetry },
      labInputs: { glucose: this.sdhInput.glucose, hbA1c: this.sdhInput.hbA1c, hemoglobin: this.sdhInput.hemoglobin, crp: this.sdhInput.crp, creatinine: this.sdhInput.creatinine, alt: this.sdhInput.alt },
      wearableInputs: { heartRate: this.sdhInput.heartRate, hrv: this.sdhInput.hrv, spo2: this.sdhInput.spo2, sleepHours: this.sdhInput.sleepHours }
    };
  }

  private sdhBuildFinalSignalQuality(): Record<string, number> {
    const q = this.sdhAdvancedSignalQuality();
    const overall = this.sdhClamp((q.camera + q.microphone + q.manual + Math.max(0, q.skeleton)) / 4, 1, 99);
    return { camera: q.camera, microphone: q.microphone, handSkeleton: q.skeleton, faceTracking: q.camera, breathingTracking: q.camera, cardiacSignal: q.camera, overall };
  }

  private sdhPreviousFinalAnalysis() {
    const patientId = this.sdhSelectedPatientId === 'umumiy' ? undefined : this.sdhSelectedPatientId;
    const previous = this.sdhStorage.sdhListFinalAnalyses(patientId).find((item) => patientId ? item.patientId === patientId : item.guestSession);
    return {
      exists: !!previous,
      previousCreatedAt: previous?.createdAt ?? null,
      previousOverallRisk: previous?.finalAnalysis?.overallRiskPercent ?? null,
      previousOrganRisks: previous?.finalAnalysis?.organRisks ?? null,
      previousMainFindings: previous?.finalAnalysis?.mainFindings ?? []
    };
  }

  private sdhMapFinalToAdvancedSummary(analysis: SdhFinalAnalysisResponse, source: 'gemini' | 'local') {
    return {
      source,
      umumiyFiziologikHolat: analysis.riskExplanation,
      testlarBoyichaNatija: Object.entries(analysis.testScores).map(([key, value]) => `${key}: ${value}%`),
      nafasTizimiTahlili: analysis.breathingAnalysis,
      yuzMimikaNevrologikSignalTahlili: analysis.facialMimicAnalysis,
      qolMotorikasiTremorTahlili: analysis.handMotorAnalysis,
      yotalOvozNutqTahlili: analysis.voiceCoughReadingAnalysis,
      yurakRiskSignallari: analysis.cardiacAnalysis,
      organlarBoyichaRiskFoizlari: this.sdhFinalOrganRows({ finalAnalysis: analysis } as SdhFinalAnalysisSession).map((row) => ({ nameUz: row.label, percent: row.value, levelUz: this.sdhRiskLevel(row.value) })),
      signalSifatiTasiri: analysis.limitations.join(' '),
      engMuhimTopilmalar: analysis.mainFindings,
      bemorUchunXulosa: analysis.patientSummary,
      shifokorUchunXulosa: analysis.doctorSummary,
      keyingiTavsiyalar: analysis.recommendations,
      emergencyWarningBor: analysis.emergencyWarning.active,
      disclaimer: analysis.disclaimer
    };
  }

  private sdhCompletionKey(id: SdhAdvancedTestId): keyof SdhTestCompletionState {
    if (id === 'facial') return 'facialMimic';
    if (id === 'hand') return 'handMotor';
    if (id === 'voice') return 'coughVoiceReading';
    return id;
  }

  private sdhDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private sdhAdvancedEmergencyFlags(riskScores: Record<string, number>, organRisks: SdhOrganRisk[]): string[] {
    const flags: string[] = [];
    if (this.sdhInput.spo2 && this.sdhInput.spo2 < 90) flags.push('Juda past SpO2');
    if (this.sdhInput.chestDiscomfort && this.sdhInput.dyspnea > 60) flags.push('Ko‘krak og‘rig‘i + nafas qisishi');
    if (this.sdhInput.neurologicalAsymmetry || riskScores['facialRisk'] > 70 || riskScores['handRisk'] > 70) flags.push('Yuz/qo‘l asimmetriyasi yoki nutq/motorika signali');
    if (organRisks.some((x) => x.key === 'heart' && x.percent > 80)) flags.push('Yurak ritmi/mikroharakat yuqori risk signali');
    return flags;
  }

  async sdhStartMonitoring() {
    this.sdhMonitoring.set(true);
    this.sdhWarnings.set([]);
    if (this.sdhInput.cameraEnabled || this.sdhInput.microphoneEnabled) {
      try {
        this.sdhMediaStream = await navigator.mediaDevices.getUserMedia({
          video: this.sdhInput.cameraEnabled,
          audio: this.sdhInput.microphoneEnabled
        });
      } catch (error) {
        console.warn('Silent Disease Hunter media permission warning:', error);
        this.sdhWarnings.set(['Kamera yoki mikrofon ruxsati berilmadi. Modul savol-javob, wearable va laborator ma’lumotlar asosida davom etadi.']);
      }
    }

    this.sdhTimer = window.setInterval(() => {
      const features = this.sdhExtractFeatures(this.sdhBuildSnapshot());
      const organRisks = this.sdhFuseOrganRisks(features);
      const risk = this.sdhClamp(Math.round(organRisks.reduce((sum, x) => sum + x.percent, 0) / organRisks.length), 1, 99);
      this.sdhLiveRisk.set(risk);
      this.sdhLiveStability.set(this.sdhClamp(100 - risk, 1, 99));
      this.sdhLiveConfidence.set(this.sdhCalculateConfidence());
      this.sdhSignalQuality.set(this.sdhCalculateSignalQuality());
      this.sdhTimeline = [...this.sdhTimeline.slice(-8), risk];
    }, 5000);
  }

  sdhStopMonitoring() {
    this.sdhMonitoring.set(false);
    if (this.sdhTimer) window.clearInterval(this.sdhTimer);
    this.sdhTimer = null;
    this.sdhMediaStream?.getTracks().forEach((track) => track.stop());
    this.sdhMediaStream = null;
  }

  async sdhRunAnalysis() {
    const snapshot = this.sdhBuildSnapshot();
    const features = this.sdhExtractFeatures(snapshot);
    const organRisks = this.sdhFuseOrganRisks(features);
    const overallRisk = this.sdhClamp(Math.round(organRisks.reduce((sum, x) => sum + x.percent, 0) / organRisks.length), 1, 99);
    const result: SdhResult = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sdh-${Date.now()}`,
      patientId: snapshot.patientId,
      createdAt: new Date().toISOString(),
      overallRisk,
      physiologicalStability: this.sdhClamp(100 - overallRisk, 1, 99),
      confidence: this.sdhCalculateConfidence(),
      signalQuality: this.sdhCalculateSignalQuality(),
      emergencyWarning: this.sdhEmergencyWarning(snapshot, overallRisk),
      usedInputs: this.sdhUsedInputs(snapshot),
      inputSnapshot: snapshot,
      features,
      organRisks,
      differentialReasoning: this.sdhDifferentialReasoning(organRisks, features),
      timeline: [...this.sdhTimeline, overallRisk],
      aiSummary: this.sdhAiSummary(overallRisk, organRisks),
      aiFindings: this.sdhAiFindings(features, organRisks),
      patientExplanation: 'Tizim kiritilgan signallarni birlashtirib, ayrim organ tizimlarida yashirin zo‘riqish yoki fiziologik notekislik ehtimolini baholadi. Bu tashxis emas, balki ehtiyotkor skrining signalidir.',
      doctorNote: this.sdhDoctorNote,
      recommendations: this.sdhRecommendations(overallRisk, organRisks)
    };

    const saved = await this.sdhStorage.sdhSave(result);
    if (saved.error) this.sdhWarnings.set([`Natija lokal saqlandi, lekin bulutga yozishda xatolik: ${saved.error.message}`]);
    this.latestResult.set(result);
    this.sdhLiveRisk.set(result.overallRisk);
    this.sdhLiveStability.set(result.physiologicalStability);
  }

  async sdhSaveDoctorNote(result: SdhResult) {
    const updated = { ...result, doctorNote: this.sdhDoctorNote };
    await this.sdhStorage.sdhSave(updated);
    this.latestResult.set(updated);
  }

  sdhBuildSnapshot(): SdhInputSnapshot {
    return { ...this.sdhInput, patientId: this.sdhSelectedPatientId || 'umumiy' };
  }

  sdhExtractFeatures(input: SdhInputSnapshot): SdhFeatureSet {
    const fatigue = Number(input.fatigue || 0);
    const dyspnea = Number(input.dyspnea || 0);
    const stress = Number(input.stress || 0);
    const poorSleep = 100 - Number(input.sleepQuality || 60);
    const heartRateRisk = input.heartRate ? Math.abs(input.heartRate - 72) * 1.2 : 25;
    const hrvRisk = input.hrv ? Math.max(0, 55 - input.hrv) * 1.4 : 30;
    const spo2Risk = input.spo2 ? Math.max(0, 97 - input.spo2) * 12 : 20;
    const glucoseRisk = input.glucose ? Math.max(0, input.glucose - 5.6) * 18 : 20;
    const hbA1cRisk = input.hbA1c ? Math.max(0, input.hbA1c - 5.7) * 20 : 15;
    const hemoglobinRisk = input.hemoglobin ? Math.max(0, 125 - input.hemoglobin) * 0.8 : 12;
    const crpRisk = input.crp ? Math.max(0, input.crp - 3) * 6 : 15;
    const creatinineRisk = input.creatinine ? Math.max(0, input.creatinine - 100) * 0.45 : 12;

    return {
      facialFatigueScore: this.sdhClamp(fatigue * 0.75 + poorSleep * 0.25, 1, 99),
      pallorCyanosisSuspicionScore: this.sdhClamp(hemoglobinRisk + spo2Risk * 0.6, 1, 99),
      microExpressionVariability: this.sdhClamp(100 - stress * 0.55 - fatigue * 0.2, 1, 99),
      motorSymmetryScore: this.sdhClamp(input.neurologicalAsymmetry ? 45 : 82 - fatigue * 0.18, 1, 99),
      respiratoryMotionPattern: this.sdhClamp(dyspnea * 0.72 + spo2Risk * 0.28, 1, 99),
      voiceStressIndex: this.sdhClamp(stress * 0.75 + poorSleep * 0.2, 1, 99),
      speechPauseFrequency: this.sdhClamp(dyspnea * 0.45 + fatigue * 0.25 + stress * 0.15, 1, 99),
      breathPressureDuringSpeech: this.sdhClamp(dyspnea * 0.55 + spo2Risk * 0.25, 1, 99),
      hrvTrend: this.sdhClamp(hrvRisk, 1, 99),
      restingHeartRateTrend: this.sdhClamp(heartRateRisk, 1, 99),
      spo2Instability: this.sdhClamp(spo2Risk, 1, 99),
      sleepRecoveryScore: this.sdhClamp(input.sleepQuality ?? 55, 1, 99),
      activityDeclineScore: this.sdhClamp(fatigue * 0.55 + poorSleep * 0.2, 1, 99),
      inflammatoryBurdenScore: this.sdhClamp(crpRisk + fatigue * 0.15, 1, 99),
      metabolicStressScore: this.sdhClamp(glucoseRisk + hbA1cRisk + poorSleep * 0.15, 1, 99),
      anemiaRiskSignal: this.sdhClamp(hemoglobinRisk + fatigue * 0.18, 1, 99),
      renalStressSignal: this.sdhClamp(creatinineRisk, 1, 99),
      hepaticStressSignal: this.sdhClamp((input.alt ? Math.max(0, input.alt - 40) * 0.6 : 10), 1, 99),
      fatigueIndex: this.sdhClamp(fatigue, 1, 99),
      dyspneaIndex: this.sdhClamp(dyspnea, 1, 99),
      stressLoadScore: this.sdhClamp(stress, 1, 99),
      neurologicalSymptomScore: this.sdhClamp(input.neurologicalAsymmetry ? 70 : stress * 0.25 + poorSleep * 0.25, 1, 99)
    };
  }

  sdhFuseOrganRisks(features: SdhFeatureSet): SdhOrganRisk[] {
    return [
      this.sdhOrgan('heart', 'Yurak-qon tomir tizimi', features.restingHeartRateTrend * 0.3 + features.hrvTrend * 0.35 + features.anemiaRiskSignal * 0.15 + features.stressLoadScore * 0.2, ['HRV trendi', 'yurak urish tezligi', 'anemiya signali']),
      this.sdhOrgan('lungs', 'Nafas tizimi', features.spo2Instability * 0.42 + features.dyspneaIndex * 0.34 + features.respiratoryMotionPattern * 0.24, ['SpO2 beqarorligi', 'nafas qisishi', 'ko‘krak harakati']),
      this.sdhOrgan('brain', 'Miya va asab tizimi', (100 - features.motorSymmetryScore) * 0.34 + features.neurologicalSymptomScore * 0.4 + features.sleepRecoveryScore * -0.12 + 22, ['motor simmetriya', 'uyqu tiklanishi', 'nevrologik simptom']),
      this.sdhOrgan('metabolic', 'Metabolik tizim', features.metabolicStressScore * 0.58 + features.activityDeclineScore * 0.2 + features.sleepRecoveryScore * -0.08 + 18, ['glyukoza/HbA1c', 'faollik pasayishi', 'uyqu sifati']),
      this.sdhOrgan('stress', 'Psixofiziologik holat', features.voiceStressIndex * 0.35 + features.stressLoadScore * 0.45 + features.sleepRecoveryScore * -0.08 + 18, ['ovoz stressi', 'stress yuklamasi', 'uyqu tiklanishi']),
      this.sdhOrgan('cellular', 'Cellular stress va yallig‘lanish', features.inflammatoryBurdenScore * 0.5 + features.metabolicStressScore * 0.22 + features.hepaticStressSignal * 0.12 + features.renalStressSignal * 0.16, ['CRP', 'metabolik stress', 'buyrak/jigar signallari'])
    ];
  }

  sdhOrgan(key: SdhOrganRisk['key'], nameUz: string, raw: number, reasons: string[]): SdhOrganRisk {
    const percent = this.sdhClamp(raw, 1, 99);
    return {
      key,
      nameUz,
      percent,
      levelUz: this.sdhRiskLevel(percent),
      trendUz: percent > 60 ? 'kuchaygan kuzatuv kerak' : percent > 30 ? 'monitoring tavsiya etiladi' : 'katta og‘ish ko‘rinmayapti',
      reasons
    };
  }

  sdhDifferentialReasoning(organs: SdhOrganRisk[], features: SdhFeatureSet): { titleUz: string; percent: number; systemUz: string }[] {
    const heart = organs.find((x) => x.key === 'heart')?.percent ?? 20;
    const lungs = organs.find((x) => x.key === 'lungs')?.percent ?? 20;
    const metabolic = organs.find((x) => x.key === 'metabolic')?.percent ?? 20;
    const stress = organs.find((x) => x.key === 'stress')?.percent ?? 20;
    return [
      { titleUz: 'Stressga bog‘liq yurak-qon tomir zo‘riqishi ehtimoli', percent: this.sdhClamp((heart + stress) / 2, 1, 99), systemUz: 'Yurak va psixofiziologik holat' },
      { titleUz: 'Nafas yetishmovchiligi yoki giperventilyatsiya yo‘nalishi ehtimoli', percent: this.sdhClamp(lungs, 1, 99), systemUz: 'Nafas tizimi' },
      { titleUz: 'Glyukoza-lipid yoki metabolik stress yo‘nalishi ehtimoli', percent: this.sdhClamp(metabolic + features.metabolicStressScore * 0.15, 1, 99), systemUz: 'Metabolik tizim' }
    ].sort((a, b) => b.percent - a.percent);
  }

  sdhAiSummary(overallRisk: number, organs: SdhOrganRisk[]): string {
    const main = [...organs].sort((a, b) => b.percent - a.percent)[0];
    return `Umumiy fiziologik risk ${overallRisk}% deb baholandi. Eng ko‘proq e’tibor talab qilayotgan tizim: ${main.nameUz}. Xulosa multimodal skrining signali bo‘lib, yakuniy tashxis emas.`;
  }

  sdhAiFindings(features: SdhFeatureSet, organs: SdhOrganRisk[]): string[] {
    const main = [...organs].sort((a, b) => b.percent - a.percent).slice(0, 3);
    return [
      `Signal sifati ${this.sdhCalculateSignalQuality()}%: natija ishonchliligiga bevosita ta’sir qiladi.`,
      `Charchoq indeksi ${features.fatigueIndex}% va stress yuklamasi ${features.stressLoadScore}% darajada baholandi.`,
      `Asosiy organ og‘ishlari: ${main.map((x) => `${x.nameUz} ${x.percent}%`).join(', ')}.`
    ];
  }

  sdhRecommendations(overallRisk: number, organs: SdhOrganRisk[]): string[] {
    const recs = ['Natijani simptomlar kundaligi bilan birga qayta baholang.', 'Signal sifati past bo‘lsa, yorug‘lik, tinch muhit va ma’lumot to‘liqligini yaxshilang.'];
    if (overallRisk > 60) recs.push('Shifokor ko‘rigini rejalashtiring va formal tekshiruvlar bilan tasdiqlang.');
    if (organs.some((x) => x.key === 'heart' && x.percent > 60)) recs.push('EKG, qon bosimi va yurak-qon tomir baholashini ko‘rib chiqing.');
    if (organs.some((x) => x.key === 'metabolic' && x.percent > 60)) recs.push('Glyukoza, HbA1c va lipidlar bo‘yicha laborator nazoratni kuchaytiring.');
    return recs;
  }

  sdhUsedInputs(input: SdhInputSnapshot): string[] {
    const used: string[] = [];
    if (input.cameraEnabled) used.push('kamera');
    if (input.microphoneEnabled) used.push('mikrofon');
    if (input.wearableProvided) used.push('wearable qo‘lda kiritilgan');
    if (input.labProvided) used.push('laborator ko‘rsatkichlar');
    if (input.questionnaireProvided) used.push('savol-javob');
    return used.length ? used : ['minimal savol-javob'];
  }

  sdhEmergencyWarning(input: SdhInputSnapshot, overallRisk: number): boolean {
    return overallRisk >= 82 || !!(input.spo2 && input.spo2 < 90) || (input.chestDiscomfort && input.dyspnea > 65) || input.neurologicalAsymmetry;
  }

  sdhCalculateSignalQuality(): number {
    let quality = 35;
    if (this.sdhInput.cameraEnabled) quality += 13;
    if (this.sdhInput.microphoneEnabled) quality += 12;
    if (this.sdhInput.wearableProvided) quality += 16;
    if (this.sdhInput.labProvided) quality += 18;
    if (this.sdhInput.questionnaireProvided) quality += 10;
    return this.sdhClamp(quality, 10, 98);
  }

  sdhCalculateConfidence(): number {
    const sourceCount = this.sdhUsedInputs(this.sdhBuildSnapshot()).length;
    return this.sdhClamp(this.sdhCalculateSignalQuality() * 0.72 + sourceCount * 5, 10, 98);
  }

  sdhCurrentOrganRisks(): SdhOrganRisk[] {
    return this.latestResult()?.organRisks ?? this.sdhFuseOrganRisks(this.sdhExtractFeatures(this.sdhBuildSnapshot()));
  }

  sdhMonitoringCards() {
    return [
      { name: 'Kamera', active: this.sdhInput.cameraEnabled, status: this.sdhInput.cameraEnabled ? 'ruxsat so‘raladi yoki faol' : 'fallback rejim' },
      { name: 'Mikrofon', active: this.sdhInput.microphoneEnabled, status: this.sdhInput.microphoneEnabled ? 'ovoz markerlari baholanadi' : 'ovozsiz baholash' },
      { name: 'Wearable', active: this.sdhInput.wearableProvided, status: this.sdhInput.wearableProvided ? 'qo‘lda kiritilgan' : 'ma’lumot kiritilmagan' },
      { name: 'EKG', active: false, status: 'qo‘lda risk signali sifatida qo‘shilishi mumkin' },
      { name: 'Laboratoriya', active: this.sdhInput.labProvided, status: this.sdhInput.labProvided ? 'biomarkerlar ishlatiladi' : 'ma’lumot kiritilmagan' },
      { name: 'Monitoring', active: this.sdhMonitoring(), status: this.sdhMonitoring() ? 'har 5 soniyada yangilanmoqda' : 'to‘xtatilgan' }
    ];
  }

  sdhTimelinePoints(): string {
    const data = this.latestResult()?.timeline ?? this.sdhTimeline;
    return data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 420},${135 - this.sdhClamp(v, 1, 99)}`).join(' ');
  }

  sdhHeatColor(percent: number): string {
    const hue = 145 - percent * 1.15;
    return `linear-gradient(180deg, hsla(${hue}, 85%, 48%, .92), rgba(15,23,42,.92))`;
  }

  sdhRiskLevel(percent: number): string {
    if (percent <= 30) return 'Past risk';
    if (percent <= 60) return 'O‘rta risk';
    if (percent <= 80) return 'Yuqori risk';
    return 'Juda yuqori risk';
  }

  sdhPatientName(id: string): string {
    return this.sdhPatients().find((x) => x.id === id)?.name ?? 'Umumiy profil';
  }

  sdhPrintReport() {
    if (typeof window !== 'undefined') window.print();
  }

  private sdhClamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));
  }
}
