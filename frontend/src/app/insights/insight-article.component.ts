import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { getArticle, getRelated, InsightArticle } from './insights-data';
import { CmsPage } from '../core/cms-page';
import { FieldMap, overlay } from '../core/cms-merge';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * Which article fields are editable, and the CMS key for each. `relatedSlugs`
 * is absent: it is navigation, and an editor changing it in a text field would
 * break the related-articles module rather than improve the copy.
 */
const EDITABLE: FieldMap<keyof InsightArticle & string>[] = [
  { field: 'title', key: 'title' },
  { field: 'author', key: 'author' },
  { field: 'date', key: 'date' },
  { field: 'category', key: 'category' },
  { field: 'featuredImage', key: 'featuredImage' },
  { field: 'summary', key: 'summary' },
  { field: 'body', key: 'body', list: true },
];

/**
 * /insights/[slug] Ã¢â‚¬â€ reusable Insights article template (master doc Section
 * 10.2). Fully generic: every block reads from the resolved InsightArticle
 * (title, author, date, featuredImage, body, relatedSlugs[]).
 *
 * The article in insights-data.ts is the fallback; the CMS values are laid over
 * it, which is also what lets the index card and the article share one source Ã¢â‚¬â€
 * the index reuses this page's title, summary and category rather than holding
 * a second copy that could drift.
 */
@Component({
  selector: 'app-insight-article',
  imports: [RouterLink, RevealDirective, DatePipe, ImageSrcPipe],
  templateUrl: './insight-article.component.html',
  styleUrl: './insight-article.component.scss',
})
export class InsightArticleComponent extends CmsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private base = signal<InsightArticle | null>(null);

  /** The article as rendered: the static entry with the CMS values on top. */
  readonly article = computed(() => {
    const base = this.base();
    return base === null ? null : overlay(base, this.values(), EDITABLE);
  });

  /** Related articles are resolved from slugs, so they follow a CMS retitle. */
  readonly related = computed(() => {
    const article = this.article();
    return article ? getRelated(article) : [];
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      const article = getArticle(slug);
      if (!article) {
        void this.router.navigate(['/insights']);
        return;
      }
      this.base.set(article);
      this.bind(`insight-${slug}`);
    });
  }
}
