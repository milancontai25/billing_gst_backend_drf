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
        try:
            user_id = validated_token['user_id']
            return Customer.objects.get(id=user_id)
        except Customer.DoesNotExist:
            raise exceptions.AuthenticationFailed('No such customer')

class ItemListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = self.request.user  # now correctly a Customer
        return Item.objects.filter(business=customer.business)



# class ItemDetailView(generics.RetrieveAPIView):
#     serializer_class = ProductSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         try:
#             business = BusinessEntity.objects.get(owner=user)
#         except BusinessEntity.DoesNotExist:
#             raise serializers.ValidationError("Business entity not found for this user.")
        
#         return Item.objects.filter(business=business)


class AppRunView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return "App running"

class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get(self, request):
        user = request.user
        update_last_login(None, user)

        # ---------- ADMIN DASHBOARD ----------
        if user.is_superuser:
            users = User.objects.exclude(is_superuser=True)
            user_data = UserSerializer(users, many=True).data
            business_data = BusinessEntitySerializer(
                BusinessEntity.objects.select_related('owner').all(),
                many=True
            ).data
            return Response({
                "message": f"Welcome Admin {user.name}!",
                "users": user_data,
                "businesses": business_data
            }, status=status.HTTP_200_OK)

        # ---------- USER DASHBOARD ----------
        business, created = BusinessEntity.objects.get_or_create(
            owner=user,
            defaults={
                "entity_name": "",
                "type": "",  # can be empty until user fills
                "description": ""
            }
        )
        print(business)

        user_data = UserSerializer(user).data
        business_data = BusinessEntitySerializer(business).data

        flag = created or not business.entity_name

        if flag:
            return Response({
                "message": f"Welcome {user.name}!",
                "user": user_data,
                "business": business_data,
                "is_new_business": created,
                "requires_setup": flag  # flag for frontend
            }, status=status.HTTP_200_OK)
        
        # business = BusinessEntity.objects.filter(owner=user).first()
        # print(business)

        total_customers = Customer.objects.filter(business=business).count()
        total_products = Item.objects.filter(business=business).count()
        total_orders = Order.objects.filter(business=business).count()
        total_invoices = Invoice.objects.filter(business=business).count()
        # total_revenue = Invoice.objects.filter(business=business, status="paid").aggregate(total=models.Sum("total_amount"))["total"] or 0.0
        total_expenses = 0  # You can extend later if you have expense tracking

        serializer = BusinessEntitySerializer(business, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(owner=user)

            return Response({
                "requires_setup": False,
                "message": f"Welcome back, {user.name}!",
                "business": serializer.data,
                "dashboard": {
                    # "total_revenue": total_revenue,
                    "total_customers": total_customers,
                    "total_products": total_products,
                    "total_orders": total_orders,
                    "total_invoices": total_invoices,
                    "total_expenses": total_expenses,
                    # "profit_loss": total_revenue - total_expenses,
                }
            }, status=status.HTTP_200_OK)



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


