import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Klinika Analytics Paneli</h2>
        <p class="text-medical-text-muted font-medium">Klinika faoliyati va bemorlar statistikasi</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div class="bg-white border border-medical-border p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all group">
          <div class="w-12 h-12 bg-medical-primary/10 rounded-2xl flex items-center justify-center text-medical-primary mb-4 group-hover:bg-medical-primary group-hover:text-white transition-all">
            <mat-icon>people</mat-icon>
          </div>
          <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest mb-1">Jami bemorlar</p>
          <h3 class="text-3xl font-black text-medical-text">1,284</h3>
          <p class="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <mat-icon class="text-xs h-3 w-3">trending_up</mat-icon>
            +12% o'tgan oydan
          </p>
        </div>
        <div class="bg-white border border-medical-border p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all group">
          <div class="w-12 h-12 bg-medical-secondary/10 rounded-2xl flex items-center justify-center text-medical-secondary mb-4 group-hover:bg-medical-secondary group-hover:text-white transition-all">
            <mat-icon>psychology</mat-icon>
          </div>
          <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest mb-1">AI Analizlar</p>
          <h3 class="text-3xl font-black text-medical-text">4,592</h3>
          <p class="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <mat-icon class="text-xs h-3 w-3">trending_up</mat-icon>
            +24% o'tgan oydan
          </p>
        </div>
        <div class="bg-white border border-medical-border p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all group">
          <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <mat-icon>warning</mat-icon>
          </div>
          <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest mb-1">Kritik holatlar</p>
          <h3 class="text-3xl font-black text-medical-text">12</h3>
          <p class="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
            <mat-icon class="text-xs h-3 w-3">trending_down</mat-icon>
            -5% o'tgan oydan
          </p>
        </div>
        <div class="bg-white border border-medical-border p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all group">
          <div class="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <mat-icon>attach_money</mat-icon>
          </div>
          <p class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest mb-1">Daromad (oylik)</p>
          <h3 class="text-3xl font-black text-medical-text">$12.4k</h3>
          <p class="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <mat-icon class="text-xs h-3 w-3">trending_up</mat-icon>
            +8% o'tgan oydan
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
          <h3 class="text-lg font-bold text-medical-text mb-8">Bemorlar demografiyasi</h3>
          <div class="h-64 flex items-end justify-between gap-4 px-4">
            <div class="flex-1 bg-medical-primary/20 rounded-t-xl relative group" style="height: 40%">
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-medical-text opacity-0 group-hover:opacity-100 transition-all">18-25</div>
            </div>
            <div class="flex-1 bg-medical-primary/40 rounded-t-xl relative group" style="height: 65%">
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-medical-text opacity-0 group-hover:opacity-100 transition-all">26-35</div>
            </div>
            <div class="flex-1 bg-medical-primary/60 rounded-t-xl relative group" style="height: 85%">
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-medical-text opacity-0 group-hover:opacity-100 transition-all">36-45</div>
            </div>
            <div class="flex-1 bg-medical-primary/80 rounded-t-xl relative group" style="height: 55%">
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-medical-text opacity-0 group-hover:opacity-100 transition-all">46-60</div>
            </div>
            <div class="flex-1 bg-medical-primary rounded-t-xl relative group" style="height: 35%">
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-medical-text opacity-0 group-hover:opacity-100 transition-all">60+</div>
            </div>
          </div>
          <div class="flex justify-between mt-4 px-4">
            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">18-25</span>
            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">26-35</span>
            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">36-45</span>
            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">46-60</span>
            <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">60+</span>
          </div>
        </div>

        <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
          <h3 class="text-lg font-bold text-medical-text mb-8">Kasalliklar tarqalishi</h3>
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-bold text-medical-text uppercase tracking-widest">
                <span>Anemiya</span>
                <span>42%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-red-500 h-full" style="width: 42%"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-bold text-medical-text uppercase tracking-widest">
                <span>Gipertoniya</span>
                <span>28%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-full" style="width: 28%"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-bold text-medical-text uppercase tracking-widest">
                <span>Qandli diabet</span>
                <span>15%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full" style="width: 15%"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-bold text-medical-text uppercase tracking-widest">
                <span>Mukovitsidoz</span>
                <span>5%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full" style="width: 5%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAnalyticsComponent {
}
