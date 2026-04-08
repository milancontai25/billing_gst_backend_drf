from django.db import models
from business_entity.models import BusinessEntity
from customers.models import Customer  # assuming you have a Customer model
from products.models import Item  # your existing Item model

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
    invoice_id = models.CharField(max_length=20, unique=True)  # keep as your logic
    date = models.DateField(auto_now_add=True)

    customer_name = models.CharField(max_length=150, blank=False, null=False, default="")

    total_base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    round_off = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(max_length=20, default="Pending")

    attachment_url = models.URLField(blank=True, null=True)
    special_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def payment_status(self):
        if not self.payments.exists():
            return "Unpaid"

        if self.payments.filter(status="Success").exists():
            return "Paid"

        if self.payments.filter(status="Pending").exists():
            return "Pending"

        return "Failed"

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
        on_delete=models.PROTECT,
        related_name="ordered_items"
    )

    item_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField(default=1)
    rate = models.DecimalField(max_digits=10, decimal_places=2)

    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    tax_percent = models.DecimalField(max_digits=5, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_type = models.CharField(max_length=20)
    price_includes_tax = models.BooleanField(default=False)

    base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def subtotal(self):
        return self.rate * self.quantity

    def __str__(self):
        return f"{self.item_name} ({self.quantity})"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ("CASH", "Cash"),
        ("UPI", "UPI"),
        ("GATEWAY", "Gateway"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Success", "Success"),
        ("Failed", "Failed"),
        ("Refunded", "Refunded"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")

    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="Pending")

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Gateway fields
    gateway_order_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_payment_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_signature = models.TextField(blank=True, null=True)

    # UPI proof
    payment_proof_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.method}"
    


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

