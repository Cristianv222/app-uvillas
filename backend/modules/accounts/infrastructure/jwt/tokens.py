from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


def issue_tokens(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def user_id_from_access_token(token: str) -> str | None:
    """Valida un access token y devuelve el id del usuario (o None si es inválido/expirado)."""
    try:
        return str(AccessToken(token)["user_id"])
    except (TokenError, KeyError):
        return None
