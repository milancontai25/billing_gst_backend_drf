# utils/calculation.py

from decimal import Decimal, ROUND_HALF_UP

def calculate_item_values(price, qty, discount_percent, tax_percent, includes_tax):
    price = Decimal(str(price))
    qty = Decimal(str(qty))
    discount_percent = Decimal(str(discount_percent or 0))
    tax_percent = Decimal(str(tax_percent or 0))

    line_price = price * qty

    if includes_tax:
        discount_amount = (line_price * discount_percent) / 100
        after_discount = line_price - discount_amount

        taxable_amount = after_discount / (1 + tax_percent / 100)
        tax_amount = after_discount - taxable_amount

        base_amount = taxable_amount
        total_value = after_discount
    else:
        base_amount = line_price

        discount_amount = (base_amount * discount_percent) / 100
        taxable_amount = base_amount - discount_amount

        tax_amount = (taxable_amount * tax_percent) / 100
        total_value = taxable_amount + tax_amount

    return {
        "base_amount": base_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "discount_amount": discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "taxable_amount": taxable_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "tax_amount": tax_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "total_value": total_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
    }