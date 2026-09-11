from rest_framework import generics, permissions
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Product, Category, SubCategory
from .serializers import ProductSerializer, CategorySerializer, SubCategorySerializer

# Create your views here.

class CategoryListAPIView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None  # Disable pagination for categories

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

class SubCategoryListAPIView(generics.ListCreateAPIView):
    serializer_class = SubCategorySerializer
    pagination_class = None  # Disable pagination for subcategories
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = SubCategory.objects.all()
        category = self.request.query_params.get('category', None)
        
        if category:
            queryset = queryset.filter(category__id=category)
        
        return queryset.order_by('category', 'name')

class ProductListAPIView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        categories = self.request.query_params.getlist('category')
        sub_categories = self.request.query_params.getlist('sub_category')
        featured = self.request.query_params.get('featured', None)
        show_in_gallery = self.request.query_params.get('show_in_gallery', None)
        search = self.request.query_params.get('search', None)
        
        if categories:
            queryset = queryset.filter(category__id__in=categories)
        
        if sub_categories:
            queryset = queryset.filter(sub_category__id__in=sub_categories)
        
        if featured is not None:
            queryset = queryset.filter(featured=True)
            
        if show_in_gallery is not None:
            queryset = queryset.filter(show_in_gallery=True)
            
        if search is not None:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) | 
                Q(sub_category__name__icontains=search)
            )
        
        return queryset.order_by('-created_at')

class GalleryProductListAPIView(generics.ListAPIView):
    """API view specifically for products that should be shown in the gallery"""
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        return Product.objects.filter(
            is_active=True, 
            show_in_gallery=True
        ).order_by('-created_at')

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()]


class ShopBootstrapAPIView(generics.GenericAPIView):
    """Aggregate endpoint to reduce frontend round-trips.

    Returns categories, subcategories (optionally filtered by category), and
    the first page of products matching optional filters.
    """
    def get(self, request, *args, **kwargs):
        categories_qs = Category.objects.all().order_by('name')
        subcategories_qs = SubCategory.objects.all().order_by('category', 'name')

        categories = CategorySerializer(categories_qs, many=True).data
        subcategories = SubCategorySerializer(subcategories_qs, many=True).data

        products = ProductListAPIView.as_view()
        # Delegate to ProductListAPIView to keep filter logic in one place
        product_response = products(request._request)
        product_data = product_response.data if isinstance(product_response, Response) else product_response

        response = Response({
            'categories': categories,
            'subcategories': subcategories,
            'products': product_data,
        })
        # Basic caching headers (can be tuned later)
        response['Cache-Control'] = 'public, max-age=60'
        return response
