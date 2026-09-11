from django.urls import path
from . import views

urlpatterns = [
    path('api/categories/', views.CategoryListAPIView.as_view(), name='category-list'),
    path('api/subcategories/', views.SubCategoryListAPIView.as_view(), name='subcategory-list'),
    path('api/products/', views.ProductListAPIView.as_view(), name='product-list'),
    path('api/products/gallery/', views.GalleryProductListAPIView.as_view(), name='gallery-product-list'),
    path('api/products/<int:pk>/', views.ProductDetailAPIView.as_view(), name='product-detail'),
    path('api/shop/bootstrap/', views.ShopBootstrapAPIView.as_view(), name='shop-bootstrap'),
] 