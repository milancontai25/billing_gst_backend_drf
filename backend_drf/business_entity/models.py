from django.db import models
from users.models import User

class BusinessEntity(models.Model):
    entity_name = models.CharField(max_length=150)
    type = models.CharField(max_length=20, blank=False, null=False)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="businesses")
    image_bucket_url = models.URLField(max_length=500, blank=True, null=True, help_text="Cloud bucket link for image")
    entity_code_name = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return f"{self.entity_name} ({self.type})"