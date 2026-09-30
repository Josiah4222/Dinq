import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsletterFormComponent } from '../newsletter-form/newsletter-form.component';
import { getArticles, InsightArticle } from './insights-data';
import { CmsPage } from '../core/cms-page';
import { FieldMap, overlay } from '../core/cms-merge';
import { ImageSrcPipe } from '../core/image-src.pipe';

/** Article fields the CMS may override; `slug` and `relatedSlugs` are structure. */
const EDITABLE: FieldMap<keyof InsightArticle & string>[] = [
  { field: 'title', key: 'title' },
  { field: 'author', key: 'author' },
  { field: 'date', key: 'date' },
  { field: 'category', key: 'category' },
  { field: 'featuredImage', key: 'featuredImage' },
  { field: 'summary', key: 'summary' },
];

/**
 * /insights Ã¢â‚¬â€ index / grid page (master doc Section 10.1).
 * Reverse-chronological article cards + newsletter signup (sidebar), with a
 * category filter that turns itself on once enough articles are live.
 *
 * The cards are built from each article's own CMS page rather than from a second
 * copy held here. An index card and its article show the same title, summary and
 * category, so keeping both would mean editing the same headline twice and
 * letting the two drift apart. Only the page's own heading is editable here.
 */
@Component({
  selector: 'app-insights-index',
  imports: [RouterLink, DatePipe, NewsletterFormComponent, ImageSrcPipe],
  templateUrl: './insights-index.component.html',
  styleUrl: './insights-index.component.scss',
})
export class InsightsIndexComponent extends CmsPage implements OnInit {
  private readonly stored = this.manyValues();

  /** Headline and eyebrow for the page itself. */
  readonly eyebrow = computed(() => this.content.text(this.values(), 'hero.eyebrow', 'Insights'));
  readonly title = computed(() => this.content.text(this.values(), 'hero.title', 'Market insight, grounded in practice'));

  /** Every article, each carrying its own CMS overrides. */
  readonly articles = computed<InsightArticle[]>(() => {
    const stored = this.stored();
    return getArticles().map(article => overlay(article, stored[`insight-${article.slug}`] ?? null, EDITABLE));
  });

  /** Filter appears only when the article count crosses the threshold. */
  readonly showFilter = computed(() => this.articles().length > FILTER_THRESHOLD);

  readonly categories = computed(() => [...new Set(this.articles().map(a => a.category))]);

  /** '' = all articles. */
  readonly activeCategory = signal('');

  readonly filtered = computed(() => {
    const all = this.articles();
    const active = this.activeCategory();
    return active ? all.filter(article => article.category === active) : all;
  });

  /** Toggles a category; clicking the active one clears the filter. */
  setCategory(category: string): void {
    const active = this.activeCategory();
    this.activeCategory.set(active === category ? '' : category);
  }

  ngOnInit(): void {
    // This page's own heading, then each article it lists.
    this.bindMany(['insights', ...getArticles().map(article => `insight-${article.slug}`)], 'insights');
  }
}

/**
 * Article count at which the category filter activates automatically.
 * Hidden below this so the grid stays clean at launch (3 articles).
 */
const FILTER_THRESHOLD = 10;
