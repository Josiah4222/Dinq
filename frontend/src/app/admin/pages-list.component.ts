import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService, PageGroup } from '../core/cms.service';
import { AdminShellComponent } from './admin-shell.component';

/**
 * /admin/pages — every public page as a card, grouped by category.
 *
 * A card exists for every route in the inventory, including the ones whose copy
 * still lives in the Angular component. `hasContent` is the distinction the
 * staff member actually cares about: "Ready" means an edit here reaches the live
 * page, "Not yet migrated" means the page renders from its own hardcoded copy
 * and this editor would be recording changes nothing reads.
 */
@Component({
  selector: 'app-pages-list',
  imports: [RouterLink, AdminShellComponent],
  templateUrl: './pages-list.component.html',
  styleUrl: './pages-list.component.scss',
})
export class PagesListComponent implements OnInit {
  private readonly cms = inject(CmsService);

  readonly groups = signal<PageGroup[]>([]);
  readonly total = signal(0);
  readonly readyCount = signal(0);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Pages with migrated copy, summed across categories. */
  readonly pendingCount = computed(() => this.total() - this.readyCount());

  ngOnInit(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.cms.listPages().subscribe({
      next: (res) => {
        this.groups.set(res.categories);
        this.total.set(res.total);
        this.readyCount.set(
          res.categories.reduce(
            (sum, group) => sum + group.pages.filter(page => page.hasContent).length,
            0,
          ),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load the page list. Please try again.');
      },
    });
  }

  /** Human label for where a page lives, collapsing '/' and '' to "Home". */
  routeLabel(route: string): string {
    return route === '/' || route === '' ? 'Home' : route;
  }
}
