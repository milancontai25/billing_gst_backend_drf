from rest_framework import serializers
from .models import Item
from business_entity.serializers import BusinessEntitySerializer
from api.utils.file_upload import save_file_to_server


class ProductSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)
    currency_symbol = serializers.SerializerMethodField()
    currency_code = serializers.SerializerMethodField()

    item_image = serializers.ImageField(write_only=True, required=False)
    image_1 = serializers.ImageField(write_only=True, required=False)
    image_2 = serializers.ImageField(write_only=True, required=False)
    image_3 = serializers.ImageField(write_only=True, required=False)
    category_image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Item
        fields = [
            # Core
            'id', 'business', 'slug',
            'item_type', 'item_name', 'category', 'description',
            'currency_symbol',
            'currency_code',

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

            # Write-only upload fields
            'item_image',
            'image_1',
            'image_2',
            'image_3',
            'category_image',

            # Other
            'area', 'customer_view', 'isShow', 'created_date',
        ]

        read_only_fields = [
            'business', 'slug',
            'item_image_url',
            'item_image_1',
            'item_image_2',
            'item_image_3',
            'category_image_url',
        ]

    def get_currency_symbol(self, obj):
        symbols = {
            "INR": "₹",
            "USD": "$",
        }
        return symbols.get(obj.business.currency, "") if obj.business else ""

    def get_currency_code(self, obj):
        return obj.business.currency if obj.business else ""

    def create(self, validated_data):
        images = {
            "item_image_url": validated_data.pop("item_image", None),
            "item_image_1": validated_data.pop("image_1", None),
            "item_image_2": validated_data.pop("image_2", None),
            "item_image_3": validated_data.pop("image_3", None),
            "category_image_url": validated_data.pop("category_image", None),
        }

        item = Item.objects.create(**validated_data)

        for field, image in images.items():
            if image:
                setattr(item, field, save_file_to_server(image, "items"))

        item.save()
        return item

    def update(self, instance, validated_data):
        images = {
            "item_image_url": validated_data.pop("item_image", None),
            "item_image_1": validated_data.pop("image_1", None),
            "item_image_2": validated_data.pop("image_2", None),
            "item_image_3": validated_data.pop("image_3", None),
            "category_image_url": validated_data.pop("category_image", None),
        }

        # ✅ Handle boolean explicitly
        if "price_includes_tax" in validated_data:
            instance.price_includes_tax = validated_data.pop("price_includes_tax")

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update images
        for field, image in images.items():
            if image:
                setattr(instance, field, save_file_to_server(image, "items"))

        instance.save()
        return instance

    def validate(self, data):
        gross_amount = data.get("gross_amount", getattr(self.instance, "gross_amount", None))
        tax_percent = data.get("tax_percent", getattr(self.instance, "tax_percent", 0))
        includes_tax = data.get("price_includes_tax", getattr(self.instance, "price_includes_tax", False))

        if gross_amount is None:
            raise serializers.ValidationError("gross_amount is required")

        if tax_percent < 0:
            raise serializers.ValidationError("tax_percent cannot be negative")

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
