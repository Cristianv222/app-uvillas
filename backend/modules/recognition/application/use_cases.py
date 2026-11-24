from shared.domain.errors import ValidationError
from shared.domain.parts import Part

from ..domain.entities import Classification
from ..domain.ports import ImageClassifier


class ClassifyImage:
    def __init__(self, classifier: ImageClassifier, max_bytes: int = 5 * 1024 * 1024):
        self._classifier = classifier
        self._max_bytes = max_bytes

    def execute(self, part: str, image_bytes: bytes, top_k: int = 3) -> Classification:
        part_value = Part.parse(part).value
        if not image_bytes:
            raise ValidationError("Imagen vacía.", "empty_image")
        if len(image_bytes) > self._max_bytes:
            raise ValidationError("La imagen es demasiado grande.", "image_too_large")
        predictions = self._classifier.classify(part_value, image_bytes)
        return Classification(part=part_value, predictions=predictions[:top_k])
