"""
Page content in the Django admin.

The Angular CMS screen under /admin/pages is the intended editing surface, but
the same rows are editable here — the block inlines make scanning a page's copy
quick without leaving the list.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import ContentBlock, InquiryTopic, Page


class ContentBlockInline(admin.TabularInline):
    model = ContentBlock
    extra = 0
    fields = ['order', 'key', 'label', 'kind', 'value', 'data']
    readonly_fields = ['updated_at']
    ordering = ['order', 'key']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'route', 'block_count', 'updated_at']
    list_filter = ['category']
    search_fields = ['title', 'slug', 'route']
    ordering = ['category', 'order', 'title']
    inlines = [ContentBlockInline]
    readonly_fields = ['created_at', 'updated_at']
    fields = [
        'title',
        'slug',
        'route',
        'category',
        'order',
        'created_at',
        'updated_at',
    ]

    @admin.display(description='blocks')
    def block_count(self, obj) -> str:
        total = obj.blocks.count()
        return format_html('<strong>{}</strong>', total)


@admin.register(InquiryTopic)
class InquiryTopicAdmin(admin.ModelAdmin):
    """
    The quick-inquiry topic list.

    No staff screen of its own: these rows are few and change rarely, so the admin
    is the right place for them. `list_editable` is what makes reordering and
    hiding a topic a two-click job.
    """

    list_display = ['label', 'slug', 'group', 'order', 'is_active', 'updated_at']
    list_display_links = ['label']
    list_editable = ['group', 'order', 'is_active']
    list_filter = ['group', 'is_active']
    search_fields = ['label', 'slug']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['group', 'order', 'label']
    fieldsets = (
        (None, {'fields': ('label', 'slug', 'group', 'order', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
