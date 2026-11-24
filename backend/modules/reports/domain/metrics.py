def health_ratio(total: int, healthy: int) -> float:
    return round(healthy / total, 4) if total else 0.0
