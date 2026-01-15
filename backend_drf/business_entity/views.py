import uuid
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
from django.contrib.sites.models import Site
from api.utils.file_upload import save_file_to_server
import os
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser


def generate_unique_entity_code_name(name):
    base_slug = slugify(name)
    slug = base_slug
    counter = 1

    while BusinessEntity.objects.filter(entity_code_name=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


class BusinessSetupView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        user = request.user
        businesses = BusinessEntity.objects.filter(user=user)

        return Response({
            "user": UserSerializer(user).data,
            "businesses": BusinessEntitySerializer(businesses, many=True).data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        data = request.data.copy()

        if not data.get("business_name"):
            return Response({"error": "business_name is required"}, status=400)

        # generate unique entity code
        data["entity_code_name"] = generate_unique_entity_code_name(
            data["business_name"]
        )

        # file uploads
        logo_file = request.FILES.get("logo_file")
        kyc_file = request.FILES.get("kyc_file")

        if logo_file:
            data["logo_bucket_url"] = self.save_file_to_server(
                logo_file, "business_logo"
            )

        if kyc_file:
            data["kyc_bucket_url"] = self.save_file_to_server(
                kyc_file, "kyc_docs"
            )

        serializer = BusinessEntitySerializer(data=data)

        if serializer.is_valid():
            business = serializer.save(user=user)

            # auto-set active business
            if not user.active_business:
                user.active_business = business
                user.save(update_fields=["active_business"])

            return Response({
                "message": "Business created successfully",
                "business": BusinessEntitySerializer(business).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



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

