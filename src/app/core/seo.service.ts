import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  setPublicSeo(title: string, description: string, path: string): void {
    const fullTitle = `${title} | Abdulloh AI`;
    const canonicalUrl = `https://abdullohai.sbs${path}`;
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    this.upsertCanonical(canonicalUrl);
  }

  setPrivateSeo(title: string): void {
    this.title.setTitle(`${title} | Abdulloh AI`);
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }

  private upsertCanonical(url: string): void {
    const id = 'canonical-link';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }
}
