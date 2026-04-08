import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json({ limit: '10mb' }));
const angularApp = new AngularNodeAppEngine();

const aiClient = process.env['GEMINI_API_KEY']
  ? new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] })
  : null;

app.post('/api/ai/analyze-case', async (req, res) => {
  if (!aiClient) return res.status(503).json({ error: 'AI service is not configured on server' });

  const { prompt, systemInstruction } = req.body as { prompt: string; systemInstruction: string };
  const response = await aiClient.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  return res.json({ text: response.text || '{}' });
});

app.post('/api/ai/chat', async (req, res) => {
  if (!aiClient) return res.status(503).json({ error: 'AI service is not configured on server' });

  const { message, history } = req.body as { message: string; history: unknown[] };
  const response = await aiClient.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { role: 'user', parts: [{ text: `History: ${JSON.stringify(history || [])}` }] },
      { role: 'user', parts: [{ text: message }] },
    ],
  });

  return res.json({ text: response.text || '' });
});

app.post('/api/ai/dermatology/:mode', async (req, res) => {
  if (!aiClient) return res.status(503).json({ error: 'AI service is not configured on server' });

  const mode = req.params['mode'];
  const { model, prompt, base64 } = req.body as { model: string; prompt: string; base64?: string };

  const contents = mode === 'analyze-image' && base64
    ? [{ role: 'user', parts: [{ inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }, { text: prompt }] }]
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await aiClient.models.generateContent({
    model: model || 'gemini-3-flash-preview',
    contents,
    config: mode === 'diagnosis' ? { responseMimeType: 'application/json' } : undefined,
  });

  return res.json({ text: response.text || '' });
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        return writeResponseToNodeResponse(response, res);
      } else {
        return next();
      }
    })
    .catch((err) => {
      console.error('[Server] Error handling request:', err);
      next(err);
    });
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
