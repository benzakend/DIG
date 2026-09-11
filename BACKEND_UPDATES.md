# Backend Updates - New Product Attributes

## Overview
Added two new attributes to the Django backend:

1. **`show_in_gallery`** - Boolean field to control whether a product is displayed in the gallery
2. **`SubCategory`** - New model that properly links categories and products

## Changes Made

### 1. New SubCategory Model (`shop/products/models.py`)
- Created `SubCategory` model with:
  - `name` - Name of the sub-category
  - `category` - ForeignKey to Category
  - `description` - Optional description
  - `created_at` - Timestamp
- Updated `Product` model:
  - Added `show_in_gallery = models.BooleanField(default=True, verbose_name="הצג בגלריה")`
  - Changed `sub_category` to ForeignKey to SubCategory model

### 2. Admin Interface Updates (`shop/products/admin.py`)
- Added `SubCategoryAdmin` for managing sub-categories
- Updated `ProductAdmin` to work with the new ForeignKey relationship
- Added new fields to `list_display`, `list_filter`, and `fieldsets`
- **NEW**: Added `ProductAdminForm` with server-side validation
- **NEW**: Added dynamic sub-category filtering via JavaScript
- **NEW**: Added API endpoint for fetching sub-categories by category

### 3. JavaScript Enhancement (`shop/static/admin/js/product_admin.js`)
- **NEW**: Dynamic filtering of sub-category dropdown based on selected category
- **NEW**: AJAX calls to fetch relevant sub-categories
- **NEW**: Preserves selected sub-category when editing existing products
- **NEW**: Handles both new product creation and product editing

### 4. API Serializer Updates (`shop/products/serializers.py`)
- Added `SubCategorySerializer` for sub-category API responses
- Updated `ProductSerializer` to include `sub_category_name` field
- Added proper serialization for the ForeignKey relationship

### 5. API Views Updates (`shop/products/views.py`)
- Added `SubCategoryListAPIView` for listing sub-categories
- Enhanced `ProductListAPIView` with filtering by sub-category IDs
- Updated search functionality to include sub-category names
- Created `GalleryProductListAPIView` for gallery-specific products

### 6. URL Configuration (`shop/products/urls.py`)
- Added new endpoint: `/api/subcategories/` for sub-categories
- Added new endpoint: `/api/products/gallery/` for gallery products

### 7. Database Migration
- Created and applied migration `0004_product_show_in_gallery_subcategory_and_more.py`

## API Endpoints

### Categories
- `GET /api/categories/` - List all categories

### Sub-Categories
- `GET /api/subcategories/` - List all sub-categories
- `GET /api/subcategories/?category=1` - Filter sub-categories by category

### Products
- `GET /api/products/` - List all products (with enhanced filtering)
- `GET /api/products/gallery/` - List only gallery products
- `GET /api/products/<id>/` - Get specific product

### Admin API (Internal)
- `GET /admin/products/product/api/subcategories/<category_id>/` - Get sub-categories for admin interface

## Usage Examples

### Get sub-categories for a specific category
```
GET /api/subcategories/?category=1
```

### Filter products by sub-category
```
GET /api/products/?sub_category=1&sub_category=2
```

### Get only gallery products
```
GET /api/products/?show_in_gallery=true
```

### Get gallery products (dedicated endpoint)
```
GET /api/products/gallery/
```

### Search including sub-category names
```
GET /api/products/?search=engine
```

## Admin Interface Features

### Sub-Category Management
- Full CRUD operations for sub-categories
- Filtering by parent category
- Search functionality
- Proper Hebrew labels

### Product Management
- **NEW**: Dynamic sub-category dropdown that filters based on selected category
- **NEW**: Server-side validation prevents invalid sub-category selections
- **NEW**: JavaScript enhancement for better user experience
- Inline editing for show_in_gallery
- Filtering by category, sub-category, and gallery visibility
- Search includes sub-category names

### Enhanced User Experience
- **Dynamic Filtering**: Sub-category dropdown automatically updates when category changes
- **Validation**: Server-side validation ensures data integrity
- **Preservation**: Selected sub-category is preserved when editing existing products
- **Error Handling**: Clear error messages in Hebrew for validation failures

## Data Structure

### SubCategory Model
```python
{
    "id": 1,
    "name": "Engine Parts",
    "category": 1,  # ForeignKey to Category
    "category_name": "Tractor Parts",  # Read-only
    "description": "Engine components and parts",
    "created_at": "2025-08-22T05:04:00Z"
}
```

### Product Model (Updated)
```python
{
    "id": 1,
    "name": "Engine Filter",
    "category": 1,
    "category_name": "Tractor Parts",
    "sub_category": 1,
    "sub_category_name": "Engine Parts",
    "show_in_gallery": true,
    # ... other fields
}
```

## Relationships
- **Category** → **SubCategory** (One-to-Many)
- **SubCategory** → **Product** (One-to-Many)
- **Category** → **Product** (One-to-Many, through sub-category)

## Validation Rules
- **Server-side**: Sub-category must belong to the selected category
- **Client-side**: Dynamic filtering prevents invalid selections
- **Error Messages**: Hebrew error messages for validation failures

## Migration Status
✅ Migration created and applied successfully
✅ All existing data preserved
✅ New SubCategory model available
✅ Proper ForeignKey relationships established
✅ API endpoints working correctly
✅ Dynamic filtering implemented
✅ Server-side validation added
✅ JavaScript enhancement working
