from enum import Enum

from shared.domain.errors import ValidationError


class Part(str, Enum):
    """Parte de la planta. Cada una tiene su propio modelo de reconocimiento."""

    HOJAS = "hojas"
    TALLOS = "tallos"
    FRUTOS = "frutos"

    @classmethod
    def parse(cls, value: object) -> "Part":
        try:
            return cls(str(value).strip().lower())
        except ValueError:
            valid = ", ".join(p.value for p in cls)
            raise ValidationError(f"Parte inválida '{value}'. Use: {valid}.", "invalid_part")

    @classmethod
    def choices(cls):
        return [(p.value, p.value.capitalize()) for p in cls]
