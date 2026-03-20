import uuid
from api.views import CustomerJWTAuthentication
from api.utils.file_upload import save_file_to_server
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
from django.shortcuts import get_object_or_404

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

        order = get_object_or_404(
            Order,
            order_number=order_number,
            business=request.user.active_business
        )

        for field, value in serializer.validated_data.items():
            if isinstance(value, str):
                value = value.capitalize()
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

        cart, _ = Cart.objects.get_or_create(
            customer=customer,
            business=business
        )

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            item=item,
            defaults={'quantity': 0}
        )

        new_quantity = cart_item.quantity + quantity

        # 🔥 REAL STOCK CHECK
        if item.item_type == "Goods" and item.quantity_product < new_quantity:
            return Response({"error": "Not enough stock"}, status=400)
            

        cart_item.quantity = new_quantity
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



from decimal import Decimal, ROUND_HALF_UP
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.views import CustomerJWTAuthentication
from .models import Cart


class CheckoutPreviewView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = request.user
        business = customer.business

        try:
            cart = Cart.objects.get(customer=customer, business=business)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=400)

        cart_items = cart.items.select_related("item")

        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        total_base = Decimal("0.00")
        total_discount = Decimal("0.00")
        total_taxable = Decimal("0.00")
        total_gst = Decimal("0.00")
        total_final = Decimal("0.00")

        items = []

        for ci in cart_items:
            item = ci.item
            qty = Decimal(ci.quantity)

            price = Decimal(str(item.mrp_baseprice if item.mrp_baseprice is not None else item.gross_amount))
            discount_percent = Decimal(str(getattr(item, "discount_percent", 0) or 0))
            gst_percent = Decimal(str(getattr(item, "gst_percent", 0) or 0))

            base_amount = price * qty
            discount_amount = (base_amount * discount_percent) / Decimal("100")
            taxable_amount = base_amount - discount_amount
            gst_amount = (taxable_amount * gst_percent) / Decimal("100")
            total_value = taxable_amount + gst_amount

            base_amount = base_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            discount_amount = discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            taxable_amount = taxable_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst_amount = gst_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_value = total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            items.append({
                "item_id": item.id,
                "name": item.item_name,
                "qty": ci.quantity,
                "price": price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "discount_percent": discount_percent.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "discount_amount": discount_amount,
                "gst_percent": gst_percent.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "base_amount": base_amount,
                "taxable_amount": taxable_amount,
                "gst_amount": gst_amount,
                "total_value": total_value,
            })

            total_base += base_amount
            total_discount += discount_amount
            total_taxable += taxable_amount
            total_gst += gst_amount
            total_final += total_value

        total_base = total_base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_discount = total_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_taxable = total_taxable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_gst = total_gst.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_final = total_final.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        net_payable = total_final.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = (net_payable - total_final).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return Response({
            "customer": {
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address
            },
            "items": items,
            "total_base_amount": total_base,
            "discount_amount": total_discount,
            "total_taxable_amount": total_taxable,
            "total_gst": total_gst,
            "total_amount": total_final,
            "round_off": round_off,
            "net_payable": net_payable,
            "upi_qrcode_url": business.upi_qrcode_url
        })


# class CashCheckoutView(APIView):
#     authentication_classes = [CustomerJWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def post(self, request):
#         customer = request.user
#         business = customer.business

#         if request.data.get("payment_method") != "CASH":
#             return Response({"error": "Invalid payment method"}, status=400)

#         cart = Cart.objects.select_for_update().get(
#             customer=customer,
#             business=business
#         )

#         cart_items = cart.items.select_related('item').select_for_update()

#         if not cart_items.exists():
#             return Response({"error": "Cart empty"}, status=400)

#         total = 0
#         for ci in cart_items:
#             if ci.item.quantity_product < ci.quantity:
#                 raise serializers.ValidationError(
#                     f"Not enough stock for {ci.item.item_name}"
#                 )
#             total += ci.item.gross_amount * ci.quantity

#         # CREATE ORDER (ONLY NOW)
#         order = Order.objects.create(
#             business=business,
#             customer=customer,
#             order_number=f"ORD-{date.today().year}-{uuid.uuid4().hex[:8].upper()}",
#             total_amount=total,
#             payment_method="CASH",
#             payment_status="unpaid",
#             status="CONFIRMED"
#         )

#         for ci in cart_items:
#             item = ci.item
#             item.quantity_product -= ci.quantity
#             item.save(update_fields=['quantity_product'])

#             OrderItem.objects.create(
#                 order=order,
#                 item=item,
#                 product_name=item.item_name,
#                 quantity=ci.quantity,
#                 price=item.gross_amount
#             )

