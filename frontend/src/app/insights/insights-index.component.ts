import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsletterFormComponent } from '../newsletter-form/newsletter-form.component';
import { Article, ArticlesService } from '../core/articles.service';
import { CmsPage } from '../core/cms-page';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * /insights — index / grid page (master doc Section 10.1).
 * Reverse-chronological article cards + newsletter signup (sidebar), with a
 * category filter that turns itself on once enough articles are live.
 *
 * The article list now comes from the database via the articles API, authored
 * on /admin/newsletters. Only this page's own heading is CMS-managed (the
 * `insights` page); the cards themselves are no longer overlaid on a hardcoded
 * registry, because the registry is gone.
 */
@Component({
  selector: 'app-insights-index',
  imports: [RouterLink, DatePipe, NewsletterFormComponent, ImageSrcPipe],
  templateUrl: './insights-index.component.html',
  styleUrl: './insights-index.component.scss',
})
export class InsightsIndexComponent extends CmsPage implements OnInit {
  private readonly articlesService = inject(ArticlesService);

  /** Headline and eyebrow for the page itself (CMS-managed). */
  readonly eyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'Insights'));
  readonly title = computed(() => this.content.text(this.values(), 'hero.title', 'Market insight, grounded in practice'));

  /** Every article, newest first, straight from the API. */
  readonly articles = signal<Article[]>([]);
  readonly loading = signal(true);

  /** Filter appears only when the article count crosses the threshold. */
  readonly showFilter = computed(() => this.articles().length > FILTER_THRESHOLD);

  readonly categories = computed(() => [...new Set(this.articles().map((a) => a.category).filter(Boolean))]);

  /** '' = all articles. */
  readonly activeCategory = signal('');

  readonly filtered = computed(() => {
    const all = this.articles();
    const active = this.activeCategory();
    return active ? all.filter((article) => article.category === active) : all;
  });

  /** Toggles a category; clicking the active one clears the filter. */
  setCategory(category: string): void {
    const active = this.activeCategory();
    this.activeCategory.set(active === category ? '' : category);
  }

  ngOnInit(): void {
    // The page's own heading, then the article list from the API.
    this.bind('insights');

    this.articlesService.listPublic().subscribe({
      next: (res) => {
        this.articles.set(res.results);
        this.loading.set(false);
      },
      error: () => {
        this.articles.set([]);
        this.loading.set(false);
      },
    });
  }
}

/**
 * Article count at which the category filter activates automatically.
 * Hidden below this so the grid stays clean at launch.
 */
const FILTER_THRESHOLD = 10;
