from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from ..application.use_cases import RegisterUser
from ..infrastructure.jwt.tokens import issue_tokens
from ..infrastructure.repositories import DjangoUserRepository
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        data = RegisterSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        entity = RegisterUser(DjangoUserRepository()).execute(**data.validated_data)
        user = get_user_model().objects.get(id=entity.id)
        return Response(
            {"user": UserSerializer(user).data, **issue_tokens(user)}, status=status.HTTP_201_CREATED
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = LoginSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh", "")).blacklist()
        except TokenError:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)
