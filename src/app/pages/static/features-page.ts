import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticPageComponent } from './static-page';

@Component({
  standalone: true,
  imports: [StaticPageComponent],
  template: `<app-static-page title="Features" body="Core features include structured case intake, lab interpretation, differential diagnosis explanation panels, red-flag triage, adherence tracking, and longitudinal follow-up monitoring for complex patients." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesPageComponent {}
