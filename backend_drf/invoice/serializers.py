from decimal import Decimal, ROUND_HALF_UP
from business_entity.serializers import BusinessEntitySerializer
from rest_framework import serializers
from .models import Invoice, InvoiceItem
from products.models import Item


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        exclude = ['invoice']


class InvoiceSerializer(serializers.ModelSerializer):
    invoice_items = InvoiceItemSerializer(many=True, write_only=True)
    items_details = InvoiceItemSerializer(source="invoice_items", many=True, read_only=True)
    business = BusinessEntitySerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = (
            "business",   # ✅ ADD THIS
            "total_base_amount",
            "discount_amount",
            "total_taxable_amount",
            "total_gst",
            "total_value",
            "round_off",
            "net_payable",
        )


    def create(self, validated_data):
        request = self.context["request"]
        business = request.user.active_business

        items_data = validated_data.pop("invoice_items")

        # Remove customer_name if it exists in request
        validated_data.pop("customer_name", None)

        customer_obj = validated_data.get("customer")

        invoice = Invoice.objects.create(
            business=business,
            customer_name=customer_obj.name,  # auto fill from customer
            **validated_data
        )


        total_base = Decimal("0")
        total_discount = Decimal("0")
        total_taxable = Decimal("0")
        total_gst = Decimal("0")
        total_final = Decimal("0")

        for item_data in items_data:
            item_obj = item_data["item"]
            qty = Decimal(item_data.get("quantity", 1))
            rate = Decimal(item_data.get("rate", 0))
            discount_percent = Decimal(item_data.get("discount_percent", 0))
            gst_percent = Decimal(item_data.get("gst_percent", 0))

            # Stock check
            if item_obj.quantity_product < qty:
                raise serializers.ValidationError(
                    f"Not enough stock for {item_obj.item_name}"
                )

            # Reduce stock
            item_obj.quantity_product -= qty
            item_obj.save(update_fields=["quantity_product"])

            base_amount = rate * qty
            discount_amount = (base_amount * discount_percent) / 100
            taxable_amount = base_amount - discount_amount
            gst_amount = (taxable_amount * gst_percent) / 100
            total_value = taxable_amount + gst_amount

            # Quantize
            base_amount = base_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            discount_amount = discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            taxable_amount = taxable_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            gst_amount = gst_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_value = total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            InvoiceItem.objects.create(
                invoice=invoice,
                item=item_obj,
                quantity=qty,
                rate=rate,
                discount_percent=discount_percent,
                discount_amount=discount_amount,
                gst_percent=gst_percent,
                gst_amount=gst_amount,
                base_amount=base_amount,
                taxable_amount=taxable_amount,
                total_value=total_value,
            )

            total_base += base_amount
            total_discount += discount_amount
            total_taxable += taxable_amount
            total_gst += gst_amount
            total_final += total_value

        net_payable = total_final.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = net_payable - total_final

        invoice.total_base_amount = total_base
        invoice.discount_amount = total_discount
        invoice.total_taxable_amount = total_taxable
        invoice.total_gst = total_gst
        invoice.total_value = total_final
        invoice.net_payable = net_payable
        invoice.round_off = round_off

        invoice.save()

        return invoice
