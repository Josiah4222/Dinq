import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RevealDirective } from '../reveal.directive';
import { Article, ArticlesService } from '../core/articles.service';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * /insights/[slug] — reusable Insights article template (master doc Section
 * 10.2). Fully generic: every block reads from the article the API returns
 * (title, author, date, featuredImage, body, related).
 *
 * The article is fetched from the database (authored on /admin/newsletters)
 * rather than overlaid on a hardcoded registry. An unknown slug bounces to the
 * index, which is also what happens if an article is deleted after someone
 * bookmarks it.
 */
@Component({
  selector: 'app-insight-article',
  imports: [RouterLink, RevealDirective, DatePipe, ImageSrcPipe],
  templateUrl: './insight-article.component.html',
  styleUrl: './insight-article.component.scss',
})
export class InsightArticleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articlesService = inject(ArticlesService);

  readonly article = signal<Article | null>(null);
  readonly related = signal<Article[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      if (!slug) {
        void this.router.navigate(['/insights']);
        return;
      }

      this.loading.set(true);
      this.article.set(null);
      this.related.set([]);

      this.articlesService.getPublic(slug).subscribe({
        next: (res) => {
          this.article.set(res.article);
          this.related.set(res.related);
          this.loading.set(false);
        },
        error: () => {
          // Unknown or deleted — the index is the safe place to land.
          void this.router.navigate(['/insights']);
        },
      });
    });
  }
}
