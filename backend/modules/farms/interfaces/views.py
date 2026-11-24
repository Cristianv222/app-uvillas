from rest_framework import viewsets

from ..application.use_cases import CreateFarm, CreatePlot, DeleteFarm
from ..infrastructure.models import Farm, Plot
from .serializers import FarmSerializer, PlotSerializer


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer

    def get_queryset(self):
        return Farm.objects.filter(owner=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        serializer.instance = CreateFarm().execute(owner=self.request.user, **data)

    def perform_update(self, serializer):
        from django.utils import timezone

        serializer.save(updated_at=timezone.now())

    def perform_destroy(self, instance):
        DeleteFarm().execute(instance)


class PlotViewSet(viewsets.ModelViewSet):
    serializer_class = PlotSerializer

    def get_queryset(self):
        qs = Plot.objects.filter(farm__owner=self.request.user, is_deleted=False)
        farm = self.request.query_params.get("farm")
        return qs.filter(farm_id=farm) if farm else qs

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        farm = data.pop("farm")
        serializer.instance = CreatePlot().execute(owner=self.request.user, farm_id=farm.id, **data)

    def perform_update(self, serializer):
        from django.utils import timezone

        serializer.save(updated_at=timezone.now())

    def perform_destroy(self, instance):
        from django.utils import timezone

        instance.is_deleted, instance.updated_at = True, timezone.now()
        instance.save(update_fields=["is_deleted", "updated_at"])
