import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { CaseData } from '../../services/ai';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="medical-depth-card scan-sweep relative overflow-hidden p-6 md:p-8">
        <div class="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-indigo-200/45 blur-2xl pointer-events-none"></div>
        <div class="absolute right-12 bottom-2 w-20 h-20 rounded-full bg-sky-200/50 blur-2xl pointer-events-none"></div>
        <div class="relative flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-extrabold tracking-[0.24em] text-medical-primary/70 uppercase mb-2">Clinical Intelligence</p>
            <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Bemorlar holatlari</h2>
            <p class="text-medical-text-muted font-medium">Barcha saqlangan tahlillar ro'yxati</p>
          </div>
          <div class="hidden md:flex items-center gap-2 rounded-2xl border border-medical-primary/20 px-4 py-2 bg-white/75 backdrop-blur-sm">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-semibold text-medical-text-muted">Live monitoring active</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-10">
        <div>
          <h3 class="text-xl md:text-2xl font-bold text-medical-text tracking-tight">Klinik holatlar paneli</h3>
          <p class="text-medical-text-muted font-medium text-sm md:text-base">Kuzatuv va tahlil uchun barcha bemor yozuvlari</p>
        </div>
        <a routerLink="/new-case" class="btn-primary px-6 py-3">
          <mat-icon>add</mat-icon>
          Yangi holat
        </a>
      </div>

      <div class="grid gap-5">
        @for (case of cases(); track case.id) {
          <a [routerLink]="['/case', case.id]" 
             class="medical-depth-card p-6 hover:border-medical-primary/35 group flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="w-14 h-14 rounded-2xl bg-slate-50/90 border border-medical-border flex items-center justify-center text-medical-text-muted group-hover:bg-medical-primary/10 group-hover:text-medical-primary group-hover:border-medical-primary/20 transition-all">
                <mat-icon class="text-3xl">person</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold text-medical-text">Bemor #{{ case.id.slice(0, 8) }}</h3>
                  <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {{ case.gender === 'male' ? 'Erkak' : 'Ayol' }}
                  </span>
                </div>
                <p class="text-sm text-medical-text-muted font-medium">
                  {{ case.age }} yosh • {{ case.created_at | date:'dd.MM.yyyy HH:mm' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right hidden md:block">
                <p class="text-[10px] text-medical-text-muted uppercase font-bold tracking-widest mb-1">Asosiy simptom</p>
                <p class="text-sm text-medical-text font-semibold truncate max-w-[250px]">{{ case.symptoms }}</p>
              </div>
              <button (click)="deleteCase($event, case.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" title="O'chirish">
                <mat-icon>delete</mat-icon>
              </button>
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-medical-primary group-hover:bg-medical-primary/5 transition-all">
                <mat-icon>chevron_right</mat-icon>
              </div>
            </div>
          </a>
        } @empty {
          <div class="text-center py-24 premium-surface border border-dashed border-medical-border rounded-3xl relative overflow-hidden">
            <div class="hud-ring w-36 h-36 left-1/2 -translate-x-1/2 top-12 opacity-55"></div>
            <div class="hud-ring hud-ring-slow w-52 h-52 left-1/2 -translate-x-1/2 top-4 opacity-35"></div>
            <div class="relative w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <mat-icon class="text-slate-300 text-5xl h-12 w-12">folder_open</mat-icon>
            </div>
            <h3 class="relative text-xl font-bold text-medical-text mb-2">Hozircha holatlar mavjud emas</h3>
            <p class="relative text-medical-text-muted mb-8 max-w-xs mx-auto">Tizimdan foydalanishni boshlash uchun birinchi bemor ma'lumotlarini kiriting</p>
            <a routerLink="/new-case" class="relative btn-primary inline-flex">Birinchi holatni yarating</a>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  cases = signal<CaseData[]>([]);

  async ngOnInit() {
    try {
      const { data } = await this.supabase.getCases();
      if (data) this.cases.set(data as unknown as CaseData[]);
    } catch (e) {
      console.error('Failed to load cases:', e);
    }
  }

  async deleteCase(event: Event, id: string) {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm('Haqiqatan ham ushbu bemor ma\'lumotlarini o\'chirib tashlamoqchimisiz?')) {
      try {
        const { error } = await this.supabase.deleteCase(id);
        if (error) throw error;
        this.cases.update(cs => cs.filter(c => c.id !== id));
      } catch (e) {
        console.error('Delete error:', e);
        alert('Ma\'lumotlarni o\'chirishda xatolik yuz berdi');
      }
    }
  }
}
