import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListItem } from './page-content.service';

/** `ContentBlock.Kind` values, mirroring Django's TextChoices. */
export type BlockKind = 'text' | 'textarea' | 'list' | 'image';

/** A list block whose items are objects with these fields, or a plain string. */
export interface BlockObjectItem {
  title?: string;
  text?: string;
  slug?: string;
  icon?: string;
  [key: string]: string | undefined;
}

export interface ContentBlock {
  key: string;
  kind: BlockKind;
  label: string;
  value: string;
  data: ListItem[];
  order: number;
  updatedAt: string;
}

export interface PageSummary {
  slug: string;
  title: string;
  route: string;
  category: string;
  order: number;
  blockCount: number;
  hasContent: boolean;
  /** Change token, bumped on every accepted edit. */
  version: number;
  updatedAt: string;
}

export interface PageGroup {
  category: string;
  pages: PageSummary[];
}

export interface PageListResponse {
  categories: PageGroup[];
  total: number;
}

export interface PageDetail extends PageSummary {
  blocks: ContentBlock[];
}

export interface PageUpdateResponse {
  slug: string;
  changed: string[];
  /** The page's change token after the save. */
  version: number;
}

export interface PageUpdateError {
  detail: string;
  /** Keyed by block key. `keys` covers a request naming a block that does not exist. */
  errors?: Record<string, string[] | string[]>;
  changed?: string[];
}

/** One image in the staff library, as the upload endpoint describes it. */
export interface ImageAsset {
  /** Public path to use as an image `src`, e.g. `/media/uploads/2026/09/hero-1a2b3c4d.jpg`. */
  path: string;
  /** The filename the staff member's file had, kept for display. */
  name: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: string;
  uploadedAt: string;
}

export interface ImageLibraryResponse {
  results: ImageAsset[];
  count: number;
}


/**
 * Staff access to editable page content — the card grid and the page editor
 * under /admin/pages.
 *
 * As with the submissions service these calls do NOT set SKIP_AUTH_REDIRECT, so
 * a 403 sends the user to /login, which is what a staff-only screen should do.
 */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly http = inject(HttpClient);

  /** Every page as a card, grouped by category. */
  listPages(): Observable<PageListResponse> {
    return this.http.get<PageListResponse>('/api/staff/pages/');
  }

  /** One page's blocks, with the labels the editor shows above each input. */
  getPage(slug: string): Observable<PageDetail> {
    return this.http.get<PageDetail>(`/api/staff/pages/${slug}/`);
  }

  /**
   * Save changed values. Only keys already on the page are accepted, so this
   * sends just what the editor touched rather than the whole block set.
   */
  updatePage(slug: string, blocks: Record<string, string | ListItem[]>): Observable<PageUpdateResponse> {
    return this.http.patch<PageUpdateResponse>(`/api/staff/pages/${slug}/update/`, { blocks });
  }

  /**
   * Send one image file to the server and get back the path to store in a block.
   *
   * The file is the only thing uploaded; the path it comes back with is then saved
   * with the rest of the page in the ordinary way, so an uploaded image and a
   * typed one are indistinguishable once saved. That is deliberate: it keeps Save
   * as the single point where a change becomes live, rather than having an upload
   * silently publish a half-finished edit.
   */
  uploadImage(file: File, altText = ''): Observable<ImageAsset> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (altText) {
      form.append('altText', altText);
    }
    return this.http.post<ImageAsset>('/api/staff/uploads/', form);
  }

  /**
   * Images already uploaded, newest first, so an editor can reuse one instead of
   * uploading the same photo to three pages.
   */
  listImages(): Observable<ImageLibraryResponse> {
    return this.http.get<ImageLibraryResponse>('/api/staff/images/');
  }
}
