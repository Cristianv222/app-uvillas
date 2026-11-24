from dataclasses import dataclass

from shared.domain.errors import ValidationError


def clean_name(name: str) -> str:
    name = (name or "").strip()
    if not name:
        raise ValidationError("El nombre es obligatorio.", "name_required")
    if len(name) > 120:
        raise ValidationError("El nombre es demasiado largo.", "name_too_long")
    return name


def validate_area(area):
    if area is not None and area < 0:
        raise ValidationError("El área no puede ser negativa.", "invalid_area")
    return area
