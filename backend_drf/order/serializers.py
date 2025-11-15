from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return obj.quantity * obj.price


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_city = serializers.CharField(source='customer.city', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number',
            'date',
            'status',
            'payment_status',
            'customer_name',
            'customer_email',
            'customer_phone',
            'customer_city',
            'customer_address',
            'order_items',
            'total_amount',
            'special_notes',
            'created_at',
            'updated_at'
        ]
