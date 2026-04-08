import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let current = this.route;
        while (current.firstChild) {
          current = current.firstChild;
        }

        const data = current.snapshot.data as { title?: string; description?: string; canonical?: string };
        this.seo.update(data || {});
      });
  }
}
