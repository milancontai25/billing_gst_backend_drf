# invoices/serializers.py
from business_entity.serializers import BusinessEntitySerializer
from business_entity.models import BusinessEntity
from rest_framework import serializers
from .models import Invoice, InvoiceItem
from products.models import Item


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        exclude = ['invoice']


class InvoiceSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)
    invoice_items = InvoiceItemSerializer(many=True, write_only=True)
    items_details = InvoiceItemSerializer(source='invoice_items', many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('invoice_items')
        discount_percent = float(validated_data.get("discount_percent", 0))

        invoice = Invoice.objects.create(**validated_data)

        total_value = 0
        total_gst = 0

        for item_data in items_data:
            item_obj = item_data.get('item')
            qty = item_data.get('quantity', 0)
            rate = float(item_data.get('rate', 0))
            gst_percent = float(item_data.get('gst_percent', 0))

            # Stock check
            if item_obj.quantity_product < qty:
                raise serializers.ValidationError(
                    f"Not enough stock for {item_obj.item_name}"
                )

            # Reduce stock
            item_obj.quantity_product -= qty
            item_obj.save()

            # Totals
            line_total = rate * qty
            total_value += line_total
            total_gst += (line_total * gst_percent) / 100

            # Create item
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        # Calculate discount amount
        discount_amount = (total_value * discount_percent) / 100

        # Net amount after discount + GST
        gross_amount = total_value + total_gst - discount_amount

        # Round off & net payable
        net_payable = round(gross_amount)
        round_off = net_payable - gross_amount

        # Save final totals
        invoice.total_value = total_value
        invoice.total_gst = total_gst
        invoice.net_payable = net_payable
        invoice.round_off = round_off

        invoice.save()
        return invoice
