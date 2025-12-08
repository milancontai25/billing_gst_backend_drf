from customers.models import Customer
from customers.serializers import CustomerSerializer
from business_entity.models import BusinessEntity
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from products.models import Item
from products.serializers import ProductSerializer
from rest_framework import status, generics, filters
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceItemSerializer
from django.db.models import Q
from rest_framework import serializers


class ItemSearchListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.active_business
        if business is None:
            return Item.objects.none()

        search_term = self.request.query_params.get('search', '').strip()
        if not search_term:
            return Item.objects.none()

        return Item.objects.filter(
            business=business,
            item_name__icontains=search_term
        )



class ItemDetailByNameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_name = request.query_params.get('product_name')
        if not product_name:
            return Response({"error": "Product name is required."}, status=400)

        business = request.user.active_business
        if business is None:
            return Response({"error": "No active business selected."}, status=400)

        try:
            item = Item.objects.get(business=business, item_name=product_name)
        except Item.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        return Response(ProductSerializer(item).data)


class CustomerSearchListView(generics.ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        business = self.request.user.active_business
        if business is None:
            return Customer.objects.none()

        return Customer.objects.filter(business=business)


class CustomerDetailByNameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        name = request.query_params.get('name')
        if not name:
            return Response({"error": "Customer name is required."}, status=400)

        business = request.user.active_business
        if business is None:
            return Response({"error": "No active business selected."}, status=400)

        try:
            customer = Customer.objects.get(business=business, name=name)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=404)

        return Response(CustomerSerializer(customer).data)


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Invoice.objects.filter(business=user.active_business).order_by('-date')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        user = self.request.user
        business = user.active_business
        serializer.save(business=business)

        
class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        business = self.request.user.active_business
        if business is None:
            return Invoice.objects.none()

        return Invoice.objects.filter(business=business)


class InvoiceItemListView(generics.ListAPIView):
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        invoice_id = self.kwargs.get('invoice_id')
        return InvoiceItem.objects.filter(invoice_id=invoice_id)

