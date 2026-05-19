import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-premium-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <section class="hero" aria-labelledby="premium-hero-title">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="badge">Kelajak tibbiyoti uchun AI platforma</p>
          <h1 id="premium-hero-title">Abdulloh AI</h1>
          <p class="subtitle">Sun’iy intellekt yordamida tibbiy tahlil, xavf baholash va klinik qarorlarni qo‘llab-quvvatlash platformasi.</p>

          <div class="cta-row">
            <a class="cta-primary" routerLink="/auth">Boshlash</a>
            <a class="cta-secondary" href="#premium-hero-visual">Ko‘proq ma’lumot</a>
          </div>

          <ul class="trust" aria-label="Ishonch indikatorlari">
            <li><mat-icon>analytics</mat-icon>AI tahlil</li>
            <li><mat-icon>shield</mat-icon>Xavf baholash</li>
            <li><mat-icon>clinical_notes</mat-icon>Klinik xulosa</li>
            <li><mat-icon>monitor_heart</mat-icon>Bemor paneli</li>
          </ul>
        </div>

        <div id="premium-hero-visual" class="hero-visual" aria-hidden="true">
          <div class="grid-overlay"></div>
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="core"><mat-icon>favorite</mat-icon></div>

          <article class="float-card c1"><span>AI Diagnostika</span></article>
          <article class="float-card c2"><span>Risk Modeli</span></article>
          <article class="float-card c3"><span>Klinik Xulosa</span></article>
          <article class="float-card c4"><span>3D Yurak</span></article>
          <article class="float-card c5"><span>Bemor Paneli</span></article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}
    .hero{max-width:1200px;margin:0 auto 1.25rem;padding:clamp(1rem,2.5vw,1.8rem);border:1px solid rgba(212,175,55,.25);border-radius:1.25rem;background:linear-gradient(145deg,rgba(7,7,6,.94),rgba(16,14,9,.85));box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 20px 60px rgba(0,0,0,.35);overflow:hidden}
    .hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,1fr);gap:clamp(1rem,3vw,2rem);align-items:center}
    .hero-copy{animation:fadeInUp .8s ease both}
    .badge{display:inline-flex;padding:.45rem .8rem;border-radius:999px;border:1px solid rgba(212,175,55,.4);background:rgba(212,175,55,.08);color:#f2d675;font-size:.82rem;font-weight:700;letter-spacing:.02em}
    h1{margin:.75rem 0 .4rem;color:#f2d675;font-family:Georgia,serif;font-size:clamp(2.2rem,5vw,4.2rem);line-height:1.03}
    .subtitle{margin:0;color:#cdc5a7;max-width:58ch;line-height:1.7}
    .cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.2rem}
    .cta-primary,.cta-secondary{text-decoration:none;min-height:44px;padding:.7rem 1.1rem;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
    .cta-primary{background:linear-gradient(135deg,#d4af37,#f2d675);color:#120f05}
    .cta-secondary{border:1px solid rgba(212,175,55,.45);color:#f2d675;background:rgba(8,8,7,.55)}
    .cta-primary:focus-visible,.cta-secondary:focus-visible{outline:2px solid #f2d675;outline-offset:3px}
    .trust{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;list-style:none;padding:0;margin:1rem 0 0}
    .trust li{display:flex;align-items:center;gap:.45rem;color:#d8d1b6;font-size:.9rem}
    .trust mat-icon{color:#d4af37;font-size:1.1rem;width:1.1rem;height:1.1rem}

    .hero-visual{position:relative;min-height:420px;border:1px solid rgba(212,175,55,.22);border-radius:1.1rem;background:radial-gradient(circle at 50% 50%,rgba(212,175,55,.15),rgba(7,8,7,.92) 62%)}
    .grid-overlay{position:absolute;inset:0;background:linear-gradient(rgba(212,175,55,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.08) 1px,transparent 1px);background-size:28px 28px;mask-image:radial-gradient(circle at center, black 28%, transparent 100%);opacity:.4}
    .orbit{position:absolute;top:50%;left:50%;translate:-50% -50%;border:1px solid rgba(212,175,55,.4);border-radius:999px;box-shadow:0 0 40px rgba(212,175,55,.16)}
    .orbit-a{width:250px;height:250px;animation:spin 22s linear infinite}
    .orbit-b{width:330px;height:330px;border-style:dashed;animation:spinRev 28s linear infinite}
    .core{position:absolute;top:50%;left:50%;translate:-50% -50%;width:132px;height:132px;border-radius:999px;background:radial-gradient(circle,#f2d675,#9b7821 58%,rgba(212,175,55,.16));display:grid;place-items:center;box-shadow:0 0 36px rgba(242,214,117,.28)}
    .core mat-icon{color:#1d1305;font-size:3rem;width:3rem;height:3rem}
    .float-card{position:absolute;padding:.5rem .8rem;border:1px solid rgba(212,175,55,.3);border-radius:999px;background:rgba(16,16,14,.58);backdrop-filter:blur(8px);color:#eee4c6;font-size:.82rem;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .25s ease,border-color .25s ease;animation:float 8s ease-in-out infinite}
    .float-card:hover{transform:translateY(-4px);border-color:rgba(242,214,117,.72)}
    .c1{top:10%;left:8%}.c2{top:14%;right:10%;animation-delay:-1.5s}.c3{bottom:20%;left:9%;animation-delay:-3.2s}.c4{bottom:10%;right:10%;animation-delay:-2.4s}.c5{top:48%;right:3%;animation-delay:-4s}

    @keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
    @keyframes spinRev{to{transform:translate(-50%,-50%) rotate(-360deg)}}

    @media (max-width: 1024px){.hero-grid{grid-template-columns:1fr}.hero-visual{min-height:360px}.c5{right:8%}}
    @media (max-width: 640px){.hero{padding:1rem}.trust{grid-template-columns:1fr}.hero-visual{min-height:330px}.float-card{font-size:.78rem}}
    @media (prefers-reduced-motion: reduce){.hero-copy,.orbit-a,.orbit-b,.float-card{animation:none!important}.float-card{transition:none!important}}
  `]
})
export class PremiumHeroSectionComponent {}
