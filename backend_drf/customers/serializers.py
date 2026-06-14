from business_entity.models import BusinessEntity
from .models import Customer
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['business']

    def validate(self, data):
        # 1. Get the request object to access the current user/business context
        request = self.context.get('request')
        
        # If there's no request context (e.g., during internal testing), skip validation
        if not request or not hasattr(request, 'user'):
            return data

        # 2. Extract the active business
        # Adjust this depending on how you've set up your User model to link to a Business
        business = getattr(request.user, 'active_business', None)
        
        if not business:
            raise serializers.ValidationError({"business": ["Active business context is missing."]})

        email = data.get('email')
        phone = data.get('phone')

        # 3. Validation for Updates (PUT/PATCH)
        if self.instance:
            if email:
                if Customer.objects.filter(business=business, email=email).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError({"email": ["A customer with this email already exists."]})
            
            if phone:
                if Customer.objects.filter(business=business, phone=phone).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError({"phone": ["A customer with this phone number already exists."]})
        
        # 4. Validation for Creation (POST)
        else:
            if email:
                if Customer.objects.filter(business=business, email=email).exists():
                    raise serializers.ValidationError({"email": ["A customer with this email already exists."]})
            
            if phone:
                if Customer.objects.filter(business=business, phone=phone).exists():
                    raise serializers.ValidationError({"phone": ["A customer with this phone number already exists."]})

        return data


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
            'name',
            'phone',
            'email',
            'address',
            'country',
            'state',
            'district',
            'pin',
            'gstin'
        ]
        extra_kwargs = {
            'email': {
                'required': False,
                'allow_blank': True,
                'allow_null': True
            },
            'gstin': {
                'required': False,
                'allow_blank': True,
                'allow_null': True
            }
        }

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


