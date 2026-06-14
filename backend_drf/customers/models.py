from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
from business_entity.models import BusinessEntity
from django.core.validators import RegexValidator

class Customer(models.Model):
    business = models.ForeignKey(
        BusinessEntity,
        on_delete=models.CASCADE,
        related_name="customers"
    )

    category = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField(auto_now_add=True)

    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)

    customer_type = models.CharField(max_length=20, default='Special')
    

    gstin = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
                'Enter a valid GSTIN'
            )
        ]
    )

    country = models.CharField(max_length=20, blank=True, null=True)
    state = models.CharField(max_length=20, blank=True, null=True)
    district = models.CharField(max_length=20, blank=True, null=True)
    pin = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    password = models.CharField(max_length=128, blank=True, null=True)
    is_customer = models.BooleanField(default=True)

    # 🔐 OTP fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = (
            ('business', 'email'),
            ('business', 'phone'),
        )

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()

        if self.password and not self.password.startswith('pbkdf2_'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save(update_fields=['password'])

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    # OTP helpers
    def set_otp(self, otp):
        self.otp = otp
        self.otp_expiry = timezone.now() + timedelta(minutes=5)
        self.save(update_fields=['otp', 'otp_expiry'])

    def verify_otp(self, otp):
        valid = (
            self.otp == otp and
            self.otp_expiry and
            timezone.now() <= self.otp_expiry
        )

        if valid:
            self.otp = None
            self.otp_expiry = None
            self.save(update_fields=['otp', 'otp_expiry'])

        return valid

    @property
    def is_authenticated(self):
        return True
