from django.db.models import Count, Q
from django.db.models.functions import TruncDate

from modules.scans.infrastructure.models import Scan


def _base(user, farm=None, plot=None, date_from=None, date_to=None):
    qs = Scan.objects.filter(user=user, is_deleted=False)
    if farm:
        qs = qs.filter(farm_id=farm)
    if plot:
        qs = qs.filter(plot_id=plot)
    if date_from:
        qs = qs.filter(captured_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(captured_at__date__lte=date_to)
    return qs


class DjangoReportQueries:
    def totals(self, user, **f):
        agg = _base(user, **f).aggregate(total=Count("id"), healthy=Count("id", filter=Q(is_healthy=True)))
        return agg["total"], agg["healthy"]

    def by_part(self, user, **f):
        rows = _base(user, **f).values("part").annotate(total=Count("id"), healthy=Count("id", filter=Q(is_healthy=True)))
        return {r["part"]: {"total": r["total"], "healthy": r["healthy"]} for r in rows}

    def by_disease(self, user, **f):
        rows = (_base(user, **f).filter(is_healthy=False).values("part", "label_code", "label_name")
                .annotate(count=Count("id")).order_by("-count"))
        return [{"part": r["part"], "code": r["label_code"], "name": r["label_name"], "count": r["count"]} for r in rows]

    def timeline(self, user, **f):
        rows = (_base(user, **f).annotate(day=TruncDate("captured_at")).values("day")
                .annotate(total=Count("id"), diseased=Count("id", filter=Q(is_healthy=False))).order_by("day"))
        return [{"date": r["day"].isoformat(), "total": r["total"], "diseased": r["diseased"]} for r in rows]
