import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, inject, signal, viewChild } from '@angular/core';

interface ShowcaseItem {
  title: string;
  description: string;
  features: string[];
  visual: 'ai' | 'risk' | 'heart' | 'clinical' | 'dashboard' | 'patient';
}

@Component({
  selector: 'app-horizontal-showcase-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="showcase" aria-label="Interaktiv platforma oqimi" #sectionRoot>
      <div class="showcase-shell" [class.mobile]="isMobile()">
        <p class="label">Interaktiv platforma oqimi</p>

        <div class="sticky-zone" [style.height.px]="stickyHeight()">
          <div class="sticky-inner">
            <div class="track" [style.transform]="trackTransform()" [class.no-transform]="isMobile()" [style.width.px]="trackWidth()">
              @for (item of items; track item.title) {
                <article class="panel" [class.active]="$index === activeIndex()" aria-label="{{ item.title }}">
                  <div class="copy">
                    <h2>{{ item.title }}</h2>
                    <p>{{ item.description }}</p>
                    <ul>
                      @for (feature of item.features; track feature) {
                        <li>{{ feature }}</li>
                      }
                    </ul>
                  </div>
                  <div class="visual" aria-hidden="true">
                    @switch (item.visual) {
                      @case ('ai') { <div class="v v-ai"></div> }
                      @case ('risk') { <div class="v v-risk"><span>78%</span></div> }
                      @case ('heart') { <div class="v v-heart">❤</div> }
                      @case ('clinical') { <div class="v v-clinical"></div> }
                      @case ('dashboard') { <div class="v v-dashboard"></div> }
                      @case ('patient') { <div class="v v-patient"></div> }
                    }
                  </div>
                </article>
              }
            </div>
          </div>
        </div>

        <div class="progress-wrap" aria-hidden="true">
          <div class="progress" [style.width.%]="progressPercent()"></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}
    .showcase{max-width:1200px;margin:0 auto 1.25rem;padding:0 0.25rem;overflow:hidden}
    .label{margin:0 0 .6rem;color:#d4af37;font-size:.82rem;font-weight:700;letter-spacing:.08em}
    .sticky-zone{position:relative}
    .sticky-inner{position:sticky;top:1rem;overflow:hidden}
    .track{display:flex;gap:1rem;will-change:transform;transition:transform .06s linear}
    .panel{flex:0 0 min(86vw,980px);display:grid;grid-template-columns:1.1fr .9fr;gap:1rem;padding:1.1rem;border-radius:1rem;border:1px solid rgba(212,175,55,.28);background:rgba(16,14,11,.72);backdrop-filter:blur(8px);box-shadow:0 12px 32px rgba(0,0,0,.32)}
    .panel.active{border-color:rgba(242,214,117,.7);box-shadow:0 0 30px rgba(212,175,55,.18),0 12px 32px rgba(0,0,0,.36)}
    h2{margin:.2rem 0 .5rem;color:#f2d675;font-family:Georgia,serif}
    p{margin:0;color:#d1c8ac;line-height:1.65}
    ul{margin:.85rem 0 0;padding-left:1rem;color:#e5dcc0;display:grid;gap:.35rem}
    .visual{display:grid;place-items:center;min-height:220px;border-radius:.9rem;border:1px solid rgba(212,175,55,.2);background:rgba(10,10,9,.58)}
    .v{width:min(90%,260px);height:170px;border-radius:1rem;border:1px solid rgba(212,175,55,.28)}
    .v-ai{background:radial-gradient(circle,rgba(242,214,117,.28),transparent 56%),repeating-radial-gradient(circle at 50% 50%,rgba(212,175,55,.12) 0 6px,transparent 7px 14px)}
    .v-risk{display:grid;place-items:center;border-radius:999px;width:170px;height:170px;background:conic-gradient(#d4af37 78%,rgba(212,175,55,.14) 0)}
    .v-risk span{display:grid;place-items:center;width:120px;height:120px;border-radius:999px;background:#0b0b09;color:#f2d675;font-weight:800}
    .v-heart{display:grid;place-items:center;font-size:4rem;color:#f2d675;background:radial-gradient(circle,rgba(242,214,117,.32),rgba(212,175,55,.08) 62%,transparent)}
    .v-clinical{background:linear-gradient(180deg,rgba(212,175,55,.25),transparent),repeating-linear-gradient(180deg,rgba(212,175,55,.2) 0 2px,transparent 2px 16px)}
    .v-dashboard{background:linear-gradient(135deg,rgba(212,175,55,.18),rgba(212,175,55,.04));position:relative}
    .v-dashboard::before,.v-dashboard::after{content:"";position:absolute;left:12%;right:12%;height:16px;border-radius:999px;background:rgba(242,214,117,.35)}
    .v-dashboard::before{top:28%}.v-dashboard::after{top:56%}
    .v-patient{background:linear-gradient(145deg,rgba(212,175,55,.16),rgba(8,8,7,.3));position:relative}
    .v-patient::before{content:"";position:absolute;inset:14%;border:1px solid rgba(212,175,55,.35);border-radius:.7rem}
    .progress-wrap{height:4px;margin-top:.8rem;background:rgba(212,175,55,.18);border-radius:999px;overflow:hidden}
    .progress{height:100%;width:0;background:linear-gradient(90deg,#9e7e22,#f2d675)}

    .showcase-shell.mobile .sticky-zone{height:auto!important}
    .showcase-shell.mobile .sticky-inner{position:static}
    .showcase-shell.mobile .track{display:grid;gap:.85rem;transform:none!important;width:auto!important}
    .showcase-shell.mobile .panel{min-width:0;grid-template-columns:1fr}
    .showcase-shell.mobile .visual{min-height:180px}

    @media (max-width: 1024px){.panel{grid-template-columns:1fr;flex-basis:min(92vw,720px)}}
    @media (max-width: 768px){.sticky-inner{position:static}.track{display:grid;transform:none!important;width:auto!important}.panel{min-width:0;grid-template-columns:1fr}}
  `]
})
export class HorizontalShowcaseSectionComponent implements AfterViewInit, OnDestroy {
  readonly sectionRoot = viewChild<ElementRef<HTMLElement>>('sectionRoot');
  readonly progress = signal(0);
  readonly activeIndex = signal(0);
  readonly isMobile = signal(false);
  readonly stickyHeight = signal(700);
  readonly trackWidth = signal(0);

  private trackScrollable = 0;
  private sectionStart = 0;
  private sectionRange = 1;
  private rafId: number | null = null;

  readonly items: ShowcaseItem[] = [
    { title: 'AI Diagnostika', description: 'Simptomlar va tahlil ma’lumotlari asosida yordamchi klinik tahlil.', features: ['Simptom tahlili', 'Ehtimoliy yo‘nalish', 'Keyingi tekshiruvlar'], visual: 'ai' },
    { title: 'Risk Panel', description: 'Yurak, jigar, buyrak, o‘pka, anemiya va diabet xavfini baholash.', features: ['Foizli xavf', 'Vaqt oralig‘i', 'Kuzatuv tavsiyasi'], visual: 'risk' },
    { title: '3D Yurak Modeli', description: 'Yurak holatini vizual tushuntirish uchun interaktiv ko‘rinish.', features: ['Vizual karta', 'Holat belgisi', 'Klinik izoh'], visual: 'heart' },
    { title: 'Klinik Xulosa', description: 'Shifokor uchun qisqa, aniq va klinik qarorga yordam beruvchi xulosa.', features: ['Asosiy topilma', 'Ehtimoliy sabab', 'Tavsiya'], visual: 'clinical' },
    { title: 'Dashboard', description: 'Bemorlar, tahlillar va natijalarni yagona panelda ko‘rish.', features: ['Statistika', 'Trend', 'Natijalar'], visual: 'dashboard' },
    { title: 'Bemor Paneli', description: 'Bemor uchun tushunarli natija, maslahat va kuzatuv.', features: ['Oddiy izoh', 'Kuzatuv', 'Print/save'], visual: 'patient' }
  ];

  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.recalculate();
    window.addEventListener('resize', this.recalculate, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('resize', this.recalculate);
    window.removeEventListener('scroll', this.onScroll);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  trackTransform(): string {
    if (this.isMobile()) return 'none';
    const x = -this.progress() * this.trackScrollable;
    return `translate3d(${x}px,0,0)`;
  }

  progressPercent(): number {
    return Math.max(0, Math.min(100, this.progress() * 100));
  }

  private readonly recalculate = (): void => {
    const root = this.sectionRoot()?.nativeElement;
    if (!root || !isPlatformBrowser(this.platformId)) return;

    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);

    const track = root.querySelector<HTMLElement>('.track');
    const sticky = root.querySelector<HTMLElement>('.sticky-zone');
    const firstPanel = root.querySelector<HTMLElement>('.panel');
    if (!track || !sticky || !firstPanel) return;

    if (mobile) {
      this.trackScrollable = 0;
      this.trackWidth.set(0);
      this.stickyHeight.set(0);
      this.sectionStart = root.offsetTop;
      this.sectionRange = Math.max(1, root.clientHeight);
      return;
    }

    const panelGap = 16;
    const totalWidth = (firstPanel.offsetWidth * this.items.length) + (panelGap * (this.items.length - 1));
    const viewportWidth = sticky.clientWidth;

    this.trackWidth.set(totalWidth);
    this.trackScrollable = Math.max(0, totalWidth - viewportWidth);

    const stickyViewHeight = Math.max(520, Math.min(760, window.innerHeight - 40));
    this.stickyHeight.set(stickyViewHeight + this.trackScrollable);

    const rect = root.getBoundingClientRect();
    this.sectionStart = window.scrollY + rect.top;
    this.sectionRange = Math.max(1, this.stickyHeight() - stickyViewHeight);
  };

  private readonly onScroll = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const root = this.sectionRoot()?.nativeElement;
      if (!root) return;

      if (this.isMobile()) {
        this.progress.set(0);
        this.activeIndex.set(0);
        return;
      }

      const y = window.scrollY;
      const raw = (y - this.sectionStart) / this.sectionRange;
      const clamped = Math.max(0, Math.min(1, raw));
      this.progress.set(clamped);
      const index = Math.min(this.items.length - 1, Math.floor(clamped * this.items.length));
      this.activeIndex.set(index);
    });
  };
}
