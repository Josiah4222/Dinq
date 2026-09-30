"""Put the leadership contact links high in each row, where staff will find them.

The page editor renders a list row's inputs in the order its keys are stored, so
the fields added by 0005 landed below a long biography textarea, once per leader.
A field nobody can see is a field nobody fills in.

This only reorders. Every value is carried across untouched, and a key that is
not in the preferred order keeps its position at the end, so a row carrying a
field this migration has never heard of is not silently dropped.
"""

from django.db import migrations

BLOCK_KEY = 'leadership.members'

# The order staff should meet: who this is, then how to reach them, then the
# long copy nobody needs to scroll past to find a link.
PREFERRED = [
    'key',
    'name',
    'role',
    'linkedin',
    'email',
    'image',
    'org',
    'bio',
    'focus',
]


def reorder_contact_fields(apps, schema_editor):
    ContentBlock = apps.get_model('cms', 'ContentBlock')

    for block in ContentBlock.objects.filter(key=BLOCK_KEY, kind='list'):
        rows = block.data
        if not isinstance(rows, list):
            continue

        changed = False
        reordered_rows = []
        for row in rows:
            if not isinstance(row, dict):
                reordered_rows.append(row)
                continue
            new_row = {k: row[k] for k in PREFERRED if k in row}
            new_row.update({k: v for k, v in row.items() if k not in new_row})
            if list(new_row) != list(row):
                changed = True
            reordered_rows.append(new_row)

        if changed:
            block.data = reordered_rows
            block.save(update_fields=['data'])


def restore_original_order(apps, schema_editor):
    """No-op: key order in a JSON column carries no meaning worth restoring."""


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0005_leadership_contact_links'),
    ]

    operations = [
        migrations.RunPython(reorder_contact_fields, restore_original_order),
    ]
