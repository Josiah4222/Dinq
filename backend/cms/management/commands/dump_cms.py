"""
Write the seeded CMS copy to JSON, for the key-coverage check.

Why this exists
---------------
`frontend/tools/verify-cms-keys.mjs` reads this file and compares it against the
Angular source of truth. That check is the one that catches the failure mode the
CMS migration exists to prevent: a block that appears in the editor but is never
read by the page, so an editor changes it and nothing happens.

The snapshot is a checked-in copy of the database, which makes it a thing that
can go stale. A field added to a seed file does not reach this file on its own,
and a stale snapshot does not fail loudly - it fails quietly, by checking the
CMS against a version of itself that predates the change. So:

    python manage.py dump_cms            # rewrite the snapshot
    python manage.py dump_cms --check    # fail if it is out of date

`--check` is the one to run in CI or before a commit. It is the difference
between a snapshot that is verified to be current and one that is merely present.

Output location
---------------
Defaults to `cms_snapshot.json` beside this file, which is where
`verify-cms-keys.mjs` looks. An earlier draft of this module's docstring
suggested writing to the repository root instead, which produced a second copy
that nothing read. Pass `--output` to write elsewhere; `--check` will then
happily confirm a file the verifier is not looking at, so keep the default
unless you are deliberately feeding something else.

The file is written in the same shape `dumps()` produces, so the two never drift.
"""
from __future__ import annotations

import json
from pathlib import Path

from cms.snapshot import dumps
from django.core.management.base import BaseCommand, CommandError

# This file is backend/cms/management/commands/dump_cms.py, so three parents up
# is the backend directory - which is where verify-cms-keys.mjs looks.
DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / 'cms_snapshot.json'


class Command(BaseCommand):
    help = 'Write the seeded CMS copy to cms_snapshot.json for the key-coverage check.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check',
            action='store_true',
            help='Report whether the snapshot is out of date instead of rewriting it.',
        )
        parser.add_argument(
            '--output',
            type=Path,
            default=DEFAULT_OUTPUT,
            help=f'Where to write the snapshot (default: {DEFAULT_OUTPUT}).',
        )

    def handle(self, *args, **options):
        target: Path = options['output']
        content = dumps() + '\n'

        if options['check']:
            current = target.read_text(encoding='utf-8') if target.is_file() else None
            if current == content:
                self.stdout.write(self.style.SUCCESS(f'{target} is up to date.'))
                return
            if current is None:
                raise CommandError(f'{target} does not exist. Run: python manage.py dump_cms')
            raise CommandError(
                f'{target} is out of date with the database. Run: python manage.py dump_cms'
            )

        target.parent.mkdir(parents=True, exist_ok=True)
        # A newline at the end keeps the file well behaved in git and editors.
        target.write_text(content, encoding='utf-8')
        self.stdout.write(
            self.style.SUCCESS(
                f'Wrote {len(json.loads(content))} page(s) to {target}. '
                'Run `npm run verify:cms` in frontend/ to check the coverage.'
            )
        )
