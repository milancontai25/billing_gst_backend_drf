from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

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
