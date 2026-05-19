import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface Patient {
  id: string;
  full_name: string;
  age: number;
  bp: number;
  smoking: boolean;
  risk: number;
}

@Component({
  selector: 'app-digital-twin',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="mb-10">
        <h2 class="text-3xl font-extrabold text-medical-text tracking-tight">Digital Clinical Twin</h2>
        <p class="text-medical-text-muted font-medium">Bemorlarning raqamli egizaklari va markaziy overview paneli</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Twin Visualization Placeholder -->
        <div class="lg:col-span-2 bg-white border border-medical-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden min-h-[500px]">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-white -z-10"></div>
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-black text-medical-text">Raqamli Egizak Modeli</h3>
            <div class="flex gap-2">
              <span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Active Sync</span>
            </div>
          </div>
          
          <div class="flex flex-col items-center justify-center h-full py-10">
            <div class="relative w-64 h-96 bg-slate-50 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group">
              <mat-icon class="text-slate-200 text-[200px] h-48 w-48 transition-all group-hover:scale-110">person</mat-icon>
              
              <!-- Hotspots -->
              <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              
              <div class="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div class="absolute bottom-1/3 right-1/3 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            
            <div class="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div class="p-4 bg-white border border-medical-border rounded-2xl shadow-sm text-center">
                <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-1">Yurak urishi</p>
                <p class="text-xl font-black text-red-500">72 <span class="text-xs">bpm</span></p>
              </div>
              <div class="p-4 bg-white border border-medical-border rounded-2xl shadow-sm text-center">
                <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-1">SpO2</p>
                <p class="text-xl font-black text-blue-500">98 <span class="text-xs">%</span></p>
              </div>
              <div class="p-4 bg-white border border-medical-border rounded-2xl shadow-sm text-center">
                <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-1">Harorat</p>
                <p class="text-xl font-black text-amber-500">36.6 <span class="text-xs">°C</span></p>
              </div>
              <div class="p-4 bg-white border border-medical-border rounded-2xl shadow-sm text-center">
                <p class="text-[10px] text-medical-text-muted font-bold uppercase mb-1">Qon bosimi</p>
                <p class="text-xl font-black text-indigo-500">120/80</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Side Stats & Alerts -->
        <div class="space-y-8">
          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6 flex items-center gap-2">
              <mat-icon class="text-amber-500">warning</mat-icon>
              Early Warning Alerts
            </h3>
            <div class="space-y-4">
              <div class="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <div class="flex items-center gap-3 mb-1">
                  <mat-icon class="text-red-500 text-sm h-4 w-4">error</mat-icon>
                  <span class="text-xs font-bold text-red-900">Kritik: Gipo-perfuziya xavfi</span>
                </div>
                <p class="text-[10px] text-red-700 font-medium leading-relaxed">Bemor #8c2a1b da qon bosimi pasayishi kuzatilmoqda. Monitoringni kuchaytiring.</p>
              </div>
              <div class="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div class="flex items-center gap-3 mb-1">
                  <mat-icon class="text-amber-500 text-sm h-4 w-4">info</mat-icon>
                  <span class="text-xs font-bold text-amber-900">Ogohlantirish: Lab natijalari</span>
                </div>
                <p class="text-[10px] text-amber-700 font-medium leading-relaxed">Bemor #f2e1a4 da CRP miqdori oshgan. Infeksiya ehtimoli.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-medical-border p-8 rounded-3xl shadow-xl">
            <h3 class="text-lg font-bold text-medical-text mb-6">Tizim holati</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-sm text-medical-text-muted font-medium">Bemorlar soni</span>
                <span class="text-sm font-black text-medical-text">{{ patientCount() }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-sm text-medical-text-muted font-medium">AI Analizlar</span>
                <span class="text-sm font-black text-medical-text">124</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-medical-text-muted font-medium">O'rtacha risk</span>
                <span class="text-sm font-black text-medical-text">32%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Patient Status List -->
      <div class="mt-8 bg-white border border-medical-border rounded-[2.5rem] shadow-xl overflow-hidden">
        <div class="p-8 border-b border-medical-border flex items-center justify-between">
          <h3 class="text-xl font-black text-medical-text">Bemorlar holati (Live)</h3>
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span class="text-[10px] font-bold text-medical-text-muted uppercase">Barqaror</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span class="text-[10px] font-bold text-medical-text-muted uppercase">Nazoratda</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="text-[10px] font-bold text-medical-text-muted uppercase">Kritik</span>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="py-4 px-8 text-[10px] font-black text-medical-text-muted uppercase tracking-widest">Bemor</th>
                <th class="py-4 px-8 text-[10px] font-black text-medical-text-muted uppercase tracking-widest">Holat</th>
                <th class="py-4 px-8 text-[10px] font-black text-medical-text-muted uppercase tracking-widest">Risk</th>
                <th class="py-4 px-8 text-[10px] font-black text-medical-text-muted uppercase tracking-widest">Oxirgi yangilanish</th>
                <th class="py-4 px-8 text-[10px] font-black text-medical-text-muted uppercase tracking-widest">Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (patient of patients(); track patient.id) {
                <tr class="border-b border-slate-50 hover:bg-slate-50/30 transition-all group">
                  <td class="py-4 px-8">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-medical-primary group-hover:text-white transition-all">
                        <mat-icon>person</mat-icon>
                      </div>
                      <div>
                        <p class="text-sm font-bold text-medical-text">{{ patient.full_name }}</p>
                        <p class="text-[10px] text-medical-text-muted uppercase font-bold tracking-tighter">ID: {{ patient.id.slice(0, 8) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-8">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" 
                           [class.bg-emerald-500]="patient.risk < 40"
                           [class.bg-amber-500]="patient.risk >= 40 && patient.risk < 70"
                           [class.bg-red-500]="patient.risk >= 70"></div>
                      <span class="text-xs font-bold text-medical-text">
                        {{ patient.risk < 40 ? 'Barqaror' : patient.risk < 70 ? 'Nazoratda' : 'Kritik' }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-8">
                    <span class="text-sm font-black"
                          [class.text-emerald-600]="patient.risk < 40"
                          [class.text-amber-600]="patient.risk >= 40 && patient.risk < 70"
                          [class.text-red-600]="patient.risk >= 70">
                      {{ patient.risk }}%
                    </span>
                  </td>
                  <td class="py-4 px-8 text-xs font-bold text-medical-text-muted">
                    Hozirgina
                  </td>
                  <td class="py-4 px-8">
                    <button [routerLink]="['/case', patient.id]" class="p-2 hover:bg-medical-primary/10 rounded-xl text-medical-primary transition-all">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DigitalTwinComponent implements OnInit {
  private supabase = inject(SupabaseService);
  patientCount = signal<number>(0);
  patients = signal<Patient[]>([]);

  async ngOnInit() {
    const { data } = await this.supabase.getCases();
    if (data) {
      this.patientCount.set(data.length);
      this.patients.set(data.map((p: Patient) => ({
        ...p,
        risk: Math.min(100, Math.max(10, Math.floor((p.age / 100) * 50 + (p.bp > 140 ? 30 : 10) + (p.smoking ? 20 : 0))))
      })));
    }
  }
}
