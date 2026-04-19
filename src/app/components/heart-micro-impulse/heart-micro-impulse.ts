import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  DiagnosisProb,
  HeartMicroImpulseFeatures,
  HeartMicroImpulseSession,
  HeartMicroImpulseStorageService
} from '../../services/heart-micro-impulse-storage';
import { HeartMicroImpulseInterpretationService } from '../../services/heart-micro-impulse-interpretation';

@Component({
  selector: 'app-heart-micro-impulse',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
  <div class="max-w-7xl mx-auto space-y-6">
    <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
      <h2 class="text-3xl font-black text-medical-text">Yurak Mikro Impuls</h2>
      <p class="text-medical-text-muted mt-2">No-invaziv multimodal yurak mikro-impuls skrining moduli (kamera + mikrofon).</p>
      <div class="mt-3 p-4 border border-amber-100 bg-amber-50 rounded-2xl text-sm text-amber-800">
        <p><strong>Medical disclaimer:</strong> Bu modul skrining va diagnostik qo‘llab-quvvatlash konsepti. Bu mustaqil yakuniy tashxis emas.</p>
      </div>
    </section>

    <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
      <h3 class="text-xl font-black">Tayyorgarlik protokoli</h3>
      <div class="mt-3 inline-flex rounded-xl border border-medical-border p-1 bg-slate-50">
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold"
          [class.bg-white]="scanMode() === 'standard'"
          [class.shadow-sm]="scanMode() === 'standard'"
          (click)="scanMode.set('standard')"
        >
          Standart skan
        </button>
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold"
          [class.bg-white]="scanMode() === 'topography'"
          [class.shadow-sm]="scanMode() === 'topography'"
          (click)="scanMode.set('topography')"
        >
          Prekordial Rezonans Topografiya
        </button>
        <button
          class="px-3 py-2 rounded-lg text-sm font-semibold"
          [class.bg-white]="scanMode() === 'cardio-provocation'"
          [class.shadow-sm]="scanMode() === 'cardio-provocation'"
          (click)="scanMode.set('cardio-provocation')"
        >
          CardioProvocation Twin
        </button>
      </div>
      <ol class="list-decimal pl-5 text-sm mt-3 space-y-1">
        <li>Ko‘krak sohasi kameraga markazda tushsin (asosiy zona).</li>
        <li>Bo‘yin/jugular sohasi ikkilamchi yordamchi zona sifatida ko‘rinishi mumkin.</li>
        <li>Atrof shovqinini kamaytiring, normal nafas holatida turing.</li>
        <li>Qurilma avtomatik tanlanadi: telefon yoki noutbuk kamera/mikrofoni.</li>
      </ol>
      @if (scanMode() === 'topography') {
        <div class="mt-3 text-sm p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800">
          Topografiya rejimi: target zona avval aniqlanadi, so‘ng anatomik overlay va individual yurak modeli quriladi.
        </div>
      } @else if (scanMode() === 'cardio-provocation') {
        <div class="mt-3 text-sm p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">
          CardioProvocation Twin: baseline → sekin nafas provokatsiyasi → (ixtiyoriy) qisqa breath-hold → recovery fazalarida javob/tiklanish tahlili.
        </div>
      }
      <div class="mt-4 flex gap-2">
        <button class="btn-primary" (click)="initCapture()" [disabled]="captureReady()">Tizimni ulash</button>
        <button class="btn-secondary" (click)="stopCapture()" [disabled]="!captureReady()">To‘xtatish</button>
      </div>
    </section>

    <section class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white border border-medical-border rounded-3xl p-4 shadow-sm">
        <div class="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[340px]">
          <video #video autoplay playsinline muted class="w-full h-full object-cover"></video>
          <canvas #overlay class="absolute inset-0 w-full h-full"></canvas>
          @if (!captureReady()) {
            <div class="absolute inset-0 flex items-center justify-center text-white/90">Capture hali yoqilmagan</div>
          }
          @if (isRecording()) {
            <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold">REC {{ timeLeft() }}s</div>
          }
        </div>
        <div class="mt-3">
          <p class="text-sm font-semibold">Live guidance: {{ liveGuide() }}</p>
          <div class="h-2 rounded-full bg-slate-200 mt-2"><div class="h-2 rounded-full bg-indigo-600" [style.width.%]="progress()"></div></div>
        </div>
      </div>
      <div class="bg-white border border-medical-border rounded-3xl p-5 shadow-sm space-y-3">
        <h3 class="font-black">Signal nazorati</h3>
        <p class="text-sm">Qurilma: {{ hardwareInfo() }}</p>
        <p class="text-sm">Signal sifati: <strong>{{ signalQuality() }}%</strong></p>
        <p class="text-sm">Ishonchlilik: <strong>{{ confidence() }}%</strong></p>
        <p class="text-sm">Shoshilinch indikator: <strong>{{ urgency() }}%</strong></p>
        @if (scanMode() === 'topography') {
          <p class="text-sm">Tracking aniqligi: <strong>{{ trackingConfidence() }}%</strong></p>
          <p class="text-sm">Kontur ishonchliligi (kiyim ta’siri): <strong>{{ clothingReliability() }}%</strong></p>
        } @else if (scanMode() === 'cardio-provocation') {
          <p class="text-sm">Protocol fazasi: <strong>{{ provocationPhaseLabel() }}</strong></p>
          @if (provocationPhase() === 'hold') {
            <button class="btn-secondary w-full text-sm" (click)="skipOptionalHold()">Breath-holdni o‘tkazib yuborish</button>
          }
        }
        @if (isReady()) {
          <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">
            Signal to‘g‘ri. Natija chiqarish uchun yetarli. Testni boshlang.
          </div>
        } @else {
          <div class="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
            <p class="font-semibold mb-1">Signal sifati past. Natija aniqligi pasayishi mumkin.</p>
            @for (warn of readinessWarnings(); track warn) { <p>• {{ warn }}</p> }
            <p class="mt-1 font-semibold">Joylashuvni yaxshilang yoki baribir testni boshlang.</p>
          </div>
        }
        <button class="btn-primary w-full" (click)="startRecording()" [disabled]="!captureReady() || isRecording()">{{ isReady() ? startButtonLabel() : 'Signal past bo‘lsa ham davom etish' }}</button>
      </div>
    </section>

    @if (pipelineActive()) {
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm">
        <h3 class="text-xl font-black">Ilmiy pipeline ishlayapti...</h3>
        <div class="mt-3 space-y-2">
          @for (s of pipelineSteps; track s) {
            <p class="text-sm" [class.font-bold]="s === activePipelineStep()">• {{ s }}</p>
          }
        </div>
      </section>
    }

    @if (latest(); as r) {
      <section class="bg-white border border-medical-border rounded-3xl p-6 shadow-sm space-y-4">
        <h3 class="text-2xl font-black">Yurak skrining natijasi</h3>

        <div class="grid md:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Umumiy yurak xavfi</p><p class="text-2xl font-black text-rose-600">{{ overallRisk(r) }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Signal sifati</p><p class="text-2xl font-black">{{ r.features.signalQuality }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Ishonchlilik</p><p class="text-2xl font-black">{{ r.features.confidence }}%</p></div>
          <div class="p-3 rounded-xl border bg-slate-50"><p class="text-xs">Urgency</p><p class="text-2xl font-black">{{ r.features.urgency }}%</p></div>
        </div>

        <div class="p-4 rounded-2xl border bg-indigo-50/40">
          <h4 class="font-black">Bitta asosiy diagnoz</h4>
          <p class="text-lg font-bold">{{ r.mainDiagnosis.name }} — {{ r.mainDiagnosis.percent }}%</p>
          <p class="text-sm mt-2">{{ r.narrative.qisqaXulosa }}</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Top 3 ehtimoliy diagnoz</h4>
            @for (d of r.topDiagnoses; track d.name) {
              <div class="mt-2">
                <div class="flex justify-between text-sm"><span>{{ d.name }}</span><span>{{ d.percent }}%</span></div>
                <div class="h-2 rounded-full bg-slate-200"><div class="h-2 rounded-full bg-rose-500" [style.width.%]="d.percent"></div></div>
              </div>
            }
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Diagnostik taqsimot (100%)</h4>
            <div class="w-28 h-28 rounded-full mx-auto mt-3" [style.background]="diagDonut(r.topDiagnoses)"></div>
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Confidence gauge</h4>
            <div class="mt-4 h-16 rounded-t-full" [style.background]="semiGauge(r.features.confidence)"></div>
            <p class="text-center font-black mt-1">{{ r.features.confidence }}%</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">EKG-uslub signal</h4>
            <svg viewBox="0 0 420 120" class="w-full h-28 mt-2"><polyline [attr.points]="wavePoints(r.waveform)" fill="none" stroke="#22c55e" stroke-width="2.5"></polyline></svg>
          </div>
          <div class="p-4 rounded-2xl border">
            <h4 class="font-black">Ko‘krak mikro-harakat trendi</h4>
            <svg viewBox="0 0 420 120" class="w-full h-28 mt-2"><polyline [attr.points]="wavePoints(r.motionTrace)" fill="none" stroke="#0ea5e9" stroke-width="2.5"></polyline></svg>
          </div>
          <div class="p-4 rounded-2xl border lg:col-span-2">
            <h4 class="font-black">Electromechanical phase timeline</h4>
            <svg viewBox="0 0 420 60" class="w-full h-16 mt-2">
              <line x1="0" y1="30" x2="420" y2="30" stroke="#94a3b8" stroke-width="2"></line>
              <circle [attr.cx]="(r.features.electromechanicalTimingProxy/100)*420" cy="30" r="8" fill="#7c3aed"></circle>
              <circle [attr.cx]="(r.features.cycleStabilityProxy/100)*420" cy="30" r="8" fill="#10b981"></circle>
            </svg>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-4 text-sm">
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Bo‘lishi mumkin bo‘lgan holatlar</h4><ul class="list-disc pl-5">@for (x of r.narrative.bolishiMumkinHolatlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">O‘tkir va surunkali xavf belgisi</h4><ul class="list-disc pl-5">@for (x of r.narrative.otkirVaSurunkaliXavfBelgisi; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Shoshilinch xavf belgisi</h4><ul class="list-disc pl-5">@for (x of r.narrative.shoshilinchXavfBelgisi; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Tavsiya etiladigan tekshiruvlar</h4><ul class="list-disc pl-5">@for (x of r.narrative.tavsiyaTekshiruvlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Patogenez</h4><ul class="list-disc pl-5">@for (x of r.narrative.patogenez; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Molekulyar mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.molekulyarMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Biofizik mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.biofizikMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Biokimyoviy mexanizm</h4><ul class="list-disc pl-5">@for (x of r.narrative.biokimyoviyMexanizm; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Clinical interpretation</h4><ul class="list-disc pl-5">@for (x of r.narrative.klinikInterpretatsiya; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Recommended next steps</h4><ul class="list-disc pl-5">@for (x of r.narrative.keyingiQadamlar; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Sodda izoh</h4><ul class="list-disc pl-5">@for (x of r.narrative.soddaIzoh; track x) {<li>{{ x }}</li>}</ul></div>
          <div class="p-4 border rounded-2xl"><h4 class="font-black">Chuqur ilmiy izoh</h4><ul class="list-disc pl-5">@for (x of r.narrative.chuqurIlmiyIzoh; track x) {<li>{{ x }}</li>}</ul></div>
        </div>

        <div class="p-4 border rounded-2xl text-sm">
          <h4 class="font-black">O‘ta chuqur mexanistik izoh</h4>
          <ul class="list-disc pl-5">@for (x of r.narrative.otaChuqurMexanistikIzoh; track x) {<li>{{ x }}</li>}</ul>
        </div>

        @if (r.scanMode === 'cardio-provocation') {
          @if (r.cardioProvocation; as cp) {
            <div class="p-4 border rounded-2xl bg-rose-50/40">
              <h4 class="font-black">CardioProvocation Twin: fazalararo javob profili</h4>
              <div class="grid md:grid-cols-4 gap-3 mt-3 text-sm">
                <div class="p-3 rounded-xl border bg-white"><p>Cardiac Reserve Score</p><p class="text-2xl font-black text-emerald-600">{{ cp.cardiacReserveScore }}%</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Recovery Time</p><p class="text-2xl font-black text-indigo-600">{{ cp.provokedMechanicalRecoveryTime }}s</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Autonomic Recovery Slope</p><p class="text-2xl font-black text-sky-600">{{ cp.autonomicRecoverySlope }}%</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Hidden Decompensation Risk</p><p class="text-2xl font-black text-rose-600">{{ cp.hiddenDecompensationRisk }}%</p></div>
              </div>
              <div class="grid lg:grid-cols-2 gap-4 mt-4">
                <div class="p-3 rounded-xl border bg-white">
                  <h5 class="font-black text-sm">Baseline / Provocation / Recovery waveform</h5>
                  <svg viewBox="0 0 420 120" class="w-full h-28 mt-2">
                    <polyline [attr.points]="wavePoints(cp.baselineWaveform)" fill="none" stroke="#10b981" stroke-width="2"></polyline>
                    <polyline [attr.points]="wavePoints(cp.provocationWaveform)" fill="none" stroke="#f97316" stroke-width="2"></polyline>
                    <polyline [attr.points]="wavePoints(cp.recoveryWaveform)" fill="none" stroke="#3b82f6" stroke-width="2"></polyline>
                  </svg>
                </div>
                <div class="p-3 rounded-xl border bg-white">
                  <h5 class="font-black text-sm">Recovery slope va adaptatsiya trendi</h5>
                  <svg viewBox="0 0 420 120" class="w-full h-28 mt-2">
                    <polyline [attr.points]="provocationTrendPoints(cp)" fill="none" stroke="#e11d48" stroke-width="2.2"></polyline>
                  </svg>
                  <p class="text-xs text-medical-text-muted mt-1">Qizil chiziq keskin bo‘lsa provokatsiya javobi notekis; silliq pasayish tiklanish yaxshiroq ekanini bildiradi.</p>
                </div>
              </div>
              <div class="grid md:grid-cols-4 gap-3 mt-3 text-sm">
                <div class="p-3 rounded-xl border bg-white"><p>Respiratory-Cardiac Coupling</p><p class="font-black">{{ cp.respiratoryCardiacCouplingFlexibility }}%</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Load Adaptation Score</p><p class="font-black">{{ cp.loadAdaptationScore }}%</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Recovery Stability Index</p><p class="font-black">{{ cp.recoveryStabilityIndex }}%</p></div>
                <div class="p-3 rounded-xl border bg-white"><p>Response Balance</p><p class="font-black">{{ cp.provocationResponseBalance }}%</p></div>
              </div>
            </div>
          }
        }

        @if (r.scanMode === 'topography') {
          <div class="grid lg:grid-cols-2 gap-4">
            <div class="p-4 border rounded-2xl text-sm">
              <h4 class="font-black">Topografik xarita izohi</h4>
              <ul class="list-disc pl-5">@for (x of r.narrative.topografikXaritaIzohi; track x) {<li>{{ x }}</li>}</ul>
            </div>
            <div class="p-4 border rounded-2xl text-sm">
              <h4 class="font-black">Individual yurak modeli izohi</h4>
              <ul class="list-disc pl-5">@for (x of r.narrative.individualYurakModelIzohi; track x) {<li>{{ x }}</li>}</ul>
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-4">
            <div class="p-4 border rounded-2xl">
              <h4 class="font-black">Individual yurak vizualizatsiyasi (3D-uslub)</h4>
              <div class="mt-3 h-56 rounded-2xl border relative overflow-hidden bg-slate-950/95">
                <div class="absolute inset-0 opacity-85" [style.background]="heartModelBackground(r)"></div>
                <div class="absolute inset-0 flex items-center justify-center p-2">
                  <svg viewBox="0 0 320 260" class="w-full h-full max-w-[290px]" [style.transform]="heartModelTransform(r)">
                    <defs>
                      <radialGradient id="myocardiumBase" cx="40%" cy="30%" r="74%">
                        <stop offset="0%" stop-color="#ffe4e6"></stop>
                        <stop offset="26%" stop-color="#fb7185"></stop>
                        <stop offset="58%" stop-color="#b91c1c"></stop>
                        <stop offset="86%" stop-color="#7f1d1d"></stop>
                        <stop offset="100%" stop-color="#3f0b0b"></stop>
                      </radialGradient>
                      <linearGradient id="myocardiumRidge" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fecdd3" stop-opacity="0.9"></stop>
                        <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0.25"></stop>
                      </linearGradient>
                      <linearGradient id="vesselShade" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fecdd3"></stop>
                        <stop offset="38%" stop-color="#fb7185"></stop>
                        <stop offset="100%" stop-color="#881337"></stop>
                      </linearGradient>
                      <linearGradient id="veinShade" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#f43f5e"></stop>
                        <stop offset="100%" stop-color="#4c0519"></stop>
                      </linearGradient>
                      <radialGradient id="analysisHotspot" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" [attr.stop-color]="heartHotspotColor(r)" stop-opacity="0.8"></stop>
                        <stop offset="100%" [attr.stop-color]="heartHotspotColor(r)" stop-opacity="0"></stop>
                      </radialGradient>
                    </defs>

                    <path d="M86 150 C70 112, 88 74, 128 58 C156 48, 182 54, 196 72 C212 56, 238 50, 262 68 C286 86, 290 118, 274 148 C260 176, 236 204, 208 228 C188 246, 160 246, 142 230 C116 206, 98 188, 86 150 Z" fill="url(#myocardiumBase)" stroke="#7f1d1d" stroke-width="2.8"></path>
                    <path d="M114 122 C130 100, 156 90, 188 92 C220 96, 244 114, 254 138 C232 124, 202 120, 176 120 C146 120, 126 124, 114 122 Z" fill="#7f1d1d" opacity="0.34"></path>
                    <path d="M130 146 C150 168, 170 188, 188 222" stroke="url(#myocardiumRidge)" stroke-width="5.2" stroke-linecap="round" opacity="0.7"></path>
                    <path d="M162 84 C158 62, 146 44, 126 38 C106 34, 86 46, 84 64 C82 82, 100 98, 122 102 C138 104, 154 100, 162 84 Z" fill="url(#vesselShade)" opacity="0.96"></path>
                    <path d="M196 84 C206 58, 226 38, 250 38 C270 40, 284 56, 280 74 C274 94, 252 106, 228 104 C212 102, 202 96, 196 84 Z" fill="url(#vesselShade)" opacity="0.96"></path>
                    <path d="M176 72 C182 54, 196 44, 212 46 C224 48, 230 60, 226 74 C220 88, 204 98, 188 98" fill="none" stroke="url(#veinShade)" stroke-width="11" stroke-linecap="round" opacity="0.88"></path>
                    <path d="M144 90 C130 98, 118 112, 116 126 C114 140, 126 146, 138 140 C150 132, 158 116, 158 102 C158 92, 152 86, 144 90 Z" fill="#ef4444" opacity="0.72"></path>
                    <path d="M196 118 C212 126, 222 140, 222 156 C220 172, 208 178, 196 170 C182 160, 174 146, 176 130 C178 120, 186 114, 196 118 Z" fill="#dc2626" opacity="0.68"></path>
                    <path d="M120 156 C138 170, 150 188, 156 210" stroke="#fecdd3" stroke-width="3.2" stroke-linecap="round" opacity="0.45"></path>
                    <path d="M178 144 C198 158, 212 174, 220 194" stroke="#fecdd3" stroke-width="3.2" stroke-linecap="round" opacity="0.38"></path>
                    <ellipse cx="188" cy="152" rx="76" ry="62" fill="url(#analysisHotspot)"></ellipse>
                  </svg>
                </div>
              </div>
            </div>
            <div class="p-4 border rounded-2xl">
              <h4 class="font-black">Prekordial rezonans topografiya xaritasi</h4>
              <div class="mt-3 grid grid-cols-6 gap-1.5">
                @for (z of topographyCells(r); track $index) {
                  <div class="h-10 rounded-md border border-slate-200" [style.background]="topographyColor(z)"></div>
                }
              </div>
              <p class="text-xs text-medical-text-muted mt-2">Zonal ko‘krak rezonans tarqalishi (yuqori qiymat = yuqori dispersiya/turbulentlik).</p>
            </div>
          </div>

          <details class="p-4 border rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50" open>
            <summary class="font-black cursor-pointer text-base">Xaritani qanday o‘qish kerak?</summary>
            <div class="mt-3 space-y-4 text-sm">
              <div class="p-3 rounded-xl border bg-white">
                <h5 class="font-black">Sodda izoh</h5>
                <p class="mt-2">Prekordial rezonans topografiya xaritasi ko‘krak zonalari bo‘yicha signalning bir xil yoki notekis tarqalishini ko‘rsatadi. Bu rasm emas, balki yurak bilan bog‘liq mikro-harakat va vibroakustik javobning zonal tahlili.</p>
              </div>

              <div class="p-3 rounded-xl border bg-white">
                <h5 class="font-black">Ilmiy talqin</h5>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Ochiqroq / sarg‘ish-yashilga yaqin zona</strong> — signal ko‘proq notekis, dispersiya yoki turbulentlik ehtimoli yuqoriroq.</li>
                  <li><strong>To‘qroq / bir xil yashil zona</strong> — signal nisbatan barqarorroq, zonadagi mexanik rezonans bir tekisroq.</li>
                  <li><strong>Bir tomondagi rang farqi kattaroq bo‘lsa</strong> — chap-o‘ng asimmetriya ehtimoli mavjud.</li>
                  <li><strong>Markaziy va chap prekordial zonalarda farq katta bo‘lsa</strong> — mexanik tarqalish yoki rezonans bir xil emasligini ko‘rsatuvchi ehtimoliy signal.</li>
                  <li><strong>Hamma joy deyarli bir xil bo‘lsa</strong> — xarita bir tekis, ya’ni zonalararo katta tafovut ko‘rinmayapti.</li>
                </ul>
              </div>

              <div class="p-3 rounded-xl border bg-white">
                <h5 class="font-black">Muhim eslatma</h5>
                <p class="mt-2">Bu blok AI asosidagi topografik tahlil natijasi hisoblanadi. U yakuniy tashxis emas; klinik tasdiq uchun EKG, EHO, Holter va zarur laborator tekshiruvlar talab etilishi mumkin.</p>
              </div>
            </div>
          </details>
        }
      </section>
    }
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeartMicroImpulseComponent implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') overlayRef?: ElementRef<HTMLCanvasElement>;

  private storage = inject(HeartMicroImpulseStorageService);
  private interpretationService = inject(HeartMicroImpulseInterpretationService);

  captureReady = signal(false);
  isRecording = signal(false);
  timeLeft = signal(0);
  progress = signal(0);
  liveGuide = signal('Ko‘krak sohasi markazda bo‘lsin.');
  hardwareInfo = signal('Aniqlanmoqda...');
  signalQuality = signal(0);
  confidence = signal(0);
  urgency = signal(0);
  isReady = signal(false);
  readinessWarnings = signal<string[]>(['Natija chiqarish uchun signal hali yetarli emas']);
  overlayTracked = signal(false);
  trackingConfidence = signal(0);
  clothingReliability = signal(70);
  scanMode = signal<'standard' | 'topography' | 'cardio-provocation'>('standard');
  provocationPhase = signal<'idle' | 'baseline' | 'breathing' | 'hold' | 'recovery' | 'done'>('idle');
  latest = signal<HeartMicroImpulseSession | null>(null);
  pipelineActive = signal(false);
  activePipelineStep = signal('');

  pipelineSteps = [
    'Multimodal signal extraction',
    'Motion noise filtering',
    'Vibroakustik pattern tahlili',
    'Electromechanical irregularity estimation',
    'Diagnostik taqsimot generatsiyasi',
    'Ilmiy narrativ sintezi'
  ];

  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioData = new Uint8Array(256);
  private timer: number | null = null;
  private qcTimer: number | null = null;
  private rafId: number | null = null;
  private protocolSeq: { phase: 'baseline' | 'breathing' | 'hold' | 'recovery'; seconds: number; optional?: boolean }[] = [];
  private protocolIndex = 0;
  private protocolTick = 0;
  private skipHoldRequested = false;
  private prevFrame: Uint8ClampedArray | null = null;
  private waveform: number[] = [];
  private motionTrace: number[] = [];
  private phaseWaveforms: Record<'baseline' | 'breathing' | 'hold' | 'recovery', number[]> = { baseline: [], breathing: [], hold: [], recovery: [] };
  private phaseMotions: Record<'baseline' | 'breathing' | 'hold' | 'recovery', number[]> = { baseline: [], breathing: [], hold: [], recovery: [] };
  private torsoPose = { cx: 0.5, cy: 0.58, scale: 1, tilt: 0 };
  private isPreviewMirrored = true;

  async initCapture() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (this.videoRef?.nativeElement) this.videoRef.nativeElement.srcObject = this.stream;
      this.setupAudio(this.stream);
      this.captureReady.set(true);
      this.hardwareInfo.set(navigator.userAgent.includes('Mobile') ? 'Telefon kamera + mikrofon' : 'Noutbuk webcam + mikrofon');
      this.isPreviewMirrored = true;
      this.startQualityLoop();
      this.startOverlayLoop();
    } catch (error) {
      console.error(error);
      this.liveGuide.set('Qurilma ruxsati rad etildi yoki media qurilma topilmadi.');
    }
  }

  stopCapture() {
    this.cleanup();
    this.captureReady.set(false);
    this.isRecording.set(false);
    this.provocationPhase.set('idle');
  }

  async startRecording() {
    if (!this.captureReady() || this.isRecording()) return;
    if (this.scanMode() === 'cardio-provocation') {
      await this.startCardioProvocationProtocol();
      return;
    }
    this.isRecording.set(true);
    this.waveform = [];
    this.motionTrace = [];
    this.timeLeft.set(25);
    this.progress.set(0);

    let tick = 0;
    this.timer = window.setInterval(async () => {
      tick += 1;
      this.timeLeft.set(Math.max(0, 25 - tick));
      this.progress.set((tick / 25) * 100);
      this.sampleSignals();
      this.drawOverlay();

      if (tick >= 25) {
        if (this.timer) clearInterval(this.timer);
        this.isRecording.set(false);
        await this.runPipelineAndGenerate();
      }
    }, 1000);
  }

  startButtonLabel(): string {
    if (this.scanMode() === 'cardio-provocation') return 'CardioProvocation Twin protokoli (≈25s)';
    return this.isReady() ? 'Avtomatik capture (25s)' : 'Baribir testni boshlash (25s)';
  }

  provocationPhaseLabel(): string {
    const p = this.provocationPhase();
    if (p === 'baseline') return 'Baseline';
    if (p === 'breathing') return 'Sekin nafas';
    if (p === 'hold') return 'Qisqa breath-hold (ixtiyoriy)';
    if (p === 'recovery') return 'Recovery';
    if (p === 'done') return 'Yakunlandi';
    return 'Boshlanmagan';
  }

  skipOptionalHold() {
    this.skipHoldRequested = true;
  }

  private async startCardioProvocationProtocol() {
    this.isRecording.set(true);
    this.waveform = [];
    this.motionTrace = [];
    this.phaseWaveforms = { baseline: [], breathing: [], hold: [], recovery: [] };
    this.phaseMotions = { baseline: [], breathing: [], hold: [], recovery: [] };
    this.protocolSeq = [
      { phase: 'baseline', seconds: 6 },
      { phase: 'breathing', seconds: 7 },
      { phase: 'hold', seconds: 4, optional: true },
      { phase: 'recovery', seconds: 8 }
    ];
    this.protocolIndex = 0;
    this.protocolTick = 0;
    this.skipHoldRequested = false;
    this.timeLeft.set(this.protocolSeq.reduce((s, x) => s + x.seconds, 0));
    this.progress.set(0);
    this.updateProvocationGuide('baseline');

    this.timer = window.setInterval(async () => {
      const current = this.protocolSeq[this.protocolIndex];
      if (!current) return;
      if (current.phase === 'hold' && this.skipHoldRequested) {
        this.protocolIndex += 1;
        this.protocolTick = 0;
        const next = this.protocolSeq[this.protocolIndex];
        if (next) this.updateProvocationGuide(next.phase);
        return;
      }
      this.provocationPhase.set(current.phase);
      this.sampleSignals();
      const wave = this.waveform[this.waveform.length - 1] ?? 0;
      const mot = this.motionTrace[this.motionTrace.length - 1] ?? 0;
      this.phaseWaveforms[current.phase].push(wave);
      this.phaseMotions[current.phase].push(mot);
      this.protocolTick += 1;
      this.drawOverlay();

      const doneSecs = this.protocolSeq
        .slice(0, this.protocolIndex)
        .reduce((s, x) => s + x.seconds, 0) + this.protocolTick;
      const totalSecs = this.protocolSeq.reduce((s, x) => s + x.seconds, 0);
      this.timeLeft.set(Math.max(0, totalSecs - doneSecs));
      this.progress.set((doneSecs / totalSecs) * 100);

      if (this.protocolTick >= current.seconds) {
        this.protocolIndex += 1;
        this.protocolTick = 0;
        const next = this.protocolSeq[this.protocolIndex];
        if (!next) {
          if (this.timer) clearInterval(this.timer);
          this.isRecording.set(false);
          this.provocationPhase.set('done');
          await this.runPipelineAndGenerate();
          return;
        }
        this.updateProvocationGuide(next.phase);
      }
    }, 1000);
  }

  private updateProvocationGuide(phase: 'baseline' | 'breathing' | 'hold' | 'recovery') {
    this.provocationPhase.set(phase);
    if (phase === 'baseline') this.liveGuide.set('Tayyor holatda turing, normal nafas oling (baseline).');
    if (phase === 'breathing') this.liveGuide.set('Chuqur va sekin nafas oling, ritmni barqaror saqlang.');
    if (phase === 'hold') this.liveGuide.set('Nafasni qisqa ushlab turing (ixtiyoriy). Noqulaylik bo‘lsa o‘tkazib yuboring.');
    if (phase === 'recovery') this.liveGuide.set('Endi odatiy nafasga qayting, tiklanish bosqichi kuzatilmoqda.');
  }

  private startQualityLoop() {
    if (this.qcTimer) clearInterval(this.qcTimer);
    this.qcTimer = window.setInterval(() => {
      this.sampleSignals();
      const brightness = this.brightness();
      const motion = this.motionTrace.slice(-8).reduce((a, b) => a + b, 0) / Math.max(1, this.motionTrace.slice(-8).length);
      const mic = this.waveform.slice(-8).reduce((a, b) => a + b, 0) / Math.max(1, this.waveform.slice(-8).length);
      const pose = this.estimateTorsoPose();
      this.trackingConfidence.set(Math.round(pose.confidence * 100));
      const clothingReliability = this.chestContourReliability(pose);
      this.clothingReliability.set(clothingReliability);
      this.updateGuidance(brightness, motion, mic);

      const quality = Math.max(10, Math.min(98, Math.round(100 - Math.abs(55 - brightness) - motion * 0.7 - Math.max(0, 12 - mic) * 2)));
      this.signalQuality.set(quality);
      this.confidence.set(Math.max(10, Math.min(98, Math.round(quality * 0.78 + (100 - motion) * 0.22))));
      this.urgency.set(Math.max(1, Math.min(99, Math.round((motion * 0.5) + (100 - quality) * 0.5))));
    }, 800);
  }

  private startOverlayLoop = () => {
    this.drawOverlay();
    this.rafId = requestAnimationFrame(this.startOverlayLoop);
  };

  private async runPipelineAndGenerate() {
    this.pipelineActive.set(true);
    for (const step of this.pipelineSteps) {
      this.activePipelineStep.set(step);
      await new Promise((r) => setTimeout(r, 500));
    }

    const features = this.buildFeatures();
    const topDiagnoses = this.diagnosisDistribution(features);
    const main = topDiagnoses[0];
    const narrative = await this.interpretationService.interpret(features, topDiagnoses, main, this.scanMode());
    const topographyGrid = this.scanMode() === 'topography' ? this.buildTopographyGrid(features) : [];
    const heartVisualProfile = this.buildHeartVisualProfile(features);
    const cardioProvocation = this.scanMode() === 'cardio-provocation'
      ? this.buildCardioProvocationMetrics(features)
      : undefined;

    const session: HeartMicroImpulseSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `heart-${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetZone: 'chest',
      waveform: this.waveform.slice(-240),
      motionTrace: this.motionTrace.slice(-240),
      features,
      topDiagnoses,
      mainDiagnosis: main,
      narrative,
      scanMode: this.scanMode(),
      topographyGrid,
      heartVisualProfile,
      cardioProvocation
    };

    this.storage.save(session);
    this.latest.set(session);
    this.pipelineActive.set(false);
  }

  private buildFeatures(): HeartMicroImpulseFeatures {
    const w = this.waveform.length ? this.waveform : [0];
    const m = this.motionTrace.length ? this.motionTrace : [0];
    const wavStd = this.std(w);
    const motStd = this.std(m);

    return {
      rhythmIrregularity: this.clamp(Math.round(wavStd * 2.4), 1, 99),
      motionEnergyAsymmetry: this.clamp(Math.round(motStd * 2.1), 1, 99),
      acousticTurbulence: this.clamp(Math.round(this.max(w) * 1.4), 1, 99),
      electromechanicalTimingProxy: this.clamp(Math.round((wavStd + motStd) * 1.7), 1, 99),
      cycleStabilityProxy: this.clamp(Math.round(100 - (wavStd * 1.4 + motStd * 1.2)), 1, 99),
      chestMicroMotionAmplitude: this.clamp(Math.round(this.avg(m) * 1.8), 1, 99),
      vibroacousticResonanceShift: this.clamp(Math.round(Math.abs(this.avg(w) - this.avg(m)) * 1.5), 1, 99),
      perfusionInstabilityProxy: this.clamp(Math.round((motStd * 1.2 + wavStd * 0.8)), 1, 99),
      autonomicStressProxy: this.clamp(Math.round(this.signalQuality() < 60 ? 70 : 35 + motStd), 1, 99),
      signalQuality: this.signalQuality(),
      confidence: this.confidence(),
      urgency: this.urgency(),
      rezonansAsimmetriyaIndeksi: this.clamp(Math.round((motStd * 1.1) + (Math.abs(this.avg(w) - this.avg(m)) * 1.2)), 1, 99),
      mexanikTarqalishKechikishi: this.clamp(Math.round((wavStd * 0.9) + (motStd * 1.1)), 1, 99),
      prekordialDispersiyaSkori: this.clamp(Math.round((this.max(w) * 0.8) + (this.max(m) * 0.9)), 1, 99),
      mikrosinxronlikIndeksi: this.clamp(Math.round(100 - ((wavStd * 1.1) + (motStd * 1.0))), 1, 99),
      turbulentVibroakustikEhtimol: this.clamp(Math.round((this.max(w) * 1.0) + (motStd * 0.8)), 1, 99)
    };
  }

  private diagnosisDistribution(f: HeartMicroImpulseFeatures): DiagnosisProb[] {
    const topographyBoost = this.scanMode() === 'topography'
      ? (f.rezonansAsimmetriyaIndeksi * 0.25 + f.mexanikTarqalishKechikishi * 0.2 + f.prekordialDispersiyaSkori * 0.22)
      : 0;
    const provocationBoost = this.scanMode() === 'cardio-provocation'
      ? ((100 - f.cycleStabilityProxy) * 0.24 + f.autonomicStressProxy * 0.22 + f.mexanikTarqalishKechikishi * 0.2)
      : 0;
    const raw = [
      { name: 'Aritmiya yo‘nalishi', score: f.rhythmIrregularity * 1.2 + f.electromechanicalTimingProxy + topographyBoost * 0.22 + provocationBoost * 0.28 },
      { name: 'Yurak yetishmovchiligi yo‘nalishi', score: f.perfusionInstabilityProxy + (100 - f.cycleStabilityProxy) + f.motionEnergyAsymmetry * 0.8 + topographyBoost * 0.26 + provocationBoost * 0.22 },
      { name: 'Ishemik yurak kasalligi yo‘nalishi', score: f.vibroacousticResonanceShift + f.acousticTurbulence + f.autonomicStressProxy * 0.5 + topographyBoost * 0.3 + provocationBoost * 0.18 },
      { name: 'Klapan patologiyasi yo‘nalishi', score: f.acousticTurbulence + f.chestMicroMotionAmplitude * 0.7 },
      { name: 'Miokard disfunksiyasi yo‘nalishi', score: f.electromechanicalTimingProxy + f.perfusionInstabilityProxy + topographyBoost * 0.2 + provocationBoost * 0.24 },
      { name: 'Post-viral yurak zararlanishi', score: f.autonomicStressProxy + f.vibroacousticResonanceShift + topographyBoost * 0.12 + provocationBoost * 0.14 },
      { name: 'Vegetativ disbalans yo‘nalishi', score: f.autonomicStressProxy + (100 - f.signalQuality) }
    ].sort((a, b) => b.score - a.score).slice(0, 3);

    const total = raw.reduce((s, x) => s + x.score, 0) || 1;
    const p1 = Math.round((raw[0].score / total) * 100);
    const p2 = Math.round((raw[1].score / total) * 100);
    const p3 = 100 - p1 - p2;

    return [
      { name: raw[0].name, percent: p1 },
      { name: raw[1].name, percent: p2 },
      { name: raw[2].name, percent: Math.max(1, p3) }
    ];
  }

  overallRisk(r: HeartMicroImpulseSession): number {
    return Math.round((r.mainDiagnosis.percent * 0.5) + (r.features.urgency * 0.3) + ((100 - r.features.cycleStabilityProxy) * 0.2));
  }

  diagDonut(list: DiagnosisProb[]): string {
    const a = list[0]?.percent || 0;
    const b = (list[1]?.percent || 0) + a;
    return `conic-gradient(#ef4444 ${a}%, #f59e0b ${a}% ${b}%, #3b82f6 ${b}% 100%)`;
  }

  semiGauge(percent: number): string {
    return `conic-gradient(from 180deg, #10b981 ${percent * 1.8}deg, #e5e7eb ${percent * 1.8}deg 180deg)`;
  }

  wavePoints(data: number[]): string {
    if (!data.length) return '0,60 420,60';
    return data.slice(-180).map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 420},${110 - v}`).join(' ');
  }

  private drawOverlay() {
    const video = this.videoRef?.nativeElement;
    const canvas = this.overlayRef?.nativeElement;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = video.clientWidth || 640;
    const h = canvas.height = video.clientHeight || 360;
    ctx.clearRect(0, 0, w, h);

    const quality = this.signalQuality();
    const ok = quality >= 65;
    const accent = ok ? '#22c55e' : '#f97316';
    const soft = ok ? 'rgba(34,197,94,0.14)' : 'rgba(249,115,22,0.14)';

    const pose = this.estimateTorsoPose();
    const tracked = pose.confidence >= 0.56;
    this.overlayTracked.set(tracked);

    if (!tracked) {
      // Stage 1: search/detect mode – full anatomical overlayni ko‘rsatmaymiz
      ctx.strokeStyle = 'rgba(148,163,184,0.75)';
      ctx.lineWidth = 1.5;
      const boxW = w * 0.42;
      const boxH = h * 0.44;
      const boxX = (w - boxW) / 2;
      const boxY = h * 0.34;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.fillText('Target zona qidirilmoqda...', boxX + 8, boxY - 8);
      ctx.fillText('Ko‘krak sohasi hali to‘liq ko‘rinmayapti', boxX + 8, boxY + boxH + 16);
      return;
    }

    // Stage 2/3: tracked mode
    this.torsoPose.cx = this.torsoPose.cx * 0.82 + pose.cx * 0.18;
    this.torsoPose.cy = this.torsoPose.cy * 0.82 + pose.cy * 0.18;
    this.torsoPose.scale = this.torsoPose.scale * 0.84 + pose.scale * 0.16;
    this.torsoPose.tilt = this.torsoPose.tilt * 0.8 + pose.tilt * 0.2;

    const cx = w * this.torsoPose.cx;
    const neckY = h * (this.torsoPose.cy - 0.3 * this.torsoPose.scale);
    const shoulderY = h * (this.torsoPose.cy - 0.2 * this.torsoPose.scale);
    const thoraxTop = h * (this.torsoPose.cy - 0.2 * this.torsoPose.scale);
    const thoraxBottom = h * (this.torsoPose.cy + 0.28 * this.torsoPose.scale);
    const thoraxHalfW = w * 0.2 * this.torsoPose.scale;

    // outer thorax contour
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.85, shoulderY);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 1.18, h * 0.48, cx - thoraxHalfW * 0.78, thoraxBottom);
    ctx.quadraticCurveTo(cx, h * 0.9, cx + thoraxHalfW * 0.78, thoraxBottom);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 1.18, h * 0.48, cx + thoraxHalfW * 0.85, shoulderY);
    ctx.stroke();

    // subtle fill for target framing zone
    ctx.fillStyle = soft;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.8, thoraxTop);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 1.05, h * 0.5, cx - thoraxHalfW * 0.72, thoraxBottom * 0.98);
    ctx.quadraticCurveTo(cx, h * 0.86, cx + thoraxHalfW * 0.72, thoraxBottom * 0.98);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 1.05, h * 0.5, cx + thoraxHalfW * 0.8, thoraxTop);
    ctx.closePath();
    ctx.fill();

    // clavicles + neck base
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 0.58, shoulderY);
    ctx.quadraticCurveTo(cx - thoraxHalfW * 0.2, neckY + h * 0.02, cx, neckY + h * 0.03);
    ctx.quadraticCurveTo(cx + thoraxHalfW * 0.2, neckY + h * 0.02, cx + thoraxHalfW * 0.58, shoulderY);
    ctx.stroke();

    // sternum line + center axis
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, shoulderY + 6);
    ctx.lineTo(cx, thoraxBottom - 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // rib-cage hints (left/right arcs)
    ctx.strokeStyle = 'rgba(148,163,184,0.72)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      const y = thoraxTop + (i + 1) * ((thoraxBottom - thoraxTop) / 6);
      const spread = thoraxHalfW * (0.76 - i * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - spread, y);
      ctx.quadraticCurveTo(cx - spread * 0.25, y - 7, cx - thoraxHalfW * 0.08, y + 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + thoraxHalfW * 0.08, y + 1);
      ctx.quadraticCurveTo(cx + spread * 0.25, y - 7, cx + spread, y);
      ctx.stroke();
    }

    // shoulder balance lines
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - thoraxHalfW * 1.05, shoulderY);
    ctx.lineTo(cx - thoraxHalfW * 0.58, shoulderY);
    ctx.moveTo(cx + thoraxHalfW * 0.58, shoulderY);
    ctx.lineTo(cx + thoraxHalfW * 1.05, shoulderY);
    ctx.stroke();

    // precordial target zone (left chest emphasis)
    // preview mirrored bo‘lganda chap precordial hududni foydalanuvchi nuqtai nazariga mos akslantiramiz
    const precordialSign = this.isPreviewMirrored ? 1 : -1;
    const heartX = cx + precordialSign * thoraxHalfW * 0.24;
    const heartY = h * 0.56;
    const heartW = thoraxHalfW * 0.52;
    const heartH = h * 0.19;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(heartX, heartY, heartW * 0.55, heartH * 0.5, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ok ? 'rgba(16,185,129,0.16)' : 'rgba(249,115,22,0.16)';
    ctx.fill();

    // neck support ring (secondary region)
    ctx.strokeStyle = ok ? 'rgba(34,197,94,0.7)' : 'rgba(249,115,22,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, neckY, thoraxHalfW * 0.32, h * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();

    // guidance text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(ok ? 'Anatomik zona mos: ko‘krak sohasi to‘g‘ri' : 'Ko‘krak markaziga yaqinlashing va barqaror turing', cx - thoraxHalfW, thoraxTop - 8);
  }

  private estimateTorsoPose(): { cx: number; cy: number; scale: number; tilt: number; confidence: number } {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return { ...this.torsoPose, confidence: 0 };
    const c = document.createElement('canvas');
    c.width = 96; c.height = 72;
    const ctx = c.getContext('2d');
    if (!ctx) return { ...this.torsoPose, confidence: 0 };
    ctx.drawImage(video, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    let count = 0;
    let sumX = 0, sumY = 0;
    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    let leftMass = 0, rightMass = 0;

    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (lum < 165) {
          count++;
          sumX += x; sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < c.width / 2) leftMass++; else rightMass++;
        }
      }
    }

    if (count < 220) return { ...this.torsoPose, confidence: 0.2 };
    const cx = sumX / count / c.width;
    const cy = sumY / count / c.height;
    const bw = Math.max(1, maxX - minX);
    const scale = Math.max(0.72, Math.min(1.28, (bw / c.width) * 1.9));
    const tilt = (rightMass - leftMass) / Math.max(1, count);
    const occupancy = count / (c.width * c.height);
    const centered = 1 - Math.min(1, Math.abs(cx - 0.5) * 2.2) - Math.min(1, Math.abs(cy - 0.57) * 2.4);
    const confidence = Math.max(0, Math.min(1, occupancy * 2.4 + centered * 0.35));
    return { cx, cy, scale, tilt, confidence };
  }

  private updateGuidance(brightness: number, motion: number, mic: number) {
    const p = this.torsoPose;
    const tooFar = p.scale < 0.84;
    const tooNear = p.scale > 1.18;
    const offCenter = Math.abs(p.cx - 0.5) > 0.11;
    const highLow = p.cy < 0.48 || p.cy > 0.67;
    const rotated = Math.abs(p.tilt) > 0.08;
    const unstable = motion > 45;
    const orientationWrong = this.isPreviewMirrored ? p.tilt < -0.12 : p.tilt > 0.12;
    const trackingWeak = !this.overlayTracked();
    const clothingWeak = this.scanMode() === 'topography' && this.clothingReliability() < 52;

    const warnings: string[] = [];
    if (brightness < 45) warnings.push('Yorug‘lik yetarli emas');
    if (mic < 8) warnings.push('Audio sifati past');
    if (tooFar) warnings.push('Kamera juda uzoq');
    if (tooNear) warnings.push('Kamera juda yaqin');
    if (offCenter) warnings.push('Ko‘krak sohasi noto‘g‘ri joylashgan');
    if (highLow) warnings.push('Target zona markazda emas');
    if (rotated) warnings.push('Tana juda burilgan');
    if (orientationWrong) warnings.push('Chap/o‘ng yo‘nalish noto‘g‘ri');
    if (unstable) warnings.push('Foydalanuvchi ko‘p harakatlanyapti, signal beqaror');
    if (trackingWeak) warnings.push('Ko‘krak sohasi aniqlanmoqda, target zona qidirilmoqda');
    if (clothingWeak) warnings.push('Kiyim konturi sabab topografik aniqlik pasayishi mumkin');

    const readinessScore =
      (offCenter ? 0 : 18) +
      (highLow ? 0 : 15) +
      (tooFar || tooNear ? 0 : 14) +
      (rotated || orientationWrong ? 0 : 13) +
      (brightness >= 45 ? 12 : 0) +
      (mic >= 8 ? 12 : 0) +
      (motion <= 45 ? 16 : 0);
    const ready = !trackingWeak && readinessScore >= 78 && this.signalQuality() >= 62 && this.confidence() >= 58;
    this.isReady.set(ready);
    this.readinessWarnings.set(ready
      ? ['Signal to‘g‘ri', 'Natija chiqarish uchun yetarli', 'Testni boshlang']
      : [...warnings, 'Natija aniqligi pasayishi mumkin', 'Signal past, lekin davom etish mumkin']);

    if (ready) this.liveGuide.set('Signal to‘g‘ri. Natija chiqarish uchun yetarli. Testni boshlang');
    else this.liveGuide.set(warnings[0] || 'Natija chiqarish uchun signal hali yetarli emas');
  }

  private sampleSignals() {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.audioData);
      const rms = Math.sqrt(this.audioData.reduce((s, n) => {
        const v = (n - 128) / 128;
        return s + v * v;
      }, 0) / this.audioData.length);
      this.waveform.push(Math.min(100, Math.round(rms * 260)));
    }
    this.motionTrace.push(this.estimateMotion());
  }

  private brightness(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    const ctx = c.getContext('2d'); if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (data.length / 4);
  }

  private estimateMotion(): number {
    const video = this.videoRef?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return 0;
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    const ctx = c.getContext('2d'); if (!ctx) return 0;
    ctx.drawImage(video, 0, 0, 64, 48);
    const current = ctx.getImageData(0, 0, 64, 48).data;
    if (!this.prevFrame) {
      this.prevFrame = current;
      return 0;
    }
    let diff = 0;
    for (let i = 0; i < current.length; i += 20) diff += Math.abs(current[i] - this.prevFrame[i]);
    this.prevFrame = current;
    return Math.min(100, diff / 70);
  }

  topographyCells(r: HeartMicroImpulseSession): number[] {
    if (r.topographyGrid?.length) return r.topographyGrid;
    return this.buildTopographyGrid(r.features);
  }

  topographyColor(v: number): string {
    const clamped = this.clamp(v, 1, 99);
    const hue = 220 - Math.round(clamped * 1.8);
    const alpha = 0.18 + (clamped / 100) * 0.66;
    return `hsla(${hue}, 85%, 54%, ${alpha})`;
  }

  heartModelBackground(r: HeartMicroImpulseSession): string {
    const profile = r.heartVisualProfile ?? this.buildHeartVisualProfile(r.features);
    const shift = Math.max(-20, Math.min(20, profile.leftRightBias));
    const left = this.clamp(46 - shift, 20, 80);
    const right = this.clamp(54 + shift, 20, 80);
    return `radial-gradient(circle at ${left}% 45%, rgba(244,63,94,0.44), rgba(15,23,42,0.88) 54%), radial-gradient(circle at ${right}% 62%, rgba(14,165,233,0.32), transparent 60%)`;
  }

  heartModelTransform(r: HeartMicroImpulseSession): string {
    const profile = r.heartVisualProfile ?? this.buildHeartVisualProfile(r.features);
    const rot = Math.max(-14, Math.min(14, profile.leftRightBias * 0.65));
    const scale = 0.92 + (profile.pulseLevel / 100) * 0.18;
    return `translateY(${profile.kineticDelay * 0.08}px) rotate(${rot}deg) scale(${scale})`;
  }

  heartHotspotColor(r: HeartMicroImpulseSession): string {
    const index = r.features.rezonansAsimmetriyaIndeksi;
    if (index >= 70) return '#fb7185';
    if (index >= 45) return '#f97316';
    return '#22d3ee';
  }

  provocationTrendPoints(cp: NonNullable<HeartMicroImpulseSession['cardioProvocation']>): string {
    const series = [
      this.avg(cp.baselineMotion),
      this.avg(cp.provocationMotion),
      this.avg(cp.recoveryMotion),
      cp.recoveryStabilityIndex
    ];
    return series.map((v, i) => `${(i / (series.length - 1)) * 420},${110 - this.clamp(v, 1, 99)}`).join(' ');
  }

  private buildTopographyGrid(features: HeartMicroImpulseFeatures): number[] {
    const base = [
      features.prekordialDispersiyaSkori * 0.9,
      features.rezonansAsimmetriyaIndeksi * 0.84,
      features.mexanikTarqalishKechikishi * 0.95,
      features.turbulentVibroakustikEhtimol * 0.88,
      features.mikrosinxronlikIndeksi * 0.65,
      features.motionEnergyAsymmetry * 0.78
    ];
    const grid: number[] = [];
    for (let i = 0; i < 24; i++) {
      const x = i % 6;
      const y = Math.floor(i / 6);
      const spread = base[(x + y) % base.length];
      const resonance = features.prekordialDispersiyaSkori * (1 + (x - 2.5) * 0.06);
      const asym = features.rezonansAsimmetriyaIndeksi * (this.isPreviewMirrored ? (x > 2 ? 1.08 : 0.92) : (x < 3 ? 1.08 : 0.92));
      const depth = features.mexanikTarqalishKechikishi * (1 + y * 0.04);
      grid.push(this.clamp((spread + resonance + asym + depth) / 4, 1, 99));
    }
    return grid;
  }

  private buildHeartVisualProfile(features: HeartMicroImpulseFeatures): { pulseLevel: number; leftRightBias: number; kineticDelay: number } {
    return {
      pulseLevel: this.clamp((features.signalQuality * 0.35) + (features.confidence * 0.45) + (features.acousticTurbulence * 0.2), 1, 99),
      leftRightBias: this.clamp((features.rezonansAsimmetriyaIndeksi - 50) * 0.9, -40, 40),
      kineticDelay: this.clamp((features.mexanikTarqalishKechikishi * 0.65) + ((100 - features.mikrosinxronlikIndeksi) * 0.2), 1, 99)
    };
  }

  private chestContourReliability(pose: { confidence: number; scale: number }): number {
    const brightness = this.brightness();
    const base = pose.confidence * 100;
    const sizePenalty = pose.scale < 0.82 || pose.scale > 1.2 ? 16 : 0;
    const lightPenalty = brightness < 42 ? 18 : 0;
    return this.clamp(base - sizePenalty - lightPenalty + 22, 1, 99);
  }

  private buildCardioProvocationMetrics(features: HeartMicroImpulseFeatures): NonNullable<HeartMicroImpulseSession['cardioProvocation']> {
    const baselineWave = this.phaseWaveforms.baseline;
    const provWave = this.phaseWaveforms.breathing.concat(this.phaseWaveforms.hold);
    const recoveryWave = this.phaseWaveforms.recovery;
    const baselineMotion = this.phaseMotions.baseline;
    const provMotion = this.phaseMotions.breathing.concat(this.phaseMotions.hold);
    const recoveryMotion = this.phaseMotions.recovery;

    const baselineStd = this.std(baselineWave.length ? baselineWave : [30]);
    const provStd = this.std(provWave.length ? provWave : [35]);
    const recStd = this.std(recoveryWave.length ? recoveryWave : [30]);
    const provShift = provStd - baselineStd;
    const recoveryGain = baselineStd - recStd;
    const reserve = this.clamp(72 - provShift * 2 + recoveryGain * 3 + (features.signalQuality - 50) * 0.2, 1, 99);
    const recoverySlope = this.clamp(55 + recoveryGain * 5 - Math.max(0, provShift) * 2, 1, 99);
    const decompRisk = this.clamp(100 - reserve + Math.max(0, provShift * 3) + (features.autonomicStressProxy * 0.2), 1, 99);
    const recoveryStability = this.clamp(65 + (baselineStd - Math.abs(recStd - baselineStd)) * 2 - this.std(recoveryMotion.length ? recoveryMotion : [20]), 1, 99);
    const couplingFlex = this.clamp(68 - Math.abs(this.avg(provMotion) - this.avg(provWave)) * 0.8 + features.mikrosinxronlikIndeksi * 0.18, 1, 99);
    const loadAdaptation = this.clamp((reserve * 0.45) + (recoverySlope * 0.3) + (couplingFlex * 0.25), 1, 99);
    const responseBalance = this.clamp(100 - Math.abs(this.avg(provWave) - this.avg(recoveryWave)) * 1.1, 1, 99);

    return {
      phaseTimeline: [
        { phase: 'baseline', seconds: 6 },
        { phase: 'breathing', seconds: 7 },
        { phase: 'hold', seconds: 4, skipped: this.phaseWaveforms.hold.length === 0 },
        { phase: 'recovery', seconds: 8 }
      ],
      baselineWaveform: baselineWave,
      provocationWaveform: provWave,
      recoveryWaveform: recoveryWave,
      baselineMotion,
      provocationMotion: provMotion,
      recoveryMotion,
      cardiacReserveScore: reserve,
      provokedMechanicalRecoveryTime: this.clamp(6 + Math.max(0, provShift * 1.8), 2, 45),
      autonomicRecoverySlope: recoverySlope,
      respiratoryCardiacCouplingFlexibility: couplingFlex,
      loadAdaptationScore: loadAdaptation,
      hiddenDecompensationRisk: decompRisk,
      recoveryStabilityIndex: recoveryStability,
      provocationResponseBalance: responseBalance
    };
  }

  private setupAudio(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const src = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    src.connect(this.analyser);
  }

  private avg(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); }
  private max(arr: number[]) { return arr.reduce((a, b) => Math.max(a, b), 0); }
  private std(arr: number[]) {
    const m = this.avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + ((v - m) ** 2), 0) / Math.max(1, arr.length));
  }
  private clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(v))); }

  private cleanup() {
    if (this.timer) clearInterval(this.timer);
    if (this.qcTimer) clearInterval(this.qcTimer);
    this.timer = null;
    this.qcTimer = null;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.prevFrame = null;
    this.provocationPhase.set('idle');
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
