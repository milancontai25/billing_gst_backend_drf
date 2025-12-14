from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from django.core.mail import send_mail
import random

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        email = attrs.get("email")
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return attrs

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        
        otp = random.randint(100000, 999999)
        user.reset_otp = otp
        user.save()

        send_mail(
            "Password Reset OTP",
            f"Your OTP for password reset is: {otp}",
            "noreply@yourapp.com",
            [email],
        )
        return user
    
    
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.IntegerField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email.")

        if user.reset_otp != otp:
            raise serializers.ValidationError("Invalid OTP.")

        return attrs

    def save(self):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']

        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.reset_otp = None
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'is_superuser', 'is_active', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ['name','email','phone','password']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

# class LoginSerializer(serializers.Serializer):
#     email = serializers.CharField(required=True)
#     password = serializers.CharField(required=True, min_length=8)
