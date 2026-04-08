import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticPageComponent } from './static-page';

@Component({
  standalone: true,
  imports: [StaticPageComponent],
  template: `<app-static-page title="Contact" body="For pilots, partnerships, or clinical safety reviews, contact the AbdullohAI Clinical product team. We support staged deployments with sandbox, validation, and governance workflows." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {}
