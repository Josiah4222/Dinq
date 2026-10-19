import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * A newsletter / insight article, as the public API returns it.
 *
 * Mirrors `Article.as_public_dict()` on the server. `date` is an ISO date
 * string ('2026-08-01') derived from the article's creation time.
 */
export interface Article {
  slug: string;
  title: string;
  author: string;
  /** ISO date, e.g. '2026-08-01'. */
  date: string;
  category: string;
  summary: string;
  /** Body copy as an array of paragraphs, rendered one <p> per entry. */
  body: string[];
  /** Root-absolute image path; empty string means "show the placeholder". */
  featuredImage: string;
  /** Slugs of other articles, surfaced in the related-articles module. */
  relatedSlugs: string[];
}

/** The staff view adds the timestamps the admin list shows. */
export interface StaffArticle extends Article {
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListResponse {
  count: number;
  results: Article[];
}

export interface StaffArticleListResponse {
  count: number;
  results: StaffArticle[];
}

/** What the public article page needs: the article and a few related ones. */
export interface ArticleDetailResponse {
  article: Article;
  related: Article[];
}

export interface StaffArticleDetailResponse {
  article: StaffArticle;
}

export interface ArticleCreateResponse {
  article: StaffArticle;
}

export interface ArticleUpdateResponse {
  article: StaffArticle;
  changed: string[];
}

/** A 400 from any article mutation: `detail` plus per-field messages. */
export interface ArticleMutationError {
  detail: string;
  errors?: Record<string, string[]>;
}

/** The writable fields, sent on create and (partially) on update. */
export interface ArticleInput {
  title: string;
  slug?: string;
  author?: string;
  category?: string;
  summary?: string;
  body?: string[];
  featuredImage?: string;
  relatedSlugs?: string[];
}

/**
 * Staff and public access to newsletter / insight articles.
 *
 * Staff calls do NOT set SKIP_AUTH_REDIRECT, so a 403 sends the user to /login,
 * which is what a staff-only screen should do. Public calls are anonymous and
 * never 403, so the interceptor has nothing to catch.
 */
@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly http = inject(HttpClient);

  // ---- Staff (the /admin/newsletters screens) ---------------------------

  /** Every article, newest first. */
  listStaff(): Observable<StaffArticleListResponse> {
    return this.http.get<StaffArticleListResponse>('/api/staff/articles/');
  }

  /** One article, for the editor to load. */
  getStaff(slug: string): Observable<StaffArticleDetailResponse> {
    return this.http.get<StaffArticleDetailResponse>(`/api/staff/articles/${slug}/`);
  }

  /** Create an article. The slug is generated from the title when omitted. */
  create(input: ArticleInput): Observable<ArticleCreateResponse> {
    return this.http.post<ArticleCreateResponse>('/api/staff/articles/create/', input);
  }

  /** Save the fields present in `input`; untouched fields keep their value. */
  update(slug: string, input: Partial<ArticleInput>): Observable<ArticleUpdateResponse> {
    return this.http.patch<ArticleUpdateResponse>(`/api/staff/articles/${slug}/update/`, input);
  }

  /** Remove an article. Its public URL stops working immediately. */
  delete(slug: string): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`/api/staff/articles/${slug}/delete/`);
  }

  // ---- Public (the /insights screens) -----------------------------------

  /** Every article, newest first, for the index grid. */
  listPublic(): Observable<ArticleListResponse> {
    return this.http.get<ArticleListResponse>('/api/articles/');
  }

  /** One article plus its related articles, for the article page. */
  getPublic(slug: string): Observable<ArticleDetailResponse> {
    return this.http.get<ArticleDetailResponse>(`/api/articles/${slug}/`);
  }
}
