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
    <div class="premium-cases mx-auto max-w-6xl">
      <div class="premium-header mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-4">
          <div class="header-icon">
            <mat-icon>groups</mat-icon>
          </div>
          <div>
            <p class="section-kicker">KLINIK PANEL</p>
            <h2 class="text-3xl font-black tracking-tight text-[#F7F0D0] md:text-4xl">Bemorlar holatlari</h2>
            <p class="mt-1 text-base font-medium text-[#C9C2A4] md:text-lg">Barcha saqlangan tahlillar ro'yxati</p>
          </div>
        </div>
        <a routerLink="/new-case" class="premium-new-case">
          <mat-icon>add</mat-icon>
          Yangi holat
        </a>
      </div>

      <div class="grid gap-6">
        @for (case of cases(); track case.id) {
          <a [routerLink]="['/case', case.id]"
             class="case-card group">
            <div class="patient-block">
              <div class="patient-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="min-w-0">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-xl font-black text-[#F7F0D0]">Bemor #{{ case.id.slice(0, 8) }}</h3>
                  <span class="gender-badge">
                    {{ case.gender === 'male' ? 'Erkak' : 'Ayol' }}
                  </span>
                </div>
                <div class="metadata-row">
                  <span><mat-icon>cake</mat-icon>{{ case.age }} yosh</span>
                  <span><mat-icon>schedule</mat-icon>{{ case.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>

            <div class="symptom-block">
              <p>Asosiy simptom</p>
              <strong>{{ case.symptoms }}</strong>
            </div>

            <div class="action-row">
              <button (click)="deleteCase($event, case.id)" class="action-btn danger" title="O'chirish" aria-label="Bemor holatini o'chirish">
                <mat-icon>delete</mat-icon>
              </button>
              <div class="action-btn view" aria-hidden="true">
                <mat-icon>chevron_right</mat-icon>
              </div>
            </div>
          </a>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>folder_open</mat-icon>
            </div>
            <h3>Hozircha holatlar mavjud emas</h3>
            <p>Tizimdan foydalanishni boshlash uchun birinchi bemor ma'lumotlarini kiriting</p>
            <a routerLink="/new-case" class="premium-new-case inline-flex">Birinchi holatni yarating</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}.premium-cases{position:relative;z-index:1}.section-kicker{color:#D4AF37;font-size:.76rem;font-weight:900;letter-spacing:.24em;text-transform:uppercase}.header-icon{display:grid;place-items:center;min-width:4rem;width:4rem;height:4rem;border-radius:1.25rem;border:1px solid rgba(212,175,55,.42);background:rgba(12,13,10,.86);color:#F5D76E;box-shadow:0 0 34px rgba(212,175,55,.16)}.header-icon mat-icon{font-size:2rem;width:2rem;height:2rem}.premium-new-case{display:inline-flex;min-height:3.25rem;align-items:center;justify-content:center;gap:.65rem;border-radius:1rem;border:1px solid rgba(212,175,55,.45);background:rgba(12,13,10,.78);padding:.85rem 1.2rem;color:#F5D76E;font-weight:900;text-decoration:none;box-shadow:0 0 30px rgba(212,175,55,.10);transition:.2s}.premium-new-case:hover{background:rgba(212,175,55,.14);box-shadow:0 0 42px rgba(212,175,55,.22);transform:translateY(-1px)}.case-card{display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,.8fr) auto;align-items:center;gap:1.5rem;border:1px solid rgba(212,175,55,.30);border-radius:1.6rem;background:rgba(12,13,10,.86);padding:1.7rem 2rem;text-decoration:none;box-shadow:0 22px 70px rgba(0,0,0,.25);backdrop-filter:blur(18px);transition:.2s}.case-card:hover{border-color:rgba(245,215,110,.72);background:rgba(18,16,10,.95);box-shadow:0 0 46px rgba(212,175,55,.18)}.patient-block{display:flex;min-width:0;align-items:center;gap:1.25rem}.patient-avatar{display:grid;place-items:center;min-width:3.6rem;width:3.6rem;height:3.6rem;border-radius:1.1rem;border:1px solid rgba(212,175,55,.38);background:rgba(212,175,55,.12);color:#F5D76E;box-shadow:0 0 26px rgba(212,175,55,.12)}.patient-avatar mat-icon{font-size:2rem;width:2rem;height:2rem}.gender-badge{border:1px solid rgba(212,175,55,.36);border-radius:999px;background:rgba(212,175,55,.10);padding:.22rem .62rem;color:#D4AF37;font-size:.65rem;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.metadata-row{display:flex;flex-wrap:wrap;gap:.85rem;color:#8D8876;font-size:.9rem;font-weight:700}.metadata-row span{display:inline-flex;align-items:center;gap:.35rem}.metadata-row mat-icon{color:#D4AF37;font-size:1rem;width:1rem;height:1rem}.symptom-block{border-left:1px solid rgba(212,175,55,.22);padding-left:1.5rem;min-width:0}.symptom-block p{margin:0 0 .35rem;color:#D4AF37;font-size:.68rem;font-weight:900;letter-spacing:.22em;text-transform:uppercase}.symptom-block strong{display:-webkit-box;overflow:hidden;color:#F7F0D0;font-size:1.05rem;font-weight:900;line-height:1.4;-webkit-line-clamp:2;-webkit-box-orient:vertical}.action-row{display:flex;justify-content:flex-end;gap:.8rem}.action-btn{display:grid;place-items:center;width:3.35rem;height:3.35rem;border-radius:1rem;border:1px solid rgba(212,175,55,.32);background:rgba(3,4,3,.68);transition:.2s}.action-btn.view{color:#F5D76E}.action-btn.view:hover,.case-card:hover .action-btn.view{border-color:rgba(245,215,110,.65);box-shadow:0 0 28px rgba(212,175,55,.18)}.action-btn.danger{color:#FF6B6B;border-color:rgba(255,77,77,.22)}.action-btn.danger:hover{background:rgba(255,77,77,.10);border-color:rgba(255,77,77,.55);box-shadow:0 0 28px rgba(255,77,77,.18)}.empty-state{text-align:center;border:1px dashed rgba(212,175,55,.35);border-radius:1.7rem;background:rgba(12,13,10,.78);padding:5rem 1.5rem;color:#C9C2A4}.empty-icon{display:grid;place-items:center;width:5rem;height:5rem;margin:0 auto 1.5rem;border-radius:999px;border:1px solid rgba(212,175,55,.28);background:rgba(212,175,55,.08);color:#D4AF37}.empty-icon mat-icon{font-size:3rem;width:3rem;height:3rem}.empty-state h3{margin-bottom:.5rem;color:#F7F0D0;font-size:1.35rem;font-weight:900}.empty-state p{max-width:22rem;margin:0 auto 2rem}@media(max-width:900px){.case-card{grid-template-columns:1fr;gap:1.25rem;padding:1.2rem}.symptom-block{border-left:0;border-top:1px solid rgba(212,175,55,.20);padding-left:0;padding-top:1rem}.action-row{justify-content:flex-start}.action-btn{width:3rem;height:3rem}.premium-new-case{width:100%}.premium-header{align-items:stretch}}
  `],
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
