import {ChangeDetectionStrategy, Component, inject, effect, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {RouterOutlet, Router} from '@angular/router';
import {SupabaseService} from './services/supabase';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const user = this.supabase.user();
      const url = this.router.url;

      if (!user) {
        if (!url.includes('/auth')) {
          this.router.navigate(['/auth']);
        }
      } else {
        if (url.includes('/auth')) {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }
}
