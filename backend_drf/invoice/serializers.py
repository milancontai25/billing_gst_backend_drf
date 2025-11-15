# invoices/serializers.py
from business_entity.models import BusinessEntity
from rest_framework import serializers
from .models import Invoice, InvoiceItem
from products.models import Item


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        exclude = ['invoice']  # <-- don't require this field in POST


class InvoiceSerializer(serializers.ModelSerializer):
    invoice_items = InvoiceItemSerializer(many=True, write_only=True)
    items_details = InvoiceItemSerializer(source='invoice_items', many=True, read_only=True)

    class Meta:
        model = Invoice
        exclude = ['business']  # <-- handled automatically in the view

    def create(self, validated_data):
        items_data = validated_data.pop('invoice_items')
        request = self.context.get('request')
        user = request.user
        business = BusinessEntity.objects.get(owner=user)

        # create main invoice
        invoice = Invoice.objects.create(business=business, **validated_data)

        total_value = 0
        total_gst = 0

        # add each invoice item
        for item_data in items_data:
            item_obj = item_data.get('item')
            qty = item_data.get('quantity', 0)
            rate = float(item_data.get('rate', 0))
            gst_percent = float(item_data.get('gst_percent', 0))

            # check stock
            if item_obj.quantity < qty:
                raise serializers.ValidationError(f"Not enough stock for {item_obj.product_name}")

            # reduce stock
            item_obj.quantity -= qty
            item_obj.save()

            # compute totals
            total = rate * qty
            total_value += total
            total_gst += (total * gst_percent) / 100

            # create invoice item linked to invoice
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        # update invoice totals
        invoice.total_value = total_value
        invoice.total_gst = total_gst
        invoice.net_payable = round(total_value + total_gst)
        invoice.round_off = invoice.net_payable - (total_value + total_gst)
        invoice.save()

        return invoice
