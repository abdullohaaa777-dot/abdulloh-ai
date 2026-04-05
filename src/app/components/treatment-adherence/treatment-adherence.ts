import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-treatment-adherence',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Davolash Rejimiga Amal Qilish</h2>
        <p class="text-medical-text-muted font-medium">Dori-darmonlar va muolajalar monitoringi</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Overall Adherence -->
        <div class="lg:col-span-1 bg-white border border-medical-border p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
          <h3 class="text-lg font-bold text-medical-text mb-8">Umumiy ko'rsatkich</h3>
          <div class="relative w-48 h-48 mb-8">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="3" />
              <circle cx="18" cy="18" r="16" fill="none" 
                      class="stroke-emerald-500 transition-all duration-1000"
                      stroke-width="3" 
                      stroke-linecap="round" 
                      stroke-dasharray="85, 100" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="text-5xl font-black text-medical-text">85%</span>
              <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Adherence</span>
            </div>
          </div>
          <p class="text-sm font-medium text-medical-text-muted leading-relaxed">Bemor davolash rejimiga yaxshi amal qilmoqda. Oxirgi 7 kunlik ko'rsatkich barqaror.</p>
        </div>

        <!-- Detailed Tracking -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6">Dori vositalari</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-4 p-4 bg-slate-50 border border-medical-border rounded-2xl group hover:bg-white transition-all">
                <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <mat-icon>medication</mat-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-medical-text">Lisinopril 10mg</h4>
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Kuniga 1 mahal, ertalab</p>
                </div>
                <div class="flex gap-1">
                  <div class="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-slate-200 rounded-full"></div>
                  <div class="w-2 h-6 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div class="flex items-center gap-4 p-4 bg-slate-50 border border-medical-border rounded-2xl group hover:bg-white transition-all">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <mat-icon>inhaler</mat-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-medical-text">Salbutamol Inhaler</h4>
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Zarurat bo'lganda</p>
                </div>
                <div class="flex gap-1">
                  <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6">Muolajalar va Fizioterapiya</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div class="flex items-center gap-3 mb-2">
                  <mat-icon class="text-indigo-600 text-sm h-4 w-4">fitness_center</mat-icon>
                  <span class="text-xs font-bold text-indigo-900 uppercase tracking-widest">Nafas mashqlari</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-indigo-700">Haftalik: 5/7</span>
                  <span class="text-xs font-black text-indigo-600">71%</span>
                </div>
              </div>
              <div class="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <div class="flex items-center gap-3 mb-2">
                  <mat-icon class="text-purple-600 text-sm h-4 w-4">directions_walk</mat-icon>
                  <span class="text-xs font-bold text-purple-900 uppercase tracking-widest">Kunlik yurish</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-purple-700">Haftalik: 7/7</span>
                  <span class="text-xs font-black text-purple-600">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentAdherenceComponent {
}
