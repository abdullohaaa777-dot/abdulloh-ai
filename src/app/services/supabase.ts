import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { CaseData } from './ai';
import { OrganBioelectricResult } from '../models/organ-bioelectric';
import { HomeostasisResult } from '../models/homeostasis';

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


  async saveHomeostasisResult(result: HomeostasisResult, patientId?: string | null) {
    const userId = this.user()?.id ?? 'demo-user';
    const payload = {
      user_id: userId,
      patient_id: patientId ?? null,
      input_data: result.inputData,
      calculated_scores: result.calculatedScores,
      ai_analysis: JSON.stringify(result.aiAnalysis),
      trend_status: result.trendStatus,
      risk_level: result.riskLevel,
      five_year_projection: result.fiveYearProjection,
      ten_year_projection: result.tenYearProjection,
      organ_interaction_map: result.organInteractionMap,
      recommendations: result.recommendations
    };

    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const results = JSON.parse(localStorage.getItem('demo-homeostasis-results') || '[]');
      const newResult = { ...result, ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      results.unshift(newResult);
      localStorage.setItem('demo-homeostasis-results', JSON.stringify(results));
      return { data: newResult, error: null };
    }

    const { data, error } = await this.supabase
      .from('homeostasis_results')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  }

  async getHomeostasisResults() {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: [], error: null };
      const results = JSON.parse(localStorage.getItem('demo-homeostasis-results') || '[]');
      return { data: results, error: null };
    }

    const { data, error } = await this.supabase
      .from('homeostasis_results')
      .select('*')
      .order('created_at', { ascending: false });
    const mapped = data?.map((row: Record<string, unknown>) => ({
      inputData: row['input_data'],
      calculatedScores: row['calculated_scores'],
      aiAnalysis: typeof row['ai_analysis'] === 'string' ? JSON.parse(row['ai_analysis']) : row['ai_analysis'],
      trendStatus: row['trend_status'],
      riskLevel: row['risk_level'],
      fiveYearProjection: row['five_year_projection'],
      tenYearProjection: row['ten_year_projection'],
      organInteractionMap: row['organ_interaction_map'],
      recommendations: row['recommendations'],
      createdAt: row['created_at']
    }));
    return { data: mapped, error };
  }


  async saveOrganBioelectricResult(result: OrganBioelectricResult, patientId?: string | null) {
    const userId = this.user()?.id ?? 'demo-user';
    const payload = {
      patient_id: patientId ?? null,
      doctor_id: userId,
      user_id: userId,
      overall_index: result.overallIndex,
      organ_scores: result.organScores,
      internal_indexes: result.internalIndexes,
      network_edges: result.networkEdges,
      top_problems: result.topProblems,
      ai_summary: result.aiSummaryUz,
      recommendations: result.recommendationsUz,
      raw_test_summary: result.rawTestSummary,
      confidence_level: result.confidence,
      disclaimer_shown: result.disclaimerShown
    };

    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: { message: 'Browser only' } };
      const results = JSON.parse(localStorage.getItem('demo-organ-bioelectric-results') || '[]');
      const newResult = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      results.unshift(newResult);
      localStorage.setItem('demo-organ-bioelectric-results', JSON.stringify(results));
      return { data: newResult, error: null };
    }

    const { data, error } = await this.supabase
      .from('organ_bioelectric_results')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  }

  async getLatestOrganBioelectricResult() {
    if (this.isDemoMode) {
      if (!this.isBrowser()) return { data: null, error: null };
      const results = JSON.parse(localStorage.getItem('demo-organ-bioelectric-results') || '[]');
      return { data: results[0] ?? null, error: null };
    }

    const { data, error } = await this.supabase
      .from('organ_bioelectric_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
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
