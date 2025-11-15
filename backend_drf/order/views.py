from api.views import CustomerJWTAuthentication
from users.permissions import IsUserOrAdmin
from business_entity.models import BusinessEntity
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from .models import Order, OrderItem
from products.models import Item
from customers.models import Customer
from .serializers import OrderItemSerializer, OrderSerializer
import datetime
from datetime import date

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get_queryset(self):
        user = self.request.user
        business = BusinessEntity.objects.get(owner=user)
        queryset = Order.objects.filter(business=business).order_by('-created_at')

        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if status_param and status_param != 'All':
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(customer__name__icontains=search)
            )

        return queryset


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(business=BusinessEntity.objects.get(owner=user))
    
class OrderItemListView(generics.ListAPIView):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        order_id = self.kwargs.get('order_id')
        return OrderItem.objects.filter(order_id=order_id)


class CreateOrderView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        customer = request.user  # Customer comes from token
        business = customer.business  # linked business
        data = request.data

        items_data = data.get('order_items', [])
        if not items_data:
            return Response(
                {"error": "No order items provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate unique order number
        order_number = f"ORD-{date.today().year}-{Order.objects.count() + 1:04d}"

        # Calculate total amount
        try:
            total = sum(float(i['price']) * int(i['quantity']) for i in items_data)
        except (KeyError, ValueError, TypeError):
            return Response(
                {"error": "Invalid price or quantity format in order items."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Order
        order = Order.objects.create(
            business=business,
            customer=customer,
            order_number=order_number,
            total_amount=total,
            payment_status=data.get('payment_status', 'unpaid'),
            status=data.get('status', 'Pending'),
            special_notes=data.get('special_notes', '')
        )

        # Create Order Items and reduce Item stock
        for i in items_data:
            try:
                item = Item.objects.get(id=i['item'], business=business)
            except Item.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {"error": f"Item with ID {i['item']} not found in your business."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            qty = int(i['quantity'])
            if item.quantity < qty:
                transaction.set_rollback(True)
                return Response(
                    {"error": f"Not enough stock for {item.product_name}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # reduce quantity
            item.quantity -= qty
            item.save()

            # create order item
            OrderItem.objects.create(
                order=order,
                item=item,
                product_name=item.product_name,
                quantity=qty,
                price=i['price']
            )

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UpdateOrderStatusView(generics.UpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def patch(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        payment_status = request.data.get('payment_status')

        if status_value:
            order.status = status_value
        if payment_status:
            order.payment_status = payment_status

        order.save()
        return Response({"message": "Order updated successfully"}, status=status.HTTP_200_OK)
