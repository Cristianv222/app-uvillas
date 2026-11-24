from shared.domain.errors import ConflictError

from ..domain.entities import NewUser, UserEntity
from ..domain.repositories import UserRepository


class RegisterUser:
    def __init__(self, users: UserRepository):
        self._users = users

    def execute(self, email: str, password: str, full_name: str = "") -> UserEntity:
        new_user = NewUser(email=email, password=password, full_name=full_name)
        if self._users.email_exists(new_user.email):
            raise ConflictError("Ya existe una cuenta con ese correo.", "email_taken")
        return self._users.create(new_user)
