import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({ standalone: true, imports: [RouterLink], template: `
<section class="hero"><h1>Abdulloh AI</h1><p>Klinik qaror qabul qilish va transplant monitoring platformasi.</p><div><a routerLink="/register">Boshlash</a> <a routerLink="/features">Platformani ko‘rish</a></div></section>
<section><h2>Ilmiy xavfsizlik</h2><p>Bu tizim mustaqil tashxis qo‘ymaydi, shifokorni almashtirmaydi.</p></section>
` })
export class HomePage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Bosh sahifa','Transplant va siydik monitoringi uchun explainable klinik yordamchi platforma.'); }}

@Component({ standalone: true, template: `<h1>About</h1><p>Abdulloh AI klinik qarorlarni tushuntiriladigan signal va risk bilan qo‘llab-quvvatlaydi.</p>` })
export class AboutPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('About','Abdulloh AI haqida.'); }}

@Component({ standalone: true, template: `<h1>Features</h1><ul><li>Urine basic vision</li><li>Urine strip analyzer</li><li>Transplant Causal Resilience Twin</li><li>Next best test navigator</li></ul>` })
export class FeaturesPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Features','Platforma funksiyalari.'); }}

@Component({ standalone: true, template: `<h1>Transplant</h1><p>Kidney transplant V1 uchun risk/explainability engine.</p>` })
export class TransplantPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Transplant','Transplant monitoring yondashuvi.'); }}

@Component({ standalone: true, template: `<h1>Urine Analysis</h1><p>Plain photo: makroskopik screening. Strip photo: semi-quantitative kimyoviy natija.</p>` })
export class UrineAnalysisPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Urine Analysis','Siydik basic va strip tahlil modullari.'); }}

@Component({ standalone: true, template: `<h1>Privacy</h1><p>Platforma maxfiylik va audit tamoyillari bilan ishlaydi.</p>` })
export class PrivacyPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Privacy','Maxfiylik siyosati.'); }}

@Component({ standalone: true, template: `<h1>Terms</h1><p>Klinik qo‘llab-quvvatlash vositasi, tashxis qurilmasi emas.</p>` })
export class TermsPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Terms','Foydalanish shartlari.'); }}

@Component({ standalone: true, template: `<h1>Contact</h1><p>Email: clinical@abdullohai.sbs</p>` })
export class ContactPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPage('Contact','Bog‘lanish sahifasi.'); }}
