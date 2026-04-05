import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { CaseData } from './ai';
import { DermatologyCase } from '../models/dermatology';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private _supabase: SupabaseClient | null = null;
  user = signal<User | null>(null);
  private platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    if (!this.isBrowser()) return;

    try {
      if (this.isConfigured()) {
        this.supabase.auth.onAuthStateChange((event, session) => {
          this.user.set(session?.user ?? null);
        });
      } else {
        // Check for demo user in localStorage
        const demoUser = localStorage.getItem('demo-user');
        if (demoUser) {
          this.user.set(JSON.parse(demoUser));
        }
      }
    } catch (e) {
      console.error('Supabase initialization failed:', e);
    }
  }

  public isConfigured(): boolean {
    return !!(typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && SUPABASE_URL.startsWith('http'));
  }

  private get isDemoMode(): boolean {
    return !this.isConfigured();
  }

  private get supabase(): SupabaseClient {
    if (!this._supabase) {
      if (this.isDemoMode) {
        // Return a proxy or dummy client to avoid crashes, 
        // but we'll handle demo mode logic in methods
        return {} as unknown as SupabaseClient;
      }
      this._supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return this._supabase;
  }

  get client() {
    return this.supabase;
  }

  async signUp(email: string, password: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: { user: null }, error: null };
      const mockUser = { id: 'demo-user', email } as User;
      this.user.set(mockUser);
      localStorage.setItem('demo-user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }
    return await this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: { user: null }, error: null };
      const mockUser = { id: 'demo-user', email } as User;
      this.user.set(mockUser);
      localStorage.setItem('demo-user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    if (this.isDemoMode) {
      this.user.set(null);
      if (this.isBrowser()) {
        localStorage.removeItem('demo-user');
      }
      return { error: null };
    }
    return await this.supabase.auth.signOut();
  }

  async getCases() {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: [], error: null };
      const cases = JSON.parse(localStorage.getItem('demo-cases') || '[]');
      return { data: cases, error: null };
    }
    const { data, error } = await this.supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async createCase(caseData: Partial<CaseData>) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('demo-cases') || '[]');
      const newCase = { 
        ...caseData, 
        id: crypto.randomUUID(), 
        created_at: new Date().toISOString(),
        user_id: 'demo-user' 
      };
      cases.push(newCase);
      localStorage.setItem('demo-cases', JSON.stringify(cases));
      return { data: newCase, error: null };
    }
    const { data, error } = await this.supabase
      .from('cases')
      .insert([{ ...caseData, user_id: this.user()?.id }])
      .select()
      .single();
    return { data, error };
  }

  async updateCase(id: string, caseData: Partial<CaseData>) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('demo-cases') || '[]');
      const index = cases.findIndex((c: CaseData) => c.id === id);
      if (index === -1) return { data: null, error: { message: 'Not found' } };
      
      cases[index] = { ...cases[index], ...caseData };
      localStorage.setItem('demo-cases', JSON.stringify(cases));
      return { data: cases[index], error: null };
    }
    const { data, error } = await this.supabase
      .from('cases')
      .update(caseData)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }

  async getCaseById(id: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('demo-cases') || '[]');
      const foundCase = cases.find((c: CaseData) => c.id === id);
      if (!foundCase) return { data: null, error: { message: 'Not found' } };
      
      const uploads = JSON.parse(localStorage.getItem(`demo-uploads-${id}`) || '[]');
      const chats = JSON.parse(localStorage.getItem(`demo-chats-${id}`) || '[]');
      
      return { data: { ...foundCase, uploads, chats }, error: null };
    }
    const { data, error } = await this.supabase
      .from('cases')
      .select('*, uploads(*), chats(*)')
      .eq('id', id)
      .single();
    return { data, error };
  }

  async uploadFile(caseId: string, file: File) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const uploads = JSON.parse(localStorage.getItem(`demo-uploads-${caseId}`) || '[]');
      const newUpload = { 
        id: crypto.randomUUID(), 
        case_id: caseId, 
        file_path: URL.createObjectURL(file),
        file_name: file.name,
        created_at: new Date().toISOString()
      };
      uploads.push(newUpload);
      localStorage.setItem(`demo-uploads-${caseId}`, JSON.stringify(uploads));
      return { data: newUpload, error: null };
    }
    const filePath = `${this.user()?.id}/${caseId}/${Date.now()}_${file.name}`;
    const { data, error: uploadError } = await this.supabase.storage
      .from('medical-uploads')
      .upload(filePath, file);

    if (uploadError) return { error: uploadError };

    const { error: dbError } = await this.supabase
      .from('uploads')
      .insert([{ case_id: caseId, file_path: filePath }]);

    return { data, error: dbError };
  }

  async addChatMessage(caseId: string, role: string, message: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const chats = JSON.parse(localStorage.getItem(`demo-chats-${caseId}`) || '[]');
      const newChat = { 
        id: crypto.randomUUID(), 
        case_id: caseId, 
        role, 
        message,
        created_at: new Date().toISOString()
      };
      chats.push(newChat);
      localStorage.setItem(`demo-chats-${caseId}`, JSON.stringify(chats));
      return { data: newChat, error: null };
    }
    const { data, error } = await this.supabase
      .from('chats')
      .insert([{ case_id: caseId, role, message }])
      .select()
      .single();
    return { data, error };
  }

  async getDermatologyCases() {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: [], error: null };
      const cases = JSON.parse(localStorage.getItem('dermatologyCases') || '[]');
      return { data: cases as DermatologyCase[], error: null };
    }
    const { data, error } = await this.supabase
      .from('dermatology_cases')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data as DermatologyCase[], error };
  }

  async createDermatologyCase(caseData: Partial<DermatologyCase>) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('dermatologyCases') || '[]');
      const newCase = { ...caseData, user_id: this.user()?.id || 'demo-user' };
      cases.push(newCase);
      localStorage.setItem('dermatologyCases', JSON.stringify(cases));
      return { data: newCase as DermatologyCase, error: null };
    }
    const { data, error } = await this.supabase
      .from('dermatology_cases')
      .insert([{ ...caseData, user_id: this.user()?.id }])
      .select()
      .single();
    return { data: data as DermatologyCase, error };
  }

  async updateDermatologyCase(id: string, caseData: Partial<DermatologyCase>) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('dermatologyCases') || '[]');
      const index = cases.findIndex((c: DermatologyCase) => c.id === id);
      if (index === -1) return { data: null, error: { message: 'Not found' } };
      cases[index] = { ...cases[index], ...caseData };
      localStorage.setItem('dermatologyCases', JSON.stringify(cases));
      return { data: cases[index] as DermatologyCase, error: null };
    }
    const { data, error } = await this.supabase
      .from('dermatology_cases')
      .update(caseData)
      .eq('id', id)
      .select()
      .single();
    return { data: data as DermatologyCase, error };
  }

  async deleteDermatologyCase(id: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('dermatologyCases') || '[]');
      const filteredCases = cases.filter((c: DermatologyCase) => c.id !== id);
      localStorage.setItem('dermatologyCases', JSON.stringify(filteredCases));
      return { error: null };
    }
    const { error } = await this.supabase
      .from('dermatology_cases')
      .delete()
      .eq('id', id);
    return { error };
  }

  async deleteCase(id: string) {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { error: { message: 'Browser only' } };
      const cases = JSON.parse(localStorage.getItem('demo-cases') || '[]');
      const filteredCases = cases.filter((c: CaseData) => c.id !== id);
      localStorage.setItem('demo-cases', JSON.stringify(filteredCases));
      
      // Clean up associated data
      localStorage.removeItem(`demo-uploads-${id}`);
      localStorage.removeItem(`demo-chats-${id}`);
      
      return { error: null };
    }

    // Delete related records first if cascade is not set up
    await this.supabase.from('chats').delete().eq('case_id', id);
    await this.supabase.from('uploads').delete().eq('case_id', id);

    // Delete files from storage
    const { data: files } = await this.supabase.storage.from('medical-docs').list(id);
    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${id}/${f.name}`);
      await this.supabase.storage.from('medical-docs').remove(filesToDelete);
    }

    const { error } = await this.supabase
      .from('cases')
      .delete()
      .eq('id', id);
    return { error };
  }
}
