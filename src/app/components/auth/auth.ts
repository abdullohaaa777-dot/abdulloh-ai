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
    <div class="min-h-screen flex items-center justify-center p-4 md:p-8 bg-medical-bg relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,.08),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,.08),transparent_32%)]"></div>
      <div class="absolute top-[-12%] left-[-12%] w-[42%] h-[42%] bg-medical-primary/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-[-12%] right-[-12%] w-[42%] h-[42%] bg-medical-secondary/10 rounded-full blur-3xl"></div>

      <div class="w-full max-w-md bg-white/95 backdrop-blur-sm p-7 md:p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(15,23,42,.12)] border border-white/60 ring-1 ring-medical-border/70 relative z-10">
        <div class="text-center mb-8 md:mb-9">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-medical-primary to-indigo-700 rounded-3xl mb-5 shadow-xl shadow-medical-primary/25">
            <mat-icon class="text-white text-5xl h-12 w-12">health_and_safety</mat-icon>
          </div>
          <h1 class="text-4xl font-extrabold text-medical-text tracking-tight">Abdulloh AI</h1>
          <p class="text-medical-text-muted mt-2 font-medium">Klinik qaror qabul qilish tizimi</p>
          <p class="text-xs text-medical-text-muted/80 mt-1">Himoyalangan autentifikatsiya oynasi</p>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4 md:space-y-5">
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
            <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm font-medium mb-6">
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

          <button type="submit" [disabled]="loading()" class="w-full h-12 rounded-xl bg-gradient-to-r from-medical-primary to-indigo-700 text-white font-semibold shadow-lg shadow-medical-primary/20 hover:shadow-xl hover:shadow-medical-primary/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
            @if (!loading()) {
              <span>{{ supabase.isConfigured() ? authButtonText : 'Demo rejimida kirish' }}</span>
            }
            @if (loading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
            }
          </button>
        </form>

        <div class="mt-7 text-center">
          <button (click)="toggleMode()" class="text-medical-primary hover:text-indigo-700 font-bold text-sm transition-colors underline-offset-4 hover:underline">
            {{ isLogin() ? 'Yangi hisob ochish' : 'Hisobingiz bormi? Kirish' }}
          </button>
        </div>
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
