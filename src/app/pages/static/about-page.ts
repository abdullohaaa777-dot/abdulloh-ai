import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticPageComponent } from './static-page';

@Component({
  standalone: true,
  imports: [StaticPageComponent],
  template: `<app-static-page title="About AbdullohAI Clinical" body="AbdullohAI Clinical is a clinician-facing decision support platform that organizes patient data, computes risk formulas, and generates explainable differential diagnosis support with explicit uncertainty and red-flag escalation." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {}
