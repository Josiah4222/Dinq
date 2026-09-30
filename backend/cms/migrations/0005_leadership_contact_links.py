"""Give every leadership row the two contact fields the icons read.

The editor builds the inputs of an object list from the keys already stored, so
a field that only exists in the seed and in the Angular fallback is invisible
in /admin/pages: an installed database already has its own copy of the
leadership rows, the seed will not touch them, and staff would have no way to
add the links the public page now draws.

Both keys are added empty and only when absent, so a row that already carries a
value keeps it. The reverse migration deliberately does nothing: dropping the
keys would delete links somebody has entered.
"""

from django.db import migrations

BLOCK_KEY = 'leadership.members'
CONTACT_FIELDS = ('linkedin', 'email')


def add_contact_fields(apps, schema_editor):
    ContentBlock = apps.get_model('cms', 'ContentBlock')

    for block in ContentBlock.objects.filter(key=BLOCK_KEY, kind='list'):
        rows = block.data
        if not isinstance(rows, list):
            continue

        changed = False
        for row in rows:
            # Only leader rows. A row without a name is something else, and
            # writing empty keys into it would not make an input appear.
            if not isinstance(row, dict) or 'name' not in row:
                continue
            for field in CONTACT_FIELDS:
                if field not in row:
                    row[field] = ''
                    changed = True

        if changed:
            block.save(update_fields=['data'])


def remove_contact_fields(apps, schema_editor):
    """No-op on the way back: the keys may hold links staff entered."""


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0004_imageasset'),
    ]

    operations = [
        migrations.RunPython(add_contact_fields, remove_contact_fields),
    ]
