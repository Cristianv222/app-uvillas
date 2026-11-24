from django.conf import settings
from django.db import models
from django.utils import timezone

from shared.domain.parts import Part
from shared.infrastructure.models import SyncableModel


class Scan(SyncableModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans")
    farm = models.ForeignKey("farms.Farm", null=True, blank=True, on_delete=models.SET_NULL, related_name="scans")
    plot = models.ForeignKey("farms.Plot", null=True, blank=True, on_delete=models.SET_NULL, related_name="scans")
    part = models.CharField(max_length=10, choices=Part.choices())
    label_code = models.CharField(max_length=60)
    label_name = models.CharField(max_length=100)
    confidence = models.FloatField()
    is_healthy = models.BooleanField(default=False)
    top_k = models.JSONField(default=list, blank=True)
    image = models.ImageField(upload_to="scans/%Y/%m/", null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    captured_at = models.DateTimeField(default=timezone.now, db_index=True)
    source = models.CharField(max_length=10, default="local")
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-captured_at"]
