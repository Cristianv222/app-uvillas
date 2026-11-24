from django.utils.dateparse import parse_date
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.errors import ValidationError

from ..application.use_cases import GetSummary
from ..infrastructure.queries import DjangoReportQueries


def _date(value, name):
    if not value:
        return None
    parsed = parse_date(value)
    if parsed is None:
        raise ValidationError(f"'{name}' debe tener formato YYYY-MM-DD.", "invalid_date")
    return parsed


class SummaryView(APIView):
    def get(self, request):
        p = request.query_params
        data = GetSummary(DjangoReportQueries()).execute(
            request.user, farm=p.get("farm"), plot=p.get("plot"),
            date_from=_date(p.get("date_from"), "date_from"), date_to=_date(p.get("date_to"), "date_to"),
        )
        return Response(data)
