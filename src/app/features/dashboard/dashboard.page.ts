import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';

@Component({ standalone: true, template: `<h1>Dashboard</h1><p>Summary, monitoring alerts va quick actions.</p>` })
export class DashboardPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Dashboard','Klinik dashboard.', true); }}
