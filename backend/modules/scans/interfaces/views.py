from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from ..application.use_cases import CreateScan, DeleteScan
from ..infrastructure.models import Scan
from .serializers import ScanImageSerializer, ScanSerializer


class ScanViewSet(viewsets.ModelViewSet):
    serializer_class = ScanSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Scan.objects.filter(user=self.request.user, is_deleted=False)
        p = self.request.query_params
        for key in ("part", "farm", "plot", "is_healthy"):
            if p.get(key) not in (None, ""):
                value = p[key] in ("1", "true", "True") if key == "is_healthy" else p[key]
                qs = qs.filter(**{key: value})
        return qs

    def perform_create(self, serializer):
        serializer.instance = CreateScan().execute(user=self.request.user, **serializer.validated_data)

    def perform_destroy(self, instance):
        DeleteScan().execute(instance)

    @action(detail=True, methods=["post"], url_path="image")
    def image(self, request, pk=None):
        scan = self.get_object()
        data = ScanImageSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        scan.image = data.validated_data["image"]
        scan.updated_at = timezone.now()
        scan.save(update_fields=["image", "updated_at"])
        return Response(self.get_serializer(scan).data)
