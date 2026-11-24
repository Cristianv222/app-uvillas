from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Permite el acceso únicamente a usuarios con rol 'admin' o con privilegios de staff/superuser."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (getattr(request.user, "role", None) == "admin" or request.user.is_staff or request.user.is_superuser)
        )
