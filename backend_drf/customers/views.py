from api.views import CustomerJWTAuthentication
from business_entity.models import BusinessEntity
from rest_framework import generics, serializers, status
from .models import  Customer
from .serializers import CustomerAddressUpdateSerializer, CustomerForgotPasswordSerializer, CustomerLoginOtpRequestSerializer, CustomerLoginOtpVerifySerializer, CustomerLoginSerializer, CustomerResetPasswordSerializer, CustomerSerializer, CustomerSignupSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
import random
from django.core.mail import send_mail
from rest_framework.views import APIView

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.active_business:
            raise serializers.ValidationError("Please select an active business first.")

        return Customer.objects.filter(business=user.active_business)

    def perform_create(self, serializer):
        user = self.request.user

        if not user.active_business:
            raise serializers.ValidationError("Please select an active business first.")

        serializer.save(business=user.active_business)


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.active_business:
            raise serializers.ValidationError("Please select an active business first.")

        return Customer.objects.filter(business=user.active_business)


class CustomerSignupView(generics.CreateAPIView):
    serializer_class = CustomerSignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        business_slug = self.kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = serializer.save(business=business)

        return Response(
            {
                "message": "Customer registered successfully",
                "customer": {
                    "name": customer.name,
                    "email": customer.email,
                    "phone": customer.phone,
                }
            },
            status=status.HTTP_201_CREATED
        )


def generate_customer_tokens(customer):
    refresh = RefreshToken()

    refresh['type'] = 'customer'
    refresh['customer_id'] = customer.id
    refresh['business_id'] = customer.business_id

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }



class CustomerAddressUpdateView(generics.UpdateAPIView):
    serializer_class = CustomerAddressUpdateSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Logged-in customer only
        return self.request.user

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "message": "Address details updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class CustomerLoginView(generics.GenericAPIView):
    serializer_class = CustomerLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        business_slug = kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get('email')
        phone = serializer.validated_data.get('phone')
        password = serializer.validated_data['password']

        try:
            if email:
                customer = Customer.objects.get(
                    business=business,
                    email=email
                )
            else:
                customer = Customer.objects.get(
                    business=business,
                    phone=phone
                )
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not customer.check_password(password):
            return Response(
                {"detail": "Invalid password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = generate_customer_tokens(customer)

        return Response(tokens)


class CustomerTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('refresh')

        if not token:
            return Response(
                {"detail": "Refresh token required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(token)
        except Exception:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Ensure CUSTOMER token
        if refresh.get('type') != 'customer':
            return Response(
                {"detail": "Invalid token type"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        customer_id = refresh.get('customer_id')
        business_id = refresh.get('business_id')

        try:
            Customer.objects.get(
                id=customer_id,
                business_id=business_id
            )
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "access": str(refresh.access_token)
        })



class CustomerForgotPasswordView(generics.GenericAPIView):
    serializer_class = CustomerForgotPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        business_slug = kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(
            data=request.data,
            context={"business": business}
        )
        serializer.is_valid(raise_exception=True)

        customer = serializer.validated_data['customer']

        otp = str(random.randint(100000, 999999))
        customer.set_otp(otp)

        send_mail(
            "Reset Password OTP",
            f"Your OTP is {otp}. Valid for 5 minutes.",
            "no-reply@statgrow.com",
            [customer.email],
        )

        return Response({"message": "OTP sent to email"})


class CustomerResetPasswordView(generics.GenericAPIView):
    serializer_class = CustomerResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        business_slug = kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(
            data=request.data,
            context={"business": business}
        )
        serializer.is_valid(raise_exception=True)

        customer = serializer.validated_data['customer']
        customer.set_password(serializer.validated_data['new_password'])
        customer.otp = None
        customer.otp_expiry = None
        customer.save()

        return Response({"message": "Password reset successful"})


class CustomerLoginOtpRequestView(generics.GenericAPIView):
    serializer_class = CustomerLoginOtpRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        business_slug = kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            customer = Customer.objects.get(
                business=business,
                email=serializer.validated_data['email']
            )
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        otp = str(random.randint(100000, 999999))
        customer.set_otp(otp)

        send_mail(
            subject="Your Login OTP",
            message=f"Your OTP is {otp}. It is valid for 5 minutes.",
            from_email="no-reply@yourapp.com",
            recipient_list=[customer.email],
            fail_silently=False,
        )

        return Response(
            {"message": "OTP sent successfully"},
            status=status.HTTP_200_OK
        )

class CustomerLoginOtpVerifyView(generics.GenericAPIView):
    serializer_class = CustomerLoginOtpVerifySerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        business_slug = kwargs.get('business_slug')

        try:
            business = BusinessEntity.objects.get(slug=business_slug)
        except BusinessEntity.DoesNotExist:
            return Response(
                {"detail": "Business not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = Customer.objects.get(
            business=business,
            email=serializer.validated_data['email']
        )

        if not customer.verify_otp(serializer.validated_data['otp']):
            raise serializers.ValidationError("Invalid OTP")

        tokens = generate_customer_tokens(customer)

        return Response(tokens)


