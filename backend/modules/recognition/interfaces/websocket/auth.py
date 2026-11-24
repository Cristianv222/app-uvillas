from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from modules.accounts.infrastructure.jwt.tokens import user_id_from_access_token


@database_sync_to_async
def get_user(user_id: str):
    return get_user_model().objects.filter(id=user_id, is_active=True).first()


async def authenticate_scope(scope):
    """Lee `?token=<access JWT>` de la URL del WebSocket."""
    token = parse_qs(scope.get("query_string", b"").decode()).get("token", [""])[0]
    user_id = user_id_from_access_token(token) if token else None
    return await get_user(user_id) if user_id else None
