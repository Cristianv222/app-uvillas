from typing import Protocol

from .entities import DiseaseInfo


class DiseaseRepository(Protocol):
    def find_all(self, part: str | None = None) -> list[DiseaseInfo]: ...

    def get(self, part: str, code: str) -> DiseaseInfo | None: ...

    def upsert_many(self, items: list[DiseaseInfo]) -> int: ...
