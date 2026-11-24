from django.db import models

from shared.domain.parts import Part


class Disease(models.Model):
    part = models.CharField(max_length=10, choices=Part.choices())
    code = models.CharField(max_length=60)
    name = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.CharField(max_length=10, default="none")
    is_healthy = models.BooleanField(default=False)
    symptoms = models.JSONField(default=list)
    treatment = models.JSONField(default=list)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["part", "code"], name="uniq_disease_part_code")]
        ordering = ["part", "name"]

    def __str__(self):
        return f"{self.part}/{self.code}"
