from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from modules.accounts.application.use_cases import RegisterUser
from modules.accounts.domain.entities import NewUser
from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.accounts.infrastructure.repositories import DjangoUserRepository
from shared.domain.errors import ConflictError, ValidationError


class DomainTests(TestCase):
    def test_invalid_email_and_weak_password(self):
        with self.assertRaises(ValidationError):
            NewUser(email="no-es-correo", password="12345678")
        with self.assertRaises(ValidationError):
            NewUser(email="a@b.co", password="corta")

    def test_duplicate_email(self):
        uc = RegisterUser(DjangoUserRepository())
        uc.execute("a@b.co", "contraseña123")
        with self.assertRaises(ConflictError):
            uc.execute("A@B.co", "contraseña123")


class AuthApiTests(TestCase):
    def test_register_login_me_refresh_logout(self):
        c = APIClient()
        r = c.post("/api/auth/register/", {"email": "uno@x.co", "password": "contraseña123", "full_name": "Uno"}, format="json")
        self.assertEqual(r.status_code, 201)
        r = c.post("/api/auth/login/", {"email": "uno@x.co", "password": "contraseña123"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["user"]["email"], "uno@x.co")
        access, refresh = r.data["access"], r.data["refresh"]
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(c.get("/api/auth/me/").status_code, 200)
        r = APIClient().post("/api/auth/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("refresh", r.data)  # rotación
        self.assertEqual(c.post("/api/auth/logout/", {"refresh": r.data["refresh"]}, format="json").status_code, 204)

    def test_requires_token(self):
        self.assertEqual(APIClient().get("/api/scans/").status_code, 401)

    def test_bad_login(self):
        r = APIClient().post("/api/auth/login/", {"email": "no@x.co", "password": "xxxxxxxx"}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_admin_user_management(self):
        farmer = get_user_model().objects.create_user(
            username="farmer@x.co", email="farmer@x.co", password="contraseña123", role="farmer"
        )
        admin = get_user_model().objects.create_user(
            username="admin@x.co", email="admin@x.co", password="contraseña123", role="admin"
        )

        farmer_c = APIClient()
        farmer_c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(farmer)['access']}")

        admin_c = APIClient()
        admin_c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(admin)['access']}")

        # 1. Agricultor no puede acceder al listado de usuarios
        self.assertEqual(farmer_c.get("/api/auth/users/").status_code, 403)

        # 2. Administrador sí puede listar usuarios
        r = admin_c.get("/api/auth/users/")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(r.data["count"], 2)

        # 3. Administrador puede cambiar el rol de un usuario
        r = admin_c.patch(f"/api/auth/users/{farmer.id}/", {"role": "admin"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["role"], "admin")

        # 4. Validar rechazo de rol no permitido
        r = admin_c.patch(f"/api/auth/users/{farmer.id}/", {"role": "hacker"}, format="json")
        self.assertEqual(r.status_code, 400)
