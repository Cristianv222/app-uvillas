from typing import Protocol

from .entities import Prediction


class ImageClassifier(Protocol):
    def classify(self, part: str, image_bytes: bytes) -> list[Prediction]:
        """Devuelve todas las clases del modelo de `part` ordenadas por confianza."""
        ...
