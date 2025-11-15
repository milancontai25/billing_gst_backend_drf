from django.urls import path
from order.views import CreateOrderView, OrderDetailView, OrderItemListView, OrderListView
from invoice.views import CustomerDetailByNameView, CustomerSearchListView, InvoiceDetailView, InvoiceItemListView, InvoiceListCreateView, ItemDetailByNameView, ItemSearchListView
from products.views import ItemDetailView, ItemListCreateView
from customers.views import CustomerDetailView, CustomerListCreateView, CustomerLoginView, CustomerSignupView
from business_entity.views import BusinessSetupView
from users import views as UserViews
from .views import DashboardView, ItemListView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('register/', UserViews.RegisterView.as_view(), name='auth_register'),
    # path('login/', UserViews.LoginView.as_view(), name='auth_login'),
    path('dashboard/', DashboardView.as_view(), name="dashboard"),
    path('business/setup/', BusinessSetupView.as_view(), name='business-setup'),

    path('products/', ItemListCreateView.as_view(), name='item-list-create'),
    path('products/<int:pk>', ItemDetailView.as_view(), name='item-detail'),
    path('products/', ItemSearchListView.as_view(), name='item-search'),
    path('products/detail/', ItemDetailByNameView.as_view(), name='item-detail-by-name'),

    path('customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>', CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/', CustomerSearchListView.as_view(), name='customer-search'),
    path('customers/detail/', CustomerDetailByNameView.as_view(), name='customer-detail-by-name'),

    # path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('invoices/', InvoiceListCreateView.as_view(), name='invoice-list-create'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<int:invoice_id>/items/', InvoiceItemListView.as_view(), name='invoice-item-list'),

    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/items/', OrderItemListView.as_view(), name='order-item-list'),
   
    path('customer/signup/', CustomerSignupView.as_view(), name='customer-signup'),
    path('customer/login/', CustomerLoginView.as_view(), name='customer-login'),
    path('customer/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('customer/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('customer/dashboard/', ItemListView.as_view(), name="custoemr-dashboard"),
    path('customer/order/create', CreateOrderView.as_view(), name="custoemr-dashboard"),
]