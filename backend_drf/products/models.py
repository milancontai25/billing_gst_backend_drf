# import uuid
# from django.db import models
# from business_entity.models import BusinessEntity
# from django.utils.text import slugify

# def generate_barcode():
#     return str(uuid.uuid4()).replace("-", "")[:12]

# class Item(models.Model):
#     business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="items")

#     ITEM_TYPE_CHOICES = (
#         ("Goods", "Goods"),
#         ("Service", "Service"),
#     )

#     item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)

#     created_date = models.DateField(auto_now_add=True)
#     item_image_url = models.URLField(blank=True, null=True)
#     item_image_1 = models.URLField(blank=True, null=True)
#     item_image_2 = models.URLField(blank=True, null=True)
#     item_image_3 = models.URLField(blank=True, null=True)
#     item_video_link = models.URLField(blank=True, null=True)
#     slug = models.SlugField(max_length=200, blank=True, null=True)
#     item_name = models.CharField(max_length=150, blank=False, null=False)
#     brand_product = models.CharField(max_length=150, blank=False, null=False, default='NA')
#     hsn_sac_code_product = models.CharField(max_length=20, blank=True, null=True, default='NA')
#     category = models.CharField(max_length=100, blank=False, null=False)
#     subcategory = models.CharField(max_length=100, blank=False, null=False)
#     category_image_url = models.URLField(blank=True, null=True)
#     subcategory_image_url = models.URLField(blank=True, null=True)
#     description = models.TextField(blank=True, null=True)

#     unit_product = models.CharField(max_length=50, blank=False, null=False, default='NA')
#     quantity_product = models.IntegerField(blank=False, null=False, default=100)
#     min_order_quantity_product = models.IntegerField(blank=False, null=False, default=1)
#     max_order_quantity_product = models.IntegerField(blank=False, null=False, default=1)

#     mrp_baseprice = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
#     gross_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
#     cost_price_product = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False, default=0)
#     # discount_percent = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)

#     # cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
#     # sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
#     # igst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
#     # cess_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
#     tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    
#     min_stock_product = models.IntegerField(default=0)
    
#     customer_view = models.CharField(max_length=10, default='Special')
#     availability_status_service = models.CharField(max_length=10, default='NA')
#     area = models.CharField(max_length=150, blank=False, null=False)
#     isShow = models.BooleanField(blank=False, null=False, default=False)
#     best_selling = models.BooleanField(blank=False, null=False, default=False)
#     trending = models.BooleanField(blank=False, null=False, default=False)
#     barcode = models.CharField(max_length=100, unique=True, blank=True, null=True)

#     def __str__(self):
#         return self.item_name

#     class Meta:
#         unique_together = ('business', 'slug')

#     # def save(self, *args, **kwargs):
#     #     if not self.slug:
#     #         base_slug = slugify(self.item_name)
#     #         slug = base_slug
#     #         counter = 1

#     #         existing_slugs = set(
#     #             Item.objects.filter(business=self.business, slug__startswith=base_slug)
#     #             .values_list("slug", flat=True)
#     #         )

#     #         while slug in existing_slugs:
#     #             slug = f"{base_slug}-{counter}"
#     #             counter += 1

#     #         self.slug = slug

#     #     super().save(*args, **kwargs)

    

#     def save(self, *args, **kwargs):
#         # ✅ Slug generation (your existing logic)
#         if not self.slug:
#             base_slug = slugify(self.item_name)
#             slug = base_slug
#             counter = 1

#             existing_slugs = set(
#                 Item.objects.filter(business=self.business, slug__startswith=base_slug)
#                 .values_list("slug", flat=True)
#             )

#             while slug in existing_slugs:
#                 slug = f"{base_slug}-{counter}"
#                 counter += 1

#             self.slug = slug

#         if self.item_type.lower() == "goods":
#             if not self.barcode:
#                 while True:
#                     code = generate_barcode()
#                     if not Item.objects.filter(barcode=code).exists():
#                         self.barcode = code
#                         break
#         else:
#             self.barcode = None  # remove if service

#         super().save(*args, **kwargs)




import uuid
from django.db import models
from django.utils.text import slugify
from business_entity.models import BusinessEntity


def generate_barcode():
    return str(uuid.uuid4()).replace("-", "")[:12]


