from django.shortcuts import render
from django.db import models
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import BusinessEntity
from .serializers import BusinessEntitySerializer
from users.serializers import UserSerializer
from rest_framework.permissions import AllowAny
# from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password 
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth.models import update_last_login
from django.utils.text import slugify

def generate_unique_entity_code_name(name):
    base_slug = slugify(name)  # "objectsol tech" → "objectsol-tech"
    slug = base_slug
    counter = 1

    from .models import BusinessEntity

    # Loop until unique
    while BusinessEntity.objects.filter(entity_code_name=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug

class BusinessSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        business = BusinessEntity.objects.filter(owner=user).first()
        user_data = UserSerializer(user).data
        business_data = BusinessEntitySerializer(business).data if business else None

        return Response({
            "user": user_data,
            "business": business_data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        business = BusinessEntity.objects.filter(owner=user).first()

        if not business:
            return Response({"error": "Business entity not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        # If entity_name exists → always regenerate entity_code_name
        if "entity_name" in data:
            entity_name = data["entity_name"]
            unique_code = generate_unique_entity_code_name(entity_name)
            data["entity_code_name"] = unique_code

        serializer = BusinessEntitySerializer(business, data=data, partial=True)
        if serializer.is_valid():
            serializer.save(owner=user)
            return Response({
                "message": "Business profile updated successfully.",
                "business": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
