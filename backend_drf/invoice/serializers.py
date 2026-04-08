from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers
from .models import Invoice, InvoiceItem
from products.models import Item
from business_entity.serializers import BusinessEntitySerializer


# ---------------- Invoice Item Serializer ----------------
class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        exclude = ['invoice']


# ---------------- Invoice Serializer ----------------
class InvoiceSerializer(serializers.ModelSerializer):
    invoice_items = InvoiceItemSerializer(many=True, write_only=True)
    items_details = InvoiceItemSerializer(source="invoice_items", many=True, read_only=True)
    business = BusinessEntitySerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = (
            "business",
            "total_base_amount",
            "discount_amount",
            "total_taxable_amount",
            "total_tax",
            "total_value",
            "round_off",
            "net_payable",
        )

    def create(self, validated_data):
        request = self.context["request"]
        business = request.user.active_business

        items_data = validated_data.pop("invoice_items")
        validated_data.pop("customer_name", None)

        customer_obj = validated_data.get("customer")

        # ✅ Create Invoice
        invoice = Invoice.objects.create(
            business=business,
            customer_name=customer_obj.name,
            **validated_data
        )

        total_base = Decimal("0")
        total_discount = Decimal("0")
        total_taxable = Decimal("0")
        total_tax = Decimal("0")
        total_final = Decimal("0")

        for item_data in items_data:
            item_obj = item_data["item"]

            qty = Decimal(item_data.get("quantity", 1))
            rate = Decimal(item_obj.gross_amount)  # ✅ MAIN PRICE
            discount_percent = Decimal(item_data.get("discount_percent", 0))

            tax_percent = Decimal(item_obj.tax_percent)
            tax_type = business.tax_type
            includes_tax = business.price_includes_tax

            # ---------------- STOCK CHECK ----------------
            if item_obj.quantity_product < qty:
                raise serializers.ValidationError(
                    f"Not enough stock for {item_obj.item_name}"
                )

            item_obj.quantity_product -= int(qty)
            item_obj.save(update_fields=["quantity_product"])

            # ---------------- CALCULATION ----------------
            line_price = rate * qty

            if includes_tax:
                # ✅ TAX INCLUDED LOGIC (CORRECT)
                total_amount = line_price

                discount_amount = (total_amount * discount_percent) / 100
                after_discount = total_amount - discount_amount

                taxable_amount = after_discount / (1 + tax_percent / 100)
                tax_amount = after_discount - taxable_amount

                base_amount = taxable_amount
                total_value = after_discount

            else:
                # ✅ TAX EXCLUDED LOGIC
                base_amount = line_price

                discount_amount = (base_amount * discount_percent) / 100
                taxable_amount = base_amount - discount_amount

                tax_amount = (taxable_amount * tax_percent) / 100
                total_value = taxable_amount + tax_amount

            # ---------------- ROUNDING ----------------
            base_amount = base_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            discount_amount = discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            taxable_amount = taxable_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            tax_amount = tax_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_value = total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # ---------------- SAVE ITEM ----------------
            InvoiceItem.objects.create(
                invoice=invoice,
                item=item_obj,
                item_name=item_obj.item_name,
                quantity=qty,
                rate=rate,

                discount_percent=discount_percent,
                discount_amount=discount_amount,

                tax_percent=tax_percent,
                tax_type=tax_type,
                price_includes_tax=includes_tax,

                base_amount=base_amount,
                tax_amount=tax_amount,
                total_value=total_value,
            )

            # ---------------- TOTALS ----------------
            total_base += base_amount
            total_discount += discount_amount
            total_taxable += taxable_amount
            total_tax += tax_amount
            total_final += total_value

        # ---------------- FINAL ROUNDING ----------------
        net_payable = total_final.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        round_off = net_payable - total_final

        invoice.total_base_amount = total_base
        invoice.discount_amount = total_discount
        invoice.total_taxable_amount = total_taxable
        invoice.total_tax = total_tax
        invoice.total_value = total_final
        invoice.net_payable = net_payable
        invoice.round_off = round_off

        invoice.save()

        return invoice