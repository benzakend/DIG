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
    image_url = serializers.SerializerMethodField(read_only=True)
    image = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image', 'image_url', 'category', 
            'category_name', 'sub_category', 'sub_category_name', 'is_active', 'featured', 
            'show_in_gallery', 'sku', 'weight', 'dimensions', 
            'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def create(self, validated_data):
        image_data = validated_data.pop('image', None)
        if image_data:
            clean_name = image_data.strip()
            if not clean_name.startswith('products/'):
                clean_name = f"products/{clean_name}"
            validated_data['image'] = clean_name
        else:
            validated_data['image'] = "products/dig_groom_vip_box.jpg"

        if not validated_data.get('sku'):
            import random
            cat_id = validated_data.get('category').id if validated_data.get('category') else 0
            validated_data['sku'] = f"DIG-{cat_id}-{random.randint(1000, 9999)}"

        return super().create(validated_data) 