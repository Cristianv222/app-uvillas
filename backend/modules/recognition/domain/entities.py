from dataclasses import dataclass


@dataclass(frozen=True)
class Prediction:
    code: str
    name: str
    confidence: float
    is_healthy: bool


@dataclass(frozen=True)
class Classification:
    part: str
    predictions: list  # ordenadas de mayor a menor confianza

    @property
    def best(self) -> Prediction:
        return self.predictions[0]
