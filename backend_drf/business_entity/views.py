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
from django.shortcuts import get_object_or_404


def generate_unique_slug(name):
    """
    Generates a URL-safe slug from the name.
    If the slug exists, appends a counter (e.g., 'joes-pizza-1').
    """
    base_slug = slugify(name)
    slug = base_slug[:45]
    counter = 1

    # Loop until we find a slug that doesn't exist in the database
    while BusinessEntity.objects.filter(slug=slug).exists():
        slug = f"{slug}-{counter}"
        counter += 1

    return slug


class BusinessSetupView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        user = request.user
        businesses = BusinessEntity.objects.filter(user=user)

        user_data = UserSerializer(user).data
        business_data = BusinessEntitySerializer(businesses, many=True).data

        return Response(
            {
                "user": user_data,
                "businesses": business_data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        user = request.user
        # Make a mutable copy of the data
        data = request.data.copy()

        if "business_name" not in data or not data["business_name"]:
            return Response({"error": "business_name is required"}, status=400)

        # ---------- Generate SLUG ----------
        # Logic updated to use the new function and key
        data["slug"] = generate_unique_slug(data["business_name"])

        # ---------- File Upload Handling ----------
        logo_file = request.FILES.get("logo_file")
        kyc_file = request.FILES.get("kyc_file")

        # Assuming 'save_file_to_hostinger' is a method defined in this class or a mixin
        if logo_file:
            logo_url = self.save_file_to_hostinger(request, logo_file, "business_logo")
            data["logo_bucket_url"] = logo_url

        if kyc_file:
            kyc_url = self.save_file_to_hostinger(request, kyc_file, "kyc_docs")
            data["kyc_bucket_url"] = kyc_url

        serializer = BusinessEntitySerializer(data=data)

        if serializer.is_valid():
            business = serializer.save(user=user)

            # Set as active business if the user doesn't have one selected yet
            if user.active_business is None:
                user.active_business = business
                user.save()

            return Response({
                "message": "Business created successfully.",
                "business": serializer.data,
                "active_business_set": True
            }, status=201)

        return Response(serializer.errors, status=400)
    
    
    # -----------------------------------------
    # Save file to Hostinger VPS & return URL
    # -----------------------------------------
    def save_file_to_hostinger(self, request, file, folder_name):

        upload_path = os.path.join(settings.MEDIA_ROOT, folder_name)

        if not os.path.exists(upload_path):
            os.makedirs(upload_path)

        file_path = os.path.join(upload_path, file.name)

        with open(file_path, "wb+") as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        file_url = f"{settings.SERVER_URL}{settings.MEDIA_URL}{folder_name}/{file.name}"

        return file_url


class BusinessUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk):
        business = get_object_or_404(
            BusinessEntity,
            id=pk,
            user=request.user
        )

        data = request.data.copy()

        # 🔒 Extra safety: strip KYC
        data.pop("kyc_doc_type", None)
        data.pop("kyc_bucket_url", None)

        if "logo_file" in request.FILES:
            data["logo_bucket_url"] = save_file_to_server(
                request.FILES["logo_file"], "business_logo"
            )

        if "banner_1" in request.FILES:
            data["banner_1_url"] = save_file_to_server(
                request.FILES["banner_1"], "business_banners"
            )

        if "banner_2" in request.FILES:
            data["banner_2_url"] = save_file_to_server(
                request.FILES["banner_2"], "business_banners"
            )

        if "banner_3" in request.FILES:
            data["banner_3_url"] = save_file_to_server(
                request.FILES["banner_3"], "business_banners"
            )

        serializer = BusinessEntitySerializer(
            business, data=data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Business updated successfully", "business": serializer.data},
            status=200
        )





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

