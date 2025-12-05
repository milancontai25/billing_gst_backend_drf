from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from business_entity.models import BusinessEntity

class Customer(models.Model):
    business = models.ForeignKey(BusinessEntity, on_delete=models.CASCADE, related_name="customers")
    category = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, unique=True)
    customer_type = models.CharField(max_length=20, default='Special')
    gstin = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=20, blank=True, null=True)
    state = models.CharField(max_length=20, blank=True, null=True)
    district = models.CharField(max_length=20, blank=True, null=True)
    pin = models.IntegerField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    password = models.CharField(max_length=128, blank=True, null=True, default='statgrow123')
    is_customer = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.password.startswith('pbkdf2_'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        """For DRF to treat Customer like a User instance"""
        return True
