from rest_framework import serializers
from .models import Item
from business_entity.serializers import BusinessEntitySerializer
from api.utils.file_upload import save_file_to_server

class ProductSerializer(serializers.ModelSerializer):
    business = BusinessEntitySerializer(read_only=True)
    item_image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ['business', 'item_image_url']

    def create(self, validated_data):
        image = validated_data.pop('item_image', None)
        print("IMAGE RECEIVED:", image)

        item = Item.objects.create(**validated_data)

        if image:
            image_url = save_file_to_server(image, "items")
            print("IMAGE SAVED AT:", image_url)
            item.item_image_url = image_url
            item.save()

        return item


    def update(self, instance, validated_data):
        image = validated_data.pop('item_image', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if image:
            image_url = save_file_to_server(image, "items")
            instance.item_image_url = image_url

        instance.save()
        return instance
