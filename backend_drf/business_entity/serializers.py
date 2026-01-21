from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessEntity
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

    def update(self, instance, validated_data):
        # ❌ Block KYC updates
        validated_data.pop("kyc_doc_type", None)
        validated_data.pop("kyc_pan_id", None)
        validated_data.pop("kyc_bucket_url", None)

        return super().update(instance, validated_data)
