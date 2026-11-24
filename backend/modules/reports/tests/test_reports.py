from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.reports.domain.metrics import health_ratio
from modules.scans.application.use_cases import CreateScan
from django.contrib.auth import get_user_model


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
