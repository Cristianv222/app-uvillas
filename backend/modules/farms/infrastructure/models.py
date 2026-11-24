from django.conf import settings
from django.db import models

from shared.infrastructure.models import SyncableModel


class Farm(SyncableModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="farms")
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name


class Plot(SyncableModel):
    """Lote dentro de una finca."""

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="plots")
    name = models.CharField(max_length=120)
    area_hectares = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.farm.name} / {self.name}"
