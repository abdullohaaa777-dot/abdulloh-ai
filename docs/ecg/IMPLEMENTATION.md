# AI EKG Assistant Pro — research foundation

This branch is a partial implementation, not completion of the full clinical specification.
Existing Gemini features and authentication are retained. No production deployment or remote migration has been performed.

## Available
- `/ecg`: Uzbek CSV upload, history, per-lead signal viewer, time zoom/pan, explicit missing leads and limitations.
- CSV: unique standard lead headers, numeric mV samples, explicit integer 100–2000 Hz sampling rate, 5–60 seconds. Browser limit 3 MiB; server JSON 4 MiB.
- Research-only peak candidates and RR/HR; flat signals abstain. No diagnostic classification or calibrated confidence claims.
- Authenticated Express API shared between Angular Node SSR and Vercel Node function.
- Additive owner-only Supabase studies, no client writes, server-side JWT validation and explicit ownership queries.
- Durable per-user hourly upload quota, single Claude attempt per study and immutable unreviewed status.
- Optional Claude explanation of limitations only. It is intentionally not clinical interpretation. Live model lookup verifies the configured ID. Strict output keys, evidence IDs, length and numeric-claim rejection; text is Angular escaped.

## Configuration and staging
1. Review and apply `supabase/migrations/202610200001_ecg.sql` to staging Supabase. Existing SQL schema is unaffected. Do not apply to production without reviewing retention and permissions.
2. Set server runtime `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`. Secrets must never enter Angular defines or public variables. Choose an actual available Claude model; no default is assumed.
3. Set `ECG_ENABLED=true` only in a controlled staging environment. Default false. Existing Vercel Gemini variables remain unchanged. Existing frontend Gemini key exposure identified in audit remains outside this module.
4. Build with `npm run build`; Node SSR uses `npm run serve:ssr:app`. Vercel API entry is `api/ecg.ts`, with the API rewrite before the SPA fallback. Actual Vercel routing must be verified in preview deployment; it has not been remotely tested.
5. Sign in using real Supabase authentication; demo users cannot use ECG API. Upload calibrated CSV and verify database ownership with a second user.
6. Anthropic receives only generic detector limitations in this version, after a separate consent action. Raw signal, patient identity and measured numbers are not sent.

## Validation
`npx vitest run tests/ecg` verifies a known synthetic pulse spacing, flat-signal abstention, malformed formats, AI output validation and disabled/unauthenticated API paths. These tests are not clinical validation. Live Supabase/Anthropic and Vercel preview tests require configured staging services.

## Not implemented / release blockers
WFDB/XML/image/PDF ingestion and digitization, validated P/QRS/T delineation, PR/QT/QTc/ST/axis measurements, diagnostic rules, clinician identity and grants, patient-case mapping, clinical review/signature, PDF export, historical comparison, asynchronous workers, full audit trail, deletion/retention workflows and clinical dataset evaluation. No synthetic results are substituted for these features.
Research peak detection may confuse T waves and artifacts with R waves; its HR/RR values must not guide care. Per-lead quality checks only identify extreme flatness; they do not establish signal validity.
Before enabling outside controlled staging: complete retention/erasure and access audit, deploy integration tests with real RLS and provider mocks, validate Vercel routing, then implement and clinically evaluate the remaining features.

## Rollback
Set `ECG_ENABLED=false` in server runtime and redeploy the preceding application version if needed. Preserve the additive ECG tables and stored data. Do not drop tables as an automatic rollback. A separate reviewed erasure policy is required. Claude failures retain measurements and deliberately prevent automatic repeat spending; operator investigation is needed before resetting a failed attempt.

## Local verification (2026-10-20)
- Six new signal/schema/API boundary tests passed.
- Existing Angular App test passed.
- Angular development build passed; Vercel API TypeScript check passed.
- EKG-specific ESLint passed. Full-project lint has pre-existing respiratory component violations.
- Production build blocked by Google Fonts HTTP 403 in this environment. Existing font imports were preserved.
- Live provider documentation access also returned HTTP 403. No model ID was invented; runtime authenticated model lookup remains mandatory.
- No live database migration, provider call, preview or production deployment was executed.
