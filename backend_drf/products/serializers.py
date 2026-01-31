from rest_framework import serializers
from .models import Item
from business_entity.serializers import BusinessEntitySerializer
from api.utils.file_upload import save_file_to_server

class ProductSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)

    item_image = serializers.ImageField(write_only=True, required=False)
    image_1 = serializers.ImageField(write_only=True, required=False)
    image_2 = serializers.ImageField(write_only=True, required=False)
    image_3 = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ['business']

    def create(self, validated_data):
        images = {
            "item_image_url": validated_data.pop("item_image", None),
            "item_image_1": validated_data.pop("image_1", None),
            "item_image_2": validated_data.pop("image_2", None),
            "item_image_3": validated_data.pop("image_3", None),
        }

        item = Item.objects.create(**validated_data)

        for field, image in images.items():
            if image:
                item.__dict__[field] = save_file_to_server(image, "items")

        item.save()
        return item

    def update(self, instance, validated_data):
        images = {
            "item_image_url": validated_data.pop("item_image", None),
            "item_image_1": validated_data.pop("image_1", None),
            "item_image_2": validated_data.pop("image_2", None),
            "item_image_3": validated_data.pop("image_3", None),
        }

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        for field, image in images.items():
            if image:
                instance.__dict__[field] = save_file_to_server(image, "items")

        instance.save()
        return instance

    def validate_item_image(self, image):
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be under 5MB")
        return image
