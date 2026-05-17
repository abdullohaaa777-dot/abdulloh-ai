import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '1mb' }));

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */


const REHABILITATION_SAFETY_NOTE = 'Bu tahlil reabilitatsiya jarayonini kuzatishga yordam beruvchi yordamchi AI xulosadir. Og‘riq, bosh aylanishi, nafas qisishi, yurak urishining kuchayishi yoki holsizlik bo‘lsa, mashqni to‘xtating va shifokorga murojaat qiling.';

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function fallbackRehabilitationAnalysis(session: Record<string, unknown>, statusMessage = 'AI tahlil vaqtincha mavjud emas, asosiy natijalar saqlandi.') {
  const totalScore = Number(session['totalScore'] ?? 0);
  const quality = Number(session['movementQualityScore'] ?? 0);
  const symmetry = Number(session['symmetryIndex'] ?? 0);
  const fatigue = Number(session['fatigueIndex'] ?? 0);
  return {
    overall_summary: statusMessage,
    movement_quality_analysis: `Harakat sifati ${quality}%: silliqlik, amplituda, motor nazorat va trayektoriya og‘ishi asosida kuzatildi.`,
    joint_problem_analysis: 'Bo‘g‘im burchaklari jadvali va amplituda cheklovlari shifokor/fizioterapevt tomonidan klinik kontekstda ko‘rib chiqiladi.',
    symmetry_analysis: `Chap-o‘ng simmetriya indeksi ${symmetry}%. Simmetriya pasaysa kompensator gavda qiyshayishi tekshiriladi.`,
    fatigue_analysis: `Nevromotor charchash indeksi ${fatigue}%. Charchash ortsa takrorlar sonini kamaytirish yoki dam olish oralig‘ini oshirish mumkin.`,
    progress_comparison: `Joriy umumiy ball ${totalScore}%. Keyingi sessiyalar bilan dinamik solishtirish davom ettiriladi.`,
    risk_warnings: fatigue > 65 ? ['Charchash yuqori: og‘riq, bosh aylanishi yoki holsizlik bo‘lsa mashq to‘xtatiladi.'] : ['Xavfli belgi aniq ko‘rinmadi, lekin klinik simptomlar bo‘lsa mashq to‘xtatiladi.'],
    patient_advice: String(session['patientAdvice'] ?? 'Mashqni sekin, nazoratli va xavfsiz amplitudada bajaring.'),
    doctor_clinical_note: String(session['doctorNote'] ?? 'Sessiya natijalari klinik yordamchi monitoring sifatida talqin qilinadi.'),
    next_exercise_recommendation: totalScore > 75 ? 'Shu mashqni nazoratli ritmda davom ettiring; keyingi bosqichda amplituda asta-sekin oshirilishi mumkin.' : 'Keyingi sessiyada kamroq takror, sekinroq ritm va zarur bo‘lsa amplituda cheklovi tavsiya etiladi.',
    safety_note: REHABILITATION_SAFETY_NOTE
  };
}

app.post('/api/rehabilitation/analyze', async (req, res) => {
  const session = (req.body?.session ?? {}) as Record<string, unknown>;
  const previousSession = req.body?.previousSession ?? null;
  const apiKey = process.env['GEMINI_API_KEY'];

  if (!apiKey) {
    return res.status(503).json({ analysis: fallbackRehabilitationAnalysis(session) });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Siz Abdulloh AI platformasining tibbiy reabilitatsiya tahlil modulisisiz.

Sizga bemorning reabilitatsiya mashqi natijalari beriladi.
Vazifangiz: natijalarni tibbiy, biomekanik va reabilitatsion nuqtayi nazardan tahlil qilish.

Muhim:
- Tashxisni qat’iy hukm sifatida qo‘ymang.
- Natijani klinik yordamchi tahlil sifatida yozing.
- Bemor uchun sodda tavsiya bering.
- Shifokor uchun professional klinik izoh bering.
- Og‘riq, nafas qisishi, bosh aylanishi, kuchli holsizlik bo‘lsa, mashqni to‘xtatish va shifokorga murojaat qilishni eslatib o‘ting.

Tahlil qilinadigan ma’lumotlar:
${JSON.stringify({ rehabilitation_session_data: session, previous_session: previousSession }, null, 2)}

Javobni faqat quyidagi JSON formatda qaytaring:
{
  "overall_summary": "",
  "movement_quality_analysis": "",
  "joint_problem_analysis": "",
  "symmetry_analysis": "",
  "fatigue_analysis": "",
  "progress_comparison": "",
  "risk_warnings": [],
  "patient_advice": "",
  "doctor_clinical_note": "",
  "next_exercise_recommendation": "",
  "safety_note": "${REHABILITATION_SAFETY_NOTE}"
}`;

    const result = await ai.models.generateContent({
      model: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = extractJsonObject(result.text ?? '') ?? fallbackRehabilitationAnalysis(session, 'AI javobi JSON formatida olinmadi, asosiy natijalar saqlandi.');
    parsed['safety_note'] = typeof parsed['safety_note'] === 'string' && parsed['safety_note'] ? parsed['safety_note'] : REHABILITATION_SAFETY_NOTE;
    return res.json({ analysis: parsed });
  } catch (error) {
    console.error('[Server] Rehabilitation AI analysis failed:', error);
    return res.status(503).json({ analysis: fallbackRehabilitationAnalysis(session) });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  console.log(`[Server] Handling request: ${req.method} ${req.url}`);
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        console.log(`[Server] Response status: ${response.status}`);
        return writeResponseToNodeResponse(response, res);
      } else {
        console.log(`[Server] No response from Angular app`);
        return next();
      }
    })
    .catch((err) => {
      console.error(`[Server] Error handling request:`, err);
      next(err);
    });
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
