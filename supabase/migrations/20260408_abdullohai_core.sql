-- Abdulloh AI core clinical schema with RLS, RBAC helpers, and audit logs
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','doctor','admin')),
  full_name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  date_of_birth date,
  sex text check (sex in ('male','female','other')),
  weight numeric,
  height numeric,
  transplant_status boolean default false,
  transplant_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  created_by uuid not null references profiles(id),
  case_type text not null,
  status text not null default 'new',
  chief_complaint text,
  symptoms jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  heart_rate numeric, systolic_bp numeric, diastolic_bp numeric, temperature numeric, respiratory_rate numeric, spo2 numeric, weight numeric, urine_output numeric,
  created_at timestamptz not null default now()
);

create table if not exists labs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  wbc numeric, neutrophils numeric, lymphocytes numeric, nlr numeric, crp numeric, esr numeric, creatinine numeric, egfr numeric, urea numeric, albumin numeric,
  alt numeric, ast numeric, platelets numeric, glucose numeric, lactate numeric, proteinuria numeric, hematuria numeric, leukocytes_urine numeric,
  nitrite_urine numeric, ketones_urine numeric, acr numeric,
  created_at timestamptz not null default now()
);

create table if not exists transplant_profiles (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  transplant_type text,
  transplant_date date,
  donor_type text,
  donor_relation text,
  immunosuppressants jsonb default '[]'::jsonb,
  tacrolimus_level numeric,
  cyclosporine_level numeric,
  dsa_status text,
  dd_cfdna numeric,
  dd_exodna numeric,
  biopsy_history jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists urine_vision_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  image_path text not null,
  calibration_card_detected boolean default false,
  quality_score numeric,
  color_class text,
  turbidity_class text,
  visible_blood_suspicion text,
  foam_suspicion text,
  hydration_signal text,
  explanation jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists urine_strip_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  image_path text not null,
  calibration_card_detected boolean default false,
  strip_type text,
  timing_valid boolean,
  quality_score numeric,
  protein_result text, blood_result text, glucose_result text, ketone_result text, nitrite_result text, leukocyte_result text, ph_result text, sg_result text,
  bilirubin_result text, urobilinogen_result text, acr_estimate numeric,
  explanation jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists transplant_twin_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  model_version text not null,
  graft_reserve_score numeric, inflammatory_reserve_score numeric, microvascular_reserve_score numeric, metabolic_reserve_score numeric, recovery_reserve_score numeric,
  immune_quietness_index numeric, silent_rejection_risk numeric, drug_toxicity_suspicion numeric, infection_overlap_suspicion numeric, hemodynamic_stress_score numeric,
  likely_mechanism text, next_best_test text, urgency_level text, confidence_band text, rationale_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists monitoring_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  bp text, weight numeric, urine_output numeric, temperature numeric, medication_taken boolean, medication_notes text, symptoms jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists counterfactual_simulations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  scenario_name text not null,
  input_delta jsonb not null,
  output_delta jsonb not null,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists clinical_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  author_id uuid not null references profiles(id),
  comment text not null,
  visibility text not null default 'team',
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function is_admin(uid uuid) returns boolean language sql stable as $$
  select exists(select 1 from profiles p where p.id = uid and p.role = 'admin');
$$;

create or replace function can_access_case(uid uuid, case_uuid uuid) returns boolean language sql stable as $$
  select exists(
    select 1 from cases c
    join patients p on p.id = c.patient_id
    join profiles prof on prof.id = uid
    where c.id = case_uuid and (p.profile_id = uid or prof.role in ('doctor','admin'))
  );
$$;

create or replace function write_audit() returns trigger language plpgsql as $$
begin
  insert into audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), tg_op, tg_table_name, coalesce(new.id::text, old.id::text), jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old)));
  return coalesce(new, old);
end $$;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_patients_updated before update on patients for each row execute function set_updated_at();
create trigger trg_cases_updated before update on cases for each row execute function set_updated_at();
create trigger trg_tp_updated before update on transplant_profiles for each row execute function set_updated_at();
create trigger trg_config_updated before update on app_config for each row execute function set_updated_at();

create trigger audit_cases after insert or update or delete on cases for each row execute function write_audit();
create trigger audit_labs after insert or update or delete on labs for each row execute function write_audit();
create trigger audit_vitals after insert or update or delete on vitals for each row execute function write_audit();
create trigger audit_twin after insert or update or delete on transplant_twin_results for each row execute function write_audit();

alter table profiles enable row level security;
alter table patients enable row level security;
alter table cases enable row level security;
alter table vitals enable row level security;
alter table labs enable row level security;
alter table transplant_profiles enable row level security;
alter table urine_vision_records enable row level security;
alter table urine_strip_records enable row level security;
alter table transplant_twin_results enable row level security;
alter table monitoring_logs enable row level security;
alter table counterfactual_simulations enable row level security;
alter table clinical_comments enable row level security;
alter table audit_logs enable row level security;
alter table app_config enable row level security;

create policy profile_self on profiles for all using (id = auth.uid() or is_admin(auth.uid())) with check (id = auth.uid() or is_admin(auth.uid()));
create policy patients_access on patients for all using (profile_id = auth.uid() or is_admin(auth.uid())) with check (profile_id = auth.uid() or is_admin(auth.uid()));
create policy case_access on cases for all using (can_access_case(auth.uid(), id)) with check (can_access_case(auth.uid(), id));
create policy vitals_access on vitals for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy labs_access on labs for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy tp_access on transplant_profiles for all using (
  exists(select 1 from patients p where p.id = patient_id and (p.profile_id = auth.uid() or is_admin(auth.uid())))
) with check (
  exists(select 1 from patients p where p.id = patient_id and (p.profile_id = auth.uid() or is_admin(auth.uid())))
);
create policy uv_access on urine_vision_records for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy us_access on urine_strip_records for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy twin_access on transplant_twin_results for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy mon_access on monitoring_logs for all using (
  exists(select 1 from patients p join profiles pr on pr.id = auth.uid() where p.id = patient_id and (p.profile_id = auth.uid() or pr.role in ('doctor','admin')))
) with check (
  exists(select 1 from patients p where p.id = patient_id and p.profile_id = auth.uid())
);
create policy cf_access on counterfactual_simulations for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy cc_access on clinical_comments for all using (can_access_case(auth.uid(), case_id)) with check (can_access_case(auth.uid(), case_id));
create policy audit_admin on audit_logs for select using (is_admin(auth.uid()));
create policy config_admin on app_config for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
