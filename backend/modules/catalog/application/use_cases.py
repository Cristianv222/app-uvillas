import json
from pathlib import Path

from shared.domain.errors import NotFoundError, ValidationError
from shared.domain.parts import Part

from ..domain.entities import DiseaseInfo
from ..domain.repositories import DiseaseRepository


def _catalog_part(part):
    try:
        return Part.parse(part).value
    except ValidationError as exc:
        raise NotFoundError("Parte no encontrada.") from exc


class ListDiseases:
    def __init__(self, repo: DiseaseRepository):
        self._repo = repo

    def execute(self, part: str | None = None) -> list[DiseaseInfo]:
        return self._repo.find_all(_catalog_part(part) if part else None)


class GetDisease:
    def __init__(self, repo: DiseaseRepository):
        self._repo = repo

    def execute(self, part: str, code: str) -> DiseaseInfo:
        disease = self._repo.get(_catalog_part(part), code)
        if disease is None:
            raise NotFoundError("Enfermedad no encontrada.")
        return disease


class SeedCatalog:
    """Carga `ml-models/catalog.json` (misma fuente que usa el móvil)."""

    def __init__(self, repo: DiseaseRepository):
        self._repo = repo

    def execute(self, catalog_file: Path) -> int:
        raw = json.loads(catalog_file.read_text(encoding="utf-8"))
        items = [
            DiseaseInfo(
                part=Part.parse(r["part"]).value,
                code=r["code"],
                name=r["name"],
                description=r["description"],
                severity=r["severity"],
                is_healthy=r["is_healthy"],
                symptoms=r["symptoms"],
                treatment=r["treatment"],
            )
            for r in raw
        ]
        return self._repo.upsert_many(items)
