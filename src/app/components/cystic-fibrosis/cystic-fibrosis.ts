import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cystic-fibrosis',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-10 flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Mukovitsidoz (Cystic Fibrosis) Moduli</h2>
          <p class="text-medical-text-muted font-medium">Ixtisoslashgan diagnostika va monitoring bo'limi</p>
        </div>
        <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg shadow-blue-100/50">
          <mat-icon class="text-3xl">medical_services</mat-icon>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Stats -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white border border-medical-border p-8 rounded-[2.5rem] shadow-xl">
            <h3 class="text-xl font-black text-medical-text mb-8">Klinik ko'rsatkichlar</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-6 bg-blue-50 border border-blue-100 rounded-3xl group hover:bg-white transition-all">
                <p class="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">Ter testi (Sweat Test)</p>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-black text-medical-text">65</span>
                  <span class="text-sm font-bold text-medical-text-muted mb-1">mmol/L</span>
                </div>
                <div class="mt-4 flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">Yuqori</span>
                  <span class="text-[10px] text-medical-text-muted font-medium">Norma: < 40 mmol/L</span>
                </div>
              </div>
              <div class="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl group hover:bg-white transition-all">
                <p class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-2">FEV1 % Bashorat</p>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-black text-medical-text">82</span>
                  <span class="text-sm font-bold text-medical-text-muted mb-1">%</span>
                </div>
                <div class="mt-4 flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Yaxshi</span>
                  <span class="text-[10px] text-medical-text-muted font-medium">Oxirgi 3 oyda barqaror</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white border border-medical-border p-8 rounded-[2.5rem] shadow-xl">
            <h3 class="text-xl font-black text-medical-text mb-8">Genetik Profil</h3>
            <div class="p-6 bg-slate-50 border border-medical-border rounded-3xl">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <mat-icon>dna</mat-icon>
                </div>
                <div>
                  <h4 class="text-lg font-bold text-medical-text">CFTR Mutatsiyasi</h4>
                  <p class="text-xs text-medical-text-muted font-medium">Molekulyar-genetik tahlil natijasi</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-white border border-medical-border rounded-2xl">
                  <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest block mb-1">Allel 1</span>
                  <span class="text-sm font-black text-medical-text">F508del (Class II)</span>
                </div>
                <div class="p-4 bg-white border border-medical-border rounded-2xl">
                  <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest block mb-1">Allel 2</span>
                  <span class="text-sm font-black text-medical-text">G551D (Class III)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Side Panel -->
        <div class="space-y-8">
          <div class="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
              <mat-icon>medication</mat-icon>
              CFTR Modulyatorlari
            </h3>
            <div class="space-y-4">
              <div class="p-4 bg-white/10 rounded-2xl border border-white/20">
                <p class="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Tavsiya etilgan</p>
                <p class="text-sm font-black">Trikafta (Elexa/Teza/Iva)</p>
                <p class="text-[10px] mt-2 opacity-80 leading-relaxed">F508del mutatsiyasi mavjudligi sababli ushbu modulyator yuqori samaradorlik ko'rsatadi.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6">Monitoring Rejasi</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <mat-icon class="text-blue-500">calendar_today</mat-icon>
                <div>
                  <p class="text-xs font-bold text-medical-text">Spirometriya</p>
                  <p class="text-[10px] text-medical-text-muted font-medium">Har 3 oyda</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <mat-icon class="text-blue-500">science</mat-icon>
                <div>
                  <p class="text-xs font-bold text-medical-text">Sputum Culture</p>
                  <p class="text-[10px] text-medical-text-muted font-medium">Har bir tashrifda</p>
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
export class CysticFibrosisComponent {
}
