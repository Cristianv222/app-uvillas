from __future__ import annotations

from dataclasses import dataclass, field

from shared.domain.errors import ValidationError
from shared.domain.labels import is_healthy_code
from shared.domain.parts import Part

SOURCES = ("local", "server")


@dataclass(frozen=True)
class ScanDraft:
    """Diagnóstico por validar antes de guardarse."""

    part: str
    label_code: str
    label_name: str
    confidence: float
    source: str = "local"
    top_k: list = field(default_factory=list)
    latitude: float | None = None
    longitude: float | None = None
    notes: str = ""

    def __post_init__(self):
        Part.parse(self.part)
        if not self.label_code:
            raise ValidationError("Falta la enfermedad detectada.", "label_required")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValidationError("La confianza debe estar entre 0 y 1.", "invalid_confidence")
        if self.source not in SOURCES:
            raise ValidationError("Origen inválido.", "invalid_source")
        if self.latitude is not None and not -90 <= self.latitude <= 90:
            raise ValidationError("Latitud inválida.", "invalid_latitude")
        if self.longitude is not None and not -180 <= self.longitude <= 180:
            raise ValidationError("Longitud inválida.", "invalid_longitude")

    @property
    def is_healthy(self) -> bool:
        return is_healthy_code(self.label_code)
