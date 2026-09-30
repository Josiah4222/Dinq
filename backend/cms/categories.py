"""
The order page groups are shown in.

The CMS screen groups cards by category, and the natural ordering for that is
the shape of the site — Main first, then the sections a visitor moves through,
with the legal pages last. Django's `ordering` sorts by the category string, so
without this the groups come out alphabetically and "Legal" ends up above "Main".

Kept in its own module because both the seed and the API need it, and the API
should not have to import the seed data to know it.
"""
from __future__ import annotations

# Display order of the category groups.
CATEGORY_ORDER: list[str] = [
    'Main',
    'About',
    'Solutions',
    'Industries',
    'Insights',
    'Our Work',
    'Legal',
]


def sort_key(category: str) -> tuple[int, str]:
    """
    Sort position for one category name.

    A category not in the list sorts after the known ones, alphabetically, so a
    newly added category still appears in a predictable place rather than
    silently disappearing off the end.
    """
    try:
        return (CATEGORY_ORDER.index(category), '')
    except ValueError:
        return (len(CATEGORY_ORDER), category)
