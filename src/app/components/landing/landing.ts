import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-mockup',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="dashboard-mock premium-card">
      <div class="mock-grid">
        <aside class="mock-side">
          <strong style="color:#f2d675">Abdulloh AI</strong>
          <a class="active">Bosh sahifa</a><a>Bemorlar</a><a>Tahlillar</a><a>Diagnostika</a><a>Monitoring</a><a>Xabarnomalar</a><a>Sozlamalar</a>
          <div class="doctor-mini">Dr. Komilov<br><span>Kardiolog</span></div>
        </aside>
        <section class="mock-center">
          <div class="profile-card"><p style="color:#c9c2a4">Bemor profili</p><h3>Ismoil Azizbek</h3><p style="color:#9e7e22">ID: AAI-2048 • 42 yosh • Erkak</p></div>
          <div class="heart-orb"><mat-icon>favorite</mat-icon></div>
          <div class="mini-ecg"></div>
          <div class="analysis-list"><p><span>EKG monitoring</span><b>Barqaror</b></p><p><span>So‘nggi tahlil</span><b>Ko‘rib chiqildi</b></p><p><span>Reabilitatsiya</span><b>78%</b></p></div>
        </section>
        <aside class="mock-panel">
          <h3>Umumiy risk darajasi</h3><p style="color:#ff4d4d;font-weight:800">Yuqori risk</p><div class="risk-circle"><span>78%</span></div>
          <div class="metric"><span>Yurak urishi</span><b>92 bpm</b></div><div class="metric"><span>Qon bosimi</span><b>142/88</b></div><div class="metric"><span>SpO₂</span><b>96%</b></div><div class="metric"><span>Qon shakar</span><b>6.8</b></div>
          <p class="ai-note">AI tavsiyasi: qon bosimi va stress omillarini qayta baholash tavsiya etiladi.</p>
          <div class="bars"><div style="--w:78%"></div><div style="--w:62%"></div><div style="--w:54%"></div><div style="--w:38%"></div></div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;perspective:1200px}.premium-card{border:1px solid rgba(212,175,55,.35);background:rgba(10,12,10,.85);backdrop-filter:blur(18px)}.dashboard-mock{border-radius:2rem;transform:rotateY(-8deg) rotateX(4deg);padding:1rem;min-height:600px}.mock-grid{display:grid;grid-template-columns:150px 1fr 210px;gap:1rem;height:100%}.mock-side,.mock-panel,.mock-center{border:1px solid rgba(212,175,55,.18);border-radius:1.3rem;background:rgba(3,4,3,.72);padding:1rem}.mock-side a{display:block;color:#c9c2a4;font-size:.78rem;padding:.55rem;border-radius:.7rem}.mock-side a.active{background:rgba(212,175,55,.15);color:#f2d675}.doctor-mini{margin-top:1rem;border-top:1px solid rgba(212,175,55,.18);padding-top:1rem;font-size:.75rem;color:#c9c2a4}.profile-card h3,.mock-panel h3{color:#f2d675;font-family:Georgia,serif;font-size:1.25rem}.heart-orb{display:grid;place-items:center;margin:1.5rem auto;width:170px;height:170px;border-radius:999px;background:radial-gradient(circle,#f2d675,#9e7e22 45%,rgba(212,175,55,.09) 66%,transparent);box-shadow:0 0 55px rgba(212,175,55,.35)}.heart-orb mat-icon{font-size:4.5rem;width:4.5rem;height:4.5rem;color:#1a1202}.mini-ecg{height:72px;border-radius:1rem;background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(126,217,87,.06)),repeating-linear-gradient(90deg,transparent 0 24px,rgba(212,175,55,.08) 25px)}.analysis-list p,.metric{display:flex;justify-content:space-between;gap:.75rem;color:#c9c2a4;font-size:.78rem;border-bottom:1px solid rgba(212,175,55,.11);padding:.55rem 0}.risk-circle{display:grid;place-items:center;margin:1rem auto;width:120px;height:120px;border-radius:999px;background:conic-gradient(#ff4d4d 78%,rgba(212,175,55,.12) 0);box-shadow:0 0 30px rgba(255,77,77,.18)}.risk-circle span{display:grid;place-items:center;width:88px;height:88px;border-radius:999px;background:#060806;color:#f2d675;font-size:1.8rem;font-weight:900}.ai-note{border:1px solid rgba(126,217,87,.24);border-radius:1rem;background:rgba(126,217,87,.08);color:#dfffd6;font-size:.78rem;padding:.8rem}.bars div{height:.55rem;margin:.75rem 0;border-radius:999px;background:linear-gradient(90deg,#d4af37,var(--w),rgba(212,175,55,.1) 0)}@media(max-width:1024px){.dashboard-mock{transform:none}.mock-grid{grid-template-columns:120px 1fr}.mock-panel{grid-column:1/-1}}@media(max-width:640px){.mock-grid{grid-template-columns:1fr}.mock-side{display:none}.dashboard-mock{padding:.75rem;min-height:auto}}
  `]
})
export class DashboardMockupComponent {}


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, DashboardMockupComponent],
  template: `
    <main class="landing-page min-h-screen overflow-x-hidden bg-[#030403] text-[#F8F1D0]">
      <div class="landing-bg" aria-hidden="true"></div>

      <nav class="premium-nav">
        <a routerLink="/home" class="brand" aria-label="Abdulloh AI bosh sahifa">
          <span class="brand-mark"><mat-icon>health_and_safety</mat-icon></span>
          <span>Abdulloh AI</span>
        </a>
        <div class="nav-links" aria-label="Asosiy bo‘limlar">
          <a href="#imkoniyatlar">Imkoniyatlar</a>
          <a href="#shifokorlar">Shifokorlar uchun</a>
          <a href="#bemorlar">Bemorlar uchun</a>
          <a href="#boglanish">Bog‘lanish</a>
        </div>
        <a routerLink="/auth" class="login-link"><mat-icon>login</mat-icon><span>Kirish</span></a>
        <button type="button" class="mobile-menu" aria-label="Menyuni ochish" [attr.aria-expanded]="mobileMenuOpen()" (click)="toggleMobileMenu()">
          <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </nav>

      @if (mobileMenuOpen()) {
        <div class="mobile-drawer">
          <a href="#imkoniyatlar" (click)="closeMobileMenu()">Imkoniyatlar</a>
          <a href="#shifokorlar" (click)="closeMobileMenu()">Shifokorlar uchun</a>
          <a href="#bemorlar" (click)="closeMobileMenu()">Bemorlar uchun</a>
          <a href="#boglanish" (click)="closeMobileMenu()">Bog‘lanish</a>
          <a routerLink="/auth" class="drawer-login" (click)="closeMobileMenu()"><mat-icon>login</mat-icon>Kirish</a>
        </div>
      }

      <section class="hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">PREMIUM MEDICAL AI PLATFORM</p>
          <h1>Premium darajadagi<br>tibbiy sun’iy intellekt<br>platformasi</h1>
          <svg class="ecg" viewBox="0 0 360 58" role="img" aria-label="Tilla EKG chizig‘i">
            <path d="M4 32H72L86 18L102 44L119 10L136 33H186L199 24L214 39L232 17L251 32H356" />
          </svg>
          <p class="subtitle">Risk tahlili, diagnostik yordam va aqlli bemor boshqaruvi orqali tibbiyotda yangi avlod yechimlarini taqdim etamiz.</p>
          <div class="cta-row">
            <a routerLink="/auth" class="cta-primary"><mat-icon>medical_services</mat-icon>Shifokor sifatida kirish</a>
            <a routerLink="/auth" class="cta-secondary"><mat-icon>person</mat-icon>Bemor sifatida kirish</a>
          </div>
          <div class="trust-row">
            <span><mat-icon>lock</mat-icon>Xavfsiz va maxfiy ma’lumotlar himoyasi</span>
            <span><mat-icon>auto_awesome</mat-icon>AI asosida aniq va samaradorlik</span>
            <span><mat-icon>verified</mat-icon>Tibbiyot standartlariga to‘liq mos</span>
          </div>
        </div>

        <app-dashboard-mockup class="hero-mockup"></app-dashboard-mockup>
      </section>

      <section id="imkoniyatlar" class="feature-grid" aria-label="Abdulloh AI imkoniyatlari">
        @for (feature of features; track feature.title) {
          <article class="premium-card feature-card">
            <mat-icon>{{ feature.icon }}</mat-icon>
            <h2>{{ feature.title }}</h2>
            <p>{{ feature.description }}</p>
            <a [routerLink]="feature.link">Batafsil →</a>
          </article>
        }
      </section>

      <section class="stats-strip" aria-label="Platforma statistikasi">
        @for (stat of stats; track stat.label) {
          <div class="stat-item">
            <mat-icon>{{ stat.icon }}</mat-icon>
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        }
      </section>

      <section id="shifokorlar" class="doctor-section">
        <div class="analytics-mock premium-card">
          <div class="analytics-top"><span>Abdulloh AI Analytics</span><strong>Live</strong></div>
          <div class="kpi-grid">
            <div><span>Jami bemorlar</span><strong>1,248</strong></div>
            <div><span>Tahlillar</span><strong>3,472</strong></div>
            <div><span>Xavf aniqlangan</span><strong>318</strong></div>
            <div><span>Samaradorlik</span><strong>92%</strong></div>
          </div>
          <div class="chart-row"><div class="line-chart"></div><div class="donut">92%</div></div>
          <div class="patient-table">
            <p><span>Ismoil A.</span><b>Yuqori risk</b></p>
            <p><span>Madina K.</span><b class="ok">Barqaror</b></p>
            <p><span>Javohir S.</span><b>Monitoring</b></p>
          </div>
        </div>

        <div class="doctor-copy">
          <p class="eyebrow">SHIFOKOR UCHUN</p>
          <h2>Aqlli tahlillar,<br>ma’lumotlarga asoslangan<br>qarorlar</h2>
          <p>Abdulloh AI shifokorlarga bemor ma’lumotlarini chuqur tahlil qilish, xavf omillarini aniqlash va eng samarali davolash strategiyasini tanlashda yordam beradi.</p>
          <ul>
            <li><mat-icon>check_circle</mat-icon>AI qo‘llab-quvvatlovchi diagnostika</li>
            <li><mat-icon>check_circle</mat-icon>Shaxsiylashtirilgan davolash tavsiyalari</li>
            <li><mat-icon>check_circle</mat-icon>Ma’lumotlar asosida qaror qabul qilish</li>
            <li><mat-icon>check_circle</mat-icon>Vaqtni tejovchi avtomatlashtirilgan jarayonlar</li>
          </ul>
          <a routerLink="/auth" class="more-link">Ko‘proq imkoniyatlar →</a>
        </div>
      </section>

      <section id="bemorlar" class="patient-note premium-card">
        <div>
          <p class="eyebrow">BEMORLAR UCHUN</p>
          <h2>Shaxsiy tibbiy ko‘rsatkichlar doim nazoratda</h2>
        </div>
        <p>Natijalar, risk profili, tavsiyalar va reabilitatsiya monitoringi yagona himoyalangan muhitda jamlanadi.</p>
      </section>

      <footer id="boglanish" class="standards-strip">
        <p>XALQARO STANDARTLARGA MOS</p>
        <div>
          @for (standard of standards; track standard) {
            <span><mat-icon>workspace_premium</mat-icon>{{ standard }}</span>
          }
        </div>
      </footer>
    </main>
  `,
  styles: [`
    :host{display:block}.landing-page{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative}.landing-bg{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 16%,rgba(212,175,55,.24),transparent 28%),radial-gradient(circle at 84% 12%,rgba(242,214,117,.13),transparent 24%),radial-gradient(circle at 70% 72%,rgba(126,217,87,.07),transparent 28%),linear-gradient(135deg,#030403,#060806 45%,#0a0a08);}.premium-nav{position:sticky;top:0;z-index:40;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;max-width:1440px;padding:1rem clamp(1rem,4vw,4rem);border-bottom:1px solid rgba(212,175,55,.22);background:rgba(3,4,3,.78);backdrop-filter:blur(18px)}.brand,.login-link,.nav-links a,.mobile-drawer a{color:#f8f1d0;text-decoration:none}.brand{display:flex;align-items:center;gap:.75rem;font-family:Georgia,serif;font-size:1.35rem;font-weight:800;color:#f2d675}.brand-mark{display:grid;place-items:center;width:2.75rem;height:2.75rem;border:1px solid rgba(212,175,55,.45);border-radius:1rem;background:rgba(212,175,55,.1);box-shadow:0 0 28px rgba(212,175,55,.18)}.nav-links{display:flex;gap:2rem;font-size:.9rem;color:#c9c2a4}.nav-links a{color:#c9c2a4}.nav-links a:hover{color:#f2d675}.login-link,.drawer-login,.cta-secondary,.more-link{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:44px;border:1px solid rgba(212,175,55,.5);border-radius:999px;padding:.72rem 1.15rem;background:rgba(10,12,10,.65);color:#f2d675;transition:.2s}.login-link:hover,.cta-secondary:hover,.more-link:hover{background:rgba(212,175,55,.14);box-shadow:0 0 24px rgba(212,175,55,.22)}.mobile-menu{display:none;min-width:44px;min-height:44px;border:1px solid rgba(212,175,55,.45);border-radius:1rem;background:rgba(10,12,10,.85);color:#f2d675}.mobile-drawer{position:fixed;top:74px;left:1rem;right:1rem;z-index:50;display:grid;gap:.75rem;border:1px solid rgba(212,175,55,.35);border-radius:1.25rem;background:rgba(6,8,6,.96);padding:1rem;box-shadow:0 24px 70px rgba(0,0,0,.6)}.mobile-drawer a{min-height:44px;display:flex;align-items:center;color:#f8f1d0}.hero-shell{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.9fr) minmax(520px,1.1fr);gap:clamp(2rem,5vw,5rem);align-items:center;max-width:1440px;margin:0 auto;padding:clamp(3rem,7vw,7rem) clamp(1rem,4vw,4rem) 3rem}.eyebrow{color:#d4af37;font-size:.78rem;font-weight:900;letter-spacing:.26em}.hero-copy h1,.doctor-copy h2,.patient-note h2{font-family:Georgia,"Times New Roman",serif;color:#f2d675;text-shadow:0 0 30px rgba(212,175,55,.16)}.hero-copy h1{margin-top:1rem;font-size:clamp(2.8rem,6vw,6.5rem);line-height:.98;font-weight:900;letter-spacing:-.055em}.ecg{width:min(360px,100%);height:58px;margin:1.4rem 0}.ecg path{fill:none;stroke:#d4af37;stroke-width:3;filter:drop-shadow(0 0 8px rgba(212,175,55,.5));stroke-dasharray:540;animation:draw 4.5s ease-in-out infinite}@keyframes draw{0%,100%{stroke-dashoffset:0}50%{stroke-dashoffset:80}}.subtitle{max-width:640px;color:#c9c2a4;font-size:clamp(1rem,1.5vw,1.18rem);line-height:1.8}.cta-row,.trust-row{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.7rem}.cta-primary{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:48px;border-radius:999px;padding:.9rem 1.35rem;background:linear-gradient(135deg,#d4af37,#f2d675);color:#120f05;font-weight:900;text-decoration:none;box-shadow:0 0 34px rgba(212,175,55,.28)}.cta-primary:hover{box-shadow:0 0 46px rgba(242,214,117,.4);transform:translateY(-1px)}.trust-row span{display:flex;align-items:center;gap:.45rem;color:#c9c2a4;font-size:.9rem}.trust-row mat-icon{color:#d4af37}.premium-card{border:1px solid rgba(212,175,55,.35);background:rgba(10,12,10,.85);backdrop-filter:blur(18px)}.hero-mockup{display:block}.premium-card{border:1px solid rgba(212,175,55,.35);background:rgba(10,12,10,.85);backdrop-filter:blur(18px)}.feature-grid,.stats-strip,.doctor-section,.patient-note,.standards-strip{position:relative;z-index:1;max-width:1440px;margin:0 auto}.feature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;padding:1rem clamp(1rem,4vw,4rem) 3rem}.feature-card{border-radius:1.4rem;padding:1.35rem;transition:.2s}.feature-card:hover{transform:translateY(-5px);border-color:rgba(242,214,117,.75)}.feature-card mat-icon{color:#d4af37;font-size:2rem;width:2rem;height:2rem}.feature-card h2{margin:.9rem 0 .55rem;color:#f8f1d0;font-size:1.2rem}.feature-card p{color:#c9c2a4;line-height:1.65}.feature-card a{color:#f2d675;text-decoration:none;font-weight:800}.stats-strip{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid rgba(212,175,55,.35);border-radius:1.6rem;background:rgba(10,12,10,.85);overflow:hidden}.stat-item{display:grid;place-items:center;gap:.35rem;padding:1.5rem;text-align:center;border-right:1px solid rgba(212,175,55,.17)}.stat-item:last-child{border-right:0}.stat-item mat-icon{color:#d4af37}.stat-item strong{font-size:1.75rem;color:#f2d675}.stat-item span{color:#c9c2a4;font-size:.88rem}.doctor-section{display:grid;grid-template-columns:1fr .9fr;gap:3rem;align-items:center;padding:5rem clamp(1rem,4vw,4rem)}.analytics-mock{border-radius:1.8rem;padding:1.2rem}.analytics-top,.patient-table p{display:flex;justify-content:space-between;color:#c9c2a4}.analytics-top strong{color:#7ed957}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin:1rem 0}.kpi-grid div{border:1px solid rgba(212,175,55,.16);border-radius:1rem;padding:.85rem;background:rgba(212,175,55,.06)}.kpi-grid span{display:block;color:#c9c2a4;font-size:.75rem}.kpi-grid strong{color:#f2d675;font-size:1.25rem}.chart-row{display:grid;grid-template-columns:1fr 120px;gap:1rem}.donut{display:grid;place-items:center;border-radius:999px;background:conic-gradient(#7ed957 92%,rgba(212,175,55,.12) 0);color:#061006;font-weight:900}.patient-table{margin-top:1rem}.patient-table b{color:#ffb86b}.patient-table b.ok{color:#7ed957}.doctor-copy h2{font-size:clamp(2.2rem,4vw,4.5rem);line-height:1.04;margin:1rem 0}.doctor-copy p{color:#c9c2a4;line-height:1.8}.doctor-copy ul{list-style:none;padding:0;margin:1.4rem 0;display:grid;gap:.8rem;color:#f8f1d0}.doctor-copy li{display:flex;align-items:center;gap:.65rem}.doctor-copy mat-icon{color:#d4af37}.more-link{text-decoration:none;width:max-content}.patient-note{display:flex;align-items:center;justify-content:space-between;gap:2rem;border-radius:1.6rem;padding:1.5rem 2rem}.patient-note p{color:#c9c2a4;max-width:560px}.standards-strip{padding:2rem clamp(1rem,4vw,4rem) 3rem;text-align:center;color:#9e7e22}.standards-strip>p{letter-spacing:.25em;font-weight:900}.standards-strip div{display:flex;justify-content:center;flex-wrap:wrap;gap:1rem;margin-top:1rem}.standards-strip span{display:inline-flex;align-items:center;gap:.45rem;border:1px solid rgba(212,175,55,.22);border-radius:999px;padding:.7rem 1rem;background:rgba(10,12,10,.65);color:#c9c2a4}@media (max-width:1024px){.nav-links,.login-link{display:none}.mobile-menu{display:grid;place-items:center}.hero-shell{grid-template-columns:1fr}.dashboard-mock{transform:none}.feature-grid{grid-template-columns:repeat(2,1fr)}.stats-strip{grid-template-columns:repeat(2,1fr);margin:0 1rem}.stat-item{border-right:0;border-bottom:1px solid rgba(212,175,55,.17)}.doctor-section{grid-template-columns:1fr}.mock-grid{grid-template-columns:120px 1fr}.mock-panel{grid-column:1/-1}.patient-note{margin:0 1rem;display:block}}@media (max-width:640px){.hero-shell{padding-top:2rem}.hero-copy h1{font-size:clamp(2.35rem,13vw,3.8rem)}.cta-row a{width:100%}.trust-row{display:grid}.feature-grid{grid-template-columns:1fr}.stats-strip{grid-template-columns:1fr}.mock-grid{grid-template-columns:1fr}.mock-side{display:none}.dashboard-mock{padding:.75rem;min-height:auto}.kpi-grid{grid-template-columns:repeat(2,1fr)}.chart-row{grid-template-columns:1fr}.donut{width:120px;height:120px;margin:auto}.patient-note h2{font-size:1.7rem}.standards-strip div{display:grid;grid-template-columns:1fr 1fr}.standards-strip span{justify-content:center;font-size:.82rem}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  mobileMenuOpen = signal(false);
  features = [
    { icon: 'analytics', title: 'Risk tahlili', description: 'Algoritmlar yordamida bemor uchun kasallik rivojlanish xavfini erta aniqlaymiz.', link: '/auth' },
    { icon: 'psychology', title: 'Differensial diagnostika', description: 'Ko‘p variantli tahlil orqali aniq tashxis qo‘yishga shifokorga yordam beramiz.', link: '/auth' },
    { icon: 'cloud_done', title: 'Natijalarni saqlash', description: 'Barcha tahlil hujjatlarini bulutda xavfsiz saqlaymiz va istalgan joydan kirish imkonini beramiz.', link: '/auth' },
    { icon: 'accessibility_new', title: 'Reabilitatsiya monitoringi', description: 'Davolash jarayonini kuzatib borish va bemor holatini doimiy nazorat qilish imkoniyati.', link: '/auth' }
  ];
  stats = [
    { icon: 'local_hospital', value: '10 000+', label: 'Faol shifokorlar' },
    { icon: 'groups', value: '120 000+', label: 'Ro‘yxatdan o‘tgan bemorlar' },
    { icon: 'biotech', value: '2.5M+', label: 'Tahlillar bajarildi' },
    { icon: 'verified', value: '98.6%', label: 'Aniqlik darajasi' },
    { icon: 'support_agent', value: '24/7', label: 'Uzluksiz xizmat' }
  ];
  standards = ['ISO 27001', 'HIPAA compliant', 'GDPR compliant', 'HL7 International'];

  toggleMobileMenu() { this.mobileMenuOpen.update((value) => !value); }
  closeMobileMenu() { this.mobileMenuOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { this.closeMobileMenu(); }
}
