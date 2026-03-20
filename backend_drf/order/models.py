from django.db import models
from business_entity.models import BusinessEntity
from customers.models import Customer  # assuming you have a Customer model
from products.models import Item  # your existing Item model

from django.db import models
from business_entity.models import BusinessEntity
from customers.models import Customer
from products.models import Item


class Order(models.Model):
    business = models.ForeignKey(
        BusinessEntity,
        on_delete=models.CASCADE,
        related_name="orders"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders"
    )

    order_number = models.CharField(max_length=50, unique=True)
    invoice_id = models.CharField(max_length=20, unique=True, default="")  # keep as your logic
    date = models.DateField(auto_now_add=True)

    customer_name = models.CharField(max_length=150, blank=False, null=False, default="")

    total_base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    round_off = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    payment_method = models.CharField(max_length=20, default="UPI")
    payment_status = models.CharField(max_length=10, default="Unpaid")
    status = models.CharField(max_length=20, default="Pending")

    payment_proof_url = models.URLField(blank=True, null=True)
    attachment_url = models.URLField(blank=True, null=True)
    special_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="order_items"
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="ordered_items"
    )

    product_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.product_name} ({self.quantity})"



class Cart(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'business')

    def __str__(self):
        return f"Cart {self.id} - {self.customer.email}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)  

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['cart', 'item']),
        ]

    def subtotal(self):
        return self.item.gross_amount * self.quantity

