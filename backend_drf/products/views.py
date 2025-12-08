from .models import Item
from business_entity.models import BusinessEntity
from rest_framework import generics, serializers
from .serializers import ProductSerializer
from rest_framework.permissions import IsAuthenticated

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        business = user.active_business
        if business is None:
            raise serializers.ValidationError("No active business selected.")

        return Item.objects.filter(business=business)

    def perform_create(self, serializer):
        user = self.request.user
        
        business = user.active_business
        if business is None:
            raise serializers.ValidationError("No active business selected.")
        
        serializer.save(business=business)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        business = user.active_business
        if business is None:
            raise serializers.ValidationError("No active business selected.")

        return Item.objects.filter(business=business)

