from api.utils.file_upload import save_file_to_server
from api.utils.barcode import generate_barcode_image
from .models import Item
from rest_framework import generics, serializers
from .serializers import ProductSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

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
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        business = self.request.user.active_business
        if not business:
            raise serializers.ValidationError("No active business selected.")
        return Item.objects.filter(business=business)
    

from rest_framework.views import APIView
from django.http import HttpResponse

class DownloadBarcodeView(APIView):
    def get(self, request, pk):
        try:
            item = Item.objects.get(pk=pk)
        except Item.DoesNotExist:
            return HttpResponse("Item not found", status=404)

        if not item.barcode:
            return HttpResponse("Barcode not available for this item", status=400)

        image = generate_barcode_image(item.barcode)

        response = HttpResponse(image, content_type="image/png")
        response['Content-Disposition'] = f'attachment; filename="{item.item_name}_barcode.png"'
        return response
    
    