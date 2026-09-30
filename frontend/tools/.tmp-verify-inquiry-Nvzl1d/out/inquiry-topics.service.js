"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryTopicsService = exports.DEFAULT_INQUIRY_TOPICS = exports.TOPIC_GROUPS = void 0;
exports.normaliseTopics = normaliseTopics;
const HttpContext = class {
    set(...args) { return this; }
};
const HttpClient = class {
    get(...args) { return { pipe: () => ({ subscribe: () => { } }) }; }
};
const Injectable = ((config) => (() => { }));
const inject = ((token) => ({}));
function signal(initial) { return { value: initial, set: (v) => { }, asReadonly: () => ({ value: initial }) }; }
const catchError = (...args) => (source) => source;
const map = (...args) => (source) => source;
const of = (...values) => ({});
const shareReplay = (...args) => (source) => source;
const SKIP_AUTH_REDIRECT = 'stub';
/** The two groups, in the order the columns are rendered. */
exports.TOPIC_GROUPS = ['canadian', 'ethiopia'];
/**
 * The topics offered when the CMS cannot be reached.
 *
 * These are the shipped defaults, not a second source of truth: the endpoint is
 * authoritative once it exists, and these only fill the gap so a failed request
 * degrades to a usable form instead of an empty checkbox column. They mirror the
 * service lines in ContactComponent and the sectors in the industries data, so
 * the fallback is at least consistent with the rest of the site.
 */
exports.DEFAULT_INQUIRY_TOPICS = [
    { id: 'advisory-international', label: 'International Business & Investment Advisory', group: 'canadian', order: 10, active: true },
    { id: 'advisory-diaspora', label: 'Diaspora Advisory', group: 'canadian', order: 20, active: true },
    { id: 'advisory-property', label: 'Property & Asset Management', group: 'canadian', order: 30, active: true },
    { id: 'advisory-government', label: 'Government & Institutional Advisory', group: 'canadian', order: 40, active: true },
    { id: 'advisory-workforce', label: 'Workforce & Organizational Advisory', group: 'canadian', order: 50, active: true },
    { id: 'sector-real-estate', label: 'Real Estate', group: 'ethiopia', order: 10, active: true },
    { id: 'sector-manufacturing', label: 'Manufacturing', group: 'ethiopia', order: 20, active: true },
    { id: 'sector-mining', label: 'Mining', group: 'ethiopia', order: 30, active: true },
    { id: 'sector-infrastructure', label: 'Infrastructure', group: 'ethiopia', order: 40, active: true },
    { id: 'sector-energy', label: 'Energy', group: 'ethiopia', order: 50, active: true },
    { id: 'sector-agribusiness', label: 'Agribusiness', group: 'ethiopia', order: 60, active: true },
    { id: 'sector-technology', label: 'Technology & Digital Business', group: 'ethiopia', order: 70, active: true },
    { id: 'sector-healthcare', label: 'Healthcare', group: 'ethiopia', order: 80, active: true },
    { id: 'sector-hospitality', label: 'Hospitality & Tourism', group: 'ethiopia', order: 90, active: true },
    { id: 'sector-financial', label: 'Financial Services', group: 'ethiopia', order: 100, active: true },
];
function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function asOrder(value) {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}
function asGroup(value) {
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
function normaliseTopics(rows) {
    if (!Array.isArray(rows)) {
        return [];
    }
    const topics = [];
    for (const row of rows) {
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
let InquiryTopicsService = class InquiryTopicsService {
    constructor() {
        this.http = inject(HttpClient);
        /** Public read: a 404 here is expected, not an auth problem to redirect on. */
        this.anonymous = new HttpContext().set(SKIP_AUTH_REDIRECT, true);
        this.topics = signal(exports.DEFAULT_INQUIRY_TOPICS);
        /** The topics to render — the defaults until the request answers. */
        this.list = this.topics.asReadonly();
    }
    /**
     * Fetch the topics once.
     *
     * The defaults are published immediately and then replaced, so the checkboxes
     * are never empty. A failure leaves the defaults in place, which is the whole
     * reason they exist.
     */
    refresh() {
        if (this.request) {
            return;
        }
        this.request = this.http.get('/api/cms/inquiry-topics/', { context: this.anonymous }).pipe(map(rows => normaliseTopics(rows)), map(topics => (topics.length ? topics : exports.DEFAULT_INQUIRY_TOPICS)), catchError(() => of(exports.DEFAULT_INQUIRY_TOPICS)), shareReplay({ bufferSize: 1, refCount: false }));
        this.request.subscribe(topics => this.topics.set(topics));
    }
};
exports.InquiryTopicsService = InquiryTopicsService;
exports.InquiryTopicsService = InquiryTopicsService = __decorate([
    Injectable({ providedIn: 'root' })
], InquiryTopicsService);
