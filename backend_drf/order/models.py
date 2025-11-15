from django.db import models
from business_entity.models import BusinessEntity
from customers.models import Customer  # assuming you have a Customer model
from products.models import Item  # your existing Item model

class Order(models.Model):
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="orders")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")

    order_number = models.CharField(max_length=50, unique=True)
    date = models.DateField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=10, default="unpaid")
    status = models.CharField(max_length=20, default="Pending")
    special_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="ordered_items")
    product_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.product_name} ({self.quantity})"
