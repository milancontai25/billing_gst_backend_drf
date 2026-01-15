from api.utils.file_upload import save_file_to_server
from .models import Item
from rest_framework import generics, serializers
from .serializers import ProductSerializer
from rest_framework.permissions import IsAuthenticated

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.active_business
        if not business:
            raise serializers.ValidationError("No active business selected.")
        return Item.objects.filter(business=business)

    def perform_create(self, serializer):
        user = self.request.user
        business = user.active_business

        if not business:
            raise serializers.ValidationError("No active business selected.")

        image_file = self.request.FILES.get('item_image')

        image_url = None
        if image_file:
            image_url = save_file_to_server(image_file, "items")

        serializer.save(
            business=business,
            item_image_url=image_url
        )



class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        business = user.active_business
        if business is None:
            raise serializers.ValidationError("No active business selected.")

        return Item.objects.filter(business=business)

