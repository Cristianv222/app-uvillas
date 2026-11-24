from dataclasses import asdict

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..application.use_cases import GetDisease, ListDiseases
from ..infrastructure.repositories import DjangoDiseaseRepository


class DiseaseListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        items = ListDiseases(DjangoDiseaseRepository()).execute(request.query_params.get("part"))
        return Response([asdict(i) for i in items])


class DiseaseDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, part, code):
        return Response(asdict(GetDisease(DjangoDiseaseRepository()).execute(part, code)))
