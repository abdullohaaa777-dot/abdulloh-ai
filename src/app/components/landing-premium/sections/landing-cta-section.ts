import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-cta-section',
  standalone: true,
  imports: [RouterModule],
  template: `<section class="block cta"><h2>Landing CTA</h2><a routerLink="/auth">Boshlash</a></section>`
})
export class LandingCTASectionComponent {}
