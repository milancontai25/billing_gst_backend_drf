from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return obj.quantity * obj.price


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    business = BusinessEntitySerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
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
            'date',
            'status',
            'payment_status',
            'customer_name',
            'customer_email',
            'customer_phone',
            'customer_district',
            'customer_state',
            'customer_address',
            'order_items',
            'total_amount',
            'special_notes',
            'created_at',
            'updated_at'
        ]

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled'],
        required=False
    )
    payment_status = serializers.ChoiceField(
        choices=['Unpaid', 'Paid', 'Refunded'],
        required=False
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one field (status or payment_status) is required."
            )
        return attrs



class CartItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.item_name', read_only=True)

    mrp_baseprice = serializers.DecimalField(
        source='item.mrp_baseprice',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    gross_amount = serializers.DecimalField(
        source='item.gross_amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id',
            'item',
            'item_name',
            'mrp_baseprice',
            'gross_amount',
            'quantity',
            'subtotal'
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
        qs = obj.items.all()
        return CartItemSerializer(qs, many=True).data

    def get_total_amount(self, obj):
        return sum(i.subtotal() for i in obj.items.all())



