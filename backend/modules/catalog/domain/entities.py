from dataclasses import dataclass, field


@dataclass(frozen=True)
class DiseaseInfo:
    part: str
    code: str
    name: str
    description: str
    severity: str  # none | medium | high
    is_healthy: bool
    symptoms: list[str] = field(default_factory=list)
    treatment: list[str] = field(default_factory=list)
