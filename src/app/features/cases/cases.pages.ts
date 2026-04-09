import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { AuthService } from '../../core/auth.service';
import { SeoService } from '../../core/seo.service';

@Component({ standalone: true, imports: [RouterLink], template: `<h1>Cases</h1><a routerLink="/cases/new">Yangi case</a><ul>@for (c of data.cases(); track c.id){<li><a [routerLink]="'/cases/' + c.id">{{c.chiefComplaint}} - {{c.status}}</a></li>} </ul>` })
export class CaseListPage implements OnInit { data = inject(DataService); private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Cases','Case ro‘yxati.', true); }}

@Component({ standalone: true, imports: [FormsModule], template: `<h1>New Case</h1><input [(ngModel)]="chiefComplaint" placeholder="Chief complaint"/><textarea [(ngModel)]="notes" placeholder="notes"></textarea><button (click)="save()">Saqlash</button>` })
export class CaseNewPage {
  private data = inject(DataService); private auth = inject(AuthService); private router = inject(Router);
  chiefComplaint = ''; notes = '';
  save(){
    const user = this.auth.user(); if (!user) return;
    const c = this.data.createCase({ patientId: user.id, createdBy: user.id, caseType: 'transplant', status: 'new', chiefComplaint: this.chiefComplaint, symptoms: [], notes: this.notes });
    void this.router.navigate(['/cases', c.id]);
  }
}

@Component({ standalone: true, template: `<h1>Case detail</h1><p>{{caseText()}}</p><p>Tabs: Overview, Symptoms, Vitals, Labs, Urine Basic, Urine Strip, Transplant Twin, Counterfactual, Comments, Audit.</p>` })
export class CaseDetailPage {
  private route = inject(ActivatedRoute); private data = inject(DataService);
  caseText = signal('Loading...');
  constructor(){ const id = this.route.snapshot.paramMap.get('id'); const found = id ? this.data.getCase(id) : null; this.caseText.set(found ? `${found.chiefComplaint} (${found.status})` : 'Case topilmadi'); }
}
