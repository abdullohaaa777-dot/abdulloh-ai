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
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-medical-bg relative overflow-hidden">
      <!-- Decorative background elements -->
      <div class="auth-orb absolute top-[-12%] left-[-12%] w-[42%] h-[42%] bg-medical-primary/10 rounded-full blur-3xl"></div>
      <div class="auth-orb absolute bottom-[-15%] right-[-12%] w-[44%] h-[44%] bg-medical-secondary/10 rounded-full blur-3xl" style="animation-delay: -3s"></div>
      <div class="auth-grid pointer-events-none absolute inset-0 opacity-35"></div>

      <div class="w-full max-w-md auth-panel p-6 sm:p-10 rounded-3xl relative z-10">
        <div class="text-center mb-8 sm:mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-medical-primary to-indigo-500 rounded-2xl mb-6 shadow-[0_18px_34px_-18px_rgba(79,70,229,0.9)]">
            <mat-icon class="text-white text-5xl h-12 w-12">health_and_safety</mat-icon>
          </div>
          <h1 class="text-4xl font-extrabold text-medical-text tracking-tight">Abdulloh AI</h1>
          <p class="text-medical-text-muted mt-2 font-medium">Klinik qaror qabul qilish tizimi</p>
          <p class="text-xs text-medical-primary/70 font-semibold tracking-[0.18em] uppercase mt-3">Secure Clinical Access</p>
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

          <button type="submit" [disabled]="loading()" class="w-full btn-primary py-3.5 text-base sm:text-lg mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
            @if (!loading()) {
              <span>{{ supabase.isConfigured() ? authButtonText : 'Demo rejimida kirish' }}</span>
            }
            @if (loading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
            }
          </button>
        </form>

        <div class="mt-8 text-center border-t border-medical-border/70 pt-6">
          <button (click)="toggleMode()" class="text-medical-primary hover:text-indigo-700 font-bold text-sm transition-colors hover:underline underline-offset-4">
            {{ isLogin() ? 'Yangi hisob ochish' : 'Hisobingiz bormi? Kirish' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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

    @media (max-width: 640px) {
      .auth-panel {
        border-radius: 1.5rem;
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
