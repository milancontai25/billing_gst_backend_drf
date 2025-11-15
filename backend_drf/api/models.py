


# from django.db import models


# class NotificationType(models.TextChoices):
#     EMAIL = "email", "Email"
#     SMS = "sms", "SMS"
#     WHATSAPP = "whatsapp", "WhatsApp"

# class OrderStatus(models.TextChoices):
#     PENDING = "pending", "Pending"
#     PAID = "paid", "Paid"
#     COMPLETED = "completed", "Completed"
#     CANCELLED = "cancelled", "Cancelled"

# class PaymentStatus(models.TextChoices):
#     PAID = "paid", "Paid"
#     UNPAID = "unpaid", "Unpaid"






# class Pricing(models.Model):
#     item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="pricing")
#     customer_type = models.CharField(max_length=20, choices=CustomerType.choices)
#     price = models.FloatField()

#     class Meta:
#         unique_together = ('item', 'customer_type') # Added to ensure one pricing per item/type

#     def __str__(self): # Corrected from _str_
#         return f"{self.item.name} - {self.customer_type}: {self.price}"


# class Order(models.Model):
#     business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="orders")
#     customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")
#     status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
#     order_date = models.DateTimeField(auto_now_add=True)

#     def __str__(self): # Corrected from _str_
#         return f"Order #{self.id} - {self.status}"


# class OrderItem(models.Model):
#     order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
#     item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="order_items")
#     price = models.FloatField()
#     quantity = models.IntegerField()

#     class Meta:
#         unique_together = ('order', 'item') # Added to prevent duplicate items in one order

#     def __str__(self): # Corrected from _str_
#         return f"{self.item.name} x {self.quantity}"


# class Invoice(models.Model):
#     order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="invoice")
#     invoice_number = models.CharField(max_length=50, unique=True)
#     total_amount = models.FloatField()
#     payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self): # Corrected from _str_
#         return f"Invoice #{self.invoice_number}"


# class Notification(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
#     customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
#     notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
#     message = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self): # Corrected from _str_
#         recipient = self.customer.name if self.customer else self.user.name if self.user else "Unknown"
#         return f"Notification to {recipient} ({self.notification_type})"


# class Franchise(models.Model):
    # business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="franchises")
    # admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name="franchises_administered") # Changed related_name
    # created_at = models.DateTimeField(auto_now_add=True)

    # class Meta:
    #     unique_together = ('business', 'admin') # Prevents duplicate franchise mappings

    # def __str__(self): # Corrected from _str_
    #     return f"Franchise of {self.business.entity_name} by {self.admin.name}"