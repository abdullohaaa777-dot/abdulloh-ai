import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CaseStoreService } from '../core/case-store.service';
import { ClinicalEngineService } from '../core/clinical-engine.service';
import { SeoService } from '../core/seo.service';
import { TwinInput } from '../models';

@Component({
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule],
  template: `
  <div class="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
    <aside class="border-r p-4 bg-white space-y-2">
      <div class="font-bold text-xl mb-4">Abdulloh AI</div>
      <a routerLink="/dashboard">Dashboard</a><br>
      <a routerLink="/cases">Cases</a><br>
      <a routerLink="/urine/basic">Urine Basic</a><br>
      <a routerLink="/urine/strip">Urine Strip</a><br>
      <a routerLink="/transplant/twin">Transplant Twin</a><br>
      <a routerLink="/monitoring">Monitoring</a><br>
      <a routerLink="/admin" *ngIf="auth.user()?.role==='admin'">Admin</a><br>
      <button class="btn-secondary mt-4" (click)="logout()">Logout</button>
    </aside>
    <main class="p-6"><router-outlet /></main>
  </div>`
})
export class ProtectedShell { auth = inject(AuthService); private router = inject(Router); logout(){ this.auth.logout(); this.router.navigate(['/login']); }}

@Component({ standalone: true, imports: [CommonModule], template: `<h1 class="text-2xl font-bold">Dashboard</h1><p class="text-slate-600">Klinik yordamchi paneli.</p><div class="grid md:grid-cols-3 gap-4 mt-4"><div class="card-vibrant p-4">Cases: {{store.cases().length}}</div><div class="card-vibrant p-4">Urgent alerts: {{urgentCount()}}</div><div class="card-vibrant p-4">Role: {{auth.user()?.role}}</div></div>` })
export class DashboardPage implements OnInit { auth=inject(AuthService); store=inject(CaseStoreService); seo=inject(SeoService); urgentCount=computed(()=>this.store.cases().filter(c=>c.status==='urgent').length); ngOnInit(){this.seo.setPrivateSeo('Dashboard');}}

@Component({ standalone: true, imports: [CommonModule, RouterLink], template: `<div class="flex justify-between"><h1 class="text-2xl font-bold">Cases</h1><a routerLink="/cases/new" class="btn-primary">Yangi case</a></div><div *ngIf="!store.cases().length" class="mt-6">Case yo‘q.</div><div class="space-y-3 mt-4"><a class="block card-vibrant p-4" *ngFor="let c of store.cases()" [routerLink]="['/cases',c.id]">{{c.chiefComplaint}} • {{c.status}} • {{c.createdAt | date:'short'}}</a></div>` })
export class CasesPage { store=inject(CaseStoreService); }

@Component({ standalone: true, imports:[FormsModule], template:`<h1 class="text-2xl font-bold mb-4">New Case</h1><form class="space-y-3 max-w-xl" (ngSubmit)="save()"><input class="input-field w-full" [(ngModel)]="chiefComplaint" name="chiefComplaint" placeholder="Chief complaint" required><input class="input-field w-full" [(ngModel)]="caseType" name="caseType" placeholder="Case type" required><textarea class="input-field w-full" [(ngModel)]="notes" name="notes" placeholder="Notes"></textarea><input class="input-field w-full" [(ngModel)]="symptomsText" name="symptomsText" placeholder="Symptoms comma-separated"><button class="btn-primary">Save</button></form>` })
export class CaseNewPage { chiefComplaint=''; caseType='transplant'; notes=''; symptomsText=''; private store=inject(CaseStoreService); private auth=inject(AuthService); private router=inject(Router); save(){ const c=this.store.create({ chiefComplaint:this.chiefComplaint, caseType:this.caseType, notes:this.notes, symptoms:this.symptomsText.split(',').map(s=>s.trim()).filter(Boolean), patientId:this.auth.user()?.id ?? 'demo', createdBy:this.auth.user()?.id ?? 'demo' }); this.router.navigate(['/cases',c.id]); }}

@Component({ standalone:true, imports:[CommonModule], template:`<h1 class="text-2xl font-bold">Case detail</h1><ng-container *ngIf="record; else none"><p class="text-slate-700">{{record.chiefComplaint}}</p><p>Symptoms: {{record.symptoms.join(', ') || '—'}}</p><p class="mt-3 text-sm text-slate-600">Tabs: Overview, Symptoms, Vitals, Labs, Urine Basic, Urine Strip, Transplant Twin, Counterfactual, Comments, Audit.</p></ng-container><ng-template #none>Topilmadi.</ng-template>` })
export class CaseDetailPage { private route=inject(ActivatedRoute); private store=inject(CaseStoreService); record=this.store.getById(this.route.snapshot.params['id']); }

@Component({ standalone:true, imports:[FormsModule, CommonModule], template:`<h1 class="text-2xl font-bold mb-4">Urine Basic Vision</h1><p class="text-sm mb-2">Faqat makroskopik screening. Kimyoviy tashxis emas.</p><div class="grid md:grid-cols-2 gap-3 max-w-3xl"><label>Brightness<input class="input-field w-full" type="number" [(ngModel)]="brightness" name="brightness"></label><label>Blur<input class="input-field w-full" type="number" step="0.1" [(ngModel)]="blur" name="blur"></label><label>Reflection<input class="input-field w-full" type="number" step="0.1" [(ngModel)]="reflection" name="reflection"></label></div><button class="btn-primary mt-4" (click)="run()">Analyze</button><pre *ngIf="result" class="mt-4 bg-slate-900 text-slate-100 p-4 rounded-xl">{{result | json}}</pre>` })
export class UrineBasicPage { brightness=55; blur=1; reflection=1; result: unknown; private engine=inject(ClinicalEngineService); run(){ this.result=this.engine.analyzeUrineBasic({ brightness:this.brightness, blur:this.blur, reflection:this.reflection, containerVisible:true, calibrationCard:true }); }}

