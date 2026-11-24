from dataclasses import asdict

from django.conf import settings
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.errors import ValidationError

from ...application.use_cases import ClassifyImage
from ...infrastructure.tflite.classifier import get_classifier


def classification_to_dict(c) -> dict:
    return {"part": c.part, "best": asdict(c.best), "predictions": [asdict(p) for p in c.predictions]}


class ClassifyView(APIView):
    """POST multipart: `part` (hojas|tallos|frutos) e `image`. Para uso sin WebSocket."""

    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get("image")
        if upload is None:
            raise ValidationError("Falta el archivo 'image'.", "image_required")
        use_case = ClassifyImage(get_classifier(), settings.RECOGNITION_MAX_IMAGE_BYTES)
        result = use_case.execute(request.data.get("part", ""), upload.read(), top_k=3)
        return Response(classification_to_dict(result))


# Public, stateless laboratory. Private scan/history endpoints remain protected.
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle


class LaboratoryThrottle(AnonRateThrottle):
    rate = '20/hour'
    scope = 'laboratory'


class LaboratoryClassifyView(ClassifyView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LaboratoryThrottle]
