import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticPageComponent } from './static-page';

@Component({
  standalone: true,
  imports: [StaticPageComponent],
  template: `<app-static-page title="Privacy & Security" body="This platform is designed with least-privilege access control, secure server-side AI proxying, and auditable user actions. It is intended as decision support and must be used by qualified healthcare professionals." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {}
