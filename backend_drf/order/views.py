import uuid
from api.views import CustomerJWTAuthentication
from api.utils.file_upload import save_file_to_server
from api.utils.tax_calculator import calculate_item_values
from users.permissions import IsUserOrAdmin
from business_entity.models import BusinessEntity
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from .models import Cart, CartItem, Order, OrderItem, Payment
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
            .prefetch_related('order_items')   
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

        return (
            Order.objects
            .filter(business=user.active_business)
            .prefetch_related('order_items', 'payments')   
            .order_by('-created_at')
        )

    
class OrderItemListView(generics.ListAPIView):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def get_queryset(self):
        user = self.request.user
        order_number = self.kwargs.get('order_number')  # ✅ FIX

        if not user.active_business:
            return OrderItem.objects.none()

        order = get_object_or_404(
            Order,
            order_number=order_number,
            business=user.active_business
        )

        return order.order_items.select_related('item')
    

class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def patch(self, request, order_number):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.active_business:
            return Response(
                {"error": "No active business selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = get_object_or_404(
            Order,
            order_number=order_number,
            business=request.user.active_business
        )

        order.status = serializer.validated_data["status"]
        order.save(update_fields=["status"])

        return Response(
            {"message": "Order status updated successfully"},
            status=status.HTTP_200_OK
        )



class UpdatePaymentStatusView(APIView):
    permission_classes = [IsAuthenticated, IsUserOrAdmin]

    def patch(self, request, order_number):
        if not request.user.active_business:
            return Response(
                {"error": "No active business selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_status = request.data.get("status")

        if payment_status not in ["Pending", "Success", "Failed", "Refunded"]:
            return Response(
                {"error": "Invalid payment status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = get_object_or_404(
            Order,
            order_number=order_number,
            business=request.user.active_business
        )

        payment = order.payments.last()

        if not payment:
            return Response(
                {"error": "No payment found"},
                status=status.HTTP_404_NOT_FOUND
            )

        payment.status = payment_status
        payment.save(update_fields=["status"])

        return Response({
            "message": "Payment status updated successfully"
        }, status=status.HTTP_200_OK)
    
    
from django.utils.crypto import get_random_string
from django.db import transaction


class AddToCartView(generics.GenericAPIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        customer = request.user

        if not customer.business:
            return Response({"error": "No business assigned"}, status=400)

        business = customer.business
        item_id = request.data.get('item')

        if not item_id:
            return Response({"error": "Item is required"}, status=400)

        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity"}, status=400)

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

        cart_item, _ = CartItem.objects.get_or_create(
            cart=cart,
            item=item,
            defaults={'quantity': 0}
        )

        new_quantity = cart_item.quantity + quantity

        if item.item_type == "Goods" and item.quantity_product < new_quantity:
            return Response({"error": "Not enough stock"}, status=400)

        cart_item.quantity = new_quantity
        cart_item.save()

        return Response({
            "message": "Item added to cart",
            "quantity": cart_item.quantity
        }, status=200)

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
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
import uuid


class CheckoutPreviewView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = request.user
        business = customer.business

        # ---------------- CART ----------------
        try:
            cart = Cart.objects.get(customer=customer, business=business)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=400)

        cart_items = cart.items.select_related("item")

        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=400)

        # ---------------- TOTALS ----------------
        total_base = Decimal("0.00")
        total_discount = Decimal("0.00")
        total_taxable = Decimal("0.00")
        total_tax = Decimal("0.00")
        total_final = Decimal("0.00")

        items = []

        # ---------------- LOOP ----------------
        for ci in cart_items:
            item = ci.item

            # ✅ STOCK CHECK
            if item.item_type == "Goods" and item.quantity_product < ci.quantity:
                return Response(
                    {"error": f"Not enough stock for {item.item_name}"},
                    status=400
                )

            values = calculate_item_values(
                price=item.gross_amount,
                qty=ci.quantity,
                discount_percent=getattr(item, "discount_percent", 0),
                tax_percent=item.tax_percent,
                includes_tax=business.price_includes_tax
            )

            items.append({
                "item_id": item.id,
                "name": item.item_name,
                "qty": ci.quantity,
                **values
            })

            total_base += values["base_amount"]
            total_discount += values["discount_amount"]
            total_taxable += values["taxable_amount"]
            total_tax += values["tax_amount"]
            total_final += values["total_value"]

        # ---------------- ROUNDING ----------------
        total_base = total_base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_discount = total_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_taxable = total_taxable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_tax = total_tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_final = total_final.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        net_payable = total_final.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = (net_payable - total_final).quantize(Decimal("0.01"))

        
        # ---------------- PAYMENT CONFIG ----------------
        payment_config = getattr(business, "payment_config", None)

        payment_data = {
            "default_method": "CASH",   # ✅ always default
            "available_methods": ["CASH"],  # ✅ always include cash
            "upi": None,
            "gateway": None
        }

        if payment_config:
            mode = payment_config.payment_mode

            # ✅ UPI
            if mode in ["UPI", "BOTH"] and payment_config.is_upi_active:
                payment_data["available_methods"].append("UPI")

                payment_data["upi"] = {
                    "upi_id": payment_config.upi_id,
                    "upi_qrcode_url": payment_config.upi_qrcode_url
                }

            # ✅ GATEWAY
            if mode in ["GATEWAY", "BOTH"] and payment_config.is_gateway_active:
                payment_data["available_methods"].append("GATEWAY")

                payment_data["gateway"] = {
                    "provider": payment_config.gateway_provider,
                    "public_key": payment_config.gateway_public_key,
                    "merchant_id": payment_config.gateway_merchant_id
                }

        # ---------------- RESPONSE ----------------
        return Response({
            "customer": {
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address,
            },
            "items": items,

            "total_base_amount": total_base,
            "discount_amount": total_discount,
            "total_taxable_amount": total_taxable,
            "total_tax": total_tax,
            "total_value": total_final,
            "round_off": round_off,
            "net_payable": net_payable,

            "payment": payment_data
        })
    


from rest_framework.parsers import MultiPartParser, FormParser

class CheckoutView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        customer = request.user
        business = customer.business

        payment_method = request.data.get("payment_method", "").upper().strip()

        if payment_method not in ["CASH", "UPI"]:
            return Response({"error": "Invalid payment method"}, status=400)

        # ✅ UPI PROOF FILE
        payment_proof_file = request.FILES.get("payment_proof")

        # ---------------- CART LOCK ----------------
        try:
            cart = Cart.objects.select_for_update().get(
                customer=customer,
                business=business
            )
        except Cart.DoesNotExist:
            return Response({"error": "Cart empty"}, status=400)

        cart_items = cart.items.select_related("item")

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=400)

        # ---------------- TOTALS ----------------
        totals = {
            "base": Decimal("0.00"),
            "discount": Decimal("0.00"),
            "taxable": Decimal("0.00"),
            "tax": Decimal("0.00"),
            "final": Decimal("0.00"),
        }

        order_items_data = []

        # ---------------- CALCULATION ----------------
        for ci in cart_items:
            item = ci.item

            if item.item_type == "Goods" and item.quantity_product < ci.quantity:
                return Response(
                    {"error": f"Not enough stock for {item.item_name}"},
                    status=400
                )

            values = calculate_item_values(
                price=item.gross_amount,
                qty=ci.quantity,
                discount_percent=getattr(item, "discount_percent", 0),
                tax_percent=item.tax_percent,
                includes_tax=business.price_includes_tax
            )

            order_items_data.append((item, ci.quantity, values))

            totals["base"] += values["base_amount"]
            totals["discount"] += values["discount_amount"]
            totals["taxable"] += values["taxable_amount"]
            totals["tax"] += values["tax_amount"]
            totals["final"] += values["total_value"]

        # ---------------- ROUNDING ----------------
        totals = {
            k: v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            for k, v in totals.items()
        }

        net_payable = totals["final"].quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = (net_payable - totals["final"]).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # ---------------- CREATE ORDER ----------------
        order = Order.objects.create(
            business=business,
            customer=customer,
            customer_name=customer.name,
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            total_base_amount=totals["base"],
            discount_amount=totals["discount"],
            total_taxable_amount=totals["taxable"],
            total_tax=totals["tax"],
            total_value=totals["final"],
            round_off=round_off,
            net_payable=net_payable,
            status="Pending"
        )

        # ---------------- CREATE ORDER ITEMS ----------------
        for item, qty, values in order_items_data:
            if item.item_type == "Goods":
                item.quantity_product -= qty
                item.save(update_fields=["quantity_product"])

            OrderItem.objects.create(
            order=order,
            item=item,
            item_name=item.item_name,
            quantity=qty,
            rate=item.gross_amount,

            discount_percent=getattr(item, "discount_percent", 0),
            discount_amount=values["discount_amount"],

            tax_percent=item.tax_percent,
            tax_amount=values["tax_amount"],

            tax_type=business.tax_type,   # ✅ FIXED
            price_includes_tax=business.price_includes_tax,  # ✅ FIXED

            base_amount=values["base_amount"],
            taxable_amount=values["taxable_amount"],
            total_value=values["total_value"],
        )        
            
        
        # ---------------- PAYMENT LOGIC ----------------
        payment_status = "Pending"
        payment_proof_url = None

        # ✅ CASH
        if payment_method == "CASH":
            payment_status = "Pending"

        # ✅ UPI
        elif payment_method == "UPI":
            if not payment_proof_file:
                return Response(
                    {"error": "Payment proof required for UPI"},
                    status=400
                )

            payment_proof_url = save_file_to_server(
                payment_proof_file,
                folder_name="payment_proofs"
            )

        # ---------------- CREATE PAYMENT ----------------
        Payment.objects.create(
            order=order,
            method=payment_method,
            status=payment_status,
            amount=net_payable,
            payment_proof_url=payment_proof_url
        )

        # ---------------- CLEAR CART ----------------
        cart.items.all().delete()

        return Response({
            "message": "Order placed successfully",
            "order_id": order.order_number,
            "payment_method": payment_method,
            "payment_status": payment_status
        }, status=201)
    

    
import requests
from django.conf import settings
import hmac
import hashlib
import razorpay
from django.conf import settings

class CreateRazorpayOrderView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user
        business = customer.business

        cart = Cart.objects.get(customer=customer, business=business)
        cart_items = cart.items.select_related("item")

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=400)

        total_amount = Decimal("0.00")

        for ci in cart_items:
            values = calculate_item_values(
                price=ci.item.gross_amount,
                qty=ci.quantity,
                discount_percent=getattr(ci.item, "discount_percent", 0),
                tax_percent=ci.item.tax_percent,
                includes_tax=business.price_includes_tax
            )
            total_amount += values["total_value"]

        total_amount = total_amount.quantize(Decimal("1"))

        # 🔐 Razorpay client (USE BUSINESS KEYS)
        client = razorpay.Client(auth=(
            business.payment_config.gateway_public_key,
            business.payment_config.gateway_secret_key
        ))

        razorpay_order = client.order.create({
            "amount": int(total_amount * 100),  # paisa
            "currency": "INR",
            "payment_capture": 1
        })

        return Response({
            "order_id": razorpay_order["id"],
            "amount": total_amount,
            "key": business.payment_config.gateway_public_key
        })
    
    
class VerifyRazorpayPaymentView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        order_number = request.data.get("order_number")

        order = get_object_or_404(Order, order_number=order_number)
        payment = order.payments.last()

        business = order.business
        secret = business.payment_config.gateway_secret_key

        # 🔐 VERIFY SIGNATURE
        generated_signature = hmac.new(
            bytes(secret, 'utf-8'),
            bytes(f"{razorpay_order_id}|{razorpay_payment_id}", 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature == razorpay_signature:
            payment.status = "Success"
            payment.gateway_order_id = razorpay_order_id
            payment.gateway_payment_id = razorpay_payment_id
            payment.gateway_signature = razorpay_signature
            payment.save()

            return Response({"message": "Payment verified ✅"})

        else:
            payment.status = "Failed"
            payment.save()

            return Response({"error": "Payment verification failed ❌"}, status=400)
        


class CreatePaypalOrderView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user
        business = customer.business

        cart = Cart.objects.get(customer=customer, business=business)
        cart_items = cart.items.select_related("item")

        if not cart_items.exists():
            return Response({"error": "Cart empty"}, status=400)

        total_amount = Decimal("0.00")

        for ci in cart_items:
            values = calculate_item_values(
                price=ci.item.gross_amount,
                qty=ci.quantity,
                discount_percent=getattr(ci.item, "discount_percent", 0),
                tax_percent=ci.item.tax_percent,
                includes_tax=business.price_includes_tax
            )
            total_amount += values["total_value"]

        total_amount = total_amount.quantize(Decimal("0.01"))

        # 🔐 GET PAYPAL ACCESS TOKEN
        auth = (business.payment_config.gateway_public_key, business.payment_config.gateway_secret_key)

        token_res = requests.post(
            "https://api-m.sandbox.paypal.com/v1/oauth2/token",
            auth=auth,
            data={"grant_type": "client_credentials"}
        )

        access_token = token_res.json()["access_token"]

        # 🔐 CREATE ORDER
        order_res = requests.post(
            "https://api-m.sandbox.paypal.com/v2/checkout/orders",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "USD",
                        "value": str(total_amount)
                    }
                }]
            }
        )

        data = order_res.json()

        return Response({
            "order_id": data["id"],
            "amount": total_amount
        })


class CapturePaypalOrderView(APIView):
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        paypal_order_id = request.data.get("order_id")
        order_number = request.data.get("order_number")

        order = get_object_or_404(Order, order_number=order_number)
        payment = order.payments.last()

        business = order.business

        # 🔐 GET ACCESS TOKEN
        auth = (business.payment_config.gateway_public_key, business.payment_config.gateway_secret_key)

        token_res = requests.post(
            "https://api-m.sandbox.paypal.com/v1/oauth2/token",
            auth=auth,
            data={"grant_type": "client_credentials"}
        )

        access_token = token_res.json()["access_token"]

        # 🔐 CAPTURE PAYMENT
        capture_res = requests.post(
            f"https://api-m.sandbox.paypal.com/v2/checkout/orders/{paypal_order_id}/capture",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
        )

        result = capture_res.json()

        if capture_res.status_code == 201:
            payment.status = "Success"
            payment.gateway_order_id = paypal_order_id
            payment.save()

            return Response({"message": "Payment captured ✅"})

        else:
            payment.status = "Failed"
            payment.save()

            return Response({"error": "Payment failed ❌"}, status=400)

    

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


