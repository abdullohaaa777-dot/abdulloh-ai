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
    <div class="min-h-screen flex items-center justify-center p-4 bg-medical-bg relative overflow-hidden">
      <!-- Decorative background elements -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-medical-primary/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-medical-secondary/5 rounded-full blur-3xl"></div>

      <div class="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-medical-border relative z-10">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-medical-primary rounded-2xl mb-6 shadow-lg shadow-medical-primary/20">
            <mat-icon class="text-white text-5xl h-12 w-12">health_and_safety</mat-icon>
          </div>
          <h1 class="text-4xl font-extrabold text-medical-text tracking-tight">Abdulloh AI</h1>
          <p class="text-medical-text-muted mt-3 font-medium">Klinik qaror qabul qilish tizimi</p>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-semibold text-medical-text mb-2">Email manzilingiz</label>
            <input id="email" type="email" formControlName="email" class="w-full input-field" placeholder="email@example.com">
          </div>
          <div>
            <label for="password" class="block text-sm font-semibold text-medical-text mb-2">Parol</label>
            <input id="password" type="password" formControlName="password" class="w-full input-field" placeholder="••••••••">
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
            <div class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <mat-icon class="text-sm h-4 w-4">error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="loading()" class="w-full btn-primary py-3 text-lg mt-2">
            @if (!loading()) {
              <span>{{ supabase.isConfigured() ? authButtonText : 'Demo rejimida kirish' }}</span>
            }
            @if (loading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
            }
          </button>
        </form>

        <div class="mt-8 text-center">
          <button (click)="toggleMode()" class="text-medical-primary hover:text-indigo-700 font-bold text-sm transition-colors">
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

  get authButtonText() {
    return this.isLogin() ? 'Kirish' : "Ro'yxatdan o'tish";
  }

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
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
      this.router.navigate(['/app/dashboard']);
    }
    this.loading.set(false);
  }
}
