from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = BusinessEntity
        fields = ['id', 'entity_name', 'type', 'image_bucket_url', 'entity_code_name', 'description', 'owner']
