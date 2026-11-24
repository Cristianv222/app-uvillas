import mimetypes

from django.http import FileResponse
from django.utils import timezone
from rest_framework import status, viewsets
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
        if getattr(self.request.user, "role", None) == "admin":
            user_param = self.request.query_params.get("user")
            qs = Scan.objects.filter(user_id=user_param, is_deleted=False) if user_param else Scan.objects.filter(is_deleted=False)
        else:
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

    @action(detail=True, methods=["get", "post", "delete"], url_path="image")
    def image(self, request, pk=None):
        scan = self.get_object()

        if request.method == "GET":
            if not scan.image:
                return Response(
                    {"code": "image_not_found", "detail": "El diagnóstico no tiene imagen asociada."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            content_type, _ = mimetypes.guess_type(scan.image.name)
            as_attachment = request.query_params.get("download") in ("1", "true", "True")
            filename = f"scan_{scan.id}_{scan.part}.jpg"
            return FileResponse(
                scan.image.open("rb"),
                content_type=content_type or "image/jpeg",
                as_attachment=as_attachment,
                filename=filename if as_attachment else None,
            )

        if request.method == "POST":
            data = ScanImageSerializer(data=request.data)
            data.is_valid(raise_exception=True)
            scan.image = data.validated_data["image"]
            scan.updated_at = timezone.now()
            scan.save(update_fields=["image", "updated_at"])
            return Response(self.get_serializer(scan).data)

        if request.method == "DELETE":
            if scan.image:
                scan.image.delete(save=False)
                scan.image = None
                scan.updated_at = timezone.now()
                scan.save(update_fields=["image", "updated_at"])
            return Response(status=status.HTTP_204_NO_CONTENT)
