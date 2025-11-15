from business_entity.models import BusinessEntity
from rest_framework import generics, serializers, status
from .models import  Customer
from .serializers import CustomerLoginSerializer, CustomerSerializer, CustomerSignupSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        
        return Customer.objects.filter(business=business)

    def perform_create(self, serializer):
        user = self.request.user
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        serializer.save(business=business)


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        
        return Customer.objects.filter(business=business)


class CustomerSignupView(generics.CreateAPIView):
    serializer_class = CustomerSignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()

        return Response({
            "message": "Customer registered successfully",
            "customer": {
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone,
            }
        }, status=status.HTTP_201_CREATED)


class CustomerLoginView(generics.GenericAPIView):
    serializer_class = CustomerLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.validated_data['customer']

        refresh = RefreshToken.for_user(customer)

        return Response({
            "message": "Login successful",
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        })
