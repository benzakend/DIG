from rest_framework import serializers
from .models import Category, SubCategory, Product
from django.conf import settings

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']

class SubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'category', 'category_name', 'description', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    sub_category_name = serializers.CharField(source='sub_category.name', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'image_url', 'category', 
            'category_name', 'sub_category', 'sub_category_name', 'is_active', 'featured', 
            'show_in_gallery', 'sku', 'weight', 'dimensions', 
            'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request and not settings.DEBUG:
                # In production, always use HTTPS
                return f"https://shaubi-brothers.co.il{obj.image.url}"
            elif request:
                # In development, use request context
                return request.build_absolute_uri(obj.image.url)
            else:
                # Fallback for when no request context is available
                if settings.DEBUG:
                    return f"http://localhost:8000{obj.image.url}"
                else:
                    return f"https://shaubi-brothers.co.il{obj.image.url}"
        return None 