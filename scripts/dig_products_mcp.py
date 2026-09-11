#!/usr/bin/env python3
"""
DIG Products MCP Server
=======================
Standard Model Context Protocol (MCP) server providing AI agents with tools to:
- view_products: search and list products
- get_product: get full details of a specific product
- add_product: create new products in the store database
- delete_product: remove products from the store database
- list_categories: browse store categories and subcategories

Protocol: JSON-RPC 2.0 over Stdio
"""

import sys
import os
import json
import traceback
from decimal import Decimal

# Bootstrap Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOP_DIR = os.path.join(BASE_DIR, 'shop')
if SHOP_DIR not in sys.path:
    sys.path.insert(0, SHOP_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shop_project.settings')

try:
    import django
    django.setup()
    from products.models import Product, Category, SubCategory
    from django.db.models import Q
except Exception as e:
    sys.stderr.write(f"Failed to bootstrap Django: {e}\n{traceback.format_exc()}\n")
    sys.exit(1)


# Tool Definitions
TOOLS = [
    {
        "name": "view_products",
        "description": "List or search products in the DIG store with optional filters for category, keyword search, or status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "search": {
                    "type": "string",
                    "description": "Search keyword in product title, description, or subcategory"
                },
                "category_name": {
                    "type": "string",
                    "description": "Filter by category name (partial or exact match)"
                },
                "category_id": {
                    "type": "integer",
                    "description": "Filter by category ID"
                },
                "is_active": {
                    "type": "boolean",
                    "description": "Filter by active status (default: true)"
                },
                "featured_only": {
                    "type": "boolean",
                    "description": "Filter only featured products"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of products to return (default: 50)"
                }
            }
        }
    },
    {
        "name": "get_product",
        "description": "Get complete detailed information about a specific product by its ID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "integer",
                    "description": "The unique ID of the product"
                }
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "add_product",
        "description": "Add a new luxury product into the DIG catalog and database. The product will immediately appear in the store.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Product name (e.g. 'עניבת משי ספיר מלכותית DIG Sapphire Royale')"
                },
                "description": {
                    "type": "string",
                    "description": "Full product description highlighting luxury materials, wedding style, etc."
                },
                "price": {
                    "type": "number",
                    "description": "Price in Israeli Shekels (₪)"
                },
                "category_name": {
                    "type": "string",
                    "description": "Category name (e.g. 'עניבות ופפיונים', 'חפתים וסיכות דש', 'ממחטות כיס ושלייקס', 'שעונים וצמידים לגבר', 'חבילות חתן ומסיבות'). If omitted, defaults to first available category."
                },
                "category_id": {
                    "type": "integer",
                    "description": "Optional category ID if known"
                },
                "sub_category_name": {
                    "type": "string",
                    "description": "Subcategory name (optional, will be created under category if it doesn't exist)"
                },
                "sku": {
                    "type": "string",
                    "description": "Unique SKU code (optional, will be auto-generated if omitted)"
                },
                "image_filename": {
                    "type": "string",
                    "description": "Filename of image in media/products/ (e.g. 'dig_emerald_tie.jpg'). Defaults to 'dig_groom_vip_box.jpg' if not specified."
                },
                "featured": {
                    "type": "boolean",
                    "description": "Whether to mark as featured product (default: false)"
                },
                "show_in_gallery": {
                    "type": "boolean",
                    "description": "Whether to display in inspiration gallery carousel (default: true)"
                },
                "is_active": {
                    "type": "boolean",
                    "description": "Whether product is active and visible to buyers (default: true)"
                }
            },
            "required": ["name", "description", "price"]
        }
    },
    {
        "name": "delete_product",
        "description": "Delete a product from the DIG store by its ID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "integer",
                    "description": "The unique ID of the product to delete"
                }
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "list_categories",
        "description": "List all product categories and subcategories in the DIG catalog.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]


def serialize_product(product):
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price) if product.price is not None else None,
        "sku": product.sku,
        "category": {
            "id": product.category.id,
            "name": product.category.name
        } if product.category else None,
        "sub_category": {
            "id": product.sub_category.id,
            "name": product.sub_category.name
        } if product.sub_category else None,
        "image": product.image.url if product.image else None,
        "featured": product.featured,
        "show_in_gallery": product.show_in_gallery,
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat() if hasattr(product, 'created_at') and product.created_at else None
    }


def handle_view_products(args):
    qs = Product.objects.select_related('category', 'sub_category').all()
    
    is_active = args.get("is_active", True)
    if is_active is not None:
        qs = qs.filter(is_active=is_active)
        
    if args.get("featured_only"):
        qs = qs.filter(featured=True)
        
    category_id = args.get("category_id")
    if category_id:
        qs = qs.filter(category_id=category_id)
        
    category_name = args.get("category_name")
    if category_name:
        qs = qs.filter(category__name__icontains=category_name)
        
    search = args.get("search")
    if search:
        qs = qs.filter(
            Q(name__icontains=search) | 
            Q(description__icontains=search) |
            Q(sub_category__name__icontains=search)
        )
        
    limit = args.get("limit", 50)
    products = qs.order_by('-id')[:limit]
    
    result = [serialize_product(p) for p in products]
    return {
        "count": len(result),
        "total_matching": qs.count(),
        "products": result
    }


