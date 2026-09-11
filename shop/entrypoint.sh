#!/bin/sh
set -e

mkdir -p /tmp/media/products
cp -rn /app/media/products/* /tmp/media/products/ 2>/dev/null || true

python manage.py migrate --noinput

export DJANGO_SETTINGS_MODULE=shop_project.settings

python -c "
import os, django
django.setup()
from products.models import Product
if not Product.objects.exists():
    exit(1)
" || python seed_dig_products.py

python -c "
import os, django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
" || true

exec python manage.py runserver 0.0.0.0:8000