class Item(models.Model):
    business = models.ForeignKey(
        BusinessEntity,
        on_delete=models.CASCADE,
        related_name="items"
    )

    ITEM_TYPE_CHOICES = (
        ("Goods", "Goods"),
        ("Service", "Service"),
    )

    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPE_CHOICES
    )

    created_date = models.DateField(auto_now_add=True)

    # -----------------------------------
    # Product Media
    # -----------------------------------

    item_image_url = models.URLField(blank=True, null=True)
    item_image_1 = models.URLField(blank=True, null=True)
    item_image_2 = models.URLField(blank=True, null=True)
    item_image_3 = models.URLField(blank=True, null=True)

    item_video_link = models.URLField(blank=True, null=True)

    category_image_url = models.URLField(blank=True, null=True)
    subcategory_image_url = models.URLField(blank=True, null=True)

    # -----------------------------------
    # Basic Information
    # -----------------------------------

    slug = models.SlugField(
        max_length=200,
        blank=True,
        null=True
    )

    item_name = models.CharField(max_length=150)

    description = models.TextField(
        blank=True,
        null=True
    )

    category = models.CharField(max_length=100)

    subcategory = models.CharField(max_length=100)

    brand_product = models.CharField(
        max_length=150,
        default="NA"
    )

    hsn_sac_code_product = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default="NA"
    )

    # -----------------------------------
    # Product Details
    # Used only when has_variants=False
    # -----------------------------------

    unit_product = models.CharField(
        max_length=50,
        default="NA"
    )

    quantity_product = models.IntegerField(default=0)

    min_order_quantity_product = models.IntegerField(default=1)

    max_order_quantity_product = models.IntegerField(default=1)

    mrp_baseprice = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    gross_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    cost_price_product = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    tax_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    min_stock_product = models.IntegerField(default=0)

    # -----------------------------------
    # Service
    # -----------------------------------

    availability_status_service = models.CharField(
        max_length=20,
        default="NA"
    )

    # -----------------------------------
    # Marketplace
    # -----------------------------------

    customer_view = models.CharField(
        max_length=20,
        default="Special"
    )

    area = models.CharField(max_length=150)

    isShow = models.BooleanField(default=False)

    best_selling = models.BooleanField(default=False)

    trending = models.BooleanField(default=False)

    # -----------------------------------
    # Variant Support
    # -----------------------------------

    has_variants = models.BooleanField(
        default=False,
        help_text="Enable variants like Color, Size, RAM etc."
    )

    # Used only for simple Goods
    barcode = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True
    )

    class Meta:
        unique_together = (
            ("business", "slug"),
        )
        ordering = ["-created_date", "-id"]

    def __str__(self):
        return self.item_name

    
    @property
    def total_stock(self):
        if self.item_type == "Service":
            return None

        if self.has_variants:
            return sum(
                variant.stock
                for variant in self.variants.filter(is_active=True)
            )

        return self.quantity_product

    @property
    def selling_price(self):
        """
        Returns base selling price.
        Variant prices should be read from ItemVariant.
        """
        return self.gross_amount

    def save(self, *args, **kwargs):

        # Generate unique slug
        if not self.slug:
            base_slug = slugify(self.item_name)
            slug = base_slug
            counter = 1

            while Item.objects.filter(
                business=self.business,
                slug=slug
            ).exclude(pk=self.pk).exists():

                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        # Services never have barcode
        if self.item_type == "Service":
            self.barcode = None

        # Variant products also don't use parent barcode
        elif self.has_variants:
            self.barcode = None

            self.quantity_product = 0
            self.min_stock_product = 0

        # Simple goods get barcode
        elif not self.barcode:
            while True:
                code = generate_barcode()

                if not Item.objects.filter(
                    barcode=code
                ).exclude(pk=self.pk).exists():

                    self.barcode = code
                    break

        super().save(*args, **kwargs)




def generate_barcode():
    return str(uuid.uuid4()).replace("-", "")[:12]


import uuid 

class ItemVariant(models.Model):
    uid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        null=True,
        blank=True
    )
    
    item = models.ForeignKey(
        "Item",
        on_delete=models.CASCADE,
        related_name="variants"
    )
    # ... keep the rest of your fields exactly the same ...

    variant_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional. Example: Red / XL"
    )

    sku = models.CharField(
        max_length=100,
        help_text="Unique SKU within this business."
    )

    barcode = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True
    )

    # Inventory
    stock = models.PositiveIntegerField(default=0)

    min_stock = models.PositiveIntegerField(default=0)

    # Pricing
    mrp_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Order Limits
    min_order_quantity = models.PositiveIntegerField(default=1)

    max_order_quantity = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["item", "sku"],
                name="unique_variant_sku_per_item"
            )
        ]

    def __str__(self):
        return f"{self.item.item_name} ({self.variant_name or self.sku})"

    @property
    def display_name(self):
        attrs = self.attributes.all()

        if attrs.exists():
            return " / ".join(
                attr.attribute_value
                for attr in attrs
            )

        return self.variant_name or self.sku

    def save(self, *args, **kwargs):
        if self.item.item_type == "Service":
            self.barcode = None
        elif not self.barcode:
            # SAFETY PATCH: Limit the number of attempts to 100
            for _ in range(100):
                code = generate_barcode()
                if not ItemVariant.objects.filter(barcode=code).exists():
                    self.barcode = code
                    break
            else:
                # If we couldn't find a barcode after 100 tries, 
                # something is seriously wrong with your data
                raise Exception("Could not generate unique barcode.")
        super().save(*args, **kwargs)

        
class VariantAttribute(models.Model):
    variant = models.ForeignKey(
        ItemVariant,
        on_delete=models.CASCADE,
        related_name="attributes"
    )

    attribute_name = models.CharField(
        max_length=100
    )

    attribute_value = models.CharField(
        max_length=100
    )

    class Meta:
        ordering = ["id"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "variant",
                    "attribute_name"
                ],
                name="unique_attribute_per_variant"
            )
        ]

    def __str__(self):
        return (
            f"{self.attribute_name}: "
            f"{self.attribute_value}"
        )
    

class VariantImage(models.Model):
    variant = models.ForeignKey(
        ItemVariant,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image_url = models.URLField(
        blank=True,
        null=True
    )

    is_primary = models.BooleanField(default=False)

    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.variant.display_name} - Image {self.id}"