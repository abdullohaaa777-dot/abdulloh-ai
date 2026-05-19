import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface OrbitModuleItem {
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-abdulloh-ai-orbit-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="orbit-section" aria-labelledby="orbit-title">
      <header class="orbit-head">
        <h2 id="orbit-title">Abdulloh AI tibbiy modullar orbitasi</h2>
        <p>Platforma diagnostika, xavf baholash, klinik xulosa va bemor kuzatuvini yagona tizimga birlashtiradi.</p>
      </header>

      <div class="orbit-stage" [class.pause]="isPaused" (mouseenter)="isPaused = true" (mouseleave)="isPaused = false">
        <div class="medical-grid" aria-hidden="true"></div>

        <div class="orbit-ring ring-a" aria-hidden="true"></div>
        <div class="orbit-ring ring-b" aria-hidden="true"></div>
        <div class="orbit-ring ring-c" aria-hidden="true"></div>

        <div class="orbit-dots" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>

        <article class="orbit-core">
          <strong>Abdulloh AI</strong>
          <p>Tibbiy tahlil markazi</p>
        </article>

        <div class="orbit-track" [class.pause]="isPaused">
          @for (item of modules; track item.name; let i = $index) {
            <article
              class="orbit-module"
              [style.--angle]="i * 60 + 'deg'"
              tabindex="0"
              [attr.aria-label]="item.name + ': ' + item.description"
            >
              <div class="module-body">
                <span class="symbol" aria-hidden="true">{{ item.icon }}</span>
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </article>
          }
        </div>
      </div>

      <div class="orbit-mobile-grid">
        @for (item of modules; track item.name) {
          <article class="mobile-card">
            <span class="symbol" aria-hidden="true">{{ item.icon }}</span>
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}
    .orbit-section{max-width:1200px;margin:0 auto 1.25rem;padding:1rem;border:1px solid rgba(212,175,55,.24);border-radius:1.1rem;background:linear-gradient(155deg,rgba(8,8,7,.95),rgba(16,13,9,.78));overflow:hidden}
    .orbit-head{text-align:center;max-width:760px;margin:0 auto 1rem}
    .orbit-head h2{margin:.2rem 0 .5rem;color:#f2d675;font-family:Georgia,serif;font-size:clamp(1.45rem,3vw,2.2rem)}
    .orbit-head p{margin:0;color:#d3caaf;line-height:1.7}

    .orbit-stage{position:relative;min-height:560px;border:1px solid rgba(212,175,55,.2);border-radius:1rem;background:radial-gradient(circle at center,rgba(212,175,55,.1),rgba(9,10,9,.93) 58%);overflow:hidden}
    .medical-grid{position:absolute;inset:0;background:linear-gradient(rgba(212,175,55,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.07) 1px,transparent 1px);background-size:24px 24px;mask-image:radial-gradient(circle at center, black 30%, transparent 100%);opacity:.38}

    .orbit-ring{position:absolute;top:50%;left:50%;translate:-50% -50%;border-radius:999px;border:1px solid rgba(212,175,55,.3);box-shadow:0 0 30px rgba(212,175,55,.12)}
    .ring-a{width:280px;height:280px}
    .ring-b{width:390px;height:390px;border-style:dashed}
    .ring-c{width:500px;height:500px;border-color:rgba(212,175,55,.22)}

    .orbit-dots span{position:absolute;width:8px;height:8px;border-radius:999px;background:#e8cb72;box-shadow:0 0 12px rgba(242,214,117,.7)}
    .orbit-dots span:nth-child(1){top:18%;left:47%}
    .orbit-dots span:nth-child(2){top:49%;right:17%}
    .orbit-dots span:nth-child(3){bottom:19%;left:49%}
    .orbit-dots span:nth-child(4){top:52%;left:16%}

    .orbit-core{position:absolute;top:50%;left:50%;translate:-50% -50%;width:190px;height:190px;border-radius:999px;display:grid;place-items:center;text-align:center;border:1px solid rgba(242,214,117,.45);background:radial-gradient(circle,#f2d675,#9f7d23 55%,rgba(212,175,55,.15));box-shadow:0 0 40px rgba(242,214,117,.26)}
    .orbit-core strong{font-family:Georgia,serif;font-size:1.5rem;background:linear-gradient(135deg,#fff0bd,#f2d675,#bc8e27);-webkit-background-clip:text;background-clip:text;color:transparent}
    .orbit-core p{margin:.25rem 0 0;color:#2a1f09;font-weight:700;font-size:.84rem}

    .orbit-track{position:absolute;inset:0;animation:spin 44s linear infinite}
    .orbit-track.pause{animation-play-state:paused}
    .orbit-module{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(var(--angle)) translateY(-215px);transform-origin:center;z-index:2}
    .module-body{width:170px;padding:.65rem;border:1px solid rgba(212,175,55,.34);border-radius:1rem;background:rgba(15,15,13,.72);backdrop-filter:blur(8px);text-align:center;transform:rotate(calc(var(--angle) * -1));transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
    .symbol{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:999px;border:1px solid rgba(212,175,55,.45);color:#f2d675;font-weight:800;margin:0 auto .35rem}
    .module-body h3{margin:.1rem 0 .25rem;color:#f2d675;font-size:.9rem}
    .module-body p{margin:0;color:#d5ccb1;font-size:.76rem;line-height:1.45;opacity:0;max-height:0;overflow:hidden;transition:opacity .2s ease,max-height .2s ease}
    .orbit-module:hover .module-body,.orbit-module:focus-visible .module-body{transform:rotate(calc(var(--angle) * -1)) translateY(-4px) scale(1.02);border-color:rgba(242,214,117,.75);box-shadow:0 0 24px rgba(212,175,55,.22)}
    .orbit-module:hover .module-body p,.orbit-module:focus-visible .module-body p{opacity:1;max-height:80px}

    .orbit-mobile-grid{display:none}

    @keyframes spin{to{transform:rotate(360deg)}}

    @media (max-width:1024px){
      .ring-c{display:none}
      .orbit-stage{min-height:500px}
      .orbit-module{transform:translate(-50%,-50%) rotate(var(--angle)) translateY(-185px)}
      .module-body{width:154px}
    }

    @media (max-width:768px){
      .orbit-stage{display:none}
      .orbit-mobile-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
      .mobile-card{border:1px solid rgba(212,175,55,.3);border-radius:.9rem;background:rgba(12,12,10,.75);padding:.8rem}
      .mobile-card h3{margin:.2rem 0;color:#f2d675;font-size:.95rem}
      .mobile-card p{margin:0;color:#d5ccb1;font-size:.82rem;line-height:1.5}
    }

    @media (max-width:520px){.orbit-mobile-grid{grid-template-columns:1fr}}

    @media (prefers-reduced-motion: reduce){
      .orbit-track{animation:none!important}
      .module-body,.module-body p{transition:none!important}
    }
  `]
})
export class AbdullohAIOrbitSectionComponent {
  isPaused = false;
  modules: OrbitModuleItem[] = [
    { name: 'AI Diagnostika', icon: '◉', description: 'Simptom va tahlillarni klinik yo‘nalishda baholaydi.' },
    { name: 'Risk Modeli', icon: '◌', description: 'Kasallik xavfini foizli baholashga yordam beradi.' },
    { name: 'Klinik Xulosa', icon: '◆', description: 'Shifokor uchun qisqa xulosa beradi.' },
    { name: '3D Yurak', icon: '❤', description: 'Yurak holatini vizual tushuntiradi.' },
    { name: 'AI Tahlil', icon: '✦', description: 'Ma’lumotlarni chuqur tahlil qiladi.' },
    { name: 'Bemor Paneli', icon: '▣', description: 'Natijalarni bemorga tushunarli ko‘rsatadi.' }
  ];
}
