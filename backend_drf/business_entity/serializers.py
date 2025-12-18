from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BusinessEntity
        fields = '__all__'
        
        extra_kwargs = {
            "logo_bucket_url": {"required": False},
            "kyc_bucket_url": {"required": False},
        }