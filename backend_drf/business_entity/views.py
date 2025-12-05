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
        business = BusinessEntity.objects.filter(user=user).first()
        user_data = UserSerializer(user).data
        business_data = BusinessEntitySerializer(business).data if business else None

        return Response({
            "user": user_data,
            "business": business_data
        }, status=status.HTTP_200_OK)
    

    def post(self, request):
        user = request.user
        data = request.data.copy()

        if "business_name" not in data or not data["business_name"]:
            return Response({"error": "business_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique code
        data["entity_code_name"] = generate_unique_entity_code_name(data["business_name"])

        serializer = BusinessEntitySerializer(data=data)
        if serializer.is_valid():
            business = serializer.save(user=user)

            # ------------------------
            # NEW: Set as active business
            # ------------------------
            if user.active_business is None:
                user.active_business = business
                user.save()

            return Response({
                "message": "Business created successfully.",
                "business": serializer.data,
                "active_business_set": True
            }, status=201)

        return Response(serializer.errors, status=400)


    # def post(self, request):
    #     user = request.user
    #     business = BusinessEntity.objects.filter(user=user).first()

    #     if not business:
    #         return Response({"error": "Business entity not found."}, status=status.HTTP_404_NOT_FOUND)

    #     data = request.data.copy()

    #     # If entity_name exists → always regenerate entity_code_name
    #     if "entity_name" in data:
    #         entity_name = data["entity_name"]
    #         unique_code = generate_unique_entity_code_name(entity_name)
    #         data["entity_code_name"] = unique_code

    #     serializer = BusinessEntitySerializer(business, data=data, partial=True)
    #     if serializer.is_valid():
    #         serializer.save(user=user)
    #         return Response({
    #             "message": "Business profile updated successfully.",
    #             "business": serializer.data
    #         }, status=status.HTTP_200_OK)

    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SwitchBusinessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        business_id = request.data.get("business_id")

        try:
            business = BusinessEntity.objects.get(id=business_id, user=request.user)
        except BusinessEntity.DoesNotExist:
            return Response({"error": "Invalid business"}, status=404)

        request.user.active_business = business
        request.user.save()

        return Response({
            "message": "Business switched successfully",
            "active_business": BusinessEntitySerializer(business).data
        }, status=200)

