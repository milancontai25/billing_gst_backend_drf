from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


# --- Custom User Manager ---
class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

# --- CORE MODELS ---
class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model: Inherits from AbstractBaseUser and PermissionsMixin.
    Uses 'email' as the unique login identifier (USERNAME_FIELD).
    """
    # Django Auth Required Fields
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'phone'] 
    
    # Custom fields
    name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(unique=True, null=False)
    phone = models.CharField(max_length=15, unique=True, blank=False, null=False)

    # Removing 'username' field for simplicity since 'email' is the USERNAME_FIELD
    # If you must keep 'username', ensure it's not used for authentication.
    # The 'password' field is handled by AbstractBaseUser.
    
    # role = models.CharField(max_length=20, default='user')
    # status = models.CharField(max_length=20, default="active")
    
    # Required for PermissionsMixin and Admin Panel
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now) 
    reset_otp = models.IntegerField(null=True, blank=True)

    active_business = models.ForeignKey(
    'business_entity.BusinessEntity',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="active_users")


    # Assign the custom manager
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.name} ({self.email})"

