from django.utils.dateparse import parse_datetime
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.errors import ValidationError

from ..application.use_cases import PullChanges, PushChanges
from ..infrastructure.repositories import DjangoSyncRepository


class PushView(APIView):
    """POST {"farms": [...], "plots": [...], "scans": [...]} con id (UUID) y updated_at por registro."""

    def post(self, request):
        if not isinstance(request.data, dict):
            raise ValidationError("Cuerpo inválido.", "bad_payload")
        return Response(PushChanges(DjangoSyncRepository()).execute(request.user, request.data).as_dict())


class PullView(APIView):
    """GET ?since=<ISO8601>: cambios (incluye borrados) posteriores a `since`. Sin `since` devuelve todo."""

    def get(self, request):
        raw = request.query_params.get("since")
        since = parse_datetime(raw.replace(" ", "+")) if raw else None
        if raw and since is None:
            raise ValidationError("Parámetro 'since' inválido.", "invalid_since")
        return Response(PullChanges(DjangoSyncRepository()).execute(request.user, since))
