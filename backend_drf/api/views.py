from django.shortcuts import render
from django.db import models
from users.permissions import IsUserOrAdmin
from invoice.models import Invoice
from order.models import Order
from business_entity.models import BusinessEntity
from customers.models import Customer
from products.models import Item
from users.models import User
from users.serializers import UserSerializer
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import generics, status, serializers, exceptions
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
# from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password 
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth.models import update_last_login
from products.serializers import ProductSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication


class CustomerJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        # 🔒 Ensure this is a CUSTOMER token
        if validated_token.get('type') != 'customer':
            raise exceptions.AuthenticationFailed('Invalid token type')

        customer_id = validated_token.get('customer_id')
        business_id = validated_token.get('business_id')

        if not customer_id or not business_id:
            raise exceptions.AuthenticationFailed('Invalid token payload')

        try:
            return Customer.objects.get(
                id=customer_id,
                business_id=business_id
            )
        except Customer.DoesNotExist:
            raise exceptions.AuthenticationFailed('No such customer')


class ItemListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        business_slug = self.kwargs.get('business_slug')

        return Item.objects.filter(
            business__slug=business_slug,
            isShow=True
        ).order_by('-created_date')


        
    # serializer_class = ProductSerializer
    # authentication_classes = [CustomerJWTAuthentication]
    # permission_classes = [IsAuthenticated]

    # def get_queryset(self):
    #     customer = self.request.user  # now correctly a Customer
    #     return Item.objects.filter(business=customer.business)



# class ItemDetailView(generics.RetrieveAPIView):
#     serializer_class = ProductSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         try:
#             business = BusinessEntity.objects.get(user=user)
#         except BusinessEntity.DoesNotExist:
#             raise serializers.ValidationError("Business entity not found for this user.")
        
#         return Item.objects.filter(business=business)


class AppRunView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
                "message": "app running!"
            }, status=200)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get(self, request):
        user = request.user
        update_last_login(None, user)

        # -------- ADMIN DASHBOARD --------
        if user.is_superuser:
            users = User.objects.exclude(is_superuser=True)
            all_businesses = BusinessEntity.objects.select_related('user').all()

            return Response({
                "message": f"Welcome Admin {user.name}!",
                "total_users": users.count(),
                "total_businesses": all_businesses.count(),
                "users": UserSerializer(users, many=True).data,
                "businesses": BusinessEntitySerializer(all_businesses, many=True).data
            }, status=200)

        # -------- USER DASHBOARD --------
        businesses = BusinessEntity.objects.filter(user=user)

        # If user has no business
        if businesses.count() == 0:
            return Response({
                "message": f"Welcome {user.name}!",
                "requires_setup": True,
                "businesses": [],
                "user": UserSerializer(user).data,
            }, status=200)

        # Ensure active business exists
        if not user.active_business:
            user.active_business = businesses.first()
            user.save()

        active_business = user.active_business

        # Fetch business-specific stats
        total_customers = Customer.objects.filter(business=active_business).count()
        total_products = Item.objects.filter(business=active_business).count()
        total_orders = Order.objects.filter(business=active_business).count()
        total_invoices = Invoice.objects.filter(business=active_business).count()

        return Response({
            "message": f"Welcome, {user.name}!",
            "requires_setup": False,
            "user": UserSerializer(user).data,

            "businesses": BusinessEntitySerializer(businesses, many=True).data,
            "active_business": BusinessEntitySerializer(active_business).data,

            "dashboard": {
                "total_customers": total_customers,
                "total_products": total_products,
                "total_orders": total_orders,
                "total_invoices": total_invoices,
                "total_expenses": 0
            }
        }, status=200)


# class LoginView(generics.GenericAPIView):
#     serializer_class = LoginSerializer

#     def post(self, request, *args, **kwargs):
#         username = request.data.get('username')
#         password = request.data.get('password')
#         print(username)
#         print(password)
#         user = authenticate(username=username, password=password)
#         print(user)
#         if user is not None:
#             refresh = RefreshToken.for_user(user)
#             return Response({
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token)
#             })
#         else:
#             return Response({'detail': 'Invalid credentials'}, status=401)

# class LoginView(generics.GenericAPIView):
#     serializer_class = LoginSerializer
#     permission_classes = [AllowAny]

#     def post(self, request, *args, **kwargs):
#         email = request.data.get('email')
#         password = request.data.get('password')
#         print(email)
#         print(password)
        
#         try:
#             # 1. Manually retrieve the user by email
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             user = None

#         # 2. Check if the user exists AND use the built-in check_password method
#         if user is not None and user.check_password(password):
#             print(user)

#             refresh = RefreshToken.for_user(user)
#             print(refresh.payload)
#             return Response({
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token)
#             })
#         else:
#             print(f"Authentication failed for user: {email}")
#             return Response({'detail': 'Invalid credentials'}, status=401)      


# class DashboardView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         user = request.user
#         update_last_login(None, user) 
#         serializer = DashboardSerializer(user)
#         return Response({
#             'message': f'Welcome {user.name}!',
#             'user': serializer.data
#         }, status=status.HTTP_200_OK)

# class DashboardView(APIView):
#     permission_classes = [IsAuthenticated]
 
#     def get(self, request):
#         user = request.user
#         update_last_login(None, user)
#         # 1. Check if the current user is an admin (optional, for security/UI)
#         if not request.user.is_superuser:
#             # Optionally restrict this view to only admins, or return only their own data
#             # For simplicity, let's allow all users to see the list for now.
#             serializer = DashboardSerializer(user)
#             return Response({
#                 'message': f'Welcome {user.name}!',
#                 'user': serializer.data
#             }, status=status.HTTP_200_OK)

#         # 2. Query the User model to fetch all users where the role is NOT 'admin'
#         # Adjust 'role' field name if necessary, but based on your model, 'role' is correct.
#         non_admin_users = User.objects.exclude(is_superuser=True)
        
#         # 3. Serialize the queryset. Must pass many=True since it's a list.
#         serializer = DashboardSerializer(non_admin_users, many=True)
        
        
#         # 4. Return the list of users
#         return Response({
#             'message': f'Welcome {user.name}! Displaying all non-admin users.',
#             'users_list': serializer.data # Changed key to be more descriptive
#         }, status=status.HTTP_200_OK)


