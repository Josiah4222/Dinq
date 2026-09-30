import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { SKIP_AUTH_REDIRECT } from './auth.service';

/** Which of the two columns a topic is offered under. */
export type InquiryTopicGroup = 'canadian' | 'ethiopia';

/** One selectable topic, as the public endpoint reports it. */
export interface InquiryTopic {
  /** Stable id; the form's map is keyed by it, so it must survive a re-fetch. */
  id: string;
  label: string;
  group: InquiryTopicGroup;
  /** Lower sorts first. Ties fall back to label, so order is always stable. */
  order: number;
  /** Inactive topics are hidden but kept, so reactivating needs no client change. */
  active: boolean;
}

/** A topic that is safe to render, having survived validation. */
export type ValidTopic = InquiryTopic;

/** The two groups, in the order the columns are rendered. */
export const TOPIC_GROUPS: readonly InquiryTopicGroup[] = ['canadian', 'ethiopia'];

/**
 * The topics offered when the CMS cannot be reached.
 *
 * These are the shipped defaults, not a second source of truth: the endpoint is
 * authoritative once it exists, and these only fill the gap so a failed request
 * degrades to a usable form instead of an empty checkbox column. They mirror
 * `INQUIRY_TOPICS` in `backend/cms/topics_seed.py`; the two must stay in step or
 * a slug resolves in one and not the other.
 */
export const DEFAULT_INQUIRY_TOPICS: readonly InquiryTopic[] = [
  { id: 'canada-real-estate', label: 'Real Estate', group: 'canadian', order: 10, active: true },
  { id: 'canada-wills-estate', label: 'Wills & Estate', group: 'canadian', order: 20, active: true },
  { id: 'canada-family-law', label: 'Family Law', group: 'canadian', order: 30, active: true },
  { id: 'canada-immigration', label: 'Immigration', group: 'canadian', order: 40, active: true },
  { id: 'ethiopia-property-management', label: 'Property Management in Ethiopia', group: 'ethiopia', order: 10, active: true },
  { id: 'ethiopia-family-assets', label: 'Family Assets / Inheritance', group: 'ethiopia', order: 20, active: true },
  { id: 'ethiopia-investment', label: 'Investment in Ethiopia', group: 'ethiopia', order: 30, active: true },
];

/** The wire shape, kept loose because the endpoint is public. */
interface RawTopic {
  id?: unknown;
  label?: unknown;
  group?: unknown;
  order?: unknown;
  active?: unknown;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asOrder(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asGroup(value: unknown): InquiryTopicGroup | null {
  const text = asText(value).toLowerCase();
  return text === 'canadian' || text === 'ethiopia' ? text : null;
}

/**
 * Drop anything that cannot be rendered and sort what is left.
 *
 * The endpoint is public, so its rows are treated as untrusted: a topic with no
 * label, no id, or an unrecognised group is discarded rather than rendered as an
 * empty or misplaced checkbox. `active` defaults to true only when the field is
 * absent, so a row that does not mention the flag is still offered; an explicit
 * `false` hides it.
 */
export function normaliseTopics(rows: unknown): InquiryTopic[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  const topics: InquiryTopic[] = [];
  for (const row of rows as RawTopic[]) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const label = asText(row.label);
    const group = asGroup(row.group);
    if (!label || !group) {
      continue;
    }
    topics.push({
      id: asText(row.id) || `${group}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      group,
      order: asOrder(row.order),
      active: row.active === undefined ? true : Boolean(row.active),
    });
  }

  return topics
    .filter(topic => topic.active)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

/**
 * The inquiry topics offered by the quick inquiry form.
 *
 * Read once and shared: the list is the same for every visitor, it changes only
 * when staff edit it, and a form that re-requested it on every checkbox click
 * would be both slower and capable of reordering a set mid-interaction.
 *
 * `shareReplay` keeps the late subscriber behaviour that matters here — a second
 * caller gets the already-resolved value — without `refCount`, because a failed
 * first request should fall back rather than retry on every new subscriber.
 */
@Injectable({ providedIn: 'root' })
export class InquiryTopicsService {
  private readonly http = inject(HttpClient);

  /** Public read: a 404 here is expected, not an auth problem to redirect on. */
  private readonly anonymous = new HttpContext().set(SKIP_AUTH_REDIRECT, true);

  private readonly topics = signal<readonly ValidTopic[]>(DEFAULT_INQUIRY_TOPICS);

  /** The topics to render — the defaults until the request answers. */
  readonly list = this.topics.asReadonly();

  private request?: Observable<readonly ValidTopic[]>;

  /**
   * Fetch the topics once.
   *
   * The defaults are published immediately and then replaced, so the checkboxes
   * are never empty. A failure leaves the defaults in place, which is the whole
   * reason they exist.
   */
  refresh(): void {
    if (this.request) {
      return;
    }
    this.request = this.http.get<unknown>('/api/cms/inquiry-topics/', { context: this.anonymous }).pipe(
      map(rows => normaliseTopics(rows)),
      map(topics => (topics.length ? topics : DEFAULT_INQUIRY_TOPICS)),
      catchError(() => of(DEFAULT_INQUIRY_TOPICS)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.request.subscribe(topics => this.topics.set(topics));
  }
}
