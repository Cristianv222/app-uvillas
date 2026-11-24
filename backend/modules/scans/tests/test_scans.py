import io
import uuid

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from PIL import Image
from rest_framework.test import APIClient

from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.scans.domain.entities import ScanDraft
from shared.domain.errors import ValidationError


def make_test_image_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=(0, 128, 0)).save(buf, format="JPEG")
    return buf.getvalue()


class DraftTests(SimpleTestCase):
    def test_validation(self):
        with self.assertRaises(ValidationError):
            ScanDraft(part="hojas", label_code="x", label_name="x", confidence=1.5)
        with self.assertRaises(ValidationError):
            ScanDraft(part="raices", label_code="x", label_name="x", confidence=0.5)
        self.assertTrue(ScanDraft(part="hojas", label_code="hoja_sana", label_name="x", confidence=0.5).is_healthy)


class ScanApiTests(TestCase):
    def test_farm_plot_scan_flow_and_catalog(self):
        user = get_user_model().objects.create_user(username="f@x.co", email="f@x.co", password="contraseña123")
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
        farm = c.post("/api/farms/", {"name": "Finca"}, format="json").data
        plot = c.post("/api/farms/plots/", {"farm": farm["id"], "name": "Lote A"}, format="json")
        self.assertEqual(plot.status_code, 201, plot.content)
        cid = str(uuid.uuid4())
        r = c.post("/api/scans/", {"id": cid, "plot": plot.data["id"], "part": "hojas", "label_code": "mancha_gris",
                                   "label_name": "Mancha Gris", "confidence": 0.77}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.data["id"], cid)
        self.assertEqual(c.get("/api/scans/?part=hojas").data["count"], 1)
        self.assertEqual(c.delete(f"/api/scans/{cid}/").status_code, 204)
        self.assertEqual(c.get("/api/scans/").data["count"], 0)
        self.assertEqual(c.get("/api/farms/").data["count"], 1)

    def test_catalog_seeded(self):
        from django.core.management import call_command
        call_command("seed_catalog", verbosity=0)
        user = get_user_model().objects.create_user(username="c@x.co", email="c@x.co", password="contraseña123")
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
        self.assertEqual(len(c.get("/api/catalog/diseases/").data), 19)
        self.assertEqual(len(c.get("/api/catalog/diseases/?part=tallos").data), 4)
        self.assertEqual(c.get("/api/catalog/diseases/hojas/mancha_gris/").status_code, 200)
        self.assertEqual(c.get("/api/catalog/diseases/hojas/nada/").status_code, 404)

    def test_scan_image_upload_download_delete_and_permissions(self):
        user = get_user_model().objects.create_user(username="u1@x.co", email="u1@x.co", password="contraseña123")
        other = get_user_model().objects.create_user(username="u2@x.co", email="u2@x.co", password="contraseña123")

        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")

        other_c = APIClient()
        other_c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(other)['access']}")

        scan_id = str(uuid.uuid4())
        r = c.post(
            "/api/scans/",
            {"id": scan_id, "part": "frutos", "label_code": "fruto_sano", "label_name": "Fruto Sano", "confidence": 0.95},
            format="json",
        )
        self.assertEqual(r.status_code, 201)

        # 1. Antes de subir imagen, GET debe retornar 404
        r = c.get(f"/api/scans/{scan_id}/image/")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.data["code"], "image_not_found")

        # 2. Subir imagen
        img_bytes = make_test_image_bytes()
        upload_file = SimpleUploadedFile("leaf.jpg", img_bytes, content_type="image/jpeg")
        r = c.post(f"/api/scans/{scan_id}/image/", {"image": upload_file}, format="multipart")
        self.assertEqual(r.status_code, 200)
        self.assertIsNotNone(r.data["image_url"])

        # 3. Descargar imagen (visualización en línea)
        r = c.get(f"/api/scans/{scan_id}/image/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers.get("Content-Type"), "image/jpeg")
        self.assertEqual(r.getvalue(), img_bytes)

        # 4. Descargar imagen como adjunto
        r = c.get(f"/api/scans/{scan_id}/image/?download=1")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.headers.get("Content-Disposition", "").startswith("attachment;"))

        # 5. Aislamiento entre usuarios: otro usuario no puede ver ni descargar la imagen
        r = other_c.get(f"/api/scans/{scan_id}/image/")
        self.assertEqual(r.status_code, 404)

        # 6. Eliminar imagen
        r = c.delete(f"/api/scans/{scan_id}/image/")
        self.assertEqual(r.status_code, 204)

        # 7. Comprobar que ya no existe imagen para el diagnóstico
        r = c.get(f"/api/scans/{scan_id}/image/")
        self.assertEqual(r.status_code, 404)

    def test_admin_can_view_all_scans_and_filter_by_user(self):
        farmer = get_user_model().objects.create_user(username="f_s@x.co", email="f_s@x.co", password="pass", role="farmer")
        admin = get_user_model().objects.create_user(username="adm_s@x.co", email="adm_s@x.co", password="pass", role="admin")

        c_farmer = APIClient()
        c_farmer.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(farmer)['access']}")

        c_admin = APIClient()
        c_admin.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(admin)['access']}")

        c_farmer.post("/api/scans/", {"part": "hojas", "label_code": "hoja_sana", "label_name": "Sana", "confidence": 0.9}, format="json")

        # Agricultor ve su diagnóstico
        self.assertEqual(c_farmer.get("/api/scans/").data["count"], 1)

        # Admin ve el diagnóstico del agricultor en el listado global
        self.assertEqual(c_admin.get("/api/scans/").data["count"], 1)

        # Admin puede filtrar explícitamente por el agricultor
        self.assertEqual(c_admin.get(f"/api/scans/?user={farmer.id}").data["count"], 1)

        # Admin filtrando por un UUID inexistente devuelve 0
        self.assertEqual(c_admin.get(f"/api/scans/?user={uuid.uuid4()}").data["count"], 0)


class AccountHistoryTests(TestCase):
    def test_registration_history_survives_login_and_is_private(self):
        client = APIClient()
        credentials = {"email": "history@example.com", "password": "cultivo-seguro-123"}
        registered = client.post("/api/auth/register/", credentials, format="json")
        self.assertEqual(registered.status_code, 201)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {registered.data['access']}")
        saved = client.post("/api/scans/", {
            "part": "hojas", "label_code": "mancha_gris", "label_name": "Mancha gris",
            "confidence": 0.8, "source": "server", "notes": "Diagnóstico experto: Mancha gris.",
        }, format="json")
        self.assertEqual(saved.status_code, 201)
        client.post("/api/auth/logout/", {"refresh": registered.data["refresh"]}, format="json")
        client.credentials()
        login = client.post("/api/auth/login/", credentials, format="json")
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        history = client.get("/api/scans/?part=hojas").data
        self.assertEqual(history["count"], 1)
        self.assertEqual(history["results"][0]["notes"], saved.data["notes"])
        self.assertEqual(client.get("/api/scans/?part=frutos").data["count"], 0)
        other = APIClient()
        registration = other.post("/api/auth/register/", {
            "email": "other@example.com", "password": "cultivo-seguro-456",
        }, format="json")
        other.credentials(HTTP_AUTHORIZATION=f"Bearer {registration.data['access']}")
        self.assertEqual(other.get("/api/scans/").data["count"], 0)
        self.assertEqual(other.get(f"/api/scans/{saved.data['id']}/").status_code, 404)
