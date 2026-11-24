from datetime import datetime
from typing import Protocol

KINDS = ("farms", "plots", "scans")


class SyncRepository(Protocol):
    def server_updated_at(self, kind: str, user, item_id: str) -> datetime | None: ...

    def apply(self, kind: str, user, item: dict) -> None: ...

    def changes_since(self, kind: str, user, since: datetime | None) -> list[dict]: ...
