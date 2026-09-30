"""
The staff-chosen topic list offered on the /quick-inquiry form.

A new table rather than a JSON block on a page, because the list has to be
queryable and filterable on its own: the form reads active topics in one column
order, and the submission form validates a submitted slug against them.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0002_page_content_version'),
    ]

    operations = [
        migrations.CreateModel(
            name='InquiryTopic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(help_text='Stable id used by the form, e.g. sector-mining. Not shown to visitors.', max_length=120, unique=True)),
                ('label', models.CharField(help_text='Wording shown as the checkbox.', max_length=120)),
                ('group', models.CharField(choices=[('canadian', 'Canadian advisory services'), ('ethiopia', 'Ethiopia sectors')], db_index=True, default='ethiopia', help_text='Column of the form this topic is offered under.', max_length=20)),
                ('order', models.PositiveIntegerField(default=0, help_text='Sort within the form. Lower comes first; ties break by label.')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Untick to hide it from the form. Existing submissions keep the topic they were sent with.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Inquiry topic',
                'verbose_name_plural': 'Inquiry topics',
                'ordering': ['group', 'order', 'label'],
            },
        ),
    ]
