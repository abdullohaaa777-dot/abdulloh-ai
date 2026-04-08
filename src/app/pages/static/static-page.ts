import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <header class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <a routerLink="/" class="font-bold text-lg">AbdullohAI Clinical</a>
        <a routerLink="/login" class="px-4 py-2 rounded-lg border border-slate-300 text-sm">Sign in</a>
      </header>
      <main class="max-w-4xl mx-auto px-6 pb-16">
        <h1 class="text-3xl font-bold mb-4">{{ title() }}</h1>
        <p class="text-slate-700 leading-7">{{ body() }}</p>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticPageComponent {
  title = input.required<string>();
  body = input.required<string>();
}
