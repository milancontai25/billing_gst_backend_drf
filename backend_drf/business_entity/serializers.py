from .models import BusinessEntity
from users.serializers import UserSerializer
from rest_framework import serializers

class BusinessEntitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BusinessEntity
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

    def validate(self, data):
        tax_type = data.get("tax_type")
        tax_number = data.get("tax_number")

        if tax_type != "NONE" and not tax_number:
            raise serializers.ValidationError({
                "tax_number": f"{tax_type} number is required."
            })

        if tax_type == "NONE":
            data["tax_number"] = None

        return data


    def update(self, instance, validated_data):
        validated_data.pop("kyc_doc_type", None)
        validated_data.pop("kyc_pan_id", None)
        validated_data.pop("kyc_bucket_url", None)

        return super().update(instance, validated_data)

