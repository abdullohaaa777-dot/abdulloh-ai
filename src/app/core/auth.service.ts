import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppRole, Profile } from '../models/clinical.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private client: SupabaseClient | null = null;
  readonly user = signal<Profile | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('abdulloh-user');
      if (cached) this.user.set(JSON.parse(cached) as Profile);
    }

    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  async register(email: string, password: string, fullName: string, role: AppRole) {
    if (!this.client) {
      return this.persistMock({ id: crypto.randomUUID(), email, fullName, role });
    }

    const authRes = await this.client.auth.signUp({ email, password });
    if (authRes.error || !authRes.data.user) return { error: authRes.error?.message ?? 'Register xatosi' };
    await this.client.from('profiles').upsert({ id: authRes.data.user.id, email, full_name: fullName, role });
    return this.persistMock({ id: authRes.data.user.id, email, fullName, role });
  }

  async login(email: string, password: string) {
    if (!this.client) {
      const demo = { id: 'demo', email, fullName: 'Demo User', role: 'admin' as AppRole };
      return this.persistMock(demo);
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.message ?? 'Login xatosi' };
    const { data: profile } = await this.client.from('profiles').select('*').eq('id', data.user.id).single();
    return this.persistMock({
      id: data.user.id,
      email: data.user.email ?? email,
      fullName: profile?.full_name ?? 'User',
      role: profile?.role ?? 'patient'
    });
  }

  logout() {
    this.user.set(null);
    if (typeof window !== 'undefined') localStorage.removeItem('abdulloh-user');
  }

  private persistMock(profile: Profile) {
    this.user.set(profile);
    if (typeof window !== 'undefined') localStorage.setItem('abdulloh-user', JSON.stringify(profile));
    return { error: null };
  }
}
