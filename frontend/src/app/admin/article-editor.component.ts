import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticlesService, StaffArticle } from '../core/articles.service';
import { AuthService } from '../core/auth.service';
import { AdminShellComponent } from './admin-shell.component';
import { ImagePickerComponent } from './image-picker.component';

/**
 * /admin/newsletters/new and /admin/newsletters/:slug — one screen for writing
 * and editing a newsletter article.
 *
 * The two routes share a component because the form is the same shape either
 * way; only the save call (create vs update) and the presence of a Delete
 * button differ. The body is a plain textarea split on blank lines, so an
 * author writes the way they would in any editor and the site still renders
 * proper paragraphs rather than one wall of text.
 */
@Component({
  selector: 'app-article-editor',
  imports: [FormsModule, RouterLink, AdminShellComponent, ImagePickerComponent],
  templateUrl: './article-editor.component.html',
  styleUrl: './article-editor.component.scss',
})
export class ArticleEditorComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** The article being edited, once loaded. Null in create mode. */
  readonly article = signal<StaffArticle | null>(null);
  /** True when the route carries no slug — i.e. /admin/newsletters/new. */
  readonly isCreate = signal(true);
  readonly currentSlug = signal<string | null>(null);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // ---- Form fields --------------------------------------------------------
  readonly title = signal('');
  readonly slug = signal('');
  readonly author = signal('');
  readonly category = signal('');
  readonly summary = signal('');
  readonly bodyText = signal('');
  readonly featuredImage = signal('');

  /** Slugs ticked in the related list. */
  readonly relatedSelected = signal<string[]>([]);
  /** Every article, offered as related checkboxes (self excluded when editing). */
  readonly relatedOptions = signal<StaffArticle[]>([]);

  // ---- Save / delete state ------------------------------------------------
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  /** Live paragraph count, so the author sees the shape as they write. */
  readonly paragraphCount = computed(() => this.bodyParagraphs().length);

  /** The body textarea, split into paragraphs the way the save will. */
  private readonly bodyParagraphs = computed(() =>
    this.bodyText()
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
  );

  /** Related options minus the article being edited. */
  readonly relatedChoices = computed(() => {
    const current = this.currentSlug();
    return this.relatedOptions().filter((option) => option.slug !== current);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.isCreate.set(false);
        this.currentSlug.set(slug);
        this.load(slug);
      } else {
        this.isCreate.set(true);
        this.currentSlug.set(null);
        this.resetForCreate();
      }
      this.loadRelatedOptions();
    });
  }

  private resetForCreate(): void {
    this.article.set(null);
    this.loading.set(false);
    this.loadError.set(null);
    this.title.set('');
    this.slug.set('');
    this.author.set(this.auth.displayName());
    this.category.set('');
    this.summary.set('');
    this.bodyText.set('');
    this.featuredImage.set('');
    this.relatedSelected.set([]);
    this.saved.set(false);
    this.saveError.set(null);
    this.fieldErrors.set({});
    this.deleteError.set(null);
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.articlesService.getStaff(slug).subscribe({
      next: (res) => {
        const a = res.article;
        this.article.set(a);
        this.title.set(a.title);
        this.slug.set(a.slug);
        this.author.set(a.author);
        this.category.set(a.category);
        this.summary.set(a.summary);
        this.bodyText.set(a.body.join('\n\n'));
        this.featuredImage.set(a.featuredImage);
        this.relatedSelected.set([...a.relatedSlugs]);
        this.saved.set(false);
        this.saveError.set(null);
        this.fieldErrors.set({});
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('That article could not be loaded. It may have been deleted.');
      },
    });
  }

  private loadRelatedOptions(): void {
    this.articlesService.listStaff().subscribe({
      next: (res) => this.relatedOptions.set(res.results),
      error: () => this.relatedOptions.set([]),
    });
  }

  toggleRelated(optionSlug: string): void {
    const selected = this.relatedSelected();
    this.relatedSelected.set(
      selected.includes(optionSlug)
        ? selected.filter((s) => s !== optionSlug)
        : [...selected, optionSlug],
    );
  }

  /** The first message the server sent for a field, if any. */
  fieldError(field: string): string | null {
    const errors = this.fieldErrors()[field];
    return errors && errors.length ? errors[0] : null;
  }

  fieldInvalid(field: string): boolean {
    return this.fieldError(field) !== null;
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    const title = this.title().trim();
    if (!title) {
      this.fieldErrors.set({ title: ['Enter a title.'] });
      this.saveError.set(null);
      return;
    }

    const payload = {
      title,
      slug: this.slug().trim(),
      author: this.author().trim(),
      category: this.category().trim(),
      summary: this.summary().trim(),
      body: this.bodyParagraphs(),
      featuredImage: this.featuredImage().trim(),
      relatedSlugs: this.relatedSelected(),
    };

    this.saving.set(true);
    this.saveError.set(null);
    this.fieldErrors.set({});

    if (this.isCreate()) {
      this.articlesService.create(payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          // Land on the edit screen for the slug the server chose.
          void this.router.navigate(['/admin/newsletters', res.article.slug]);
        },
        error: (err: HttpErrorResponse) => this.onSaveError(err),
      });
    } else {
      const current = this.currentSlug()!;
      this.articlesService.update(current, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.saved.set(true);
          // If the slug changed, move the URL so refresh and share still work.
          if (res.article.slug !== current) {
            void this.router.navigate(['/admin/newsletters', res.article.slug]);
          }
        },
        error: (err: HttpErrorResponse) => this.onSaveError(err),
      });
    }
  }

  private onSaveError(err: HttpErrorResponse): void {
    this.saving.set(false);
    const body = err.error as { detail?: string; errors?: Record<string, string[]> } | null;
    if (body?.errors) {
      this.fieldErrors.set(body.errors);
    }
    this.saveError.set(body?.detail ?? 'Something went wrong. Please try again.');
  }

  remove(): void {
    if (this.deleting()) {
      return;
    }
    const slug = this.currentSlug();
    if (!slug || !window.confirm('Delete this article? The public page stops working immediately.')) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.articlesService.delete(slug).subscribe({
      next: () => {
        this.deleting.set(false);
        void this.router.navigate(['/admin/newsletters']);
      },
      error: () => {
        this.deleting.set(false);
        this.deleteError.set('That article could not be deleted. Please try again.');
      },
    });
  }
}
