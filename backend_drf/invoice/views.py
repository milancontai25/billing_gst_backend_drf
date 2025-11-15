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


class ItemSearchListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # get user's business
        try:
            business = BusinessEntity.objects.get(owner=user)
        except BusinessEntity.DoesNotExist:
            return Item.objects.none()

        # get the search term from query params
        search_term = self.request.query_params.get('search', '').strip()

        # if no search term, return nothing
        if not search_term:
            return Item.objects.none()

        # return only matching product names (case-insensitive, partial match)
        queryset = Item.objects.filter(
            business=business,
            # Q(product_name__icontains=search_term)
        )

        return queryset



class ItemDetailByNameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_name = request.query_params.get('product_name')
        if not product_name:
            return Response({"error": "Product name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = self.request.user
            business = BusinessEntity.objects.get(owner=user)
            item = Item.objects.get(business=business, product_name=product_name)
        except Item.DoesNotExist:
            return Response({"error": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(item)
        return Response(serializer.data)


class CustomerSearchListView(generics.ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        user = self.request.user
        business = BusinessEntity.objects.get(owner=user)
        return Customer.objects.filter(business=business)


class CustomerDetailByNameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        name = request.query_params.get('name')
        if not name:
            return Response({"error": "Product name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = self.request.user
            business = BusinessEntity.objects.get(owner=user)
            customer = Customer.objects.get(business=business, name=name)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomerSerializer(customer)
        return Response(serializer.data)


class InvoiceListCreateView(generics.ListCreateAPIView):
    """
    GET  -> List all invoices for the logged-in user's business
    POST -> Create new invoice with invoice items and auto stock update
    """
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Invoice.objects.filter(business__owner=user).order_by('-date')

    def get_serializer_context(self):
        """
        Add request object to serializer context
        so serializer can access user and request data.
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
def perform_create(self, serializer):
    user = self.request.user
    business = BusinessEntity.objects.get(owner=user)
    serializer.save(business=business)

        
class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Invoice.objects.filter(business__owner=user)


class InvoiceItemListView(generics.ListAPIView):
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        invoice_id = self.kwargs.get('invoice_id')
        return InvoiceItem.objects.filter(invoice_id=invoice_id)

