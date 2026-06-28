from django.http import HttpResponse
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Item, ItemVariant, VariantImage
from .serializers import ItemVariantSerializer, VariantImageSerializer
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .serializers import ProductSerializer
from api.utils.barcode import generate_barcode_image
from .models import ItemVariant, VariantAttribute
from .serializers import VariantAttributeSerializer

from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_queryset(self):
        return Item.objects.filter(
            business=self.get_business()
        ).prefetch_related("variants")

    def perform_create(self, serializer):
        serializer.save(
            business=self.get_business()
        )


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_queryset(self):
        return Item.objects.filter(
            business=self.get_business()
        ).prefetch_related("variants")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()

        return Response(
            {
                "message": "Item deleted successfully."
            },
            status=status.HTTP_200_OK
        )


class DownloadBarcodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        business = request.user.active_business

        if not business:
            return Response(
                {"detail": "No active business selected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item = Item.objects.get(
                pk=pk,
                business=business
            )

        except Item.DoesNotExist:
            return Response(
                {"detail": "Item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if item.item_type == "Service":
            return Response(
                {"detail": "Services do not have barcodes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if item.has_variants:
            return Response(
                {
                    "detail": (
                        "This product has variants. "
                        "Download the barcode from a variant."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not item.barcode:
            return Response(
                {"detail": "Barcode not available."},
                status=status.HTTP_400_BAD_REQUEST
            )

        image = generate_barcode_image(item.barcode)

        response = HttpResponse(
            image,
            content_type="image/png"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{item.item_name}_barcode.png"'
        )

        return response
    

class ItemVariantListCreateView(generics.ListCreateAPIView):
    serializer_class = ItemVariantSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_item(self):
        business = self.get_business()

        try:
            item = Item.objects.get(
                slug=self.kwargs["item_slug"],
                business=business
            )

        except Item.DoesNotExist:
            raise serializers.ValidationError(
                "Item not found."
            )

        if not item.has_variants:
            raise serializers.ValidationError(
                "This item does not support variants."
            )

        return item

    def get_queryset(self):
        return ItemVariant.objects.filter(
            item=self.get_item()
        ).prefetch_related(
            "attributes",
            "images"
        )

    def perform_create(self, serializer):
        serializer.save(
            item=self.get_item()
        )


class ItemVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ItemVariantSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_queryset(self):
        return ItemVariant.objects.filter(
            item__business=self.get_business()
        ).prefetch_related(
            "attributes",
            "images"
        )

    def destroy(self, request, *args, **kwargs):
        variant = self.get_object()

        variant.delete()

        return Response(
            {
                "message": "Variant deleted successfully."
            },
            status=status.HTTP_200_OK
        )
    

class VariantAttributeListCreateView(generics.ListCreateAPIView):
    serializer_class = VariantAttributeSerializer
    permission_classes = [IsAuthenticated]

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_variant(self):
        business = self.get_business()
        try:
            variant = ItemVariant.objects.get(
                uid=self.kwargs["variant_uid"], 
                item__business=business
            )
        except ItemVariant.DoesNotExist:
            raise serializers.ValidationError("Variant not found.")
        return variant

    def get_queryset(self):
        return VariantAttribute.objects.filter(
            variant=self.get_variant()
        ).order_by("id")

    def perform_create(self, serializer):
        serializer.save(
            variant=self.get_variant()
        )


class VariantAttributeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VariantAttributeSerializer
    permission_classes = [IsAuthenticated]

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_queryset(self):
        return VariantAttribute.objects.filter(
            variant__item__business=self.get_business()
        )

    def destroy(self, request, *args, **kwargs):
        attribute = self.get_object()
        attribute.delete()

        return Response(
            {
                "message": "Variant attribute deleted successfully."
            },
            status=status.HTTP_200_OK
        )
    
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)
    
    

class VariantImageListCreateView(generics.ListCreateAPIView):
    serializer_class = VariantImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_variant(self):
        business = self.get_business()
        try:
            variant = ItemVariant.objects.get(
                uid=self.kwargs["variant_uid"], 
                item__business=business
            )
        except ItemVariant.DoesNotExist:
            raise serializers.ValidationError("Variant not found.")
        return variant

    def get_queryset(self):
        return VariantImage.objects.filter(
            variant=self.get_variant()
        ).order_by(
            "sort_order",
            "id"
        )

    def perform_create(self, serializer):
        serializer.save(
            variant=self.get_variant()
        )


class VariantImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VariantImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_business(self):
        business = self.request.user.active_business

        if not business:
            raise serializers.ValidationError(
                "No active business selected."
            )

        return business

    def get_queryset(self):
        return VariantImage.objects.filter(
            variant__item__business=self.get_business()
        )

    def destroy(self, request, *args, **kwargs):
        image = self.get_object()

        image.delete()

        return Response(
            {
                "message": "Variant image deleted successfully."
            },
            status=status.HTTP_200_OK
        )



# import csv
# from decimal import Decimal, InvalidOperation
# from io import TextIOWrapper

# from django.db import transaction
# from django.utils.text import slugify

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.parsers import MultiPartParser
# from rest_framework import status

# from .models import (
#     Item,
#     ItemVariant,
#     VariantAttribute,
#     VariantImage,
# )


# class BulkImportView(APIView):
#     """
#     Bulk Import Supports:

#     ✔ Goods
#     ✔ Services
#     ✔ Simple Products
#     ✔ Variant Products
#     ✔ Update Existing
#     ✔ Create New
#     ✔ Unlimited Attributes
#     ✔ Unlimited Images
#     """

#     parser_classes = [MultiPartParser]

#     # ---------------------------------------------------------
#     # Helpers
#     # ---------------------------------------------------------

#     def to_bool(self, value):
#         if value is None:
#             return False

#         return str(value).strip().lower() in [
#             "true",
#             "1",
#             "yes",
#             "y"
#         ]

#     def to_int(self, value, default=0):
#         try:
#             if value in [None, ""]:
#                 return default
#             return int(float(value))
#         except:
#             return default

#     def to_decimal(self, value, default=0):
#         try:
#             if value in [None, ""]:
#                 return Decimal(default)

#             return Decimal(str(value))
#         except (InvalidOperation, ValueError):
#             return Decimal(default)

#     def get_unique_slug(self, business, item_name):

#         base_slug = slugify(item_name)

#         if not base_slug:
#             base_slug = "item"

#         slug = base_slug
#         counter = 1

#         while Item.objects.filter(
#             business=business,
#             slug=slug
#         ).exists():

#             slug = f"{base_slug}-{counter}"
#             counter += 1

#         return slug

#     # ---------------------------------------------------------
#     # Import
#     # ---------------------------------------------------------

#     @transaction.atomic
#     def post(self, request):

#         business = getattr(
#             request.user,
#             "active_business",
#             None
#         )

#         if not business:
#             return Response(
#                 {
#                     "success": False,
#                     "message": "No active business selected."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         uploaded_file = request.FILES.get("file")

#         if not uploaded_file:
#             return Response(
#                 {
#                     "success": False,
#                     "message": "CSV file is required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if not uploaded_file.name.endswith(".csv"):
#             return Response(
#                 {
#                     "success": False,
#                     "message": "Only CSV files are allowed."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         csv_file = TextIOWrapper(
#             uploaded_file.file,
#             encoding="utf-8"
#         )

#         reader = csv.DictReader(csv_file)

#         # ----------------------------
#         # Counters
#         # ----------------------------

#         items_created = 0
#         items_updated = 0

#         variants_created = 0
#         variants_updated = 0

#         attributes_created = 0
#         images_created = 0

#         errors = []

#         current_item = None

#         for row_number, row in enumerate(reader, start=2):

#             try:

#                 # ---------------------------------------
#                 # Item Basic Info
#                 # ---------------------------------------

#                 item_name = (
#                     row.get("Item Name", "")
#                     .strip()
#                 )

#                 if not item_name:
#                     errors.append(
#                         f"Row {row_number}: Item Name missing."
#                     )
#                     continue

#                 item_type = (
#                     row.get("Item Type", "Goods")
#                     .strip()
#                     or "Goods"
#                 )

#                 if item_type not in ["Goods", "Service"]:
#                     errors.append(
#                         f"Row {row_number}: Invalid Item Type."
#                     )
#                     continue

#                 has_variants = self.to_bool(
#                     row.get("Has Variants")
#                 )

#                 if item_type == "Service":
#                     has_variants = False

#                 slug = None

#                 item_defaults = {

#                     "item_name": item_name,

#                     "item_type": item_type,

#                     "has_variants": has_variants,

#                     "description":
#                         row.get("Description", ""),

#                     "category":
#                         row.get("Category", ""),

#                     "subcategory":
#                         row.get("Subcategory", ""),

#                     "brand_product":
#                         row.get("Brand", "NA"),

#                     "hsn_sac_code_product":
#                         row.get("HSN", "NA"),

#                     "unit_product":
#                         row.get("Unit", "NA"),

#                     "customer_view":
#                         row.get(
#                             "Customer View",
#                             "Special"
#                         ),

#                     "availability_status_service":
#                         row.get(
#                             "Availability",
#                             "NA"
#                         ),

#                     "area":
#                         row.get("Area", ""),

#                     "item_video_link":
#                         row.get(
#                             "Video URL",
#                             ""
#                         ),

#                     "category_image_url":
#                         row.get(
#                             "Category Image",
#                             ""
#                         ),

#                     "subcategory_image_url":
#                         row.get(
#                             "Subcategory Image",
#                             ""
#                         ),

#                     "item_image_url":
#                         row.get(
#                             "Main Image",
#                             ""
#                         ),

#                     "item_image_1":
#                         row.get(
#                             "Image 1",
#                             ""
#                         ),

#                     "item_image_2":
#                         row.get(
#                             "Image 2",
#                             ""
#                         ),

#                     "item_image_3":
#                         row.get(
#                             "Image 3",
#                             ""
#                         ),

#                     "tax_percent":
#                         self.to_decimal(
#                             row.get("Tax %")
#                         ),

#                     "best_selling":
#                         self.to_bool(
#                             row.get("Best Selling")
#                         ),

#                     "trending":
#                         self.to_bool(
#                             row.get("Trending")
#                         ),

#                     "isShow":
#                         self.to_bool(
#                             row.get("Show")
#                         ),
#                 }

                
#                 # ---------------------------------------
#                 # Simple Product
#                 # ---------------------------------------

#                 if not has_variants:

#                     item_defaults.update({

#                         "quantity_product":
#                             self.to_int(
#                                 row.get("Stock")
#                             ),

#                         "min_stock_product":
#                             self.to_int(
#                                 row.get("Minimum Stock")
#                             ),

#                         "mrp_baseprice":
#                             self.to_decimal(
#                                 row.get("MRP")
#                             ),

#                         "gross_amount":
#                             self.to_decimal(
#                                 row.get("Selling Price")
#                             ),

#                         "cost_price_product":
#                             self.to_decimal(
#                                 row.get("Cost Price")
#                             ),

#                         "min_order_quantity_product":
#                             self.to_int(
#                                 row.get("Minimum Order"),
#                                 1
#                             ),

#                         "max_order_quantity_product":
#                             self.to_int(
#                                 row.get("Maximum Order"),
#                                 1
#                             ),
#                     })

#                 else:

#                     # Parent item won't store stock/price

#                     item_defaults.update({

#                         "quantity_product": 0,

#                         "min_stock_product": 0,

#                         "mrp_baseprice": Decimal("0"),

#                         "gross_amount": Decimal("0"),

#                         "cost_price_product": Decimal("0"),

#                         "min_order_quantity_product": 1,

#                         "max_order_quantity_product": 1,
#                     })

#                 # ---------------------------------------
#                 # Create / Update Item
#                 # ---------------------------------------

#                 lookup = {
#                     "business": business,
#                 }

#                 if slug:
#                     lookup["slug"] = slug
#                 else:
#                     lookup["item_name"] = item_name

#                 current_item = Item.objects.filter(
#                     business=business,
#                     item_name=item_name
#                 ).first()

#                 if current_item:

#                     for field, value in item_defaults.items():
#                         setattr(current_item, field, value)

#                     current_item.save()
#                     items_updated += 1

#                 else:

#                     current_item = Item.objects.create(
#                         business=business,
#                         slug=self.get_unique_slug(
#                             business,
#                             item_name
#                         ),
#                         **item_defaults
#                     )

#                     items_created += 1

                
#                 # --------------------------------------------------
#                 # Skip Variant Section
#                 # --------------------------------------------------

#                 if (
#                     current_item.item_type == "Service"
#                     or not current_item.has_variants
#                 ):
#                     continue

#                 # --------------------------------------------------
#                 # Variant Basic Information
#                 # --------------------------------------------------

#                 variant_sku = (
#                     row.get("Variant SKU", "")
#                     .strip()
#                 )

#                 if not variant_sku:
#                     continue

#                 variant_defaults = {

#                     "variant_name":
#                         row.get(
#                             "Variant Name",
#                             ""
#                         ),

#                     "stock":
#                         self.to_int(
#                             row.get("Variant Stock")
#                         ),

#                     "min_stock":
#                         self.to_int(
#                             row.get(
#                                 "Variant Min Stock"
#                             )
#                         ),

#                     "mrp_base":
#                         self.to_decimal(
#                             row.get(
#                                 "Variant MRP"
#                             )
#                         ),

#                     "selling_price":
#                         self.to_decimal(
#                             row.get(
#                                 "Variant Selling Price"
#                             )
#                         ),

#                     "cost_price":
#                         self.to_decimal(
#                             row.get(
#                                 "Variant Cost Price"
#                             )
#                         ),

#                     "min_order_quantity":
#                         self.to_int(
#                             row.get(
#                                 "Variant Min Order"
#                             ),
#                             1
#                         ),

#                     "max_order_quantity":
#                         self.to_int(
#                             row.get(
#                                 "Variant Max Order"
#                             ),
#                             1
#                         ),

#                     "is_active":
#                         self.to_bool(
#                             row.get(
#                                 "Variant Active"
#                             )
#                         ),
#                 }

#                 variant, created = (
#                     ItemVariant.objects.update_or_create(
#                         item=current_item,
#                         sku=variant_sku,
#                         defaults=variant_defaults
#                     )
#                 )

#                 if created:
#                     variants_created += 1
#                 else:
#                     variants_updated += 1

#                 # --------------------------------------------------
#                 # Unlimited Attributes
#                 # --------------------------------------------------

#                 index = 1

#                 while True:

#                     attr_name = row.get(
#                         f"Attr {index} Name"
#                     )

#                     attr_value = row.get(
#                         f"Attr {index} Value"
#                     )

#                     if (
#                         attr_name is None
#                         and attr_value is None
#                     ):
#                         break

#                     attr_name = (
#                         attr_name or ""
#                     ).strip()

#                     attr_value = (
#                         attr_value or ""
#                     ).strip()

#                     if attr_name and attr_value:

#                         VariantAttribute.objects.update_or_create(

#                             variant=variant,

#                             attribute_name=attr_name,

#                             defaults={
#                                 "attribute_value":
#                                     attr_value
#                             }
#                         )

#                         attributes_created += 1

#                     index += 1

#                 VariantImage.objects.filter(
#                     variant=variant
#                 ).delete()

#                 index = 1

#                 while True:

#                     image_url = row.get(
#                         f"Variant Image {index}"
#                     )

#                     if image_url is None:
#                         break

#                     image_url = image_url.strip()

#                     if image_url:

#                         VariantImage.objects.create(
#                             variant=variant,
#                             image_url=image_url,
#                             sort_order=index - 1,
#                             is_primary=index == 1
#                         )

#                         images_created += 1

#                     index += 1

#             except Exception as e:

#                 errors.append(
#                     f"Row {row_number}: {str(e)}"
#                 )

#                 continue
#         # --------------------------------------------------
#         # Import Completed
#         # --------------------------------------------------

#         return Response(
#             {
#                 "success": True,
#                 "message": "Bulk import completed successfully.",

#                 "summary": {

#                     "items_created": items_created,

#                     "items_updated": items_updated,

#                     "variants_created": variants_created,

#                     "variants_updated": variants_updated,

#                     "attributes_created": attributes_created,

#                     "images_created": images_created,

#                     "total_errors": len(errors),
#                 },

#                 "errors": errors,
#             },
#             status=status.HTTP_200_OK,
#         )




import csv
from io import TextIOWrapper
from django.db import transaction
from django.utils.text import slugify
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from .models import Item, ItemVariant, VariantAttribute, VariantImage

class BulkImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic 
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)

        try:
            # utf-8-sig safely ignores the invisible Excel BOM if present
            csv_file = TextIOWrapper(file.file, encoding='utf-8-sig')
            reader = csv.DictReader(csv_file)
        except Exception as e:
            return Response({"error": f"Invalid CSV file format: {str(e)}"}, status=400)
        
        current_item = None
        items_created = 0
        items_updated = 0
        variants_created = 0
        variants_updated = 0

        def parse_num(val, default=0):
            try:
                return float(val.strip()) if val and val.strip() else default
            except ValueError:
                return default

        for row in reader:
            item_name = row.get('Item Name', '').strip()
            provided_slug = row.get('Item Slug', '').strip()
            has_variants = row.get('Has Variants', 'FALSE').strip().upper() == 'TRUE'

            # ---------------------------------------------------------
            # 1. BASE ITEM CREATION
            # ---------------------------------------------------------
            # If Item Name is present, it's the Parent row.
            if item_name:
                final_slug = provided_slug if provided_slug else slugify(item_name)
                
                current_item, created = Item.objects.update_or_create(
                    slug=final_slug, 
                    business=request.user.active_business,
                    defaults={
                        'item_name': item_name,
                        'item_type': row.get('Item Type', 'Goods'),
                        'has_variants': has_variants,
                        'description': row.get('Description', ''),
                        'category': row.get('Category', ''),
                        'subcategory': row.get('Subcategory', ''),
                        'brand_product': row.get('Brand', ''),
                        'hsn_sac_code_product': row.get('HSN', ''),
                        'unit_product': row.get('Unit', 'Pcs'),
                        'area': row.get('Area', ''),
                        'customer_view': row.get('Customer View', 'General'),
                        'availability_status_service': row.get('Availability Status', 'Available'),
                        
                        'tax_percent': parse_num(row.get('Tax %', 0)),
                        'best_selling': row.get('Best Selling', 'FALSE').strip().upper() == 'TRUE',
                        'trending': row.get('Trending', 'FALSE').strip().upper() == 'TRUE',
                        'isShow': row.get('Show', 'FALSE').strip().upper() == 'TRUE',
                        
                        'item_image_url': row.get('Main Image', ''),
                        'item_image_1': row.get('Image 1', ''),
                        'item_image_2': row.get('Image 2', ''),
                        'item_image_3': row.get('Image 3', ''),
                        'item_video_link': row.get('Video URL', ''),
                        'category_image_url': row.get('Category Image', ''),
                        'subcategory_image_url': row.get('Subcategory Image', ''),
                        
                        'quantity_product': parse_num(row.get('Stock', 0)),
                        'min_stock_product': parse_num(row.get('Minimum Stock', 0)),
                        'mrp_baseprice': parse_num(row.get('MRP', 0)),
                        'gross_amount': parse_num(row.get('Selling Price', 0)),
                        'cost_price_product': parse_num(row.get('Cost Price', 0)),
                        'min_order_quantity_product': parse_num(row.get('Minimum Order', 1)),
                        'max_order_quantity_product': parse_num(row.get('Maximum Order', 1)),
                    }
                )
                if created:
                    items_created += 1
                else:
                    items_updated += 1

            # ---------------------------------------------------------
            # 2. VARIANT CREATION
            # ---------------------------------------------------------
            if not current_item or not current_item.has_variants:
                continue 

            variant_sku = row.get('Variant SKU', '').strip()
            if variant_sku:
                variant, v_created = ItemVariant.objects.update_or_create(
                    item=current_item,
                    sku=variant_sku,
                    defaults={
                        'variant_name': row.get('Variant Name', ''),
                        'stock': parse_num(row.get('Variant Stock', 0)),
                        'min_stock': parse_num(row.get('Variant Minimum Stock', 0)),
                        'mrp_base': parse_num(row.get('Variant MRP', 0)),
                        'selling_price': parse_num(row.get('Variant Selling Price', 0)),
                        'cost_price': parse_num(row.get('Variant Cost Price', 0)),
                        'min_order_quantity': parse_num(row.get('Variant Minimum Order', 1)),
                        'max_order_quantity': parse_num(row.get('Variant Maximum Order', 1)),
                        'is_active': row.get('Variant Active', 'TRUE').strip().upper() == 'TRUE',
                    }
                )
                if v_created:
                    variants_created += 1
                else:
                    variants_updated += 1

                # Loop to extract Attr 1 through Attr 10
                for i in range(1, 11):
                    attr_name = row.get(f'Attr {i} Name', '').strip()
                    attr_val = row.get(f'Attr {i} Value', '').strip()
                    if attr_name and attr_val:
                        VariantAttribute.objects.update_or_create(
                            variant=variant, 
                            attribute_name=attr_name, 
                            defaults={'attribute_value': attr_val}
                        )

                # Loop to extract Variant Image 1 through Variant Image 10
                for i in range(1, 11):
                    image_url = row.get(f'Variant Image {i}', '').strip()
                    if image_url:
                        VariantImage.objects.get_or_create(variant=variant, image_url=image_url)

        return Response({
            "message": "Import Successful",
            "items_created": items_created,
            "items_updated": items_updated,
            "variants_created": variants_created,
            "variants_updated": variants_updated
        }, status=200)
    

