from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from api.utils.file_upload import save_file_to_server
from business_entity.models import BusinessEntity
from .models import BusinessPaymentConfig
from .serializers import BusinessPaymentConfigSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class BusinessPaymentConfigView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_active_business(self, request):
        if not request.user.active_business:
            return None
        return request.user.active_business

    def get(self, request):
        business = self.get_active_business(request)
        if not business:
            return Response(
                {"error": "No active business selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_config, created = BusinessPaymentConfig.objects.get_or_create(
            business=business
        )

        serializer = BusinessPaymentConfigSerializer(payment_config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        business = self.get_active_business(request)
        if not business:
            return Response(
                {"error": "No active business selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_config, created = BusinessPaymentConfig.objects.get_or_create(
            business=business
        )

        data = request.data.copy()

        # ✅ HANDLE FILE UPLOAD (MISSING IN YOUR CODE)
        if "upi_qrcode" in request.FILES:
            data["upi_qrcode_url"] = save_file_to_server(
                request.FILES["upi_qrcode"], "upi_qr"
            )

        serializer = BusinessPaymentConfigSerializer(
            payment_config,
            data=data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Payment config saved successfully",
                "payment_config": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request):
        business = self.get_active_business(request)
        if not business:
            return Response({"error": "No active business selected"}, status=400)

        payment_config = get_object_or_404(BusinessPaymentConfig, business=business)

        data = request.data.copy()

        # ✅ HANDLE FILE UPLOAD
        if "upi_qrcode" in request.FILES:
            data["upi_qrcode_url"] = save_file_to_server(
                request.FILES["upi_qrcode"], "upi_qr"
            )

        serializer = BusinessPaymentConfigSerializer(
            payment_config,
            data=data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Payment config updated successfully",
            "payment_config": serializer.data
        }, status=200)

