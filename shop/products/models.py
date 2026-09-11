from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="שם הקטגוריה")
    description = models.TextField(blank=True, verbose_name="תיאור")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="נוצר ב")
    
    class Meta:
        verbose_name = "קטגוריה"
        verbose_name_plural = "קטגוריות"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class SubCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name="שם תת-הקטגוריה")
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='sub_categories',
        verbose_name="קטגוריה"
    )
    description = models.TextField(blank=True, verbose_name="תיאור")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="נוצר ב")
    
    class Meta:
        verbose_name = "תת-קטגוריה"
        verbose_name_plural = "תת-קטגוריות"
        ordering = ['category', 'name']
        unique_together = ['name', 'category']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name="שם המוצר")
    description = models.TextField(verbose_name="תיאור")
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="מחיר (₪)"
    )
    image = models.ImageField(upload_to='products/', verbose_name="תמונה")
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='products',
        verbose_name="קטגוריה"
    )
    sub_category = models.ForeignKey(
        SubCategory,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name="תת-קטגוריה",
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True, verbose_name="פעיל")
    featured = models.BooleanField(default=False, verbose_name="מוצר מומלץ")
    show_in_gallery = models.BooleanField(default=True, verbose_name="הצג בגלריה")
    sku = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="מק״ט")
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="משקל (ק״ג)"
    )
    dimensions = models.CharField(max_length=100, blank=True, verbose_name="מידות")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="נוצר ב")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="עודכן ב")
    
    class Meta:
        verbose_name = "מוצר"
        verbose_name_plural = "מוצרים"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'ממתין לאישור'),
        ('confirmed', 'אושר'),
        ('processing', 'בעיבוד'),
        ('shipped', 'נשלח'),
        ('delivered', 'נמסר'),
        ('cancelled', 'בוטל'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True, verbose_name="מספר הזמנה")
    customer_name = models.CharField(max_length=100, verbose_name="שם הלקוח")
    customer_email = models.EmailField(verbose_name="אימייל")
    customer_phone = models.CharField(max_length=15, verbose_name="טלפון")
    shipping_address = models.TextField(verbose_name="כתובת למשלוח")
    city = models.CharField(max_length=50, verbose_name="עיר")
    postal_code = models.CharField(max_length=10, verbose_name="מיקוד")
    
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="סכום כולל (₪)"
    )
    shipping_cost = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="עלות משלוח (₪)"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="סטטוס"
    )
    notes = models.TextField(blank=True, verbose_name="הערות")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="נוצר ב")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="עודכן ב")
    
    class Meta:
        verbose_name = "הזמנה"
        verbose_name_plural = "הזמנות"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"הזמנה #{self.order_number} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="הזמנה")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="מוצר")
    quantity = models.PositiveIntegerField(verbose_name="כמות")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="מחיר ליחידה (₪)")
    
    class Meta:
        verbose_name = "פריט בהזמנה"
        verbose_name_plural = "פריטים בהזמנה"
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def total_price(self):
        return self.quantity * self.price

class Cart(models.Model):
    session_key = models.CharField(max_length=40, unique=True, verbose_name="מפתח סשן")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="נוצר ב")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="עודכן ב")
    
    class Meta:
        verbose_name = "עגלת קניות"
        verbose_name_plural = "עגלות קניות"
    
    def __str__(self):
        return f"עגלה {self.session_key[:8]}..."

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name="עגלה")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="מוצר")
    quantity = models.PositiveIntegerField(default=1, verbose_name="כמות")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="נוסף ב")
    
    class Meta:
        verbose_name = "פריט בעגלה"
        verbose_name_plural = "פריטים בעגלה"
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def total_price(self):
        return self.quantity * self.product.price
