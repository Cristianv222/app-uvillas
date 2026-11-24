from django.utils import timezone

from shared.domain.errors import NotFoundError

from ..domain.entities import ScanDraft
from ..infrastructure.models import Scan


class CreateScan:
    def execute(self, user, farm=None, plot=None, captured_at=None, **fields) -> Scan:
        keep = {k: v for k, v in fields.items() if k in ("id", "image")}
        draft = ScanDraft(
            part=fields["part"], label_code=fields["label_code"], label_name=fields.get("label_name", ""),
            confidence=fields["confidence"], source=fields.get("source", "local"),
            top_k=fields.get("top_k", []), latitude=fields.get("latitude"),
            longitude=fields.get("longitude"), notes=fields.get("notes", ""),
        )
        if plot is not None and farm is None:
            farm = plot.farm
        for ref in (farm, plot):
            if ref is not None and (getattr(ref, "owner_id", None) or ref.farm.owner_id) != user.id:
                raise NotFoundError("Finca o lote no encontrado.")
        now = timezone.now()
        return Scan.objects.create(
            user=user, farm=farm, plot=plot, part=draft.part, label_code=draft.label_code,
            label_name=draft.label_name, confidence=draft.confidence, is_healthy=draft.is_healthy,
            top_k=draft.top_k, latitude=draft.latitude, longitude=draft.longitude, notes=draft.notes,
            source=draft.source, captured_at=captured_at or now, updated_at=now, **keep,
        )


class DeleteScan:
    def execute(self, scan: Scan):
        scan.is_deleted, scan.updated_at = True, timezone.now()
        scan.save(update_fields=["is_deleted", "updated_at"])