#         cart_items.delete()

#         return Response(
#             {
#                 "message": "Order placed successfully",
#                 "order": OrderSerializer(order).data
#             },
#             status=status.HTTP_201_CREATED
#         )


from rest_framework.parsers import MultiPartParser, FormParser

from decimal import Decimal, ROUND_HALF_UP


class CheckoutView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        customer = request.user
        business = customer.business

        payment_method = (request.data.get("payment_method") or "").upper().strip()
        special_notes = request.data.get("special_notes")

        if payment_method not in ["CASH", "ONLINE"]:
            return Response(
                {"error": "Invalid payment method", "received": payment_method},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment_file = request.FILES.get("attachment")
        payment_proof_file = request.FILES.get("payment_proof")

        attachment_url = None
        payment_proof_url = None

        if attachment_file:
            attachment_url = save_file_to_server(
                attachment_file,
                folder_name="order_attachments"
            )

        if payment_method == "ONLINE":
            if not payment_proof_file:
                return Response(
                    {"error": "Payment proof is required for online payment"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment_proof_url = save_file_to_server(
                payment_proof_file,
                folder_name="payment_proofs"
            )

        try:
            cart = Cart.objects.select_for_update().get(
                customer=customer,
                business=business
            )
        except Cart.DoesNotExist:
            return Response({"error": "Cart empty"}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.select_related("item").select_for_update()

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=status.HTTP_400_BAD_REQUEST)

        total_base = Decimal("0.00")
        total_discount = Decimal("0.00")
        total_taxable = Decimal("0.00")
        total_gst = Decimal("0.00")
        total_final = Decimal("0.00")

        order_items_data = []

        for ci in cart_items:
            item = ci.item
            qty = Decimal(ci.quantity)
            price = Decimal(str(item.mrp_baseprice if item.mrp_baseprice is not None else ci.item.gross_amount))
            discount_percent = Decimal(str(getattr(item, "discount_percent", 0) or 0))
            gst_percent = Decimal(str(getattr(item, "gst_percent", 0) or 0))

            if item.item_type == "Goods":
                if item.quantity_product < ci.quantity:
                    raise serializers.ValidationError(
                        f"Not enough stock for {item.item_name}"
                    )

            base_amount = price * qty
            discount_amount = (base_amount * discount_percent) / Decimal("100")
            taxable_amount = base_amount - discount_amount
            gst_amount = (taxable_amount * gst_percent) / Decimal("100")
            total_value = taxable_amount + gst_amount

            base_amount = base_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            discount_amount = discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            taxable_amount = taxable_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst_amount = gst_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_value = total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            order_items_data.append({
                "item": item,
                "product_name": item.item_name,
                "quantity": ci.quantity,
                "price": price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "discount_percent": discount_percent.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "discount_amount": discount_amount,
                "gst_percent": gst_percent.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                "gst_amount": gst_amount,
                "base_amount": base_amount,
                "taxable_amount": taxable_amount,
                "total_value": total_value,
            })

            total_base += base_amount
            total_discount += discount_amount
            total_taxable += taxable_amount
            total_gst += gst_amount
            total_final += total_value

        total_base = total_base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_discount = total_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_taxable = total_taxable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_gst = total_gst.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_final = total_final.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        net_payable = total_final.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = (net_payable - total_final).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        payment_status = "Unpaid" if payment_method == "CASH" else "Paid"

        order = Order.objects.create(
            business=business,
            customer=customer,
            customer_name=customer.name,
            order_number=f"ORD-{date.today().year}-{uuid.uuid4().hex[:8].upper()}",
            invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            total_base_amount=total_base,
            discount_amount=total_discount,
            total_taxable_amount=total_taxable,
            total_gst=total_gst,
            total_amount=total_final,
            round_off=round_off,
            net_payable=net_payable,
            payment_method=payment_method,
            payment_status=payment_status,
            status="Pending",
            special_notes=special_notes,
            attachment_url=attachment_url,
            payment_proof_url=payment_proof_url
        )

        for row in order_items_data:
            item = row["item"]

            if item.item_type == "Goods":
                item.quantity_product -= row["quantity"]
                item.save(update_fields=["quantity_product"])

            OrderItem.objects.create(
                order=order,
                item=item,
                product_name=row["product_name"],
                quantity=row["quantity"],
                price=row["price"],
                discount_percent=row["discount_percent"],
                discount_amount=row["discount_amount"],
                gst_percent=row["gst_percent"],
                gst_amount=row["gst_amount"],
                base_amount=row["base_amount"],
                taxable_amount=row["taxable_amount"],
                total_value=row["total_value"],
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


