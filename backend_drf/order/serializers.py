from products.serializers import VariantAttributeSerializer, VariantImageSerializer
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Payment

class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    variant_name = serializers.CharField(
        source="variant.display_name",
        read_only=True
    )

    sku = serializers.CharField(
        source="variant.sku",
        read_only=True
    )

    barcode = serializers.CharField(
        source="variant.barcode",
        read_only=True
    )

    attributes = VariantAttributeSerializer(
        source="variant.attributes",
        many=True,
        read_only=True
    )

    images = VariantImageSerializer(
        source="variant.images",
        many=True,
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "item_name",
            "quantity",
            "rate",

            "variant",
            "variant_name",
            "sku",
            "barcode",
            "attributes",
            "images",

            "discount_percent",
            "discount_amount",
            "tax_percent",
            "tax_type",
            "price_includes_tax",
            "base_amount",
            "taxable_amount",
            "tax_amount",
            "total_value",
            "subtotal",
        ]

    def get_subtotal(self, obj):
        return obj.quantity * obj.rate
    



class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "method",
            "status",
            "amount",
            "payment_proof_url",
            "gateway_order_id",
            "gateway_payment_id",
        ]


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    business = BusinessEntitySerializer(read_only=True)

    customer_name_display = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_district = serializers.CharField(source='customer.district', read_only=True)
    customer_state = serializers.CharField(source='customer.state', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True)

    class Meta:
        model = Order
        fields = [
            'business',
            'order_number',
            'invoice_id',
            'date',

            'customer_name',
            'customer_name_display',
            'customer_email',
            'customer_phone',
            'customer_district',
            'customer_state',
            'customer_address',

            'status',
            'payment_status',
            'total_base_amount',
            'discount_amount',
            'total_taxable_amount',
            'total_tax',
            'total_value',
            'round_off',
            'net_payable',

            'order_items',
            'payments',   # ✅ NEW

            'attachment_url',
            'special_notes',
            'created_at',
            'updated_at'
        ]

    def get_payment_status(self, obj):
        payment = obj.payments.last()
        return payment.status if payment else "Pending"

        
class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled'],
        required=False
    )
    # payment_status = serializers.ChoiceField(
    #     choices=['Unpaid', 'Paid', 'Refunded'],
    #     required=False
    # )

    # def validate(self, attrs):
    #     if not attrs:
    #         raise serializers.ValidationError(
    #             "At least one field (status or payment_status) is required."
    #         )
    #     return attrs



class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.item_name', read_only=True)

    mrp_baseprice = serializers.SerializerMethodField()

    def get_mrp_baseprice(self, obj):
        if obj.variant:
            return obj.variant.mrp_base
        return obj.item.mrp_baseprice

    gross_amount = serializers.SerializerMethodField()

    def get_gross_amount(self, obj):
        if obj.variant:
            return obj.variant.selling_price
        return obj.item.gross_amount

    subtotal = serializers.SerializerMethodField()

    
    variant_name = serializers.CharField(
        source="variant.display_name",
        read_only=True
    )

    sku = serializers.CharField(
        source="variant.sku",
        read_only=True
    )

    images = VariantImageSerializer(
        source="variant.images",
        many=True,
        read_only=True
    )

    attributes = VariantAttributeSerializer(
        source="variant.attributes",
        many=True,
        read_only=True
    )

    item_image = serializers.SerializerMethodField()

    def get_item_image(self, obj):
        if obj.variant:
            image = obj.variant.images.filter(is_primary=True).first()

            if not image:
                image = obj.variant.images.first()

            return image.image_url if image else None

        return obj.item.item_image_url

    class Meta:
        model = CartItem
        fields = [
            'id',
            'item',
            'item_name',
            "item_image",
            'mrp_baseprice',
            'gross_amount',
            'quantity',
            'subtotal',
            "variant",
            "variant_name",
            "sku",
            "attributes",
            "images",
        ]

    def get_subtotal(self, obj):
        return obj.subtotal()


from decimal import Decimal

class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_amount']

    def get_items(self, obj):
        qs = (
            obj.items
            .select_related("item", "variant")
            .prefetch_related(
                "variant__attributes",
                "variant__images"
            )
        )
        return CartItemSerializer(qs, many=True).data


    def get_total_amount(self, obj):
        return sum(
            (item.subtotal() for item in obj.items.select_related("item", "variant")),
            Decimal("0.00")
        )



