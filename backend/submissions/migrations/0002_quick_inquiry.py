"""
Support the /quick-inquiry form in the same table as /contact.

Adds `source` so the two forms can be told apart, and relaxes the columns a quick
inquiry does not collect. Relaxation is schema-level only: `ContactSubmissionForm`
still requires a full name, email, phone, client type, message and consent, so the
/contact form's validation is unchanged. Making these columns `blank=True` lets one
table hold both forms without inventing defaults for values nobody supplied.

Safe on existing data: `source` is added with a default, and widening a column to
`blank=True` only relaxes the schema — no rows are rewritten.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactsubmission',
            name='source',
            field=models.CharField(choices=[('contact', 'Contact form'), ('quick_inquiry', 'Quick inquiry')], db_index=True, default='contact', max_length=20),
        ),
        migrations.AlterField(
            model_name='contactsubmission',
            name='client_type',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AlterField(
            model_name='contactsubmission',
            name='email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AlterField(
            model_name='contactsubmission',
            name='message',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='contactsubmission',
            name='phone',
            field=models.CharField(blank=True, max_length=60),
        ),
        migrations.AlterField(
            model_name='contactsubmission',
            name='reason_for_contact',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
