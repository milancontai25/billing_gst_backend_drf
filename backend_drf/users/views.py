from rest_framework import generics
from .models import User
from .serializers import RegisterSerializer
from rest_framework.permissions import AllowAny
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer
from rest_framework.response import Response
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from .serializers import AdminUserSerializer

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Get the standard token (which just has user_id)
        token = super().get_token(user)

        # Inject your custom fields from your User model
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff
        token['role'] = user.role 

        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "OTP sent to your email."})


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password reset successful."})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]





from django_filters.rest_framework import DjangoFilterBackend


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    # SEARCH + FILTER
    filter_backends = [
        filters.SearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter
    ]

    search_fields = [
        'name',
        'email',
        'phone',
        'active_business__business_name'
    ]

    filterset_fields = [
        'status',
        'role',
        'is_active'
    ]

    ordering_fields = [
        'date_joined',
        'name'
    ]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user == request.user:
            return Response(
                {"detail": "You cannot delete yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().destroy(request, *args, **kwargs)
    
    