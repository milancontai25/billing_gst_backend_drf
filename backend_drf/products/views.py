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
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        return Item.objects.filter(business=business)

    def perform_create(self, serializer):
        user = self.request.user
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        serializer.save(business=business)

class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            raise serializers.ValidationError("Business entity not found for this user.")
        
        return Item.objects.filter(business=business)

