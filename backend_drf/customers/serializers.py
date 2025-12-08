from business_entity.models import BusinessEntity
from .models import Customer
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers

class CustomerSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'


class CustomerSignupSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(write_only=True)

    class Meta:
        model = Customer
        fields = [
            'business_code_name', 'name', 'email', 'phone', 'password',
            'country', 'state', 'district', 'pin', 'address'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        business_code_name = validated_data.pop('business_code_name').strip()
        try:
            business = BusinessEntity.objects.get(entity_code_name__iexact=business_code_name)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError({"business_name": "Business not found"})

        customer = Customer.objects.create(business=business, **validated_data)
        customer.save()
        return customer



class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')

        if not email and not phone:
            raise serializers.ValidationError("Email or phone is required")

        try:
            if email:
                customer = Customer.objects.get(email=email)
            else:
                customer = Customer.objects.get(phone=phone)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer not found")

        if not customer.check_password(password):
            raise serializers.ValidationError("Invalid password")

        data['customer'] = customer
        return data
