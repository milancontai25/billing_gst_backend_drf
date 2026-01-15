from api.utils.file_upload import save_file_to_server
from .models import Item
from rest_framework import generics, serializers
from .serializers import ProductSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.active_business
        if not business:
            raise serializers.ValidationError("No active business selected.")
        return Item.objects.filter(business=business)

    def perform_create(self, serializer):
        business = self.request.user.active_business
        if not business:
            raise serializers.ValidationError("No active business selected.")

        serializer.save(business=business)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.active_business
        if not business:
            raise serializers.ValidationError("No active business selected.")
        return Item.objects.filter(business=business)

