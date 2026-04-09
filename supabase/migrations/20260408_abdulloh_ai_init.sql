-- Abdulloh AI baseline schema with RLS and audit support
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','doctor','admin')) default 'patient',
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date_of_birth date,
  sex text,
  weight numeric,
  height numeric,
  transplant_status boolean default false,
  transplant_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  case_type text not null,
  status text not null default 'new',
  chief_complaint text not null,
  symptoms jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.vitals (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, heart_rate numeric, systolic_bp numeric, diastolic_bp numeric, temperature numeric, respiratory_rate numeric, spo2 numeric, weight numeric, urine_output numeric, created_at timestamptz default now());
create table if not exists public.labs (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, wbc numeric, neutrophils numeric, lymphocytes numeric, nlr numeric, crp numeric, esr numeric, creatinine numeric, egfr numeric, urea numeric, albumin numeric, alt numeric, ast numeric, platelets numeric, glucose numeric, lactate numeric, proteinuria numeric, hematuria numeric, leukocytes_urine numeric, nitrite_urine numeric, ketones_urine numeric, acr numeric, created_at timestamptz default now());
create table if not exists public.transplant_profiles (id uuid primary key default gen_random_uuid(), patient_id uuid references public.patients(id) on delete cascade, transplant_type text, transplant_date date, donor_type text, donor_relation text, immunosuppressants jsonb default '[]'::jsonb, tacrolimus_level numeric, cyclosporine_level numeric, dsa_status text, dd_cfdna numeric, dd_exodna numeric, biopsy_history jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.urine_vision_records (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, image_path text, calibration_card_detected boolean, quality_score numeric, color_class text, turbidity_class text, visible_blood_suspicion boolean, foam_suspicion boolean, hydration_signal text, explanation jsonb, created_at timestamptz default now());
create table if not exists public.urine_strip_records (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, image_path text, calibration_card_detected boolean, strip_type text, timing_valid boolean, quality_score numeric, protein_result text, blood_result text, glucose_result text, ketone_result text, nitrite_result text, leukocyte_result text, ph_result text, sg_result text, bilirubin_result text, urobilinogen_result text, acr_estimate numeric, explanation jsonb, created_at timestamptz default now());
create table if not exists public.transplant_twin_results (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, model_version text, graft_reserve_score numeric, inflammatory_reserve_score numeric, microvascular_reserve_score numeric, metabolic_reserve_score numeric, recovery_reserve_score numeric, immune_quietness_index numeric, silent_rejection_risk numeric, drug_toxicity_suspicion numeric, infection_overlap_suspicion numeric, hemodynamic_stress_score numeric, likely_mechanism text, next_best_test text, urgency_level text, confidence_band text, rationale_json jsonb, created_at timestamptz default now());
create table if not exists public.monitoring_logs (id uuid primary key default gen_random_uuid(), patient_id uuid references public.patients(id) on delete cascade, bp text, weight numeric, urine_output numeric, temperature numeric, medication_taken boolean, medication_notes text, symptoms jsonb default '[]'::jsonb, created_at timestamptz default now());
create table if not exists public.counterfactual_simulations (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, scenario_name text, input_delta jsonb, output_delta jsonb, explanation text, created_at timestamptz default now());
create table if not exists public.clinical_comments (id uuid primary key default gen_random_uuid(), case_id uuid references public.cases(id) on delete cascade, author_id uuid references public.profiles(id), comment text not null, visibility text not null default 'care_team', created_at timestamptz default now());
create table if not exists public.audit_logs (id bigserial primary key, actor_id uuid, action text not null, entity_type text not null, entity_id text not null, metadata jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.app_config (id uuid primary key default gen_random_uuid(), key text not null unique, value jsonb not null, updated_at timestamptz default now());

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.cases enable row level security;
alter table public.audit_logs enable row level security;

create policy if not exists profiles_self on public.profiles for select using (id = auth.uid());
create policy if not exists patients_own on public.patients for select using (profile_id = auth.uid());
create policy if not exists cases_patient_doctor on public.cases for select using (
  created_by = auth.uid() or exists (select 1 from public.patients p where p.id = patient_id and p.profile_id = auth.uid())
);
create policy if not exists audit_admin_only on public.audit_logs for select using (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.audit_trigger() returns trigger language plpgsql as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id)::text, jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old)));
  return coalesce(new, old);
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases for each row execute function public.touch_updated_at();
drop trigger if exists cases_audit on public.cases;
create trigger cases_audit after insert or update or delete on public.cases for each row execute function public.audit_trigger();
