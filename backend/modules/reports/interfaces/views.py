from uuid import UUID

from django.utils.dateparse import parse_date
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.errors import ValidationError

from ..application.use_cases import GetSummary
from ..infrastructure.queries import DjangoReportQueries
from .exports import export_diagnostics, export_summary


def _date(value, name):
    if not value:
        return None
    try:
        parsed = parse_date(value)
    except ValueError:
        parsed = None
    if parsed is None:
        raise ValidationError(f"'{name}' debe tener formato YYYY-MM-DD.", "invalid_date")
    return parsed


def _uuid(value, name):
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError:
        raise ValidationError(f"'{name}' debe ser un UUID válido.", "invalid_filter")


def _filters(request):
    p = request.query_params
    return dict(
        target_user=_uuid(p.get("user"), "user") if request.user.role == "admin" else None,
        farm=_uuid(p.get("farm"), "farm"), plot=_uuid(p.get("plot"), "plot"),
        date_from=_date(p.get("date_from"), "date_from"), date_to=_date(p.get("date_to"), "date_to"),
    )


def _summary(request):
    return GetSummary(DjangoReportQueries()).execute(request.user, **_filters(request))


class SummaryView(APIView):
    def get(self, request):
        return Response(_summary(request))


class ExportView(APIView):
    def get(self, request, file_type):
        if file_type not in ("csv", "xlsx"):
            raise ValidationError("Formato de exportación inválido. Use csv o xlsx.", "invalid_format")
        return export_summary(_summary(request), file_type)


class DiagnosticExportView(APIView):
    def get(self, request):
        records = DjangoReportQueries().diagnostics(request.user, **_filters(request))
        return export_diagnostics(records)
