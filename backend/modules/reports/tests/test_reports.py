from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.reports.domain.metrics import health_ratio
from modules.scans.application.use_cases import CreateScan


class MetricsTests(SimpleTestCase):
    def test_ratio(self):
        self.assertEqual(health_ratio(0, 0), 0.0)
        self.assertEqual(health_ratio(4, 1), 0.25)


class SummaryTests(TestCase):
    def test_summary(self):
        user = get_user_model().objects.create_user(username="r@x.co", email="r@x.co", password="contraseña123")
        for part, code in [("hojas", "hoja_sana"), ("hojas", "mancha_gris"), ("frutos", "mancha_gris")]:
            CreateScan().execute(user, part=part, label_code=code, label_name=code, confidence=0.8)
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
        d = c.get("/api/reports/summary/").data
        self.assertEqual((d["total"], d["healthy"], d["diseased"]), (3, 1, 2))
        self.assertEqual(len(d["by_disease"]), 2)  # mismo nombre pero en distinta parte
        self.assertEqual({x["part"] for x in d["by_disease"]}, {"hojas", "frutos"})
        self.assertEqual(d["timeline"][0]["total"], 3)
        self.assertEqual(c.get("/api/reports/summary/?date_from=mal").status_code, 400)

    def test_admin_global_summary_and_user_filter(self):
        farmer1 = get_user_model().objects.create_user(username="f1@x.co", email="f1@x.co", password="pass", role="farmer")
        farmer2 = get_user_model().objects.create_user(username="f2@x.co", email="f2@x.co", password="pass", role="farmer")
        admin = get_user_model().objects.create_user(username="adm@x.co", email="adm@x.co", password="pass", role="admin")

        # Farmer1 crea 2 diagnósticos sanos
        CreateScan().execute(farmer1, part="hojas", label_code="hoja_sana", label_name="Hoja Sana", confidence=0.9)
        CreateScan().execute(farmer1, part="tallos", label_code="sano", label_name="Sano", confidence=0.9)

        # Farmer2 crea 1 diagnóstico enfermo
        CreateScan().execute(farmer2, part="frutos", label_code="pudricion_dura", label_name="Pudricion Dura", confidence=0.8)

        f1_c = APIClient()
        f1_c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(farmer1)['access']}")

        adm_c = APIClient()
        adm_c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(admin)['access']}")

        # Farmer1 solo ve sus 2 diagnósticos (sanos: 2)
        f1_summary = f1_c.get("/api/reports/summary/").data
        self.assertEqual(f1_summary["total"], 2)
        self.assertEqual(f1_summary["healthy"], 2)

        # Admin ve el total global: 3 diagnósticos (2 sanos, 1 enfermo)
        adm_global = adm_c.get("/api/reports/summary/").data
        self.assertEqual(adm_global["total"], 3)
        self.assertEqual(adm_global["healthy"], 2)
        self.assertEqual(adm_global["diseased"], 1)

        # Admin filtra por Farmer2: ve solo 1 diagnóstico
        adm_f2 = adm_c.get(f"/api/reports/summary/?user={farmer2.id}").data
        self.assertEqual(adm_f2["total"], 1)
        self.assertEqual(adm_f2["diseased"], 1)
