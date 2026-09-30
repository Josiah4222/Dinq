"""
The block copy the seed command writes, merged from its three sources.

Migrating 31 pages produced three different kinds of source, and keeping them in
one loader means `manage.py seed_cms` has a single place to read from:

  - `content_seed.HOME_BLOCKS`      the home page, written out by hand because the
                                    copy is interleaved with layout markup
  - `blocks_bespoke.BESPOKE_BLOCKS` the about/contact pages, same reason
  - `blocks_index.INDEX_BLOCKS`     the solutions and insights index pages, whose
                                    copy lives in the component that falls back to it
  - `generated_seed.json`           the data-driven and standard pages, extracted
                                    from the Angular `*-data.ts` files and route
                                    `data` by `frontend/tools/extract-cms-seed.mjs`

The generated file exists so several hundred strings of copy are lifted verbatim
rather than retyped. It is committed, so seeding does not depend on Node, but it
is derived data: change the Angular copy and re-run the extractor rather than
editing the JSON.

Every page listed in the inventory is expected to have blocks. A page that
genuinely has no migrated copy yet should say so in `PAGES`, not appear here with
an empty list, so "not yet migrated" in the CMS screen always means a real gap.
"""
from __future__ import annotations

import json
from pathlib import Path

from cms.blocks_bespoke import BESPOKE_BLOCKS
from cms.blocks_index import INDEX_BLOCKS
from cms.content_seed import BLOCKS_BY_PAGE as HANDWRITTEN_BLOCKS
from cms.content_seed import PAGES

GENERATED_FILE = Path(__file__).with_name('generated_seed.json')
GENERATED_EXTRAS_FILE = Path(__file__).with_name('generated_extras.json')


def _load_generated() -> dict[str, list[dict]]:
    """Read the machine-extracted blocks, keyed by page slug."""
    data = json.loads(GENERATED_FILE.read_text(encoding='utf-8'))
    return {slug: entry['blocks'] for slug, entry in data.items()}


def _load_generated_extras() -> dict[str, list[dict]]:
    """Read blocks that extend an already-seeded page, keyed by page slug."""
    return json.loads(GENERATED_EXTRAS_FILE.read_text(encoding='utf-8'))


def _build() -> dict[str, list[dict]]:
    merged: dict[str, list[dict]] = {}

    # The page-by-page sources must not overlap: two lists of blocks for one page
    # would make a re-run ambiguous about which is authoritative.
    for source in (HANDWRITTEN_BLOCKS, BESPOKE_BLOCKS):
        for slug, blocks in source.items():
            if slug in merged:
                raise RuntimeError(
                    f'{slug!r} has blocks in more than one seed source. Each page should be '
                    'seeded from exactly one place, or a rerun would be ambiguous.'
                )
            if not blocks:
                raise RuntimeError(f'{slug!r} has an empty block list. Remove the page from the seed.')
            merged[slug] = blocks

    generated = _load_generated()
    for slug, blocks in generated.items():
        if slug in merged:
            raise RuntimeError(f'{slug!r} is seeded by hand and by the extractor. Pick one.')
        merged[slug] = blocks

    # The index pages are the one deliberate overlap: the solutions index has its
    # card list extracted from the data file *and* headline copy of its own, which
    # lives in the component that falls back to it. Both are needed and neither
    # is a duplicate, so they are combined -- with a key check, because two blocks
    # claiming the same key really would be ambiguous.
    for slug, extra in INDEX_BLOCKS.items():
        _append(merged.setdefault(slug, []), extra, slug)

    # Blocks that extend a page seeded elsewhere. The home page's Industries
    # section is the case that needed this: its cards come from the same data
    # that links to the industry detail pages, so they were not editable at all.
    for slug, extra in _load_generated_extras().items():
        _append(merged.setdefault(slug, []), extra, slug)

    return merged


def _append(blocks: list[dict], extra: list[dict], slug: str) -> None:
    """Add blocks to a page, refusing a key that is already taken."""
    taken = {block['key'] for block in blocks}
    for block in extra:
        if block['key'] in taken:
            raise RuntimeError(
                f'{slug!r} defines {block["key"]!r} twice. A block key must be unique on a page.'
            )
        taken.add(block['key'])
        blocks.append(block)


BLOCKS_BY_PAGE = _build()

# Inventory metadata for pages the generated file describes. The extractor does
# not know about card ordering -- that is a CMS presentation concern, owned by
# the inventory below.
INVENTORY = PAGES

_slug_of_inventory = {entry['slug'] for entry in INVENTORY}
_slug_of_blocks = set(BLOCKS_BY_PAGE)

# A block page with no inventory row would still save, but it would sort to the
# end of its category and read as a typo rather than a gap.
_unlisted = _slug_of_blocks - _slug_of_inventory
if _unlisted:
    raise RuntimeError(
        'These pages have blocks but no row in the page inventory, so they would not '
        f'appear in the CMS screen: {", ".join(sorted(_unlisted))}'
    )

# The reverse is the more useful check: it is the list of pages still to migrate.
UNMIGRATED = sorted(_slug_of_inventory - _slug_of_blocks)


def block_count() -> int:
    return sum(len(blocks) for blocks in BLOCKS_BY_PAGE.values())
