from rest_framework import serializers
from .models import BusinessPaymentConfig

class BusinessPaymentConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPaymentConfig
        fields = [
            "id",
            "business",
            "payment_mode",
            "gateway_provider",
            "gateway_public_key",
            "gateway_secret_key",
            "gateway_webhook_secret",
            "gateway_merchant_id",
            "upi_id",
            "upi_qrcode_url",
            "is_upi_active",
            "is_gateway_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business", "created_at", "updated_at"]
        extra_kwargs = {
            "gateway_secret_key": {"write_only": True},
            "gateway_webhook_secret": {"write_only": True},
        }

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        payment_mode = attrs.get("payment_mode", getattr(instance, "payment_mode", "NONE"))
        is_upi_active = attrs.get("is_upi_active", getattr(instance, "is_upi_active", False))
        is_gateway_active = attrs.get("is_gateway_active", getattr(instance, "is_gateway_active", False))
        upi_id = attrs.get("upi_id", getattr(instance, "upi_id", None))
        upi_qrcode_url = attrs.get("upi_qrcode_url", getattr(instance, "upi_qrcode_url", None))
        gateway_provider = attrs.get("gateway_provider", getattr(instance, "gateway_provider", None))
        gateway_public_key = attrs.get("gateway_public_key", getattr(instance, "gateway_public_key", None))
        gateway_secret_key = attrs.get("gateway_secret_key", getattr(instance, "gateway_secret_key", None))

        if payment_mode == "NONE":
            if is_upi_active or is_gateway_active:
                raise serializers.ValidationError("When payment_mode is NONE, both UPI and gateway must be inactive.")

        if payment_mode == "UPI":
            if not is_upi_active:
                raise serializers.ValidationError("UPI must be active when payment_mode is UPI.")
            if is_gateway_active:
                raise serializers.ValidationError("Gateway must be inactive when payment_mode is UPI.")
            if not upi_id and not upi_qrcode_url:
                raise serializers.ValidationError("Provide upi_id or upi_qrcode_url for UPI mode.")

        if payment_mode == "GATEWAY":
            if not is_gateway_active:
                raise serializers.ValidationError("Gateway must be active when payment_mode is GATEWAY.")
            if is_upi_active:
                raise serializers.ValidationError("UPI must be inactive when payment_mode is GATEWAY.")
            if not gateway_provider or not gateway_public_key or not gateway_secret_key:
                raise serializers.ValidationError("Gateway provider, public key, and secret key are required for GATEWAY mode.")

        if payment_mode == "BOTH":
            if not is_upi_active or not is_gateway_active:
                raise serializers.ValidationError("Both UPI and gateway must be active when payment_mode is BOTH.")
            if not upi_id and not upi_qrcode_url:
                raise serializers.ValidationError("Provide upi_id or upi_qrcode_url for BOTH mode.")
            if not gateway_provider or not gateway_public_key or not gateway_secret_key:
                raise serializers.ValidationError("Gateway provider, public key, and secret key are required for BOTH mode.")

        return attrs
    



class PublicBusinessPaymentConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPaymentConfig
        fields = [
            "payment_mode",
            "gateway_provider",
            "gateway_public_key",
            "gateway_merchant_id",
            "upi_id",
            "upi_qrcode_url",
            "is_upi_active",
            "is_gateway_active",
        ]