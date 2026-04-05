import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';
import {injectSpeedInsights} from '@vercel/speed-insights';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Initialize Vercel Speed Insights
injectSpeedInsights();
