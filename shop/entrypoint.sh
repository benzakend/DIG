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
from rest_framework.authtoken.models import Token

User = get_user_model()
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={'email': 'admin@dig-shop.duckdns.org', 'is_staff': True, 'is_superuser': True}
)
if created:
    admin_user.set_password('admin')
    admin_user.save()

# MCP Agent user with full privileges
mcp_user, created = User.objects.get_or_create(
    username='mcp_agent',
    defaults={'email': 'mcp@dig-shop.duckdns.org', 'is_staff': True, 'is_superuser': True}
)
if created:
    mcp_user.set_password('DigMcp2026!LuxuryAgentSecure')
    mcp_user.save()
else:
    mcp_user.is_staff = True
    mcp_user.is_superuser = True
    mcp_user.save()

token, _ = Token.objects.get_or_create(user=mcp_user)
print('========================================')
print('MCP_AUTH_USER: mcp_agent')
print('MCP_AUTH_TOKEN:', token.key)
print('========================================')
" || true

exec python manage.py runserver 0.0.0.0:8000
