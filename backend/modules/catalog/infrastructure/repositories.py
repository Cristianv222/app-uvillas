from ..domain.entities import DiseaseInfo
from .models import Disease


def _to_entity(d: Disease) -> DiseaseInfo:
    return DiseaseInfo(
        part=d.part, code=d.code, name=d.name, description=d.description, severity=d.severity,
        is_healthy=d.is_healthy, symptoms=d.symptoms, treatment=d.treatment,
    )


class DjangoDiseaseRepository:
    def find_all(self, part=None):
        qs = Disease.objects.all()
        if part:
            qs = qs.filter(part=part)
        return [_to_entity(d) for d in qs]

    def get(self, part, code):
        d = Disease.objects.filter(part=part, code=code).first()
        return _to_entity(d) if d else None

    def upsert_many(self, items):
        for i in items:
            Disease.objects.update_or_create(
                part=i.part, code=i.code,
                defaults=dict(
                    name=i.name, description=i.description, severity=i.severity,
                    is_healthy=i.is_healthy, symptoms=i.symptoms, treatment=i.treatment,
                ),
            )
        return len(items)
