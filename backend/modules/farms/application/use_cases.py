from django.utils import timezone

from shared.domain.errors import NotFoundError

from ..domain.entities import clean_name, validate_area
from ..infrastructure.models import Farm, Plot


class CreateFarm:
    def execute(self, owner, name, **extra) -> Farm:
        return Farm.objects.create(owner=owner, name=clean_name(name), updated_at=timezone.now(), **extra)


class CreatePlot:
    def execute(self, owner, farm_id, name, area_hectares=None, **extra) -> Plot:
        farm = Farm.objects.filter(id=farm_id, owner=owner, is_deleted=False).first()
        if farm is None:
            raise NotFoundError("Finca no encontrada.")
        return Plot.objects.create(
            farm=farm, name=clean_name(name), area_hectares=validate_area(area_hectares),
            updated_at=timezone.now(), **extra,
        )


class DeleteFarm:
    """Borrado lógico (para poder sincronizarlo al móvil)."""

    def execute(self, farm: Farm):
        now = timezone.now()
        farm.is_deleted, farm.updated_at = True, now
        farm.save(update_fields=["is_deleted", "updated_at"])
        farm.plots.update(is_deleted=True, updated_at=now)