@Component({ standalone:true, imports:[FormsModule, CommonModule], template:`<h1 class="text-2xl font-bold mb-4">Urine Strip Vision</h1><p class="text-sm">Strip semi-quantitative tahlil.</p><label>Signal strength<input class="input-field w-full max-w-xs" type="number" [(ngModel)]="signal" name="signal"></label><label class="block mt-2"><input type="checkbox" [(ngModel)]="timing" name="timing"> Timing valid</label><button class="btn-primary mt-4" (click)="run()">Parse strip</button><pre *ngIf="result" class="mt-4 bg-slate-900 text-slate-100 p-4 rounded-xl">{{result | json}}</pre>` })
export class UrineStripPage { signal=6; timing=true; result: unknown; private engine=inject(ClinicalEngineService); run(){ this.result=this.engine.analyzeUrineStrip(this.signal, this.timing);} }

@Component({ standalone:true, imports:[FormsModule, CommonModule], template:`<h1 class="text-2xl font-bold mb-4">Transplant Causal Resilience Twin</h1><p class="text-sm mb-3">Risk/explanation engine. Definitive diagnosis emas.</p><div class="grid md:grid-cols-3 gap-2"><label>Creatinine<input class="input-field w-full" type="number" step="0.1" [(ngModel)]="input.creatinine" name="creatinine"></label><label>eGFR<input class="input-field w-full" type="number" [(ngModel)]="input.egfr" name="egfr"></label><label>CRP<input class="input-field w-full" type="number" step="0.1" [(ngModel)]="input.crp" name="crp"></label><label>Tacrolimus<input class="input-field w-full" type="number" step="0.1" [(ngModel)]="input.tacrolimus" name="tac"></label><label>SBP<input class="input-field w-full" type="number" [(ngModel)]="input.systolicBp" name="sbp"></label><label>Urine output<input class="input-field w-full" type="number" [(ngModel)]="input.urineOutput" name="uop"></label></div><button class="btn-primary mt-3" (click)="run()">Generate result</button><pre *ngIf="result" class="mt-4 bg-slate-900 text-slate-100 p-4 rounded-xl">{{result | json}}</pre><h2 class="text-xl font-semibold mt-6">What-if</h2><pre class="bg-slate-900 text-slate-100 p-4 rounded-xl">{{sim | json}}</pre>` })
export class TransplantTwinPage { engine=inject(ClinicalEngineService); input:TwinInput={creatinine:1.3,egfr:68,crp:6,tacrolimus:6.5,systolicBp:138,urineOutput:900,adherence:80}; result: unknown; sim: unknown; run(){ this.result=this.engine.calculateTwin(this.input); this.sim=this.engine.simulate(this.input);} }

@Component({ standalone:true, imports:[FormsModule], template:`<h1 class="text-2xl font-bold">Monitoring</h1><p>Daily BP/weight/urine output/temperature + medication adherence tracking.</p><form class="grid max-w-xl gap-2 mt-3"><input class="input-field" placeholder="BP 120/80"><input class="input-field" placeholder="Weight"><input class="input-field" placeholder="Urine output"><label><input type="checkbox"> Medication taken</label><button type="button" class="btn-primary">Save daily log</button></form>` })
export class MonitoringPage {}

@Component({ standalone:true, template:`<h1 class="text-2xl font-bold">Admin panel</h1><p>Users, roles, app_config, thresholds, feature flags, audit log nazorati.</p>` })
export class AdminPage {}

@Component({ standalone:true, imports:[FormsModule, RouterLink, CommonModule], template:`<section class="min-h-screen grid place-items-center p-4"><form class="card-vibrant p-6 w-full max-w-md space-y-3" (ngSubmit)="submit()"><h1 class="text-2xl font-bold">{{mode}}</h1><input *ngIf="mode==='Register'" class="input-field w-full" [(ngModel)]="fullName" name="fullName" placeholder="Full name"><input class="input-field w-full" [(ngModel)]="email" name="email" placeholder="Email" required><input type="password" class="input-field w-full" [(ngModel)]="password" name="password" placeholder="Password" required><select class="input-field w-full" [(ngModel)]="role" name="role" *ngIf="mode==='Login'"><option value="patient">patient</option><option value="doctor">doctor</option><option value="admin">admin</option></select><p class="text-red-600 text-sm" *ngIf="error">{{error}}</p><button class="btn-primary w-full">{{mode}}</button><a [routerLink]="mode==='Login'?'/register':'/login'" class="text-sm text-indigo-700">{{mode==='Login'?'Register':'Login'}} ga o‘tish</a></form></section>` })
export class AuthPage {
  private auth=inject(AuthService); private router=inject(Router); private route=inject(ActivatedRoute); fullName=''; email=''; password=''; role='patient'; error='';
  get mode(){ return this.route.snapshot.routeConfig?.path==='register' ? 'Register' : 'Login'; }
  submit(){ const res=this.mode==='Register'?this.auth.register(this.fullName,this.email,this.password):this.auth.login(this.email,this.password,this.role as any); if(!res.ok){ this.error=res.message ?? 'Xato'; return;} this.router.navigate(['/dashboard']); }
}
