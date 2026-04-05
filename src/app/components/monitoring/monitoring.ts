import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Monitoring Bo'limi</h2>
        <p class="text-medical-text-muted font-medium">Bemor ko'rsatkichlarini qo'lda kiritish va fayl yuklash</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Manual Entry Form -->
        <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
          <h3 class="text-lg font-bold text-medical-text mb-6 flex items-center gap-2">
            <mat-icon class="text-medical-primary">edit_note</mat-icon>
            Ko'rsatkichlarni kiritish
          </h3>
          
          <form class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="hr" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Yurak urishi (bpm)</label>
                <input id="hr" type="number" class="w-full px-4 py-3 bg-slate-50 border border-medical-border rounded-xl focus:border-medical-primary outline-none transition-all font-bold" placeholder="72">
              </div>
              <div class="space-y-2">
                <label for="spo2" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">SpO2 (%)</label>
                <input id="spo2" type="number" class="w-full px-4 py-3 bg-slate-50 border border-medical-border rounded-xl focus:border-medical-primary outline-none transition-all font-bold" placeholder="98">
              </div>
              <div class="space-y-2">
                <label for="temp" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Harorat (°C)</label>
                <input id="temp" type="number" step="0.1" class="w-full px-4 py-3 bg-slate-50 border border-medical-border rounded-xl focus:border-medical-primary outline-none transition-all font-bold" placeholder="36.6">
              </div>
              <div class="space-y-2">
                <label for="bp" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Qon bosimi</label>
                <input id="bp" type="text" class="w-full px-4 py-3 bg-slate-50 border border-medical-border rounded-xl focus:border-medical-primary outline-none transition-all font-bold" placeholder="120/80">
              </div>
            </div>
            
            <div class="space-y-2">
              <label for="notes" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Qo'shimcha eslatma</label>
              <textarea id="notes" class="w-full px-4 py-3 bg-slate-50 border border-medical-border rounded-xl focus:border-medical-primary outline-none transition-all font-medium h-24" placeholder="Bemor holati haqida qo'shimcha ma'lumot..."></textarea>
            </div>
            
            <button type="submit" class="btn-primary w-full py-4 text-base">
              <mat-icon>save</mat-icon>
              Ma'lumotlarni saqlash
            </button>
          </form>
        </div>

        <!-- File Upload & History -->
        <div class="space-y-8">
          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6 flex items-center gap-2">
              <mat-icon class="text-medical-primary">cloud_upload</mat-icon>
              Fayl yuklash
            </h3>
            <label class="w-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl hover:border-medical-primary hover:bg-medical-primary/5 cursor-pointer transition-all">
              <mat-icon class="text-slate-400 mb-4 text-4xl h-10 w-10">upload_file</mat-icon>
              <span class="text-base font-bold text-medical-text">Laboratoriya natijalari (PDF/Rasm)</span>
              <span class="text-xs text-medical-text-muted mt-2 uppercase tracking-wider">Maksimal 20MB</span>
              <input type="file" class="hidden">
            </label>
          </div>

          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6">Oxirgi monitoringlar</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-slate-50 border border-medical-border rounded-2xl">
                <div>
                  <p class="text-sm font-bold text-medical-text">Yurak urishi: 74 bpm</p>
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Bugun, 14:30</p>
                </div>
                <mat-icon class="text-emerald-500">check_circle</mat-icon>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50 border border-medical-border rounded-2xl">
                <div>
                  <p class="text-sm font-bold text-medical-text">SpO2: 97%</p>
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Kecha, 10:15</p>
                </div>
                <mat-icon class="text-emerald-500">check_circle</mat-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitoringComponent {
}
