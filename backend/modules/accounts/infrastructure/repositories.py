from django.contrib.auth import get_user_model

from ..domain.entities import NewUser, Role, UserEntity


def to_entity(user) -> UserEntity:
    return UserEntity(id=str(user.id), email=user.email, full_name=user.full_name, role=Role(user.role))


class DjangoUserRepository:
    def email_exists(self, email: str) -> bool:
        return get_user_model().objects.filter(email__iexact=email).exists()

    def create(self, new_user: NewUser) -> UserEntity:
        user = get_user_model().objects.create_user(
            username=new_user.email,
            email=new_user.email,
            password=new_user.password,
            full_name=new_user.full_name,
        )
        return to_entity(user)
