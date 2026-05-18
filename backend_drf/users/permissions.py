from rest_framework.permissions import BasePermission
from customers.models import Customer

class IsUserOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if hasattr(user, 'is_customer') and user.is_customer:
            return False

        return user.is_authenticated and (user.is_superuser or not user.is_anonymous)
    

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser
