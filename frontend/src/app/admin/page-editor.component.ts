import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { BlockKind, CmsService, ContentBlock, PageDetail } from '../core/cms.service';
import { EDITOR_POLL_MS, ListItem, PageContentService } from '../core/page-content.service';
import { AdminShellComponent } from './admin-shell.component';
import { ImagePickerComponent } from './image-picker.component';

/** One row in a list block, held in an editable form. */
interface DraftItem {
  /** Stable local id so the view can track a row across add/remove. */
  uid: string;
  /** True when the list holds plain strings rather than objects. */
  isText: boolean;
  text: string;
  fields: Record<string, string>;
}

/** One block, held in an editable form alongside the value it was loaded with. */
interface DraftBlock {
  key: string;
  kind: BlockKind;
  label: string;
  /** text/textarea/image value */
  text: string;
  /** list rows */
  items: DraftItem[];
  /** field order for object lists, so the editor's inputs match the stored shape */
  fieldOrder: string[];
  /** serialized value as loaded, used to tell a clean block from a changed one */
  baseline: string;
  /** per-block message from the last save attempt */
  error: string | null;
}

/** Human field names for the object keys a list item can carry. */
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  text: 'Text',
  slug: 'Slug',
  icon: 'Icon path (SVG)',
  image: 'Image',
  imagePath: 'Image',
  featuredImage: 'Featured image',
  heroImage: 'Hero image',
  linkedin: 'LinkedIn URL',
  email: 'Email address',
};

/**
 * The object keys that hold an image, so those rows get a picker instead of a
 * textarea. Matched on the field name rather than on its current value, because
 * a row with no image yet still needs the upload button, and a value that merely
 * looks like a path is not necessarily an image.
 */
const IMAGE_FIELDS = new Set(['image', 'imagePath', 'featuredImage', 'heroImage']);

/** Fields that change a link or an asset, called out so an edit is not a surprise. */
const FIELD_HINTS: Record<string, string> = {
  slug: 'Changing this changes where the link points.',
  icon: 'The path data of the SVG drawn on the card.',
  linkedin: 'A LinkedIn profile URL. Leave empty and no LinkedIn icon is shown.',
  email: 'A contact address. Leave empty and no email icon is shown.',
};

/**
 * /admin/pages/:slug — edit every block of one page.
 *
 * The whole page loads into a local draft and Save sends only the blocks that
 * actually changed, so an accidental keystroke in one field cannot rewrite
 * content someone else edited in the meantime. A page with no blocks has not
 * had its copy migrated out of the Angular component yet, and says so instead of
 * presenting an empty form that would look like it was working.
 */
@Component({
  selector: 'app-page-editor',
  imports: [RouterLink, AdminShellComponent, ImagePickerComponent],
  templateUrl: './page-editor.component.html',
  styleUrl: './page-editor.component.scss',
})
export class PageEditorComponent implements OnInit, OnDestroy {
  private readonly cms = inject(CmsService);
  private readonly route = inject(ActivatedRoute);
  private readonly content = inject(PageContentService);

  readonly page = signal<PageDetail | null>(null);
  readonly blocks = signal<DraftBlock[]>([]);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly savedAt = signal<Date | null>(null);

  /** Block keys the last save rejected, so the message lands on the right input. */
  readonly failedKeys = signal<string[]>([]);

  /**
   * Set when someone else changed this page while this draft was open. The draft
   * is left alone on purpose: silently discarding an editor's unsaved work
   * because a colleague saved would be worse than showing a notice.
   */
  readonly updatedElsewhere = signal(false);

  readonly fieldHints = FIELD_HINTS;

  /** Unique ids for list rows. Monotonic, so it never collides within a session. */
  private uidSeq = 0;

  /** Watches the page so a save from another tab or staff member is noticed. */
  private watch?: Subscription;
  /** The version this draft was built from, to spot a remote change. */
  private baseVersion = 0;

  /** Blocks whose current value differs from what was loaded. */
  readonly dirtyCount = computed(
    () => this.blocks().filter(block => this.serialize(block) !== block.baseline).length,
  );
  readonly isDirty = computed(() => this.dirtyCount() > 0);

  readonly notMigrated = computed(() => !this.loading() && this.blocks().length === 0);

