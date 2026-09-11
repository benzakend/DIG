from django.contrib import admin
from django.http import JsonResponse
from django.urls import path
from django import forms
from django.core.exceptions import ValidationError
from .models import Category, SubCategory, Product

class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'
    
    def clean(self):
        cleaned_data = super().clean()
        category = cleaned_data.get('category')
        sub_category = cleaned_data.get('sub_category')
        
        # If both category and sub_category are selected, validate the relationship
        if category and sub_category:
            if sub_category.category != category:
                raise ValidationError({
                    'sub_category': 'תת-הקטגוריה שנבחרה לא שייכת לקטגוריה שנבחרה.'
                })
        
        return cleaned_data

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    list_filter = ['created_at']

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'description', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'category__name']
    ordering = ['category', 'name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'category', 'sub_category', 'is_active', 'featured', 'show_in_gallery', 'created_at']
    list_filter = ['category', 'sub_category', 'is_active', 'featured', 'show_in_gallery', 'created_at']
    search_fields = ['name', 'sku', 'description']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_active', 'featured', 'show_in_gallery']
    
    fieldsets = (
        ('מידע בסיסי', {
            'fields': ('name', 'description', 'category', 'sub_category', 'image')
        }),
        ('מידע נוסף', {
            'fields': ('sku',)
        }),
        ('מפרטים טכניים', {
            'fields': ('weight', 'dimensions')
        }),
        ('הגדרות', {
            'fields': ('is_active', 'featured', 'show_in_gallery')
        }),
        ('תאריכים', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    class Media:
        js = ('admin/js/product_admin.js',)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('api/subcategories/<int:category_id>/', 
                 self.admin_site.admin_view(self.get_subcategories), 
                 name='product_subcategories'),
        ]
        return custom_urls + urls
    
    def get_subcategories(self, request, category_id):
        """API endpoint to get sub-categories for a specific category"""
        subcategories = SubCategory.objects.filter(category_id=category_id).values('id', 'name')
        return JsonResponse({'subcategories': list(subcategories)})
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter sub-category choices based on selected category"""
        if db_field.name == "sub_category":
            # Get the current product being edited
            product_id = request.resolver_match.kwargs.get('object_id')
            if product_id:
                try:
                    product = Product.objects.get(id=product_id)
                    kwargs["queryset"] = SubCategory.objects.filter(category=product.category)
                except Product.DoesNotExist:
                    kwargs["queryset"] = SubCategory.objects.none()
            else:
                # For new products, allow selecting any existing sub-category.
                # The JS will filter options by the chosen category, and the form's
                # clean() method validates the category/sub-category relationship.
                kwargs["queryset"] = SubCategory.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
