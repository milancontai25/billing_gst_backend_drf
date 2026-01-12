from business_entity.models import BusinessEntity
from .models import Customer
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['business']


class CustomerSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'name', 'email', 'phone', 'password',
            'country', 'state', 'district', 'pin', 'address'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    # def create(self, validated_data):
    #     slug = validated_data.pop('slug').strip()
    #     try:
    #         business = BusinessEntity.objects.get(entity_code_name__iexact=slug)
    #     except BusinessEntity.DoesNotExist:
    #         raise serializers.ValidationError({"business_name": "Business not found"})

    #     customer = Customer.objects.create(business=business, **validated_data)
    #     customer.save()
    #     return customer



class CustomerAddressUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'address',
            'country',
            'state',
            'district',
            'pin',
            'gstin'
        ]

    def validate_pin(self, value):
        if value and len(str(value)) != 6:
            raise serializers.ValidationError("PIN must be 6 digits")
        return value


class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        if not data.get('email') and not data.get('phone'):
            raise serializers.ValidationError("Email or phone is required")
        return data



class CustomerForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        business = self.context.get('business')

        try:
            customer = Customer.objects.get(
                business=business,
                email=data['email']
            )
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer not found")

        data['customer'] = customer
        return data


class CustomerResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate(self, data):
        business = self.context.get('business')

        try:
            customer = Customer.objects.get(
                business=business,
                email=data['email']
            )
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer not found")

        if not customer.verify_otp(data['otp']):
            raise serializers.ValidationError("Invalid or expired OTP")

        data['customer'] = customer
        return data



class CustomerLoginOtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class CustomerLoginOtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()


