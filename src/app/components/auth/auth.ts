import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
    <div class="min-h-screen bg-medical-bg relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,.16),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,.14),transparent_38%),linear-gradient(130deg,rgba(15,23,42,.95),rgba(30,41,59,.92)_42%,rgba(241,245,249,.95)_72%)]"></div>
      <div class="absolute top-[-12%] left-[-8%] w-[36rem] h-[36rem] bg-cyan-400/15 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-[-16%] right-[-10%] w-[34rem] h-[34rem] bg-blue-500/15 rounded-full blur-3xl"></div>

      <div class="relative z-10 min-h-screen grid lg:grid-cols-[1.12fr_.88fr]">
        <section class="hidden lg:flex relative p-12 xl:p-16 flex-col justify-between text-white">
          <div class="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 800 700" class="w-full h-full opacity-65">
              <defs>
                <linearGradient id="signal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="rgba(56,189,248,.15)"></stop>
                  <stop offset="45%" stop-color="rgba(59,130,246,.52)"></stop>
                  <stop offset="100%" stop-color="rgba(16,185,129,.15)"></stop>
                </linearGradient>
              </defs>
              <path d="M-20,420 C120,350 210,510 350,420 C470,345 560,510 820,360" stroke="url(#signal)" stroke-width="5" fill="none"></path>
              <path d="M-20,500 C140,430 250,575 390,492 C530,410 640,560 840,458" stroke="url(#signal)" stroke-width="3.5" fill="none"></path>
              <circle cx="170" cy="190" r="95" fill="none" stroke="rgba(56,189,248,.25)" stroke-width="1.5"></circle>
              <circle cx="170" cy="190" r="140" fill="none" stroke="rgba(56,189,248,.12)" stroke-width="1"></circle>
            </svg>
          </div>

          <div class="relative max-w-xl">
            <div class="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm backdrop-blur-sm">
              <mat-icon class="!text-[18px]">verified_user</mat-icon>
              <span>Himoyalangan klinik kirish muhiti</span>
            </div>
            <h1 class="mt-6 text-5xl leading-tight font-black tracking-tight">Chuqur tibbiy tahlilga<br>xavfsiz kirish maydoni</h1>
            <p class="mt-5 text-lg text-blue-100/95 max-w-lg">Signal, tahlil va klinik ehtimollarni birlashtiruvchi premium tibbiy AI platformasiga kirish uchun identifikatsiyadan o‘ting.</p>
            <div class="mt-6 space-y-2 text-sm text-blue-100/90">
              <p>• Klinik darajadagi vizual tahlil va ko‘p modal signal qatlamlari</p>
              <p>• Himoyalangan sessiya va nazorat qilinadigan kirish nuqtasi</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 max-w-xl">
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
              <p class="text-xs text-blue-100/80">Ishonch</p>
              <p class="text-xl font-bold mt-1">99%</p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
              <p class="text-xs text-blue-100/80">Nazorat</p>
              <p class="text-xl font-bold mt-1">Doimiy</p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
              <p class="text-xs text-blue-100/80">Muhit</p>
              <p class="text-xl font-bold mt-1">Himoyalangan</p>
            </div>
          </div>
        </section>

        <section class="flex items-center justify-center p-4 md:p-8 lg:p-10">
          <div class="w-full max-w-md bg-white/95 backdrop-blur-md p-7 md:p-9 rounded-[2rem] shadow-[0_20px_60px_rgba(15,23,42,.18)] border border-white/70 ring-1 ring-medical-border/70 relative overflow-hidden">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.09),transparent_42%)] pointer-events-none"></div>
            <div class="relative z-10">
              <div class="text-center mb-7">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-medical-primary to-indigo-700 rounded-2xl mb-4 shadow-lg shadow-medical-primary/25">
                  <mat-icon class="text-white text-4xl h-10 w-10">health_and_safety</mat-icon>
                </div>
                <h1 class="text-3xl font-extrabold text-medical-text tracking-tight">Abdulloh AI</h1>
                <p class="text-medical-text-muted mt-2 text-sm">Kirish orqali klinik tahlil maydoniga o‘tasiz</p>
              </div>

              <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4">
                <div>
                  <label for="email" class="block text-sm font-semibold text-medical-text mb-2">Email manzilingiz</label>
                  <div class="relative">
                    <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-medical-text-muted !text-[20px]">mail</mat-icon>
                    <input id="email" type="email" formControlName="email" class="w-full h-12 rounded-xl border border-medical-border bg-white pl-12 pr-4 text-medical-text placeholder:text-medical-text-muted/70 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-medical-primary/15 focus:border-medical-primary/60" placeholder="email@example.com">
                  </div>
                  @if (emailInvalid()) {
                    <p class="mt-2 text-xs text-red-600 font-medium">Email formatini to‘g‘ri kiriting.</p>
                  }
                </div>
                <div>
                  <label for="password" class="block text-sm font-semibold text-medical-text mb-2">Parol</label>
                  <div class="relative">
                    <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-medical-text-muted !text-[20px]">lock</mat-icon>
                    <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" class="w-full h-12 rounded-xl border border-medical-border bg-white pl-12 pr-12 text-medical-text placeholder:text-medical-text-muted/70 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-medical-primary/15 focus:border-medical-primary/60" placeholder="••••••••">
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text-muted hover:text-medical-primary transition-colors" (click)="togglePasswordVisibility()" [attr.aria-label]="showPassword() ? 'Parolni yashirish' : 'Parolni ko‘rsatish'">
                      <mat-icon class="!text-[20px]">{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                  @if (passwordInvalid()) {
                    <p class="mt-2 text-xs text-red-600 font-medium">Parol kamida 6 ta belgidan iborat bo‘lishi kerak.</p>
                  } @else {
                    <p class="mt-2 text-xs text-medical-text-muted/80">Kamida 6 ta belgi tavsiya etiladi.</p>
                  }
                </div>

                @if (!supabase.isConfigured()) {
                  <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm font-medium">
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-sm h-4 w-4">info</mat-icon>
                      <span>Demo rejimi faol</span>
                    </div>
                    <p class="text-xs opacity-80">Supabase sozlanmagan. Ma'lumotlar brauzer xotirasida saqlanadi.</p>
                  </div>
                }

                @if (error()) {
                  <div class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-start gap-2">
                    <mat-icon class="text-sm h-4 w-4">error_outline</mat-icon>
                    {{ error() }}
                  </div>
                }

                <button type="submit" [disabled]="loading()" class="w-full h-12 rounded-xl bg-gradient-to-r from-medical-primary to-indigo-700 text-white font-semibold shadow-lg shadow-medical-primary/25 hover:shadow-xl hover:shadow-medical-primary/35 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-1">
                  @if (!loading()) {
                    <span>{{ supabase.isConfigured() ? authButtonText : 'Demo rejimida kirish' }}</span>
                  }
                  @if (loading()) {
                    <mat-icon class="animate-spin">sync</mat-icon>
                  }
                </button>
              </form>

              <div class="mt-6 text-center">
                <button (click)="toggleMode()" class="text-medical-primary hover:text-indigo-700 font-bold text-sm transition-colors underline-offset-4 hover:underline">
                  {{ isLogin() ? 'Yangi hisob ochish' : 'Hisobingiz bormi? Kirish' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="lg:hidden relative z-10 px-5 pb-2 pt-20 text-white">
        <h2 class="text-2xl font-black">Chuqur tibbiy tahlilga himoyalangan kirish</h2>
        <p class="mt-2 text-sm text-blue-100/90">Kirish oynasi orqali premium klinik AI maydoniga ulanasiz.</p>
      </div>
    </div>
  `,
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
  emailInvalid = computed(() => {
    const control = this.authForm.controls.email;
    return control.touched && control.invalid;
  });
  passwordInvalid = computed(() => {
    const control = this.authForm.controls.password;
    return control.touched && control.invalid;
  });

  get authButtonText() {
    return this.isLogin() ? 'Kirish' : "Ro'yxatdan o'tish";
  }

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

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
