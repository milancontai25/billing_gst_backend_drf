from django.urls import path
from order.views import AddToCartView, CancelOrderView, CashCheckoutView, CheckoutPreviewView, CustomerOrderHistoryView, OrderDetailView, OrderItemListView, OrderListView, UpdateCartItemView, UpdateOrderStatusView, ViewCartView
from invoice.views import CustomerDetailByNameView, CustomerSearchListView, InvoiceDetailView, InvoiceItemListView, InvoiceListCreateView, ItemDetailByNameView, ItemSearchListView
from products.views import ItemDetailView, ItemListCreateView
from customers.views import CustomerAddressUpdateView, CustomerDetailView, CustomerForgotPasswordView, CustomerListCreateView, CustomerLoginOtpRequestView, CustomerLoginOtpVerifyView, CustomerLoginView, CustomerResetPasswordView, CustomerSignupView, CustomerTokenRefreshView
from business_entity.views import BusinessSetupView, SwitchBusinessView
from users import views as UserViews
from .views import DashboardView, ItemListView, AppRunView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('', AppRunView.as_view(), name='run'),
    path('register/', UserViews.RegisterView.as_view(), name='auth_register'),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),    
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),

    path('forgot-password/', UserViews.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', UserViews.ResetPasswordView.as_view(), name='reset_password'),

    # path('login/', UserViews.LoginView.as_view(), name='auth_login'),
    path('dashboard/', DashboardView.as_view(), name="dashboard"),
    path('business/setup/', BusinessSetupView.as_view(), name='business-setup'),
    path("business/switch/", SwitchBusinessView.as_view(), name="switch-business"),
    
    path('products/', ItemListCreateView.as_view(), name='item-list-create'),
    path('products/<int:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('search/products/', ItemSearchListView.as_view(), name='item-search'),
    path('products/detail/', ItemDetailByNameView.as_view(), name='item-detail-by-name'),

    path('customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('search/customers/', CustomerSearchListView.as_view(), name='customer-search'),
    path('customers/detail/', CustomerDetailByNameView.as_view(), name='customer-detail-by-name'),

    # path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('invoices/', InvoiceListCreateView.as_view(), name='invoice-list-create'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<int:invoice_id>/items/', InvoiceItemListView.as_view(), name='invoice-item-list'),

    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/items/', OrderItemListView.as_view(), name='order-item-list'),
    path('orders/<str:order_number>/update-status/', UpdateOrderStatusView.as_view(), name='order-update-status'),

    path('business/<slug:business_slug>/customer/signup/', CustomerSignupView.as_view(), name='customer-signup'),
    path('business/<slug:business_slug>/customer/login/', CustomerLoginView.as_view(), name='customer-login'),
    path('customer/token/refresh/', CustomerTokenRefreshView.as_view(), name='token-refresh'),
    path('business/<slug:business_slug>/customer/forgot-password/', CustomerForgotPasswordView.as_view()),
    path('business/<slug:business_slug>/customer/reset-password/', CustomerResetPasswordView.as_view()),
    path('business/<slug:business_slug>/customer/login/otp/', CustomerLoginOtpRequestView.as_view()),
    path('business/<slug:business_slug>/customer/login/otp/verify/', CustomerLoginOtpVerifyView.as_view()),

    path('business/<slug:business_slug>/items/', ItemListView.as_view(), name="customer-dashboard"),
    path('customer/cart/add/', AddToCartView.as_view()),
    path('customer/cart/', ViewCartView.as_view()),
    path('customer/cart/checkout/preview/', CheckoutPreviewView.as_view(), name="customer-order-preview"),
    path('customer/cart/checkout/cash/', CashCheckoutView.as_view(), name="customer-order-cash"),
    path('customer/orders/', CustomerOrderHistoryView.as_view(), name='customer-order-history'),
    path('customer/order/<str:order_number>/cancel/', CancelOrderView.as_view(), name='cancel-order'),
    path('customer/cart/update/', UpdateCartItemView.as_view(), name='update-cart'),
    path('customer/profile/address/', CustomerAddressUpdateView.as_view(), name='customer-address-update'),


]