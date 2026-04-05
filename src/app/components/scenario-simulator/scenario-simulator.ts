import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scenario-simulator',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Scenario Simulator</h2>
        <p class="text-medical-text-muted font-medium">Parametrlar o'zgarsa xavflar qanday o'zgarishini simulyatsiya qiling</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Controls -->
        <div class="lg:col-span-1 bg-white border border-medical-border p-8 rounded-3xl shadow-xl space-y-8">
          <h3 class="text-lg font-bold text-medical-text mb-6 flex items-center gap-2">
            <mat-icon class="text-medical-primary">tune</mat-icon>
            Parametrlarni o'zgartirish
          </h3>
          
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label for="age-range" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Yosh</label>
                <span class="text-sm font-black text-medical-primary">{{ age() }}</span>
              </div>
              <input id="age-range" type="range" min="1" max="100" [ngModel]="age()" (ngModelChange)="updateAge($event)" class="w-full accent-medical-primary">
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label for="cholesterol-range" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Xolesterin</label>
                <span class="text-sm font-black text-medical-primary">{{ cholesterol() }}</span>
              </div>
              <input id="cholesterol-range" type="range" min="100" max="400" [ngModel]="cholesterol()" (ngModelChange)="updateCholesterol($event)" class="w-full accent-medical-primary">
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label for="bp-range" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Qon bosimi (S)</label>
                <span class="text-sm font-black text-medical-primary">{{ bp() }}</span>
              </div>
              <input id="bp-range" type="range" min="80" max="200" [ngModel]="bp()" (ngModelChange)="updateBp($event)" class="w-full accent-medical-primary">
            </div>

            <div class="flex items-center justify-between p-4 bg-slate-50 border border-medical-border rounded-2xl">
              <label for="smoking-check" class="text-xs font-bold text-medical-text-muted uppercase tracking-widest">Chekish</label>
              <input id="smoking-check" type="checkbox" [ngModel]="smoking()" (ngModelChange)="updateSmoking($event)" class="w-6 h-6 accent-medical-primary">
            </div>
          </div>

          <button (click)="reset()" class="w-full py-3 text-xs font-bold text-medical-text-muted uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">
            Asl holatga qaytarish
          </button>
        </div>

        <!-- Results -->
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white border border-medical-border p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-medical-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div class="flex items-center gap-4 mb-10 relative z-10">
              <div class="w-12 h-12 bg-medical-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-medical-primary/20">
                <mat-icon>analytics</mat-icon>
              </div>
              <div>
                <h4 class="text-xl font-black text-medical-text tracking-tight">Simulyatsiya natijasi</h4>
                <p class="text-[10px] text-medical-primary font-bold uppercase tracking-widest">Bashorat qilingan xavf o'zgarishi</p>
              </div>
            </div>

            <div class="flex flex-col items-center justify-center py-10 relative z-10">
              <div class="relative w-48 h-48">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="2" />
                  <circle cx="18" cy="18" r="16" fill="none" 
                          [class.stroke-medical-primary]="simulatedRisk() < 50"
                          [class.stroke-amber-500]="simulatedRisk() >= 50 && simulatedRisk() < 75"
                          [class.stroke-red-500]="simulatedRisk() >= 75"
                          stroke-width="2" 
                          stroke-linecap="round" 
                          class="transition-all duration-500"
                          [style.stroke-dasharray]="simulatedRisk() + ', 100'" />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center flex-col">
                  <span class="text-5xl font-black text-medical-text">{{ simulatedRisk() }}%</span>
                  <span class="text-[10px] text-medical-text-muted font-bold uppercase tracking-widest">Umumiy xavf</span>
                </div>
              </div>
              
              <div class="mt-10 grid grid-cols-2 gap-4 w-full">
                <div class="p-6 bg-slate-50 border border-medical-border rounded-3xl text-center">
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-2">Yurak-qon tomir xavfi</p>
                  <p class="text-2xl font-black text-medical-text">{{ simulatedRisk() + 5 }}%</p>
                </div>
                <div class="p-6 bg-slate-50 border border-medical-border rounded-3xl text-center">
                  <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-2">Diabet xavfi</p>
                  <p class="text-2xl font-black text-medical-text">{{ simulatedRisk() - 2 }}%</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <h4 class="text-lg font-bold mb-4 flex items-center gap-2">
              <mat-icon>lightbulb</mat-icon>
              AI Tavsiyasi
            </h4>
            <p class="text-sm font-medium leading-relaxed opacity-90">
              @if (simulatedRisk() > 50) {
                Parametrlarning hozirgi holati yuqori xavf darajasini ko'rsatmoqda. Xolesterin miqdorini kamaytirish va chekishni tashlash xavfni 15% ga kamaytirishi mumkin.
              } @else {
                Bemor holati barqaror. Sog'lom turmush tarzini davom ettirish tavsiya etiladi.
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioSimulatorComponent {
  age = signal<number>(45);
  cholesterol = signal<number>(200);
  bp = signal<number>(120);
  smoking = signal<boolean>(false);
  simulatedRisk = signal<number>(35);

  updateAge(val: number) {
    this.age.set(val);
    this.simulate();
  }

  updateCholesterol(val: number) {
    this.cholesterol.set(val);
    this.simulate();
  }

  updateBp(val: number) {
    this.bp.set(val);
    this.simulate();
  }

  updateSmoking(val: boolean) {
    this.smoking.set(val);
    this.simulate();
  }

  simulate() {
    // Simple mock calculation
    let risk = 10;
    risk += (this.age() - 20) * 0.5;
    risk += (this.cholesterol() - 150) * 0.1;
    risk += (this.bp() - 100) * 0.2;
    if (this.smoking()) risk += 15;
    
    this.simulatedRisk.set(Math.min(Math.max(Math.round(risk), 5), 95));
  }

  reset() {
    this.age.set(45);
    this.cholesterol.set(200);
    this.bp.set(120);
    this.smoking.set(false);
    this.simulate();
  }
}
