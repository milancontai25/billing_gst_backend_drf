from rest_framework import serializers
from business_entity.serializers import BusinessEntitySerializer
from api.utils.file_upload import upload_file_to_s3
from django.core.files.uploadedfile import UploadedFile
from .models import Item, ItemVariant

from .models import ItemVariant

from rest_framework import serializers
from .models import VariantAttribute


class VariantAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantAttribute
        fields = [
            "id",
            "attribute_name",
            "attribute_value"
        ]


from .models import VariantImage
from django.core.files.uploadedfile import UploadedFile
from api.utils.file_upload import upload_file_to_s3


from rest_framework import serializers
from django.core.files.uploadedfile import UploadedFile

from .models import VariantImage
from api.utils.file_upload import upload_file_to_s3


class VariantImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        write_only=True,
        required=False
    )

    image_url = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    class Meta:
        model = VariantImage
        fields = [
            "id",
            "image_url",
            "image",
            "is_primary",
            "sort_order",
        ]

    def validate(self, attrs):
        image = attrs.get("image")
        image_url = attrs.get("image_url")

        # For create requests
        if self.instance is None:
            if not image and not image_url:
                raise serializers.ValidationError(
                    "Provide either an image file or an image URL."
                )

        return attrs

    def create(self, validated_data):
        image = validated_data.pop("image", None)

        if image and isinstance(image, UploadedFile):
            validated_data["image_url"] = upload_file_to_s3(
                image,
                "variants"
            )

        return VariantImage.objects.create(**validated_data)

    def update(self, instance, validated_data):
        image = validated_data.pop("image", None)

        if image and isinstance(image, UploadedFile):
            validated_data["image_url"] = upload_file_to_s3(
                image,
                "variants"
            )

        return super().update(instance, validated_data)
    
    

class ItemVariantSerializer(serializers.ModelSerializer):
    attributes = VariantAttributeSerializer(many=True, read_only=True)
    images = VariantImageSerializer(many=True, read_only=True)

    class Meta:
        model = ItemVariant
        fields = [
            "uid",  # 🚨 MAKE SURE THIS SAYS "uid", NOT "id" 🚨
            "variant_name",
            "display_name",
            "sku",
            "barcode",
            "stock",
            "min_stock",
            "mrp_base",
            "selling_price",
            "cost_price",
            "min_order_quantity",
            "max_order_quantity",
            "is_active",
            "attributes",
            "images",
            "created_at"
        ]
        read_only_fields = ["barcode", "display_name", "created_at"]



class ProductSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)
    currency_symbol = serializers.SerializerMethodField()
    currency_code = serializers.SerializerMethodField()
    price_includes_tax = serializers.SerializerMethodField()
    tax_type = serializers.SerializerMethodField()

    barcode = serializers.CharField(read_only=True)
    variants = ItemVariantSerializer(
        many=True,
        read_only=True
    )

    item_image = serializers.ImageField(write_only=True, required=False)
    image_1 = serializers.ImageField(write_only=True, required=False)
    image_2 = serializers.ImageField(write_only=True, required=False)
    image_3 = serializers.ImageField(write_only=True, required=False)
    category_image = serializers.ImageField(write_only=True, required=False)
    subcategory_image = serializers.ImageField(write_only=True, required=False)

    item_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    item_image_1 = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    item_image_2 = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    item_image_3 = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    item_video_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    category_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    subcategory_image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)


    class Meta:
        model = Item
        fields = [
            # Core
            'id', 'business', 'slug',
            'item_type', 'item_name', 'category', 'subcategory', 'description',
            'currency_symbol',
            'currency_code',

            'barcode', 

            'has_variants',
            'variants',

            # Pricing
            'mrp_baseprice', 'gross_amount', 'tax_percent', 'price_includes_tax', 'tax_type',

            # Goods
            'brand_product', 'hsn_sac_code_product',
            'unit_product', 'quantity_product',
            'min_stock_product',
            'min_order_quantity_product',
            'max_order_quantity_product',
            'cost_price_product',

            # Service
            'availability_status_service',

            # Media URLs (read-only)
            'item_image_url',
            'item_image_1',
            'item_image_2',
            'item_image_3',
            'item_video_link',
            'category_image_url',
            'subcategory_image_url',

            # Write-only upload fields
            'item_image',
            'image_1',
            'image_2',
            'image_3',
            'category_image',
            'subcategory_image',

            # Other
            'area', 'customer_view', 'isShow', 'best_selling', 'trending', 'created_date',
        ]

        read_only_fields = [
            'business', 'slug',
            # 'item_image_url',
            # 'item_image_1',
            # 'item_image_2',
            # 'item_image_3',
            # 'category_image_url',
            # 'subcategory_image_url',
        ]

    def get_currency_symbol(self, obj):
        symbols = {
            "INR": "₹",
            "USD": "$",
        }
        return symbols.get(obj.business.currency, "") if obj.business else ""

    def get_currency_code(self, obj):
        return obj.business.currency if obj.business else ""
    
    def get_price_includes_tax(self, obj):
        return obj.business.price_includes_tax if obj.business else False

    def get_tax_type(self, obj):
        return obj.business.tax_type if obj.business else None

    def create(self, validated_data):
        image_fields = {
            "item_image": ("item_image_url", "items"),
            "image_1": ("item_image_1", "items"),
            "image_2": ("item_image_2", "items"),
            "image_3": ("item_image_3", "items"),
            "category_image": ("category_image_url", "items"),
            "subcategory_image": ("subcategory_image_url", "items"),
        }

        uploads = {}

        for upload_field, _ in image_fields.items():
            uploads[upload_field] = validated_data.pop(upload_field, None)

        item = Item.objects.create(**validated_data)

        for upload_field, (model_field, folder) in image_fields.items():
            image = uploads.get(upload_field)

            if image and isinstance(image, UploadedFile):
                setattr(
                    item,
                    model_field,
                    upload_file_to_s3(image, folder)
                )

        item.save()

        return item



    def update(self, instance, validated_data):
        image_fields = {
            "item_image": ("item_image_url", "items"),
            "image_1": ("item_image_1", "items"),
            "image_2": ("item_image_2", "items"),
            "image_3": ("item_image_3", "items"),
            "category_image": ("category_image_url", "items"),
            "subcategory_image": ("subcategory_image_url", "items"),
        }

        uploads = {}

        for upload_field, _ in image_fields.items():
            uploads[upload_field] = validated_data.pop(upload_field, None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        for upload_field, (model_field, folder) in image_fields.items():
            image = uploads.get(upload_field)

            if image and isinstance(image, UploadedFile):
                setattr(
                    instance,
                    model_field,
                    upload_file_to_s3(image, folder)
                )

        instance.save()

        return instance


    def validate(self, data):
        item_type = data.get(
            "item_type",
            getattr(self.instance, "item_type", None)
        )

        has_variants = data.get(
            "has_variants",
            getattr(self.instance, "has_variants", False)
        )

        gross_amount = data.get(
            "gross_amount",
            getattr(self.instance, "gross_amount", None)
        )

        tax_percent = data.get(
            "tax_percent",
            getattr(self.instance, "tax_percent", 0)
        )

        if item_type == "Goods" and not has_variants:
            if gross_amount is None:
                raise serializers.ValidationError(
                    "gross_amount is required."
                )

        if tax_percent < 0:
            raise serializers.ValidationError(
                "tax_percent cannot be negative."
            )

        return data
    

    # ---------- Image Validation ----------
    def _validate_image(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be under 5MB")
        return image

    def validate_item_image(self, image):
        return self._validate_image(image)

    def validate_image_1(self, image):
        return self._validate_image(image)

    def validate_image_2(self, image):
        return self._validate_image(image)

    def validate_image_3(self, image):
        return self._validate_image(image)
    
    def validate_category_image(self, image):
        return self._validate_image(image)
    
    def validate_subcategory_image(self, image):
        return self._validate_image(image)



