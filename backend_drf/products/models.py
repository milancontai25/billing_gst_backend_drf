from django.db import models
from business_entity.models import BusinessEntity

class Item(models.Model):
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=20, blank=False, null=False)
    created_date = models.DateField(auto_now_add=True)
    item_image_url = models.URLField(blank=True, null=True)
    item_name = models.CharField(max_length=150, blank=False, null=False)
    brand_product = models.CharField(max_length=150, blank=False, null=False, default='NA')
    hsn_sac_code_product = models.CharField(max_length=20, blank=True, null=True, default='NA')
    category = models.CharField(max_length=100, blank=False, null=False)
    description = models.TextField(blank=True, null=True)

    unit_product = models.CharField(max_length=50, blank=False, null=False, default='NA')
    quantity_product = models.IntegerField(blank=False, null=False, default=1)

    mrp_baseprice = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
    cost_price_product = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False, default=0)
    # discount_percent = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)

    # cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    # sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    # igst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    # cess_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)

    min_stock_product = models.IntegerField(default=0)
    
    customer_view = models.CharField(max_length=10, default='Special')
    availability_status_service = models.CharField(max_length=10, default='NA')
    area = models.CharField(max_length=150, blank=False, null=False)

    def __str__(self):
        return self.item_name

