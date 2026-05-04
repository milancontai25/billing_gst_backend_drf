# utils/barcode.py

import barcode
from barcode.writer import ImageWriter
from io import BytesIO
from django.core.files.base import ContentFile

def generate_barcode_image(code):
    CODE128 = barcode.get_barcode_class('code128')
    barcode_obj = CODE128(code, writer=ImageWriter())

    buffer = BytesIO()
    barcode_obj.write(buffer)

    return ContentFile(buffer.getvalue(), name=f"{code}.png")