// Vercel Node function: shared authenticated router, separate from Angular SSR.
import express from 'express';
import {ecgRouter} from '../src/server/ecg/router';
const app=express();
app.disable('x-powered-by');
app.use('/api/ecg',ecgRouter);
export default app;
