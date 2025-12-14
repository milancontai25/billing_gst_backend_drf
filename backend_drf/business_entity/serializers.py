from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BusinessEntity
        fields = [
            'id',
            'business_name',
            'logo_bucket_url',
            'owner_name',
            'business_type',
            'gst_status',
            'gst_number',
            'address',
            'kyc_doc_type',
            'kyc_bucket_url',
            'entity_code_name',
            'created_at',
            'user',
        ]
        extra_kwargs = {
            "logo_bucket_url": {"required": False},
            "kyc_bucket_url": {"required": False},
        }