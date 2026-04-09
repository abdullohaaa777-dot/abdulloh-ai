import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
  <main class="max-w-6xl mx-auto p-6 space-y-10">
    <section class="py-12">
      <h1 class="text-4xl font-bold">Abdulloh AI</h1>
      <p class="mt-3 text-slate-600">Klinik qaror qabul qilish, transplant monitoring va tushuntiriladigan risk platformasi.</p>
      <div class="mt-6 flex gap-3">
        <a routerLink="/register" class="btn-primary">Boshlash</a>
        <a routerLink="/features" class="btn-secondary">Platformani ko‘rish</a>
      </div>
    </section>
    <section><h2 class="text-2xl font-semibold mb-3">Ishonchlilik</h2><p>Explainable, audit-friendly, privacy-aware, transplant-focused, clinician support.</p></section>
    <section><h2 class="text-2xl font-semibold mb-3">Ilmiy cheklov</h2><p>Bu tizim mustaqil tashxis qo‘ymaydi; faqat klinik yordamchi risk/monitoring signal beradi.</p></section>
  </main>`
})
export class HomePage implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit(): void { this.seo.setPublicSeo('Abdulloh AI', 'Transplant monitoring va klinik decision support platformasi.', '/'); }
}

@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">About</h1><p>Abdulloh AI — transplant monitoring va urine vision orqali ehtiyotkor decision support platformasi.</p></section>' })
export class AboutPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('About','Platforma haqida','/about'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Features</h1><ul class="list-disc pl-6"><li>Urine basic vision</li><li>Urine strip scanner</li><li>Transplant causal resilience twin</li><li>Next best test navigator</li><li>Counterfactual simulation</li></ul></section>' })
export class FeaturesPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Features','Asosiy imkoniyatlar','/features'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Transplant</h1><p>Kidney transplant uchun reserve, immune quietness va silent rejection risk signal moduli.</p></section>' })
export class TransplantPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Transplant','Transplant moduli','/transplant'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Urine Analysis</h1><p>Plain photo faqat makroskopik screening; kimyoviy signal faqat strip scanning orqali.</p></section>' })
export class UrineAnalysisPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Urine analysis','Siydik tahlili moduli','/urine-analysis'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Privacy</h1><p>Maʼlumotlar himoyasi, audit log va RLS tamoyillari bilan ishlaydi.</p></section>' })
export class PrivacyPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Privacy','Maxfiylik siyosati','/privacy'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Terms</h1><p>Klinik yordamchi vosita bo‘lib, shifokor qarorini almashtirmaydi.</p></section>' })
export class TermsPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Terms','Foydalanish shartlari','/terms'); }}
@Component({ standalone: true, template: '<section class="p-6 max-w-5xl mx-auto"><h1 class="text-3xl font-bold mb-3">Contact</h1><p>Email: clinical@abdullohai.sbs</p></section>' })
export class ContactPage implements OnInit { private seo = inject(SeoService); ngOnInit(){ this.seo.setPublicSeo('Contact','Aloqa','/contact'); }}
@Component({ standalone: true, template: '<section class="p-10 text-center"><h1 class="text-5xl font-bold">404</h1><p>Sahifa topilmadi.</p></section>' })
export class NotFoundPage {}
