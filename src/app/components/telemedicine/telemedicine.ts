import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-telemedicine',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Telemeditsina</h2>
          <p class="text-medical-text-muted font-medium">Shifokor va bemor o'rtasidagi chat/konsultatsiya</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary px-6 py-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
            <mat-icon>videocam</mat-icon>
            Video qo'ng'iroq
          </button>
        </div>
      </div>

      <div class="flex-1 bg-white border border-medical-border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <!-- Chat Header -->
        <div class="p-6 border-b border-medical-border flex items-center gap-4 bg-slate-50/50">
          <div class="w-12 h-12 rounded-full bg-medical-primary/10 border border-medical-primary/20 flex items-center justify-center text-medical-primary font-bold">
            AY
          </div>
          <div>
            <h3 class="text-lg font-bold text-medical-text">Dr. Abdulloh Yuldashev</h3>
            <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest mb-1">Oliy toifali shifokor</p>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Online</span>
            </div>
          </div>
          <div class="ml-auto flex gap-2">
            <button class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-medical-text-muted">
              <mat-icon>search</mat-icon>
            </button>
            <button class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-medical-text-muted">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-8 space-y-6 bg-medical-bg/20">
          <div class="flex flex-col items-center justify-center py-10 opacity-50">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <mat-icon class="text-slate-400">lock</mat-icon>
            </div>
            <p class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Xabarlar end-to-end shifrlangan</p>
          </div>

          <div class="flex gap-4 max-w-[80%]">
            <div class="w-8 h-8 rounded-full bg-medical-primary/10 flex items-center justify-center text-medical-primary text-[10px] font-bold shrink-0">AY</div>
            <div class="bg-white border border-medical-border p-4 rounded-2xl rounded-tl-none shadow-sm">
              <p class="text-sm text-medical-text font-medium leading-relaxed">Assalomu alaykum! Tahlil natijalaringizni ko'rib chiqdim. CRP miqdori biroz oshgan, bu yallig'lanish belgisi bo'lishi mumkin.</p>
              <p class="text-[10px] text-medical-text-muted font-bold mt-2">14:30</p>
            </div>
          </div>

          <div class="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
            <div class="w-8 h-8 rounded-full bg-slate-100 border border-medical-border flex items-center justify-center text-medical-text-muted text-[10px] font-bold shrink-0">ME</div>
            <div class="bg-medical-primary text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-medical-primary/20">
              <p class="text-sm font-medium leading-relaxed">Va alaykum assalom, shifokor. Qanday tavsiya berasiz?</p>
              <p class="text-[10px] text-white/70 font-bold mt-2">14:32</p>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="p-6 border-t border-medical-border bg-white">
          <div class="flex items-center gap-4 bg-slate-50 border border-medical-border p-2 rounded-2xl focus-within:border-medical-primary transition-all">
            <button class="p-2 hover:bg-slate-200 rounded-xl transition-colors text-medical-text-muted">
              <mat-icon>attach_file</mat-icon>
            </button>
            <input type="text" class="flex-1 bg-transparent border-none outline-none px-2 py-2 text-sm font-medium" placeholder="Xabar yozing...">
            <button class="w-10 h-10 bg-medical-primary text-white rounded-xl shadow-lg shadow-medical-primary/20 flex items-center justify-center hover:bg-indigo-700 transition-all">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TelemedicineComponent {
}
