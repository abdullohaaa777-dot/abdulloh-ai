# Abdulloh AI

Abdulloh AI — transplant-focused clinical decision support platformasi. Tizim tashxis qo‘ymaydi; risk, signal, monitoring va keyingi test tavsiyalarini tushuntiriladigan shaklda beradi.

## Stack
- Angular 21 (SSR-ready)
- TypeScript strict
- Supabase (Auth/Postgres/Storage) schema va migrationlar
- Vercel deploy moslamalari
- PWA (`manifest.webmanifest` + `sw.js`)

## Setup
```bash
npm install
npm run dev
```

## Environment variables
`.env.example` asosida:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Asosiy route'lar
Public: `/`, `/about`, `/features`, `/transplant`, `/urine-analysis`, `/privacy`, `/terms`, `/contact`

Protected: `/login`, `/register`, `/dashboard`, `/cases`, `/cases/new`, `/cases/:id`, `/urine/basic`, `/urine/strip`, `/transplant/twin`, `/monitoring`, `/admin`

## Database
`supabase/migrations/20260408_abdulloh_ai_init.sql` da:
- 14 ta asosiy jadval
- RLS policylar
- audit trigger
- updated_at trigger

## Testlar
```bash
npm run build
npx vitest run src/app/core/clinical-engine.service.spec.ts
```

## Scientific limitations
- Plain urine image → faqat makroskopik screening
- Strip result → semi-quantitative
- Transplant twin → risk/explanation engine, definitive diagnosis emas
