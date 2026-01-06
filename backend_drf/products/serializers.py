from .models import Item
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers

class ProductSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)
    
    class Meta:
        model = Item
        fields = '__all__'     #['id', 'business', 'item_type', 'name', 'description', 'category', 'unit_price', 'stock_qty', 'gst_applicable']
        read_only_fields = ['business']
