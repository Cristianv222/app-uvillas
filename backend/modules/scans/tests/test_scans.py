import uuid

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.scans.domain.entities import ScanDraft
from shared.domain.errors import ValidationError


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
