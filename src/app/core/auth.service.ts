import { Injectable, computed, signal } from '@angular/core';
import { AppUser, UserRole } from '../models';

const KEY = 'abdulloh-ai-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<AppUser | null>(this.restore());
  readonly user = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  login(email: string, password: string, role: UserRole): { ok: boolean; message?: string } {
    if (!email || !password) return { ok: false, message: 'Email va parol kerak.' };
    const user: AppUser = {
      id: crypto.randomUUID(),
      email,
      role,
      fullName: email.split('@')[0].replace('.', ' ')
    };
    this.currentUserSignal.set(user);
    localStorage.setItem(KEY, JSON.stringify(user));
    return { ok: true };
  }

  register(fullName: string, email: string, password: string): { ok: boolean; message?: string } {
    if (!fullName || !email || password.length < 8) {
      return { ok: false, message: 'To‘liq ism, email va kamida 8 belgili parol kiriting.' };
    }
    return this.login(email, password, 'patient');
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(KEY);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserSignal();
    return !!user && roles.includes(user.role);
  }

  private restore(): AppUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  }
}
