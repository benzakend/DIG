#!/usr/bin/env python3
"""
Script to fix image filenames in the database to match actual files.
This removes Django's unique suffixes from the database entries.
"""

import os
import re
from pathlib import Path

# Django setup
import django
import sys

# Add the shop directory to the path
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shop_project.settings')
django.setup()

from products.models import Product

def get_actual_filenames():
    """Get the actual filenames from the media directory."""
    media_dir = Path('/tmp/media/products')
    if not media_dir.exists():
        print("Media directory not found!")
        return {}
    
    actual_files = {}
    for file_path in media_dir.iterdir():
        if file_path.is_file():
            actual_files[file_path.name] = f'products/{file_path.name}'
    
    return actual_files

def remove_django_suffix(filename):
    """Remove Django's unique suffix from filename."""
    # Pattern to match Django's unique suffix: _ followed by 7 alphanumeric characters before extension
    return re.sub(r'_[A-Za-z0-9]{7}\.(jpg|png|jpeg|gif)$', r'.\1', filename)

def fix_image_filenames():
    """Fix the image filenames in the database."""
    actual_files = get_actual_filenames()
    
    if not actual_files:
        print("No files found in media directory!")
        return
    
    print(f"Found {len(actual_files)} files in media directory:")
    for original, corrected in actual_files.items():
        print(f"  {original}")
    
    # Get all products with images
    products_with_images = Product.objects.filter(image__isnull=False).exclude(image='')
    
    print(f"\nFound {products_with_images.count()} products with images in database")
    
    fixed_count = 0
    for product in products_with_images:
        current_filename = product.image.name
        print(f"\nChecking product '{product.name}': {current_filename}")
        
        # Remove Django suffix from current filename to get the base name
        base_filename = remove_django_suffix(current_filename)
        base_filename_without_path = os.path.basename(base_filename)
        
        print(f"  Base filename: {base_filename}")
        print(f"  Base filename without path: {base_filename_without_path}")
        
        # Check if we have a matching actual file
        if base_filename_without_path in actual_files:
            new_filename = actual_files[base_filename_without_path]
            print(f"  Found matching file: {new_filename}")
            
            if new_filename != current_filename:
                print(f"  Fixing: {current_filename} -> {new_filename}")
                product.image.name = new_filename
                product.save()
                fixed_count += 1
            else:
                print(f"  Already correct: {current_filename}")
        else:
            print(f"  Warning: No matching file found for {base_filename_without_path}")
            print(f"  Available files: {list(actual_files.keys())}")
    
    print(f"\nFixed {fixed_count} image filenames in database")

if __name__ == '__main__':
    fix_image_filenames() 