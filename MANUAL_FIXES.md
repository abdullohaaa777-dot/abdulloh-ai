# Manual fixes to apply in source files

These are the source-code changes still needed in addition to `supabase_migration_fix.sql`.

## 1) `src/app/services/supabase.ts`

### Make configuration stricter
Replace:

```ts
public isConfigured(): boolean {
  return !!(typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && SUPABASE_URL.startsWith('http'));
}
```

With:

```ts
public isConfigured(): boolean {
  return !!(
    typeof SUPABASE_URL !== 'undefined' &&
    typeof SUPABASE_ANON_KEY !== 'undefined' &&
    SUPABASE_URL &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY
  );
}
```

### Fix storage bucket mismatch in `deleteCase`
Replace:

```ts
const { data: files } = await this.supabase.storage.from('medical-docs').list(id);
if (files && files.length > 0) {
  const filesToDelete = files.map(f => `${id}/${f.name}`);
  await this.supabase.storage.from('medical-docs').remove(filesToDelete);
}
```

With:

```ts
const folder = `${this.user()?.id}/${id}`;
const { data: files } = await this.supabase.storage.from('medical-uploads').list(folder);
if (files && files.length > 0) {
  const filesToDelete = files.map(f => `${folder}/${f.name}`);
  await this.supabase.storage.from('medical-uploads').remove(filesToDelete);
}
```

## 2) `src/app/components/digital-twin/digital-twin.ts`
Replace:

```ts
[routerLink]="['/cases', patient.id]"
```

With:

```ts
[routerLink]="['/case', patient.id]"
```

## 3) `src/app/services/ai.ts`
Make sure the constructor and key check are safe:

```ts
constructor() {
  const key = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
  this.ai = new GoogleGenAI({ apiKey: key });
}

if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY) {
  throw new Error('Gemini API kaliti topilmadi. Iltimos, sozlamalarni tekshiring.');
}
```

## 4) `src/app/services/dermatology.ts`
Use a safe key lookup:

```ts
private ai = new GoogleGenAI({ apiKey: typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '' });
```

## 5) `package.json`
Build command should include environment defines:

```json
"build": "ng build --define GEMINI_API_KEY=\"'${GEMINI_API_KEY:-}'\" --define SUPABASE_URL=\"'${SUPABASE_URL:-}'\" --define SUPABASE_ANON_KEY=\"'${SUPABASE_ANON_KEY:-}'\""
```

## 6) Vercel environment variables
Make sure these are set in Vercel Project Settings:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 7) Apply the migration
Run `supabase_migration_fix.sql` in Supabase SQL Editor before testing create/save flows.