def handle_get_product(args):
    product_id = args.get("product_id")
    if not product_id:
        raise ValueError("Missing required argument: 'product_id'")
        
    try:
        product = Product.objects.select_related('category', 'sub_category').get(id=product_id)
        return serialize_product(product)
    except Product.DoesNotExist:
        raise ValueError(f"Product with ID {product_id} was not found.")


def handle_add_product(args):
    name = args.get("name")
    if not name or not str(name).strip():
        raise ValueError("Product 'name' is required.")
        
    description = args.get("description", "")
    price = args.get("price")
    if price is None:
        raise ValueError("Product 'price' is required.")
    
    try:
        price_decimal = Decimal(str(price))
        if price_decimal <= 0:
            raise ValueError()
    except Exception:
        raise ValueError(f"Invalid price value '{price}'. Must be a positive number.")

    # Determine Category
    category = None
    category_id = args.get("category_id")
    category_name = args.get("category_name")
    
    if category_id:
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise ValueError(f"Category ID {category_id} not found.")
    elif category_name:
        category, _ = Category.objects.get_or_create(
            name=category_name.strip(),
            defaults={"description": f"קולקציית {category_name.strip()} יוקרתית מבית DIG"}
        )
    else:
        category = Category.objects.first()
        if not category:
            category = Category.objects.create(name="קולקציית DIG", description="מוצרי יוקרה")

    # Determine SubCategory
    sub_category = None
    sub_category_name = args.get("sub_category_name")
    if sub_category_name and sub_category_name.strip():
        sub_category, _ = SubCategory.objects.get_or_create(
            name=sub_category_name.strip(),
            category=category,
            defaults={"description": f"{sub_category_name.strip()}"}
        )

    # Determine Image
    image_filename = args.get("image_filename")
    if image_filename:
        # Standardize relative path inside upload_to
        clean_name = os.path.basename(image_filename)
        image_path = f"products/{clean_name}"
    else:
        image_path = "products/dig_groom_vip_box.jpg"

    # SKU
    sku = args.get("sku")
    if not sku:
        import random
        rand_suffix = random.randint(1000, 9999)
        sku = f"DIG-{category.id if category else 0}-{rand_suffix}"

    product = Product.objects.create(
        name=name.strip(),
        description=description.strip(),
        price=price_decimal,
        category=category,
        sub_category=sub_category,
        image=image_path,
        sku=sku,
        featured=bool(args.get("featured", False)),
        show_in_gallery=bool(args.get("show_in_gallery", True)),
        is_active=bool(args.get("is_active", True))
    )

    return {
        "success": True,
        "message": f"Product '{product.name}' (ID: {product.id}) added successfully.",
        "product": serialize_product(product)
    }


def handle_delete_product(args):
    product_id = args.get("product_id")
    if not product_id:
        raise ValueError("Missing required argument: 'product_id'")
        
    try:
        product = Product.objects.get(id=product_id)
        deleted_info = {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "price": float(product.price) if product.price else None
        }
        product.delete()
        return {
            "success": True,
            "message": f"Product '{deleted_info['name']}' (ID: {deleted_info['id']}) was successfully deleted.",
            "deleted_product": deleted_info
        }
    except Product.DoesNotExist:
        raise ValueError(f"Cannot delete: Product with ID {product_id} does not exist.")


def handle_list_categories(args):
    cats = Category.objects.prefetch_related('sub_categories').all()
    data = []
    for c in cats:
        data.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "subcategories": [
                {"id": s.id, "name": s.name} for s in c.sub_categories.all()
            ]
        })
    return {"categories": data}


TOOL_HANDLERS = {
    "view_products": handle_view_products,
    "get_product": handle_get_product,
    "add_product": handle_add_product,
    "delete_product": handle_delete_product,
    "list_categories": handle_list_categories
}


def send_response(response_dict):
    """Write JSON-RPC message followed by newline to stdout and flush."""
    data = json.dumps(response_dict, ensure_ascii=False)
    sys.stdout.write(data + "\n")
    sys.stdout.flush()


def main():
    """Main JSON-RPC stdio loop."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
            
        try:
            req = json.loads(line)
        except json.JSONDecodeError as e:
            send_response({
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
            })
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        # Handle notifications (no id)
        if req_id is None and method == "notifications/initialized":
            continue

        # Handle requests
        if method == "initialize":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "dig-products-mcp",
                        "version": "1.0.0"
                    }
                }
            })
        elif method == "ping":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            })
        elif method == "tools/list":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": TOOLS
                }
            })
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            handler = TOOL_HANDLERS.get(tool_name)
            
            if not handler:
                send_response({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": f"Error: Unknown tool '{tool_name}'"}
                        ],
                        "isError": True
                    }
                })
            else:
                try:
                    result_data = handler(arguments)
                    send_response({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result_data, ensure_ascii=False, indent=2)
                                }
                            ],
                            "isError": False
                        }
                    })
                except Exception as ex:
                    send_response({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {"type": "text", "text": f"Error executing '{tool_name}': {str(ex)}"}
                            ],
                            "isError": True
                        }
                    })
        else:
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method not found: {method}"}
            })


if __name__ == "__main__":
    main()
