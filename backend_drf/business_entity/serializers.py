from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessEntity
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
        
        extra_kwargs = {
            "logo_bucket_url": {"required": False},
            "kyc_bucket_url": {"required": False},
        }