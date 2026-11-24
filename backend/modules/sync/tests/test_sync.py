import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.sync.domain.conflict import Winner, resolve


def client_for(email):
    user = get_user_model().objects.create_user(username=email, email=email, password="contraseña123")
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
    return c


class ConflictTests(SimpleTestCase):
    def test_last_write_wins(self):
        now = timezone.now()
        self.assertEqual(resolve(None, now), Winner.CLIENT)
        self.assertEqual(resolve(now, now + timedelta(seconds=1)), Winner.CLIENT)
        self.assertEqual(resolve(now, now), Winner.SERVER)
        self.assertEqual(resolve(now, now - timedelta(seconds=1)), Winner.SERVER)


class SyncApiTests(TestCase):
    def payload(self, ts):
        farm, plot, scan = (str(uuid.uuid4()) for _ in range(3))
        return farm, plot, scan, {
            "farms": [{"id": farm, "name": "La Esperanza", "updated_at": ts.isoformat()}],
            "plots": [{"id": plot, "farm_id": farm, "name": "Lote 1", "area_hectares": 1.5, "updated_at": ts.isoformat()}],
            "scans": [{"id": scan, "farm_id": farm, "plot_id": plot, "part": "hojas", "label_code": "mancha_gris",
                       "label_name": "Mancha Gris", "confidence": 0.9, "source": "local",
                       "captured_at": ts.isoformat(), "updated_at": ts.isoformat()}],
        }

    def test_push_pull_and_conflict(self):
        c = client_for("s@x.co")
        t0 = timezone.now()
        farm, plot, scan, body = self.payload(t0)
        r = c.post("/api/sync/push/", body, format="json")
        self.assertEqual(len(r.data["applied"]), 3, r.data)

        # el servidor ya tiene la versión t0: un cambio más viejo pierde
        body["farms"][0].update(name="Vieja", updated_at=(t0 - timedelta(minutes=1)).isoformat())
        r = c.post("/api/sync/push/", {"farms": body["farms"]}, format="json")
        self.assertEqual(r.data["conflicts"][0]["id"], farm)

        # uno más nuevo gana
        body["farms"][0].update(name="Nueva", updated_at=(t0 + timedelta(minutes=1)).isoformat())
        c.post("/api/sync/push/", {"farms": body["farms"]}, format="json")
        pulled = c.get("/api/sync/pull/").data
        self.assertEqual(pulled["farms"][0]["name"], "Nueva")
        self.assertTrue(pulled["scans"][0]["is_healthy"] is False)

        # pull incremental
        since = (t0 + timedelta(minutes=2)).isoformat().replace("+", "%2B")
        self.assertEqual(c.get(f"/api/sync/pull/?since={since}").data["farms"], [])

        # borrado propagado
        body["scans"][0].update(is_deleted=True, updated_at=(t0 + timedelta(minutes=3)).isoformat())
        c.post("/api/sync/push/", {"scans": body["scans"]}, format="json")
        self.assertTrue(c.get("/api/sync/pull/").data["scans"][0]["is_deleted"])
        self.assertEqual(c.get("/api/scans/").data["count"], 0)

    def test_cannot_touch_other_users_records(self):
        a, b = client_for("a@x.co"), client_for("b@x.co")
        farm, _, _, body = self.payload(timezone.now())
        a.post("/api/sync/push/", body, format="json")
        body["farms"][0].update(updated_at=(timezone.now() + timedelta(hours=1)).isoformat())
        r = b.post("/api/sync/push/", {"farms": body["farms"]}, format="json")
        self.assertEqual(r.data["rejected"][0]["code"], "foreign_record")

    def test_rejects_bad_items(self):
        c = client_for("r@x.co")
        r = c.post("/api/sync/push/", {"scans": [{"id": str(uuid.uuid4()), "updated_at": timezone.now().isoformat(),
                                                  "part": "raices", "label_code": "x", "confidence": 0.5}]}, format="json")
        self.assertEqual(r.data["rejected"][0]["code"], "invalid_part")
