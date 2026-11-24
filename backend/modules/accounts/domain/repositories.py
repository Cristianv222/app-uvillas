from typing import Protocol

from .entities import NewUser, UserEntity


class UserRepository(Protocol):
    def email_exists(self, email: str) -> bool: ...

    def create(self, new_user: NewUser) -> UserEntity: ...
