# invoices/models.py
from django.db import models
from customers.models import Customer
from business_entity.models import BusinessEntity
from products.models import Item

class Invoice(models.Model):
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="invoices")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="invoices")
    invoice_id = models.CharField(max_length=20, unique=True)
    date = models.DateField(auto_now_add=True)
    customer_name = models.CharField(max_length=100, blank=False, null=False)

    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    round_off = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    payment_mode = models.CharField(max_length=20, default="UPI")
    status = models.CharField(max_length=10, default="Unpaid")
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.invoice_id


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="invoice_items")
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.item.product_name} ({self.invoice.invoice_id})"
