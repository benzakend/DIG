import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shop_project.settings')
django.setup()

from products.models import Category, SubCategory, Product
from django.core.files import File
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

print("Seeding DIG luxury men's accessories...")

# Clear existing products, subcategories, categories
Product.objects.all().delete()
SubCategory.objects.all().delete()
Category.objects.all().delete()

media_dir = os.path.join(os.path.dirname(__file__), 'media', 'products')
os.makedirs(media_dir, exist_ok=True)

def generate_product_image(filename, title, subtitle, bg_color1, bg_color2, accent_color, icon_symbol="✦"):
    """Generate a clean luxury product banner / mockup image"""
    width, height = 600, 600
    image = Image.new("RGB", (width, height), bg_color1)
    draw = ImageDraw.Draw(image)

    # Gradient-like diagonal stripes
    for y in range(height):
        ratio = y / height
        r = int(bg_color1[0] * (1 - ratio) + bg_color2[0] * ratio)
        g = int(bg_color1[1] * (1 - ratio) + bg_color2[1] * ratio)
        b = int(bg_color1[2] * (1 - ratio) + bg_color2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Luxury border
    draw.rectangle([25, 25, width - 25, height - 25], outline=accent_color, width=3)
    draw.rectangle([35, 35, width - 35, height - 35], outline=accent_color, width=1)

    # Center luxury medallion
    cx, cy = width // 2, height // 2 - 40
    draw.ellipse([cx - 100, cy - 100, cx + 100, cy + 100], fill=(15, 23, 42), outline=accent_color, width=3)

    # Decorative sparkles
    draw.line([cx - 40, cy, cx + 40, cy], fill=accent_color, width=2)
    draw.line([cx, cy - 40, cx, cy + 40], fill=accent_color, width=2)
    draw.rectangle([cx - 20, cy - 20, cx + 20, cy + 20], outline=accent_color, width=2)

    # Bottom banner for title
    draw.rectangle([45, height - 150, width - 45, height - 45], fill=(10, 15, 30, 220), outline=accent_color, width=2)

    filepath = os.path.join(media_dir, filename)
    image.save(filepath, format="JPEG", quality=95)
    return os.path.join('products', filename)

# Categories & Subcategories definition
categories_data = [
    {
        "name": "עניבות ופפיונים",
        "description": "עניבות משי איטלקי ופפיוני קטיפה יוקרתיים לחתונות, ערבי גאלה ומסיבות",
        "subcategories": [
            {"name": "עניבות משי יוקרתיות", "description": "עניבות משי 100% באריגת ז'קארד מובחרת"},
            {"name": "פפיונים לחתן ולמסיבות", "description": "פפיוני סאטן וקטיפה במראה מלכותי"},
            {"name": "סטי עניבה וממחטה", "description": "סטים מתואמים בצבעוניות מושלמת"}
        ]
    },
    {
        "name": "חפתים וסיכות דש",
        "description": "חפתים בציפוי זהב וכסף, משובצים באבני אוניקס וספיר, וסיכות דש מרהיבות",
        "subcategories": [
            {"name": "חפתים בציפוי זהב 18K", "description": "חפתים קלאסיים ומודרניים בציפוי זהב יוקרתי"},
            {"name": "סיכות דש מעוצבות", "description": "סיכות פרח משי ואבני חן לדש הז'קט"},
            {"name": "קליפסים לעניבה", "description": "קליפסים אלגנטיים לשמירה על מראה מוקפד"}
        ]
    },
    {
        "name": "ממחטות כיס ושלייקס",
        "description": "ממחטות כיס ממשי צבעוני ושלייקס יוקרתיים לאירועים ולריקודים",
        "subcategories": [
            {"name": "ממחטות כיס ממשי טהור", "description": "דוגמאות פייזלי, נקודות וצבעים עשירים"},
            {"name": "שלייקס עור וסאטן", "description": "שלייקס קלאסיים עם סגרי עור ומתכת מוזהבת"}
        ]
    },
    {
        "name": "שעונים וצמידים לגבר",
        "description": "שעוני ערב אלגנטיים, צמידי עור איטלקי וטבעות חותם",
        "subcategories": [
            {"name": "שעוני ערב יוקרתיים", "description": "שעונים מוזהבים עם מנגנון קוורץ שוויצרי מדויק"},
            {"name": "צמידי עור ומתכת", "description": "צמידים יוקרתיים עם סגרי מגנט וזהב"}
        ]
    },
    {
        "name": "חבילות חתן ומסיבות",
        "description": "מארזים שלמים לחתנים, לשושבינים ולמסיבות רווקים מלאות סטייל",
        "subcategories": [
            {"name": "חבילת חתן VIP", "description": "כל האביזרים הדרושים ליום החתונה במארז אחד"},
            {"name": "מארזי שושבינים", "description": "סטים תואמים לנבחרת החתן במחיר מיוחד"},
            {"name": "ערכות מסיבה", "description": "אביזרי מסיבה זוהרים ויוקרתיים לרחבת הריקודים"}
        ]
    }
]

created_categories = {}
created_subcategories = {}

for cat_info in categories_data:
    cat = Category.objects.create(name=cat_info["name"], description=cat_info["description"])
    created_categories[cat.name] = cat
    print(f"Created category: {cat.name}")

    for sub_info in cat_info["subcategories"]:
        subcat = SubCategory.objects.create(
            name=sub_info["name"],
            category=cat,
            description=sub_info["description"]
        )
        created_subcategories[sub_info["name"]] = subcat

# Products definition
products_data = [
    # Ties & Bowties
    {
        "name": "עניבת משי אמרלד מלכותית DIG Royal Emerald",
        "category": "עניבות ופפיונים",
        "sub_category": "עניבות משי יוקרתיות",
        "price": 280.00,
        "description": "עניבת משי 100% איטלקית בצבע ירוק אמרלד עמוק עם דוגמת ז'קארד מובלטת ועיטורי זהב עדינים. מושלמת לחליפות כחול כהה ושחור בערבי חתונה ואירועים יוקרתיים.",
        "img": ("dig_emerald_tie.jpg", (6, 78, 59), (4, 47, 46), (212, 175, 55)),
        "featured": True
    },
    {
        "name": "פפיון קטיפה בורדו יוקרתי Velvet Royale",
        "category": "עניבות ופפיונים",
        "sub_category": "פפיונים לחתן ולמסיבות",
        "price": 240.00,
        "description": "פפיון קטיפה עשיר בצבע בורדו-יין מלכותי עם רצועה מתכווננת וסגר מתכת מוזהב. הבחירה המושלמת לחתן נועז או לאירוע גאלה ומסיבת קוקטייל נוצצת.",
        "img": ("dig_velvet_bowtie.jpg", (88, 28, 135), (74, 4, 78), (245, 158, 11)),
        "featured": True
    },
    {
        "name": "סט חתן זהב וכחול ספיר: עניבה וממחטה",
        "category": "עניבות ופפיונים",
        "sub_category": "סטי עניבה וממחטה",
        "price": 420.00,
        "description": "מארז חתן יוקרתי הכולל עניבת משי בגוון כחול ספיר עמוק עם נגיעות זהב, וממחטת כיס משי תואמת. מגיע בקופסת תכשיטים מהודרת.",
        "img": ("dig_sapphire_set.jpg", (10, 25, 47), (2, 44, 89), (212, 175, 55)),
        "featured": True
    },
    {
        "name": "פפיון משי שחור קלאסי Black Tie Gala",
        "category": "עניבות ופפיונים",
        "sub_category": "פפיונים לחתן ולמסיבות",
        "price": 190.00,
        "description": "פפיון סאטן משי שחור מבריק בקשירה מושלמת. הפריט האולטימטיבי לטוקסידו וערבי Black Tie יוקרתיים.",
        "img": ("dig_black_tie_bowtie.jpg", (15, 23, 42), (0, 0, 0), (250, 204, 21)),
        "featured": False
    },

    # Cufflinks & Pins
    {
        "name": "חפתים בציפוי זהב 18K עם שיבוץ אוניקס שחור",
        "category": "חפתים וסיכות דש",
        "sub_category": "חפתים בציפוי זהב 18K",
        "price": 360.00,
        "description": "זוג חפתים יוקרתיים בציפוי זהב 18 קראט בגימור מראה, משובצים באבן אוניקס שחורה טבעית בחיתוך מדויק. סגר T-bar נוח ועמיד.",
        "img": ("dig_gold_cufflinks.jpg", (20, 20, 20), (45, 35, 15), (212, 175, 55)),
        "featured": True
    },
    {
        "name": "חפתי ספיר כחול רויאל בציפוי כסף",
        "category": "חפתים וסיכות דש",
        "sub_category": "חפתים בציפוי זהב 18K",
        "price": 320.00,
        "description": "חפתים יוקרתיים בשיבוץ קריסטל ספיר כחול עמוק, מוקפים בטבעת פליז מצופה רודיום כסוף בוהק.",
        "img": ("dig_sapphire_cufflinks.jpg", (3, 37, 76), (10, 15, 30), (14, 165, 233)),
        "featured": False
    },
    {
        "name": "סיכת דש פרח משי לחתונה DIG Camellia",
        "category": "חפתים וסיכות דש",
        "sub_category": "סיכות דש מעוצבות",
        "price": 150.00,
        "description": "סיכת דש עבודת יד ממשי איכותי בגוון שנהב וזהב. מוסיפה טאץ' רומנטי ואלגנטי לחתן ולשושבינים ביום החופה.",
        "img": ("dig_lapel_pin.jpg", (60, 45, 20), (30, 25, 10), (245, 208, 115)),
        "featured": False
    },
    {
        "name": "קליפס עניבה זהב 18K בחריטה גיאומטרית",
        "category": "חפתים וסיכות דש",
        "sub_category": "קליפסים לעניבה",
        "price": 180.00,
        "description": "קליפס עניבה צר ומודרני בציפוי זהב 18 קראט עם חריטה עדינה. שומר על העניבה במקומה לאורך כל יום האירוע והריקודים.",
        "img": ("dig_tie_clip.jpg", (30, 25, 15), (50, 40, 20), (234, 179, 8)),
        "featured": False
    },

    # Pocket Squares & Suspenders
    {
        "name": "ממחטת כיס משי פייזלי צבעונית Vibrant Paisley",
        "category": "ממחטות כיס ושלייקס",
        "sub_category": "ממחטות כיס ממשי טהור",
        "price": 160.00,
        "description": "ממחטת כיס 100% משי איטלקי בדוגמת פייזלי עשירה המשלבת גווני זהב, רובי, ירוק אמרלד וספיר. מקפיצה כל חליפה לרמת אופנה עילאית.",
        "img": ("dig_paisley_square.jpg", (74, 4, 78), (112, 26, 117), (250, 204, 21)),
        "featured": True
    },
    {
        "name": "שלייקס עור ומשי שחור-זהב DIG Heritage",
        "category": "ממחטות כיס ושלייקס",
        "sub_category": "שלייקס עור וסאטן",
        "price": 290.00,
        "description": "שלייקס יוקרתיים בעיצוב Y עם רצועות סאטן אלסטיות, סגרי עור אמיתי וכפתורי מתכת בציפוי זהב. מתאימים לכפתורי מכנסיים או לקליפסים.",
        "img": ("dig_suspenders.jpg", (15, 23, 42), (30, 41, 59), (212, 175, 55)),
        "featured": False
    },

    # Watches & Bracelets
    {
        "name": "שעון ערב מוזהב לגבר DIG Chrono Sovereign",
        "category": "שעונים וצמידים לגבר",
        "sub_category": "שעוני ערב יוקרתיים",
        "price": 890.00,
        "description": "שעון ערב יוקרתי עם גוף פלדת אל-חלד בציפוי זהב, לוח כחול רויאל מחוגי זהב וזכוכית ספיר עמידה בשריטות. רצועת עור איטלקי חום כהה.",
        "img": ("dig_gold_watch.jpg", (10, 25, 47), (5, 12, 25), (212, 175, 55)),
        "featured": True
    },
    {
        "name": "צמיד עור שחור קלוע עם סגר זהב 18K",
        "category": "שעונים וצמידים לגבר",
        "sub_category": "צמידי עור ומתכת",
        "price": 260.00,
        "description": "צמיד עור בקר איטלקי מובחר בקליעה כפולה, עם סגר מגנטי מאובטח בציפוי זהב 18 קראט בחריטת DIG.",
        "img": ("dig_leather_bracelet.jpg", (24, 24, 27), (39, 39, 42), (212, 175, 55)),
        "featured": False
    },

    # Groom & Party Packages
    {
        "name": "מארז חתן מושלם VIP Groom Celebration Box",
        "category": "חבילות חתן ומסיבות",
        "sub_category": "חבילת חתן VIP",
        "price": 790.00,
        "description": "המארז המקיף ביותר לחתן: כולל פפיון קטיפה יוקרתי, זוג חפתי זהב ואוניקס, ממחטת כיס ממשי, סיכת דש פרח ושעון כיס מוזהב. מגיע בקופסת עור מהודרת עם הטבעת שם אישית.",
        "img": ("dig_groom_vip_box.jpg", (6, 78, 59), (10, 25, 47), (245, 158, 11)),
        "featured": True
    },
    {
        "name": "מארז 5 סטים תואמים לשושבינים Groomsmen Squad",
        "category": "חבילות חתן ומסיבות",
        "sub_category": "מארזי שושבינים",
        "price": 950.00,
        "description": "5 סטים מלאים לשושבינים של החתן: כל סט כולל פפיון סאטן יוקרתי, שלייקס תואמים וממחטת כיס. זמין במבחר גוונים מרהיבים (אמרלד, בורדו, ספיר, שחור קלאסי).",
        "img": ("dig_groomsmen_pack.jpg", (88, 28, 135), (10, 25, 47), (212, 175, 55)),
        "featured": True
    },
    {
        "name": "ערכת מסיבת רווקים וקוקטייל Party King Kit",
        "category": "חבילות חתן ומסיבות",
        "sub_category": "ערכות מסיבה",
        "price": 380.00,
        "description": "ערכה נוצצת למסיבות רווקים ולאפטר-פארטי: פפיון מנצנץ, שלייקס זוהרים, משקפי שמש יוקרתיים וסיכת דש מסיבה.",
        "img": ("dig_party_kit.jpg", (74, 4, 78), (20, 83, 45), (234, 179, 8)),
        "featured": False
    }
]

for p_data in products_data:
    cat = created_categories[p_data["category"]]
    subcat = created_subcategories.get(p_data["sub_category"])

    img_filename, color1, color2, accent = p_data["img"]
    rel_img_path = generate_product_image(
        img_filename,
        p_data["name"],
        p_data["category"],
        color1,
        color2,
        accent
    )

    p = Product.objects.create(
        name=p_data["name"],
        category=cat,
        sub_category=subcat,
        price=p_data["price"],
        description=p_data["description"],
        image=rel_img_path,
        is_active=True,
        featured=p_data["featured"],
        show_in_gallery=True
    )
    print(f"Created product: {p.name} (₪{p.price})")

print(f"Done! Successfully created {Category.objects.count()} categories, {SubCategory.objects.count()} subcategories, and {Product.objects.count()} products.")
