from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "email", "full_name", "role"]
        read_only_fields = fields


class UpdateUserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["role"]

    def validate_role(self, value):
        if value not in ("farmer", "admin"):
            raise serializers.ValidationError("Rol inválido. Debe ser 'farmer' o 'admin'.")
        return value


class RegisterSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True, default="")


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
