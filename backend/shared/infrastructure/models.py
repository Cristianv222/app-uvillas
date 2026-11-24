import uuid

from django.db import models
from django.utils import timezone


class SyncableModel(models.Model):
    """Base de entidades que se sincronizan con el móvil.

    - `id` es un UUID que puede generar el cliente (offline).
    - `updated_at` decide el ganador en conflictos (gana el más reciente).
    - `is_deleted` es borrado lógico para poder propagar eliminaciones.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True
