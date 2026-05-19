import { Component } from '@angular/core';
import { PremiumHeroSectionComponent } from './sections/premium-hero-section';
import { HorizontalShowcaseSectionComponent } from './sections/horizontal-showcase-section';
import { AbdullohAIOrbitSectionComponent } from './sections/abdulloh-ai-orbit-section';
import { PremiumCarouselSectionComponent } from './sections/premium-carousel-section';
import { AnimatedMedicalVisualComponent } from './sections/animated-medical-visual';
import { LandingCTASectionComponent } from './sections/landing-cta-section';

@Component({
  selector: 'app-premium-landing-page',
  standalone: true,
  imports: [
    PremiumHeroSectionComponent,
    HorizontalShowcaseSectionComponent,
    AbdullohAIOrbitSectionComponent,
    PremiumCarouselSectionComponent,
    AnimatedMedicalVisualComponent,
    LandingCTASectionComponent
  ],
  template: `
    <main class="premium-landing">
      <app-premium-hero-section />
      <app-horizontal-showcase-section />
      <app-abdulloh-ai-orbit-section />
      <app-premium-carousel-section />
      <app-animated-medical-visual />
      <app-landing-cta-section />
    </main>
  `,
  styles: [`
    :host{display:block}
    .premium-landing{min-height:100vh;background:linear-gradient(140deg,#040504,#0b0a06);color:#f8f1d0;padding:clamp(1rem,3vw,2rem)}
    .block{max-width:1100px;margin:0 auto 1rem;padding:1.25rem;border:1px solid rgba(212,175,55,.28);border-radius:1rem;background:rgba(14,14,12,.68);backdrop-filter:blur(8px)}
    .badge{display:inline-block;border:1px solid rgba(212,175,55,.4);padding:.35rem .65rem;border-radius:999px;color:#f2d675}
    h1,h2{margin:.4rem 0;color:#f2d675}
    p{color:#cdc5a7;line-height:1.6}
    .cta a{display:inline-block;padding:.65rem 1rem;border-radius:999px;background:linear-gradient(135deg,#d4af37,#f2d675);color:#120f05;text-decoration:none;font-weight:700}
    @media (max-width: 768px){.block{padding:1rem}}
  `]
})
export class PremiumLandingPageComponent {}
