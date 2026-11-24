import re
from dataclasses import dataclass
from enum import Enum

from shared.domain.errors import ValidationError

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


class Role(str, Enum):
    FARMER = "farmer"
    ADMIN = "admin"


@dataclass(frozen=True)
class UserEntity:
    id: str
    email: str
    full_name: str
    role: Role


@dataclass(frozen=True)
class NewUser:
    email: str
    password: str
    full_name: str = ""

    def __post_init__(self):
        object.__setattr__(self, "email", self.email.strip().lower())
        if not _EMAIL.match(self.email):
            raise ValidationError("Correo electrónico inválido.", "invalid_email")
        if len(self.password) < MIN_PASSWORD_LENGTH:
            raise ValidationError(
                f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.", "weak_password"
            )
