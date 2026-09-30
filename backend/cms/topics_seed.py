"""
The quick-inquiry topic list the seed command writes.

Mirrors `DEFAULT_INQUIRY_TOPICS` in
`frontend/src/app/core/inquiry-topics.service.ts`, which is the same list shipped
so the form still works before this command has ever been run. The two must stay
in step: a slug that appears in one and not the other either 404s in the form or
disappears from the list on the next deploy.

The two columns are the practice areas served from Canada and the matters handled
for clients in Ethiopia, which is why the `group` field alternates: a visitor
looking for family law should find it without scrolling past a list of Ethiopian
investment matters.
"""
from __future__ import annotations

# `slug` is the stable id the form keys its ticked-state on. The `label` is the
# wording a visitor reads, and can change without touching a past submission:
# submissions store labels, not slugs.
INQUIRY_TOPICS: list[dict] = [
    # Canadian practice areas.
    {
        'slug': 'canada-real-estate',
        'label': 'Real Estate',
        'group': 'canadian',
        'order': 10,
    },
    {
        'slug': 'canada-wills-estate',
        'label': 'Wills & Estate',
        'group': 'canadian',
        'order': 20,
    },
    {
        'slug': 'canada-family-law',
        'label': 'Family Law',
        'group': 'canadian',
        'order': 30,
    },
    {
        'slug': 'canada-immigration',
        'label': 'Immigration',
        'group': 'canadian',
        'order': 40,
    },
    # Ethiopian matters.
    {
        'slug': 'ethiopia-property-management',
        'label': 'Property Management in Ethiopia',
        'group': 'ethiopia',
        'order': 10,
    },
    {
        'slug': 'ethiopia-family-assets',
        'label': 'Family Assets / Inheritance',
        'group': 'ethiopia',
        'order': 20,
    },
    {
        'slug': 'ethiopia-investment',
        'label': 'Investment in Ethiopia',
        'group': 'ethiopia',
        'order': 30,
    },
]
