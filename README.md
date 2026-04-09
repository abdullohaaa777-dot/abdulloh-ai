# Abdulloh AI

Abdulloh AI — transplant bemorlar monitoringi, siydik (basic + strip) tahlili, explainable klinik risk baholash va auditga tayyor qaror qo‘llab-quvvatlash platformasi.

## Stack
- Angular 21 (SSR + prerender public routes)
- Supabase (Auth, Postgres, Storage, RLS)
- Vercel deployment
- Rule-based transparent clinical engines (V1)

## Local setup
1. `npm install`
2. `.env` faylini `.env.example` asosida to‘ldiring:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - (`GEMINI_API_KEY` ixtiyoriy)
3. Development: `npm run dev`
4. Build: `npm run build`

## Test
- Core clinical engines: `npm run test:unit`

## Supabase setup
- Migration: `supabase/migrations/20260408_abdullohai_core.sql`
- RLS, audit triggerlar, app_config va asosiy klinik jadvallar shu faylda.

## Public routes
`/`, `/about`, `/features`, `/transplant`, `/urine-analysis`, `/privacy`, `/terms`, `/contact`

## Protected routes
`/login`, `/register`, `/dashboard`, `/cases`, `/cases/new`, `/cases/:id`, `/urine/basic`, `/urine/strip`, `/transplant/twin`, `/monitoring`, `/admin`

## Clinical safety disclaimers
- Tizim mustaqil tashxis qo‘ymaydi.
- Shifokorni almashtirmaydi.
- Plain urine photo faqat makroskopik screening.
- Strip analysis semi-quantitative.
- Transplant twin: risk/explanation/support engine.

## Docs
- `docs/architecture.md`
- `docs/database.md`
- `docs/urine-analysis.md`
- `docs/transplant-twin.md`
- `docs/security.md`
- `docs/deployment.md`
