from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("api/health/", health),
    path("api/auth/", include("modules.accounts.interfaces.urls")),
    path("api/catalog/", include("modules.catalog.interfaces.urls")),
    path("api/farms/", include("modules.farms.interfaces.urls")),
    path("api/scans/", include("modules.scans.interfaces.urls")),
    path("api/recognition/", include("modules.recognition.interfaces.api.urls")),
    path("api/sync/", include("modules.sync.interfaces.urls")),
    path("api/reports/", include("modules.reports.interfaces.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
