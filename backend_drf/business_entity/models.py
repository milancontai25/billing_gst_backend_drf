from django.db import models
from users.models import User
from django.conf import settings

class BusinessEntity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='businesses'
    )

    business_name = models.CharField(max_length=255)

    logo_bucket_url = models.CharField(blank=True, null=True)

    # 
    facebook_url = models.CharField(max_length=255, blank=True, null=True)
    instagram_url = models.CharField(max_length=255, blank=True, null=True)
    youtube_url = models.CharField(max_length=255, blank=True, null=True)
    x_url = models.CharField(max_length=255, blank=True, null=True)

    # Banners
    banner_1_url = models.CharField(blank=True, null=True)
    banner_2_url = models.CharField(blank=True, null=True)
    banner_3_url = models.CharField(blank=True, null=True)

    owner_name = models.CharField(max_length=255, blank=True, null=True)
    business_type = models.CharField(max_length=55)
    gst_status = models.CharField(max_length=55)
    gst_number = models.CharField(max_length=30, blank=True, null=True)

    address = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=20, blank=True, null=True)
    state = models.CharField(max_length=20, blank=True, null=True)
    district = models.CharField(max_length=20, blank=True, null=True)
    pin = models.IntegerField(blank=True, null=True)

    kyc_doc_type = models.CharField(max_length=20)
    kyc_pan_id = models.CharField(max_length=20, blank=True, null=True)
    kyc_bucket_url = models.CharField(blank=True, null=True)

    slug = models.SlugField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)


    def __str__(self):
        return self.business_name
