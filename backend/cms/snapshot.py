"""
Dump the seeded CMS copy as JSON, for the key-coverage check.

`frontend/tools/verify-cms-keys.mjs` reads this and compares it against the
Angular source of truth. That check is the one that catches the failure mode
this whole migration exists to prevent: a block that appears in the editor but
is never read by the page, so an editor changes it and nothing happens.

Use the management command rather than printing from here. It writes straight
to the path the verifier reads, which is not obvious:

    python manage.py dump_cms           # write backend/cms_snapshot.json
    python manage.py dump_cms --check   # fail if that file is out of date
"""
from __future__ import annotations

import json

from cms.models import ContentBlock


def snapshot() -> dict[str, dict[str, object]]:
    pages: dict[str, dict[str, object]] = {}
    for block in ContentBlock.objects.select_related('page').order_by('page__slug', 'order'):
        page = pages.setdefault(block.page.slug, {'kind_of_page': 'page', 'blocks': {}})
        entry: dict[str, object] = {'kind': block.kind, 'label': block.label, 'order': block.order}
        if block.kind == 'list':
            entry['data'] = block.data
        else:
            entry['value'] = block.value
        page['blocks'][block.key] = entry  # type: ignore[index]
    return pages


def dumps() -> str:
    return json.dumps(snapshot(), ensure_ascii=False, indent=2, sort_keys=True)
