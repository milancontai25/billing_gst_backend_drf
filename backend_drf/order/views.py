import uuid
from api.views import CustomerJWTAuthentication
from users.permissions import IsUserOrAdmin
from business_entity.models import BusinessEntity
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from .models import Cart, CartItem, Order, OrderItem
from products.models import Item
from customers.models import Customer
from .serializers import CartSerializer, OrderItemSerializer, OrderSerializer, OrderStatusUpdateSerializer
from datetime import date
from rest_framework.views import APIView

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get_queryset(self):
        user = self.request.user

        if not user.active_business:
            return Order.objects.none()

        return (
            Order.objects
            .filter(business=user.active_business)
            .order_by('-created_at')
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsUserOrAdmin]
    lookup_field = 'order_number'

    def get_queryset(self):
        user = self.request.user

        if not user.active_business:
            return Order.objects.none()

        return Order.objects.filter(business=user.active_business)

    
class OrderItemListView(generics.ListAPIView):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get_queryset(self):
        user = self.request.user
        order_number = self.kwargs.get('order_number')

        if not user.active_business:
            return OrderItem.objects.none()

        return (
            OrderItem.objects
            .select_related('item', 'order')
            .filter(
                order__order_number=order_number,
                order__business=user.active_business
            )
        )



class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def patch(self, request, order_number):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        try:
            order = Order.objects.get(
                order_number=order_number,
                business=user.active_business
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        for field, value in serializer.validated_data.items():
            setattr(order, field, value)

        order.save(update_fields=serializer.validated_data.keys())

        return Response(
            {"message": "Order updated successfully"},
            status=status.HTTP_200_OK
        )




from django.utils.crypto import get_random_string
from django.db import transaction


class AddToCartView(generics.GenericAPIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user
        business = customer.business

        item_id = request.data.get('item')
        quantity = int(request.data.get('quantity', 1))

        if quantity <= 0:
            return Response({"error": "Invalid quantity"}, status=400)

        try:
            item = Item.objects.get(id=item_id, business=business)
        except Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        # ✅ FIXED FIELD
        if item.quantity_product < quantity:
            return Response({"error": "Not enough stock"}, status=400)

        cart, _ = Cart.objects.get_or_create(
            customer=customer,
            business=business
        )

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            item=item,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({"message": "Item added to cart"}, status=200)


class ViewCartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        customer = self.request.user
        business = customer.business

        cart, _ = Cart.objects.get_or_create(
            customer=customer,
            business=business
        )
        return cart



class CheckoutPreviewView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = request.user
        business = customer.business

        # if not customer.address or not customer.state or not customer.pin:
        #     return Response(
        #         {"error": "Please update address before checkout"},
        #         status=400
        #     )

        try:
            cart = Cart.objects.get(customer=customer, business=business)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=400)

        cart_items = cart.items.select_related('item')

        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        total = 0
        items = []

        for ci in cart_items:
            line_total = ci.item.mrp_baseprice * ci.quantity
            total += line_total

            items.append({
                "item_id": ci.item.id,
                "name": ci.item.item_name,
                "qty": ci.quantity,
                "price": ci.item.mrp_baseprice,
                "subtotal": line_total
            })

        return Response({
            "customer": {
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address
            },
            "items": items,
            "total_amount": total
        })


class CashCheckoutView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        customer = request.user
        business = customer.business

        if request.data.get("payment_method") != "CASH":
            return Response({"error": "Invalid payment method"}, status=400)

        cart = Cart.objects.select_for_update().get(
            customer=customer,
            business=business
        )

        cart_items = cart.items.select_related('item').select_for_update()

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=400)

        total = 0
        for ci in cart_items:
            if ci.item.quantity_product < ci.quantity:
                raise serializers.ValidationError(
                    f"Not enough stock for {ci.item.item_name}"
                )
            total += ci.item.mrp_baseprice * ci.quantity

        # CREATE ORDER (ONLY NOW)
        order = Order.objects.create(
            business=business,
            customer=customer,
            order_number=f"ORD-{date.today().year}-{uuid.uuid4().hex[:8].upper()}",
            total_amount=total,
            payment_method="CASH",
            payment_status="unpaid",
            status="CONFIRMED"
        )

        for ci in cart_items:
            item = ci.item
            item.quantity_product -= ci.quantity
            item.save(update_fields=['quantity_product'])

            OrderItem.objects.create(
                order=order,
                item=item,
                product_name=item.item_name,
                quantity=ci.quantity,
                price=item.mrp_baseprice
            )

        cart_items.delete()

        return Response(
            {
                "message": "Order placed successfully",
                "order": OrderSerializer(order).data
            },
            status=status.HTTP_201_CREATED
        )


class CancelOrderView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_number):
        customer = request.user

        try:
            order = Order.objects.get(
                order_number=order_number,
                customer=customer,
                business=customer.business
            )
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        if order.status != "Pending":
            return Response(
                {"error": "Order cannot be cancelled"},
                status=400
            )

        # 🔁 Restore stock
        for item in order.order_items.all():
            product = item.item
            product.quantity_product += item.quantity
            product.save()

        order.status = "Cancelled"
        order.save()

        return Response({"message": "Order cancelled successfully"})


class CustomerOrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = self.request.user
        return Order.objects.filter(
            customer=customer,
            business=customer.business
        ).order_by('-created_at')

class UpdateCartItemView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user
        item_id = request.data.get('item')
        action = request.data.get('action')  # increase | decrease

        try:
            cart = Cart.objects.get(customer=customer, business=customer.business)
            cart_item = CartItem.objects.get(cart=cart, item_id=item_id)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({"error": "Cart item not found"}, status=404)

        if action == "increase":
            if cart_item.item.quantity_product <= cart_item.quantity:
                return Response({"error": "Not enough stock"}, status=400)
            cart_item.quantity += 1

        elif action == "decrease":
            cart_item.quantity -= 1
            if cart_item.quantity <= 0:
                cart_item.delete()
                return Response({"message": "Item removed from cart"})

        else:
            return Response({"error": "Invalid action"}, status=400)

        cart_item.save()
        return Response({"message": "Cart updated"})


