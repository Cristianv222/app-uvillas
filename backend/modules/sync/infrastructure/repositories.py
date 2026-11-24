from django.db import transaction

from shared.domain.errors import NotFoundError, PermissionDeniedError, ValidationError
from shared.domain.labels import is_healthy_code
from shared.domain.parts import Part
from modules.farms.infrastructure.models import Farm, Plot
from modules.scans.infrastructure.models import Scan
from django.utils.dateparse import parse_datetime

COMMON = ("updated_at", "is_deleted")
FIELDS = {
    "farms": ("name", "location", "latitude", "longitude"),
    "plots": ("name", "area_hectares"),
    "scans": ("part", "label_code", "label_name", "confidence", "top_k", "latitude", "longitude",
              "source", "notes", "captured_at"),
}
MODELS = {"farms": Farm, "plots": Plot, "scans": Scan}


def _owner_filter(kind, user):
    return {"farms": {"owner": user}, "plots": {"farm__owner": user}, "scans": {"user": user}}[kind]


def _serialize(kind, obj) -> dict:
    base = {"id": str(obj.id), "updated_at": obj.updated_at.isoformat(), "created_at": obj.created_at.isoformat(),
            "is_deleted": obj.is_deleted}
    for f in FIELDS[kind]:
        v = getattr(obj, f)
        base[f] = v.isoformat() if hasattr(v, "isoformat") else v
    if kind == "plots":
        base["farm_id"] = str(obj.farm_id)
    if kind == "scans":
        base.update(farm_id=str(obj.farm_id) if obj.farm_id else None,
                    plot_id=str(obj.plot_id) if obj.plot_id else None,
                    is_healthy=obj.is_healthy, has_image=bool(obj.image))
    return base


class DjangoSyncRepository:
    def server_updated_at(self, kind, user, item_id):
        Model = MODELS[kind]
        obj = Model.objects.filter(id=item_id).only("id", "updated_at").first()
        if obj is None:
            return None
        if not Model.objects.filter(id=item_id, **_owner_filter(kind, user)).exists():
            raise PermissionDeniedError("El registro pertenece a otro usuario.", "foreign_record")
        return obj.updated_at

    @transaction.atomic
    def apply(self, kind, user, item):
        Model = MODELS[kind]
        values = {f: item[f] for f in FIELDS[kind] if f in item}
        values["updated_at"] = item["updated_at"]
        values["is_deleted"] = bool(item.get("is_deleted", False))
        if kind == "scans":
            Part.parse(values.get("part"))
            if "captured_at" in values and isinstance(values["captured_at"], str):
                values["captured_at"] = parse_datetime(values["captured_at"])
            values["is_healthy"] = is_healthy_code(values.get("label_code", ""))
        if "name" in FIELDS[kind] and not str(values.get("name", "x")).strip():
            raise ValidationError("El nombre es obligatorio.", "name_required")
        if kind in ("plots", "scans"):
            self._resolve_relations(kind, user, item, values)
        if kind == "farms":
            values["owner"] = user
        if kind == "scans":
            values["user"] = user
        Model.objects.update_or_create(id=item["id"], defaults=values)

    def _resolve_relations(self, kind, user, item, values):
        farm_id, plot_id = item.get("farm_id"), item.get("plot_id")
        if kind == "plots":
            if not Farm.objects.filter(id=farm_id, owner=user).exists():
                raise NotFoundError("Finca del lote no encontrada.", "farm_not_found")
            values["farm_id"] = farm_id
            return
        values["farm_id"] = farm_id or None
        values["plot_id"] = plot_id or None
        if farm_id and not Farm.objects.filter(id=farm_id, owner=user).exists():
            raise NotFoundError("Finca no encontrada.", "farm_not_found")
        if plot_id and not Plot.objects.filter(id=plot_id, farm__owner=user).exists():
            raise NotFoundError("Lote no encontrado.", "plot_not_found")

    def changes_since(self, kind, user, since):
        qs = MODELS[kind].objects.filter(**_owner_filter(kind, user)).order_by("updated_at")
        if since:
            qs = qs.filter(updated_at__gt=since)
        return [_serialize(kind, o) for o in qs]