  readonly saveLabel = computed(() => {
    if (this.saving()) {
      return 'Saving…';
    }
    const count = this.dirtyCount();
    return count === 1 ? 'Save 1 change' : `Save ${count} changes`;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.load(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.watch?.unsubscribe();
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  private load(slug: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.saveError.set(null);
    this.savedAt.set(null);
    this.failedKeys.set([]);
    this.updatedElsewhere.set(false);

    this.cms.getPage(slug).subscribe({
      next: (detail) => {
        this.page.set(detail);
        this.baseVersion = detail.version;
        this.blocks.set(detail.blocks.map(block => this.toDraft(block)));
        this.loading.set(false);
        this.watchPage(slug);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load this page. Please try again.');
      },
    });
  }

  /**
   * Watch the same page the public components watch, so a save from another tab
   * or another staff member is noticed here. Reloading is only safe when there
   * is nothing to lose; otherwise the change is recorded and the editor is told.
   */
  private watchPage(slug: string): void {
    this.watch?.unsubscribe();
    this.watch = this.content.watch(slug, { intervalMs: EDITOR_POLL_MS }).subscribe(values => {
      // The service emits null before the first load lands. There is nothing to
      // reconcile against yet, and this component already holds the server copy.
      if (values === null) {
        return;
      }
      const latest = this.page();
      if (!latest) {
        return;
      }
      this.cms.getPage(slug).subscribe({
        next: (detail) => {
          if (detail.version === this.baseVersion) {
            return;
          }
          this.baseVersion = detail.version;
          if (this.isDirty() || this.saving()) {
            // Keep what is on screen. The notice offers a reload.
            this.updatedElsewhere.set(true);
            return;
          }
          this.page.set(detail);
          this.blocks.set(detail.blocks.map(block => this.toDraft(block)));
        },
        // A failed re-read is not worth surfacing; the next tick tries again.
        error: () => undefined,
      });
    });
  }

  /** Throw away local work and take the saved copy. */
  reloadFromServer(): void {
    const page = this.page();
    if (page) {
      this.load(page.slug);
    }
  }

  /** Turn a stored block into a draft, remembering the value it started at. */
  private toDraft(block: ContentBlock): DraftBlock {
    const draft: DraftBlock = {
      key: block.key,
      kind: block.kind,
      label: block.label,
      text: block.value,
      items: [],
      fieldOrder: [],
      baseline: '',
      error: null,
    };

    if (block.kind === 'list') {
      const fieldOrder: string[] = [];
      draft.items = (block.data ?? []).map(item => {
        if (typeof item === 'string') {
          return { uid: this.nextUid(), isText: true, text: item, fields: {} };
        }
        const record = (item ?? {}) as Record<string, string>;
        // Field order comes from the whole list, not just the first row, so a
        // row that gained a field later still gets an input for it.
        for (const key of Object.keys(record)) {
          if (!fieldOrder.includes(key)) {
            fieldOrder.push(key);
          }
        }
        return { uid: this.nextUid(), isText: false, text: '', fields: { ...record } };
      });
      draft.fieldOrder = fieldOrder;
    }

    draft.baseline = this.serialize(draft);
    return draft;
  }

  // -------------------------------------------------------------------------
  // Editing
  // -------------------------------------------------------------------------

  setText(index: number, value: string): void {
    this.patchBlock(index, { text: value });
  }

  setItemText(blockIndex: number, uid: string, value: string): void {
    const block = this.blocks()[blockIndex];
    if (!block) {
      return;
    }
    this.patchBlock(blockIndex, {
      items: block.items.map(item => (item.uid === uid ? { ...item, text: value } : item)),
    });
  }

  setItemField(blockIndex: number, uid: string, field: string, value: string): void {
    const block = this.blocks()[blockIndex];
    if (!block) {
      return;
    }
    this.patchBlock(blockIndex, {
      items: block.items.map(item =>
        item.uid === uid ? { ...item, fields: { ...item.fields, [field]: value } } : item,
      ),
    });
  }

  addItem(blockIndex: number): void {
    const block = this.blocks()[blockIndex];
    if (!block) {
      return;
    }
    // Match the shape of the list: all-string lists stay all-string, and object
    // lists get a row with every field present but empty.
    const isText = block.fieldOrder.length === 0;
    const fields: Record<string, string> = {};
    for (const field of block.fieldOrder) {
      fields[field] = '';
    }
    this.patchBlock(blockIndex, {
      items: [...block.items, { uid: this.nextUid(), isText, text: '', fields }],
    });
  }

  removeItem(blockIndex: number, uid: string): void {
    const block = this.blocks()[blockIndex];
    if (!block) {
      return;
    }
    this.patchBlock(blockIndex, { items: block.items.filter(item => item.uid !== uid) });
  }

  /** Nudge a row up or down. Out-of-range moves are ignored rather than clamped. */
  moveItem(blockIndex: number, uid: string, delta: number): void {
    const block = this.blocks()[blockIndex];
    if (!block) {
      return;
    }
    const from = block.items.findIndex(item => item.uid === uid);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= block.items.length) {
      return;
    }
    const items = [...block.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    this.patchBlock(blockIndex, { items });
  }

  /** Put every block back to the value it was loaded with. */
  discard(): void {
    this.blocks.update(blocks => blocks.map(block => ({ ...block, ...this.fromBaseline(block) })));
    this.saveError.set(null);
    this.failedKeys.set([]);
  }

  private patchBlock(index: number, changes: Partial<DraftBlock>): void {
    this.blocks.update(blocks =>
      blocks.map((block, i) => (i === index ? { ...block, ...changes, error: null } : block)),
    );
    this.savedAt.set(null);
  }

  private nextUid(): string {
    this.uidSeq += 1;
    return `row-${this.uidSeq}`;
  }

  // -------------------------------------------------------------------------
  // Value shape
  // -------------------------------------------------------------------------

  /** The block's current value as one comparable string. */
  private serialize(block: DraftBlock): string {
    return JSON.stringify(this.payloadFor(block));
  }

  /** The block's current value in the shape the API expects. */
  private payloadFor(block: DraftBlock): string | ListItem[] {
    if (block.kind !== 'list') {
      return block.text;
    }
    return block.items.map(item => (item.isText ? item.text : { ...item.fields }));
  }

  /** Rebuild the editable fields from the baseline, for Discard. */
  private fromBaseline(block: DraftBlock): Partial<DraftBlock> {
    const original = block.kind === 'list' ? block.items : null;
    if (block.kind !== 'list' || !original) {
      return { text: this.baselineText(block) };
    }

    // The baseline is the serialized value, so decode it back into a draft.
    const parsed = JSON.parse(block.baseline) as ListItem[];
    return {
      items: parsed.map(item =>
        typeof item === 'string'
          ? { uid: this.nextUid(), isText: true, text: item, fields: {} }
          : { uid: this.nextUid(), isText: false, text: '', fields: { ...(item as Record<string, string>) } },
      ),
    };
  }

  private baselineText(block: DraftBlock): string {
    try {
      return JSON.parse(block.baseline) as string;
    } catch {
      return block.text;
    }
  }

  // -------------------------------------------------------------------------
  // Saving
  // -------------------------------------------------------------------------

  save(): void {
    const page = this.page();
    if (!page || this.saving() || !this.isDirty()) {
      return;
    }

    const changed: Record<string, string | ListItem[]> = {};
    for (const block of this.blocks()) {
      if (this.serialize(block) !== block.baseline) {
        changed[block.key] = this.payloadFor(block);
      }
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.failedKeys.set([]);

    this.cms.updatePage(page.slug, changed).subscribe({
      next: (res) => {
        // Re-baseline from what was sent, so the page reports clean without a
        // refetch. The values are the ones the server now holds.
        this.blocks.update(blocks =>
          blocks.map(block =>
            block.key in changed
              ? { ...block, baseline: JSON.stringify(changed[block.key]), error: null }
              : block,
          ),
        );
        this.baseVersion = res.version ?? this.baseVersion;
        this.updatedElsewhere.set(false);
        this.saving.set(false);
        this.savedAt.set(new Date());
        // Tell this browser's other tabs straight away, and reconcile the
        // shared store so any public view of this page in the same tab updates.
        this.content.announceSave(page.slug);
      },
      error: (response: { error?: { errors?: Record<string, string[]> | string[]; detail?: string } }) => {
        this.saving.set(false);
        const errors = response?.error?.errors;
        const detail = response?.error?.detail;

        if (errors && !Array.isArray(errors)) {
          const keys = Object.keys(errors);
          this.failedKeys.set(keys);
          this.blocks.update(blocks =>
            blocks.map(block =>
              keys.includes(block.key) ? { ...block, error: (errors[block.key] ?? []).join(' ') } : block,
            ),
          );
          this.saveError.set(detail ?? 'Some values were rejected.');
        } else {
          this.saveError.set(detail ?? 'Could not save this page. Please try again.');
        }
      },
    });
  }

  /** The block a save rejected, for marking the field. */
  isFailed(key: string): boolean {
    return this.failedKeys().includes(key);
  }

  /** A human name for one of a list item's fields. */
  labelFor(field: string): string {
    return FIELD_LABELS[field] ?? field;
  }

  /** Whether one of a list item's fields holds an image, so it gets a picker. */
  isImageField(field: string): boolean {
    return IMAGE_FIELDS.has(field);
  }

  /** An item's value for one field. Rows can lack a field a sibling row has. */
  fieldValue(item: DraftItem, field: string): string {
    return item.fields[field] ?? '';
  }
}
