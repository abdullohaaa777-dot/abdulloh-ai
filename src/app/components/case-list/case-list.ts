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
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Bemorlar holatlari</h2>
          <p class="text-medical-text-muted font-medium">Barcha saqlangan tahlillar ro'yxati</p>
        </div>
        <a routerLink="/app/new-case" class="btn-primary px-6 py-3">
          <mat-icon>add</mat-icon>
          Yangi holat
        </a>
      </div>

      <div class="grid gap-5">
        @for (case of cases(); track case.id) {
          <a [routerLink]="['/app/case', case.id]" 
             class="bg-white border border-medical-border p-6 rounded-2xl hover:border-medical-primary hover:shadow-lg hover:shadow-medical-primary/5 transition-all group flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-medical-border flex items-center justify-center text-medical-text-muted group-hover:bg-medical-primary/10 group-hover:text-medical-primary group-hover:border-medical-primary/20 transition-all">
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
          <div class="text-center py-24 bg-white border border-dashed border-medical-border rounded-3xl">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <mat-icon class="text-slate-300 text-5xl h-12 w-12">folder_open</mat-icon>
            </div>
            <h3 class="text-xl font-bold text-medical-text mb-2">Hozircha holatlar mavjud emas</h3>
            <p class="text-medical-text-muted mb-8 max-w-xs mx-auto">Tizimdan foydalanishni boshlash uchun birinchi bemor ma'lumotlarini kiriting</p>
            <a routerLink="/app/new-case" class="btn-primary inline-flex">Birinchi holatni yarating</a>
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
