"""
Copy for the two index pages that holds text of its own.

Everything else the data-driven pages need is extracted from the Angular
`*-data.ts` files and route `data` by `frontend/tools/extract-cms-seed.mjs`.
These few strings are written out here because their home is now the component
that falls back to them: the solutions index headline, and the two eyebrows and
titles on the index pages. Keeping them beside the component fallback means the
shipped copy and the seeded copy are read together, and the equality check in the
test suite fails if the two ever drift.

The solutions index cards are not here. They are the one place a card blurb is
genuinely different writing from the detail page's summary, so each is edited
where it is rendered; the card *title* is deliberately not seeded at all, so the
grid always matches the title on the solution's own page.
"""
from __future__ import annotations

SOLUTIONS_INDEX_BLOCKS: list[dict] = [
    {
        'key': 'hero.eyebrow',
        'kind': 'text',
        'label': 'Hero — eyebrow',
        'value': 'Solutions',
        'order': 0,
    },
    {
        'key': 'hero.title',
        'kind': 'text',
        'label': 'Hero — title',
        'value': 'Advisory built around what it takes to get things done.',
        'order': 1,
    },
    {
        'key': 'hero.intro',
        'kind': 'textarea',
        'label': 'Hero — introduction',
        'value': (
            'Dinq Advisory Group helps businesses, investors, institutions, and members of the '
            'Ethiopian diaspora navigate opportunities and manage interests in Ethiopia. We go '
            'beyond recommendations — helping clients assess opportunities, make informed '
            'decisions, coordinate the right professionals and stakeholders, and follow through '
            'on implementation.'
        ),
        'order': 2,
    },
    {
        'key': 'cards.eyebrow',
        'kind': 'text',
        'label': 'Solution list — eyebrow',
        'value': 'What we do',
        'order': 3,
    },
    {
        'key': 'cards.title',
        'kind': 'text',
        'label': 'Solution list — title',
        'value': 'Five practice areas',
        'order': 4,
    },
    {
        'key': 'cta.title',
        'kind': 'text',
        'label': 'CTA — title',
        'value': 'Not sure which solution fits?',
        'order': 5,
    },
    {
        'key': 'cta.text',
        'kind': 'textarea',
        'label': 'CTA — text',
        'value': (
            "Every engagement starts with a conversation. Tell us where you're headed, and we'll "
            'map the path together.'
        ),
        'order': 6,
    },
]

INSIGHTS_INDEX_BLOCKS: list[dict] = [
    {
        'key': 'hero.eyebrow',
        'kind': 'text',
        'label': 'Hero — eyebrow',
        'value': 'Insights',
        'order': 0,
    },
    {
        'key': 'hero.title',
        'kind': 'text',
        'label': 'Hero — title',
        'value': 'Market insight, grounded in practice',
        'order': 1,
    },
]

INDEX_BLOCKS: dict[str, list[dict]] = {
    'solutions': SOLUTIONS_INDEX_BLOCKS,
    'insights': INSIGHTS_INDEX_BLOCKS,
}
