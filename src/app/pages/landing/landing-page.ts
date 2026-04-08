import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-white text-slate-900">
      <header class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-100">
        <div>
          <p class="text-xl font-extrabold">AbdullohAI Clinical</p>
          <p class="text-xs text-slate-500">Clinical Decision Support Platform</p>
        </div>
        <div class="flex gap-3">
          <a routerLink="/features" class="px-4 py-2 rounded-lg border border-slate-300 text-sm">Features</a>
          <a routerLink="/login" class="px-4 py-2 rounded-lg bg-medical-primary text-white text-sm">Clinician login</a>
        </div>
      </header>

      <main>
        <section class="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p class="text-xs uppercase tracking-widest text-medical-primary font-semibold mb-3">Clinical intelligence, not generic chat</p>
            <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">Differential diagnosis support for high-risk patients.</h1>
            <p class="mt-5 text-slate-600 text-lg">AbdullohAI helps clinicians structure cases, interpret labs, surface red flags, and explain why each differential diagnosis is likely — or unlikely.</p>
            <div class="mt-8 flex gap-3">
              <a routerLink="/login" class="px-6 py-3 rounded-xl bg-medical-primary text-white font-semibold">Start clinical workspace</a>
              <a routerLink="/about" class="px-6 py-3 rounded-xl border border-slate-300 font-semibold">How it works</a>
            </div>
            <p class="mt-4 text-xs text-slate-500">For clinical decision support only. Not a standalone diagnostic system.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-6 shadow-sm bg-slate-50">
            <h2 class="font-bold text-lg mb-4">What clinicians get</h2>
            <ul class="space-y-3 text-slate-700 text-sm">
              <li>• Top 3–5 differential diagnoses with confidence ranges</li>
              <li>• “Why this diagnosis” and “Why not” explanation panels</li>
              <li>• Red-flag triage alerts for urgent escalation</li>
              <li>• Next-best-test recommendations to reduce uncertainty</li>
              <li>• Longitudinal risk trends across follow-up visits</li>
            </ul>
          </div>
        </section>

        <section class="bg-slate-50 border-y border-slate-100">
          <div class="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
            <article class="bg-white p-6 rounded-xl border border-slate-200">
              <h3 class="font-bold mb-2">Explainable by design</h3>
              <p class="text-sm text-slate-600">Every recommendation is linked to observed findings, missing data, and guideline-aligned rationale.</p>
            </article>
            <article class="bg-white p-6 rounded-xl border border-slate-200">
              <h3 class="font-bold mb-2">Privacy-first architecture</h3>
              <p class="text-sm text-slate-600">No PHI-bearing model keys in frontend bundles. AI calls go through server-side protected endpoints.</p>
            </article>
            <article class="bg-white p-6 rounded-xl border border-slate-200">
              <h3 class="font-bold mb-2">Built for care teams</h3>
              <p class="text-sm text-slate-600">Role-aware workflows for doctor, patient, and admin with auditability and consent traceability.</p>
            </article>
          </div>
        </section>
      </main>

      <footer class="max-w-7xl mx-auto px-6 py-10 text-sm text-slate-500 flex flex-wrap gap-4 justify-between">
        <p>© {{ year }} AbdullohAI Clinical</p>
        <div class="flex gap-4">
          <a routerLink="/privacy">Privacy</a>
          <a routerLink="/contact">Contact</a>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  year = new Date().getFullYear();
}
