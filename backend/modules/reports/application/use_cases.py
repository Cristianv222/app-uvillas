from ..domain.metrics import health_ratio


class GetSummary:
    def __init__(self, queries):
        self._queries = queries

    def execute(self, user, farm=None, plot=None, date_from=None, date_to=None) -> dict:
        q = self._queries
        filters = dict(farm=farm, plot=plot, date_from=date_from, date_to=date_to)
        total, healthy = q.totals(user, **filters)
        return {
            "total": total,
            "healthy": healthy,
            "diseased": total - healthy,
            "health_ratio": health_ratio(total, healthy),
            "by_part": q.by_part(user, **filters),
            "by_disease": q.by_disease(user, **filters),
            "timeline": q.timeline(user, **filters),
        }
