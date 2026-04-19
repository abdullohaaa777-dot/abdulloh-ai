import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen auth-screen relative overflow-hidden">
      <div class="auth-orb absolute top-[-14%] left-[-8%] w-[38rem] h-[38rem] bg-medical-primary/12 rounded-full blur-3xl"></div>
      <div class="auth-orb absolute bottom-[-20%] right-[-10%] w-[34rem] h-[34rem] bg-medical-secondary/14 rounded-full blur-3xl" style="animation-delay: -3s"></div>
      <div class="auth-grid pointer-events-none absolute inset-0 opacity-35"></div>

      <div class="relative z-10 min-h-screen grid lg:grid-cols-[1.12fr_0.88fr]">
        <section class="auth-hero px-6 py-10 sm:px-10 md:px-14 lg:px-16 lg:py-14 flex flex-col justify-center">
          <div class="max-w-2xl">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-medical-primary/80 mb-4">Tibbiy sun’iy intellekt platformasi</p>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-medical-text leading-tight">
              Har bir klinik signalni <span class="text-medical-primary">chuqurroq</span> ko‘ring
            </h1>
            <p class="mt-5 text-base sm:text-lg text-medical-text-muted max-w-xl">
              Abdulloh AI yordamida simptom, lab natija va xavf ko‘rsatkichlarini yagona makonda tahlil qiling.
              Tezkor, ishonchli va professional qaror uchun puxta vizual muhit.
            </p>
          </div>

          <div class="auth-hero-visual mt-10 sm:mt-12">
            <div class="auth-scene-ring auth-scene-ring-lg"></div>
            <div class="auth-scene-ring auth-scene-ring-md"></div>
            <div class="auth-scene-ring auth-scene-ring-sm"></div>
            <div class="auth-wave"></div>
            <div class="auth-wave auth-wave-delay"></div>
            <div class="auth-core">
              <mat-icon class="text-3xl text-medical-primary">monitor_heart</mat-icon>
            </div>
            <div class="auth-floating-card top-4 left-6">
              <mat-icon class="text-red-500 text-base">favorite</mat-icon>
              <span>Yurak signali faol</span>
            </div>
            <div class="auth-floating-card bottom-5 right-8">
              <mat-icon class="text-sky-500 text-base">air</mat-icon>
              <span>Nafas oqimi kuzatilmoqda</span>
            </div>
            <div class="auth-floating-card top-[48%] right-2">
              <mat-icon class="text-indigo-500 text-base">analytics</mat-icon>
              <span>AI tahlil holati tayyor</span>
            </div>
          </div>
        </section>

        <section class="flex items-center justify-center px-4 sm:px-6 pb-8 lg:pb-0">
          <div class="w-full max-w-md auth-panel p-6 sm:p-8 rounded-3xl">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-medical-primary to-indigo-500 rounded-2xl mb-4 shadow-[0_16px_28px_-18px_rgba(79,70,229,0.95)]">
                <mat-icon class="text-white text-4xl h-10 w-10">health_and_safety</mat-icon>
              </div>
              <h2 class="text-2xl font-extrabold text-medical-text">Kirish</h2>
              <p class="text-sm text-medical-text-muted mt-2">Shaxsiy klinik boshqaruv maydoniga xavfsiz kiring</p>
            </div>

            <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4 sm:space-y-5">
              <div class="space-y-2">
                <label for="email" class="block text-sm font-semibold text-medical-text">Email manzilingiz</label>
                <div class="auth-input-shell">
                  <mat-icon class="auth-input-icon">mail</mat-icon>
                  <input id="email" type="email" formControlName="email" class="w-full auth-input pl-11" placeholder="email@example.com" autocomplete="email">
                </div>
                @if (authForm.controls.email.invalid && (authForm.controls.email.touched || authForm.controls.email.dirty)) {
                  <p class="auth-error-text">
                    <mat-icon class="auth-error-icon">error_outline</mat-icon>
                    {{ authForm.controls.email.hasError('required') ? 'Email kiritilishi shart.' : 'Email formati noto‘g‘ri.' }}
                  </p>
                }
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <label for="password" class="block text-sm font-semibold text-medical-text">Parol</label>
                  <span class="text-[11px] text-medical-text-muted font-medium">Kamida 6 ta belgi</span>
                </div>
                <div class="auth-input-shell">
                  <mat-icon class="auth-input-icon">lock</mat-icon>
                  <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" class="w-full auth-input pl-11 pr-12" placeholder="••••••••" autocomplete="current-password">
                  <button type="button" class="auth-password-toggle" (click)="togglePasswordVisibility()" [attr.aria-label]="showPassword() ? 'Parolni yashirish' : 'Parolni ko‘rsatish'">
                    <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                @if (authForm.controls.password.invalid && (authForm.controls.password.touched || authForm.controls.password.dirty)) {
                  <p class="auth-error-text">
                    <mat-icon class="auth-error-icon">error_outline</mat-icon>
                    {{ authForm.controls.password.hasError('required') ? 'Parol kiritilishi shart.' : 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.' }}
                  </p>
                }
              </div>

              @if (!supabase.isConfigured()) {
                <div class="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl text-blue-700 text-sm font-medium mb-3">
                  <div class="flex items-center gap-2 mb-1">
                    <mat-icon class="text-sm h-4 w-4">info</mat-icon>
                    <span>Demo rejimi faol</span>
                  </div>
                  <p class="text-xs opacity-80">Supabase sozlanmagan. Ma'lumotlar brauzer xotirasida saqlanadi.</p>
                </div>
              }

              @if (error()) {
                <div class="p-4 bg-red-50/90 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                  <mat-icon class="text-sm h-4 w-4">error_outline</mat-icon>
                  {{ error() }}
                </div>
              }

              <button type="submit" [disabled]="loading()" class="w-full btn-primary py-3.5 text-base mt-1 disabled:opacity-70 disabled:cursor-not-allowed">
                @if (!loading()) {
                  <span>{{ supabase.isConfigured() ? 'Xavfsiz kirish' : 'Demo rejimida kirish' }}</span>
                }
                @if (loading()) {
                  <mat-icon class="animate-spin">sync</mat-icon>
                }
              </button>
            </form>

            <div class="mt-6 text-center border-t border-medical-border/70 pt-5">
              <p class="text-xs font-semibold text-medical-text-muted">Himoyalangan klinik kirish muhiti</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .auth-screen {
      background:
        radial-gradient(circle at 12% 20%, rgba(79, 70, 229, 0.11), transparent 34%),
        radial-gradient(circle at 85% 12%, rgba(14, 165, 233, 0.10), transparent 34%),
        linear-gradient(125deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .auth-hero {
      position: relative;
    }

    .auth-panel {
      background: linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
      border: 1px solid rgba(226, 232, 240, 0.85);
      box-shadow: 0 34px 65px -42px rgba(15, 23, 42, 0.7), 0 16px 34px -26px rgba(79, 70, 229, 0.4);
      backdrop-filter: blur(8px);
    }

    .auth-grid {
      background-image:
        linear-gradient(rgba(79, 70, 229, 0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(79, 70, 229, 0.045) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
    }

    .auth-input-shell {
      position: relative;
    }

    .auth-hero-visual {
      position: relative;
      border-radius: 1.4rem;
      border: 1px solid rgba(79, 70, 229, 0.16);
      background: linear-gradient(145deg, rgba(79, 70, 229, 0.12), rgba(14, 165, 233, 0.10));
      min-height: 20rem;
      overflow: hidden;
      box-shadow: inset 0 0 42px rgba(79, 70, 229, 0.09), 0 35px 60px -45px rgba(15, 23, 42, 0.9);
    }

    .auth-core {
      position: relative;
      z-index: 2;
      width: 4rem;
      height: 4rem;
      border-radius: 999px;
      border: 1px solid rgba(79, 70, 229, 0.28);
      background: rgba(255, 255, 255, 0.85);
      display: grid;
      place-items: center;
      margin: 6.9rem auto 0;
      box-shadow: 0 16px 26px -16px rgba(79, 70, 229, 0.8);
    }

    .auth-scene-ring {
      position: absolute;
      inset: 0;
      margin: auto;
      border-radius: 999px;
      border: 1px solid rgba(79, 70, 229, 0.25);
      animation: authRotate 16s linear infinite;
      opacity: 0.7;
    }

    .auth-scene-ring-lg {
      width: 19rem;
      height: 19rem;
      top: -0.9rem;
    }

    .auth-scene-ring-md {
      width: 14rem;
      height: 14rem;
      top: 1.6rem;
      border-color: rgba(14, 165, 233, 0.3);
      border-style: dashed;
      animation-duration: 24s;
      animation-direction: reverse;
    }

    .auth-scene-ring-sm {
      width: 10rem;
      height: 10rem;
      top: 3.8rem;
      border-color: rgba(79, 70, 229, 0.35);
      animation-duration: 10s;
    }

    .auth-wave {
      position: absolute;
      left: -6%;
      right: -6%;
      top: 54%;
      height: 3px;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.66), rgba(14, 165, 233, 0.66), transparent);
      animation: authPulse 3.6s ease-in-out infinite;
    }

    .auth-wave-delay {
      top: 62%;
      animation-delay: -1.6s;
      opacity: 0.62;
    }

    .auth-floating-card {
      position: absolute;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.34);
      padding: 0.42rem 0.75rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #334155;
      box-shadow: 0 14px 25px -20px rgba(15, 23, 42, 0.9);
      animation: authFloat 6s ease-in-out infinite;
    }

    .auth-input {
      height: 3.1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(203, 213, 225, 0.95);
      background: rgba(255, 255, 255, 0.96);
      color: #1e293b;
      font-size: 0.95rem;
      line-height: 1.4;
      transition: all 180ms ease;
      box-shadow: 0 8px 22px -18px rgba(15, 23, 42, 0.7);
    }

    .auth-input::placeholder {
      color: #94a3b8;
      letter-spacing: 0.02em;
    }

    .auth-input:focus {
      outline: none;
      border-color: rgba(79, 70, 229, 0.55);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12), 0 14px 24px -20px rgba(79, 70, 229, 0.8);
      background: #fff;
    }

    .auth-input-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
      color: #64748b;
      pointer-events: none;
    }

    .auth-password-toggle {
      position: absolute;
      right: 0.45rem;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 0.7rem;
      width: 2.1rem;
      height: 2.1rem;
      display: grid;
      place-items: center;
      color: #64748b;
      transition: all 150ms ease;
    }

    .auth-password-toggle:hover {
      background: rgba(79, 70, 229, 0.08);
      color: #4f46e5;
    }

    .auth-error-text {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.76rem;
      font-weight: 600;
      color: #dc2626;
      margin-top: 0.1rem;
    }

    .auth-error-icon {
      width: 0.95rem;
      height: 0.95rem;
      font-size: 0.95rem;
    }

    .auth-orb {
      animation: authFloat 10s ease-in-out infinite;
    }

    @keyframes authFloat {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(0, -12px, 0); }
    }

    @keyframes authRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes authPulse {
      0%, 100% { opacity: 0.25; transform: scaleX(0.9); }
      50% { opacity: 0.85; transform: scaleX(1.02); }
    }

    @media (max-width: 640px) {
      .auth-panel {
        border-radius: 1.5rem;
      }

      .auth-hero-visual {
        min-height: 16rem;
      }

      .auth-scene-ring-lg { width: 13rem; height: 13rem; top: -0.3rem; }
      .auth-scene-ring-md { width: 10rem; height: 10rem; top: 1.5rem; }
      .auth-scene-ring-sm { width: 7rem; height: 7rem; top: 3rem; }
      .auth-core { margin-top: 4.9rem; width: 3.3rem; height: 3.3rem; }
    }

    @media (max-width: 1024px) {
      .auth-hero {
        padding-bottom: 1.2rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public supabase = inject(SupabaseService);

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLogin = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  get authButtonText() {
    return this.isLogin() ? 'Kirish' : "Ro'yxatdan o'tish";
  }

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
    this.showPassword.set(false);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.authForm.value;
    const { error } = this.isLogin() 
      ? await this.supabase.signIn(email!, password!)
      : await this.supabase.signUp(email!, password!);

    if (error) {
      this.error.set(error.message);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.loading.set(false);
  }
}
