from datetime import datetime
from enum import Enum


class Winner(str, Enum):
    CLIENT = "client"
    SERVER = "server"


def resolve(server_updated_at: datetime | None, client_updated_at: datetime) -> Winner:
    """Gana el cambio más reciente. Si no existe en el servidor o es más nuevo el del cliente, gana el cliente.
    En empate gana el servidor (evita reescrituras idénticas)."""
    if server_updated_at is None or client_updated_at > server_updated_at:
        return Winner.CLIENT
    return Winner.SERVER
