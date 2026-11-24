from rest_framework import serializers

from ..infrastructure.models import Scan


class ScanSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    image_url = serializers.SerializerMethodField()
    captured_at = serializers.DateTimeField(required=False)

    class Meta:
        model = Scan
        fields = [
            "id", "farm", "plot", "part", "label_code", "label_name", "confidence", "is_healthy", "top_k",
            "image_url", "latitude", "longitude", "captured_at", "source", "notes",
            "created_at", "updated_at", "is_deleted",
        ]
        read_only_fields = ["is_healthy", "created_at", "updated_at", "is_deleted"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ScanImageSerializer(serializers.Serializer):
    image = serializers.ImageField()
