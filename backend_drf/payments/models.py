from django.db import models
from business_entity.models import BusinessEntity

class BusinessPaymentConfig(models.Model):
    PAYMENT_MODE_CHOICES = [
        ("UPI", "UPI"),
        ("GATEWAY", "Gateway"),
        ("BOTH", "Both"),
        ("NONE", "None"),
    ]

    GATEWAY_PROVIDER_CHOICES = [
        ("", "None"),
        ("RAZORPAY", "Razorpay"),
        ("STRIPE", "Stripe"),
        ("PAYPAL", "PayPal"),
    ]

    business = models.OneToOneField(
        BusinessEntity,
        on_delete=models.CASCADE,
        related_name="payment_config"
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODE_CHOICES,
        default="NONE"
    )

    gateway_provider = models.CharField(
        max_length=20,
        choices=GATEWAY_PROVIDER_CHOICES,
        blank=True,
        null=True
    )

    upi_qrcode_url = models.URLField(blank=True, null=True)
    upi_id = models.CharField(max_length=100, blank=True, null=True)

    gateway_public_key = models.CharField(max_length=255, blank=True, null=True)
    gateway_secret_key = models.CharField(max_length=255, blank=True, null=True)
    gateway_webhook_secret = models.CharField(max_length=255, blank=True, null=True)
    gateway_merchant_id = models.CharField(max_length=255, blank=True, null=True)

    is_gateway_active = models.BooleanField(default=False)
    is_upi_active = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business.business_name} payment config"
    