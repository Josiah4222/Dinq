import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticlesService, StaffArticle } from '../core/articles.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * /admin/newsletters — every article, newest first, as a card grid.
 *
 * Delete lives on the editor screen rather than here: a card is a single link,
 * and nesting a delete button inside it would either make the whole card
 * destructive or put two interactive elements in one hit target. Removing an
 * article is a deliberate act, so it belongs behind the article itself.
 */
@Component({
  selector: 'app-newsletters-list',
  imports: [RouterLink, DatePipe, AdminShellComponent],
  templateUrl: './newsletters-list.component.html',
  styleUrl: './newsletters-list.component.scss',
})
export class NewslettersListComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);

  readonly rows = signal<StaffArticle[]>([]);
  readonly count = signal(0);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.articlesService.listStaff().subscribe({
      next: (res) => {
        this.rows.set(res.results);
        this.count.set(res.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load the article list. Please try again.');
      },
    });
  }
}
