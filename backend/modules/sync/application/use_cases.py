from dataclasses import dataclass, field
from datetime import datetime

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from shared.domain.errors import DomainError

from ..domain.conflict import Winner, resolve
from ..domain.ports import KINDS, SyncRepository


@dataclass
class PushResult:
    applied: list = field(default_factory=list)
    conflicts: list = field(default_factory=list)  # ganó el servidor; el cliente debe hacer pull
    rejected: list = field(default_factory=list)

    def as_dict(self):
        return {"applied": self.applied, "conflicts": self.conflicts, "rejected": self.rejected,
                "server_time": timezone.now().isoformat()}


class PushChanges:
    """Recibe cambios hechos offline y aplica 'gana el más reciente' por registro."""

    def __init__(self, repo: SyncRepository):
        self._repo = repo

    def execute(self, user, payload: dict) -> PushResult:
        result = PushResult()
        for kind in KINDS:  # orden: fincas -> lotes -> diagnósticos (por las llaves foráneas)
            for item in payload.get(kind) or []:
                ref = {"kind": kind, "id": str(item.get("id", ""))}
                try:
                    client_ts = parse_datetime(str(item.get("updated_at", "")))
                    if not item.get("id") or client_ts is None:
                        raise DomainError("Registro sin id o updated_at válido.", "bad_item")
                    if timezone.is_naive(client_ts):
                        client_ts = timezone.make_aware(client_ts)
                    item = {**item, "updated_at": client_ts}
                    server_ts = self._repo.server_updated_at(kind, user, ref["id"])
                    if resolve(server_ts, client_ts) is Winner.SERVER:
                        result.conflicts.append(ref)
                        continue
                    self._repo.apply(kind, user, item)
                    result.applied.append(ref)
                except DomainError as exc:
                    result.rejected.append({**ref, "code": exc.code, "detail": exc.message})
                except (ValueError, TypeError, KeyError) as exc:
                    result.rejected.append({**ref, "code": "bad_item", "detail": str(exc)})
        return result


class PullChanges:
    def __init__(self, repo: SyncRepository):
        self._repo = repo

    def execute(self, user, since: datetime | None) -> dict:
        data = {kind: self._repo.changes_since(kind, user, since) for kind in KINDS}
        data["server_time"] = timezone.now().isoformat()
        return data
