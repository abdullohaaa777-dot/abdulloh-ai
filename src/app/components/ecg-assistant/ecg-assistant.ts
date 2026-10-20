import {Component, inject, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SupabaseService} from '../../services/supabase';
interface Study { id:string; created_at:string; status:string; result:{durationSeconds:number; referenceLead:string; measurements:{heartRateBpm:number|null;rrMs:number|null}; leads:{name:string;quality:string}[];missingLeads:string[];limitations:string[]}; signal?:{samplingRate:number;leads:Record<string,number[]>}; interpretation?:{summary:string} }
@Component({
 selector:'app-ecg-assistant',standalone:true,imports:[CommonModule,FormsModule],
 template:`<section class="max-w-6xl mx-auto space-y-6 p-4">
 <h1 class="text-2xl font-bold">AbdullohAI — AI EKG Assistant Pro</h1>
 <p class="p-4 bg-amber-50 rounded-xl" role="note">Tadqiqot rejimi. Klinik validatsiyadan o‘tmagan. Ko‘krak og‘rig‘i, hushdan ketish yoki nafas qisishida natijani kutmay shoshilinch yordamga murojaat qiling. Normal EKG xavfli kasallikni istisno qilmaydi.</p>
 @if (error()) {<p role="alert" class="text-red-700">{{error()}}</p>}
 @if (enabled()) {
 <div class="card-vibrant p-5 space-y-4">
 <h2 class="font-bold text-xl">EKG yuklash</h2>
 <p>Hozir CSV: birinchi qatorda I, II, III, aVR, aVL, aVF, V1–V6 nomlari; keyingi qatorlarda mV qiymatlar. 5–60 soniya, 100–2000 Hz. Yetishmayotgan tarmoqlar yaratilmaydi. JPG, PDF, XML va WFDB hozir qo‘llanmaydi.</p>
 <label class="block">CSV fayl <input type="file" accept=".csv,text/csv" (change)="choose($event)" [disabled]="busy()"></label>
 <label class="block">Sampling rate (Hz) <input class="input-field" type="number" min="100" max="2000" [(ngModel)]="samplingRate"></label>
 <label class="block"><input type="checkbox" [(ngModel)]="consent"> O‘zimga tegishli EKGni serverda saqlashga roziman. Signal birligi mV ekanini tekshirdim.</label>
 <button class="btn-primary" (click)="upload()" [disabled]="busy() || !csv || !consent">{{busy()?'Qayta ishlanmoqda…':'Yuklash va hisoblash'}}</button>
 </div>
 <div class="card-vibrant p-5 space-y-3"><h2 class="font-bold text-xl">EKG tarixi</h2>
 @for(study of studies();track study.id){<button class="btn-secondary" (click)="open(study.id)" [disabled]="busy()">{{study.created_at | date:'medium'}} — tasdiqlanmagan</button>}
 @if(!studies().length){<p>Saqlangan EKG yo‘q.</p>}
 </div>
 @if(selected();as study){
 <div class="card-vibrant p-5 space-y-4">
 <h2 class="font-bold text-xl">O‘lchovlar — shifokor tasdiqlamagan</h2>
 <p>R-peak nomzodlari asosidagi taxminiy HR: {{study.result.measurements.heartRateBpm === null ? 'Ishonchli o‘lchab bo‘lmadi' : (study.result.measurements.heartRateBpm | number:'1.0-1')+' bpm'}}. RR: {{study.result.measurements.rrMs === null ? 'Ishonchli o‘lchab bo‘lmadi' : (study.result.measurements.rrMs | number:'1.0-1')+' ms'}}.</p>
 <p>PR, QRS, QT/QTc, ST va elektr o‘qi: ishonchli o‘lchab bo‘lmadi.</p>
 <p>Yetishmayotgan tarmoqlar: {{study.result.missingLeads.join(', ') || 'Yo‘q'}}.</p>
 @for(lead of study.result.leads;track lead.name){<p>{{lead.name}}: {{lead.quality}}</p>}
 @if(study.signal){
 <label>Tarmoq <select class="input-field" [(ngModel)]="lead" (ngModelChange)="draw()">@for(name of leadNames();track name){<option [value]="name">{{name}}</option>}</select></label>
 <label class="block">Ko‘rinadigan interval (soniya) <input type="range" min="1" [max]="study.result.durationSeconds" step="1" [(ngModel)]="seconds" (ngModelChange)="draw()"></label>
 <label class="block">Boshlanish (soniya) <input type="range" min="0" [max]="maxStart()" step="0.1" [(ngModel)]="start" (ngModelChange)="draw()"></label>
 <svg viewBox="0 0 1000 240" class="w-full border rounded bg-white" role="img" [attr.aria-label]="lead+' tarmoq signali; vertikal ±2 mV'">
 <path d="M0 120H1000 M0 60H1000 M0 180H1000" stroke="#e2e8f0"/><path [attr.d]="path()" stroke="#4f46e5" fill="none" stroke-width="1.5"/></svg>
 <p>{{lead}} · {{start}}–{{start + seconds}} s · markaz 0 mV, to‘liq vertikal diapazon −2…+2 mV; tashqaridagi signal kesiladi.</p>
 }
 @for(limit of study.result.limitations;track limit){<p>{{limit}}</p>}
 <label class="block"><input type="checkbox" [(ngModel)]="aiConsent"> Minimal o‘lchovlarni Claude orqali izohlash uchun Anthropic xizmatiga uzatishga roziman.</label>
 <button class="btn-primary" (click)="interpret()" [disabled]="busy() || !aiConsent">Claude izohi</button>
 @if(study.interpretation){<p class="p-4 bg-indigo-50 rounded">{{study.interpretation.summary}}</p>}
 <p>Shifokor tasdig‘i, PDF va klinik patologiya tahlili hali mavjud emas.</p>
 </div>}
 } @else if(!busy()){<p>EKG moduli serverda yoqilmagan. Demo tahlil yaratilmaydi.</p>}
 </section>`
})
export class EcgAssistant implements OnInit {
 private supabase=inject(SupabaseService);
 enabled=signal(false);busy=signal(false);error=signal('');studies=signal<Study[]>([]);selected=signal<Study|null>(null);path=signal('');
 csv='';samplingRate=500;consent=false;aiConsent=false;lead='II';seconds=5;start=0;
 async ngOnInit(){this.busy.set(true);try {const res=await fetch('/api/ecg/config');if(!res.ok)throw new Error('EKG API mavjud emas.');this.enabled.set((await res.json()).enabled===true);if(this.enabled())await this.load();}catch(e){this.fail(e);}finally{this.busy.set(false);}}
 private fail(e:unknown){this.error.set(e instanceof Error?e.message:'Xatolik yuz berdi.');}
 private async request(url:string,body?:unknown){
  if(!this.supabase.isConfigured())throw new Error('EKG uchun haqiqiy Supabase sessiyasi kerak.');
  const {data}=await this.supabase.client.auth.getSession();
  if(!data.session)throw new Error('Tizimga qayta kiring.');
  const response=await fetch('/api/ecg'+url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.error || 'API xatoligi');return result;
 }
 async choose(event:Event){const file=(event.target as HTMLInputElement).files?.[0];this.csv='';if(!file)return;if(!file.name.toLowerCase().endsWith('.csv')||file.size>3*1024*1024){this.error.set('Faqat 3 MB gacha CSV qabul qilinadi.');return;}this.csv=await file.text();this.error.set('');}
 async load(){this.studies.set(await this.request('/studies'));}
 async upload(){if(this.busy()||!this.csv||!this.consent)return;this.busy.set(true);this.error.set('');try{const result=await this.request('/studies',{csv:this.csv,samplingRate:this.samplingRate,unit:'mV',consent:true});await this.load();await this.open(result.id);}catch(e){this.fail(e);}finally{this.busy.set(false);}}
 async open(id:string){this.error.set('');try{const study:Study=await this.request('/studies/'+id);this.selected.set(study);this.lead=study.result.referenceLead;this.seconds=Math.min(5,study.result.durationSeconds);this.start=0;this.aiConsent=false;this.draw();}catch(e){this.fail(e);}}
 leadNames(){return Object.keys(this.selected()?.signal?.leads??{});}
 maxStart(){return Math.max(0,(this.selected()?.result.durationSeconds??0)-this.seconds);}
 draw(){const signal=this.selected()?.signal;if(!signal)return;this.start=Math.min(this.start,this.maxStart());const values=signal.leads[this.lead]??[];const first=Math.floor(this.start*signal.samplingRate);const length=Math.floor(this.seconds*signal.samplingRate);const stride=Math.max(1,Math.floor(length/3000));const points=[];for(let i=0;i<length && first+i<values.length;i+=stride)points.push(`${points.length?'L':'M'}${(i/length*1000).toFixed(2)},${Math.max(0,Math.min(240,120-values[first+i]*60)).toFixed(2)}`);this.path.set(points.join(' '));}
 async interpret(){const study=this.selected();if(!study||!this.aiConsent||this.busy())return;this.busy.set(true);this.error.set('');try{await this.request('/studies/'+study.id+'/interpret',{consent:true});await this.open(study.id);}catch(e){this.fail(e);}finally{this.busy.set(false);}}
}
