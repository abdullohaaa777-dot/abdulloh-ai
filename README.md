<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Abdulloh AI — Run & Deploy

## Local run

**Prerequisites:** Node.js 20+

1. Install deps:
   ```bash
   npm install
   ```
2. Set environment variables (local shell, `.env.local`, or Vercel project env):
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Run app:
   ```bash
   npm run dev
   ```

## Production build (Vercel compatible)

```bash
npm run build
```

The build script forwards `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` via Angular `--define` for production builds.

## Supabase migration

Run `supabase_schema.sql` in **Supabase SQL Editor** (same project used by frontend):

1. Open Supabase Dashboard → SQL Editor.
2. Paste contents of `supabase_schema.sql`.
3. Run query.

The migration is idempotent (`CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) so it is safe for existing projects.

## Post-deploy checklist

After deploy, verify:

1. Sign in / auth works.
2. New case save works (and persists).
3. Case detail route opens via `/case/:id`.
4. AI analysis works (or returns controlled error if API key missing).
5. Dermatology AI flow does not crash when key is missing.
6. File upload/delete works in `medical-uploads` bucket.
7. Case delete removes DB rows and associated files.
