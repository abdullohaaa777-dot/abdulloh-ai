import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '1mb' }));

app.post('/api/homeostasis-ai', async (req, res) => {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return res.status(503).json({ error: 'AI kaliti sozlanmagan' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Sen Abdulloh AI platformasining klinik-metabolik tahlil modulisan. Quyidagi bemor ma’lumotlari asosida homeostaz, metabolik xavf, glyukoza-insulin dinamikasi, kortizol-stress o‘qi, energiya tiklanishi, elektrolit muvozanati va organlararo metabolik bog‘liqlikni tahlil qil. Yakuniy diagnoz qo‘yma. Ehtimoliy klinik yo‘nalishlar, xavf darajalari, monitoring rejasi va shifokorga murojaat qilish zarur bo‘lgan holatlarni tartibli o‘zbek tilida tushuntir. Natijani professional, lekin tushunarli qilib ber. Faqat JSON qaytar. Ma’lumotlar: ${JSON.stringify(req.body)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    let text = response.text || '{}';
    if (text.includes('```json')) text = text.split('```json')[1].split('```')[0];
    if (text.includes('```')) text = text.split('```')[1].split('```')[0];
    const parsed = JSON.parse(text.trim());
    return res.json({ analysis: parsed });
  } catch (error) {
    console.error('[Homeostasis AI] Server tahlil xatosi:', error);
    return res.status(500).json({ error: 'AI tahlil vaqtincha ishlamadi' });
  }
});

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

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
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
        console.log(`[Server] No response from Angular app, falling back to index.html`);
        return res.sendFile(join(browserDistFolder, 'index.html'));
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
