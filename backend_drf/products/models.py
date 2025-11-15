from django.db import models
from business_entity.models import BusinessEntity

class Item(models.Model):
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=20, blank=False, null=False)
    date = models.DateField(auto_now_add=True)

    product_name = models.CharField(max_length=150, blank=False, null=False)
    hsn_sac_code = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=100, blank=False, null=False)
    unit = models.CharField(max_length=50, blank=False, null=False)
    quantity = models.IntegerField(blank=False, null=False)

    mrp = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)

    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    igst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    cess_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=False, null=False)

    min_stock = models.IntegerField(default=0)
    note = models.TextField(blank=True, null=True)

    customer_view = models.CharField(max_length=10, default='Special')

    def __str__(self):
        return self.product_name

