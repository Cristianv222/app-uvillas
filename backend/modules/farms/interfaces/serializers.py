from rest_framework import serializers

from ..infrastructure.models import Farm, Plot


class FarmSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = Farm
        fields = ["id", "name", "location", "latitude", "longitude", "created_at", "updated_at", "is_deleted"]
        read_only_fields = ["created_at", "updated_at", "is_deleted"]


class PlotSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = Plot
        fields = ["id", "farm", "name", "area_hectares", "created_at", "updated_at", "is_deleted"]
        read_only_fields = ["created_at", "updated_at", "is_deleted"]
