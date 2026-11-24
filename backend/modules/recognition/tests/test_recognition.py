import io
import json

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, TransactionTestCase
from PIL import Image
from rest_framework.test import APIClient

from config.asgi import application
from modules.accounts.infrastructure.jwt.tokens import issue_tokens
from modules.recognition.application.use_cases import ClassifyImage
from modules.recognition.infrastructure.tflite.classifier import get_classifier
from shared.domain.errors import ValidationError
from shared.domain.labels import parse_labels
from django.contrib.auth import get_user_model


def jpeg_bytes(color=(40, 160, 60)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (300, 200), color).save(buf, "JPEG")
    return buf.getvalue()


class ModelFilesTests(SimpleTestCase):
    def test_models_and_labels_exist(self):
        expected = {"hojas": 8, "tallos": 4, "frutos": 7}
        for part, n in expected.items():
            folder = settings.ML_MODELS_DIR / part
            self.assertTrue((folder / "model_unquant.tflite").exists(), part)
            self.assertEqual(len(parse_labels((folder / "labels.txt").read_text())), n)


class ClassifierTests(SimpleTestCase):
    def test_each_model_returns_normalized_scores(self):
        uc = ClassifyImage(get_classifier())
        for part, n in {"hojas": 8, "tallos": 4, "frutos": 7}.items():
            res = uc.execute(part, jpeg_bytes(), top_k=n)
            self.assertEqual(len(res.predictions), n)
            self.assertAlmostEqual(sum(p.confidence for p in res.predictions), 1.0, places=1)
            self.assertGreaterEqual(res.best.confidence, res.predictions[-1].confidence)

    def test_invalid_inputs(self):
        uc = ClassifyImage(get_classifier())
        with self.assertRaises(ValidationError):
            uc.execute("raices", jpeg_bytes())
        with self.assertRaises(ValidationError):
            uc.execute("hojas", b"")
        with self.assertRaises(ValidationError):
            uc.execute("hojas", b"no-es-una-imagen")


class ClassifyApiTests(TestCase):
    def test_classify_endpoint(self):
        user = get_user_model().objects.create_user(username="u@x.co", email="u@x.co", password="contraseña123")
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
        r = c.post("/api/recognition/classify/",
                   {"part": "tallos", "image": SimpleUploadedFile("a.jpg", jpeg_bytes(), "image/jpeg")}, format="multipart")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.data["part"], "tallos")
        self.assertEqual(len(r.data["predictions"]), 3)


class WebSocketTests(TransactionTestCase):
    def test_unauthorized_is_rejected(self):
        async def run():
            comm = WebsocketCommunicator(application, "/ws/recognition/?part=hojas")
            connected, code = await comm.connect()
            return connected, code
        connected, code = async_to_sync(run)()
        self.assertFalse(connected)
        self.assertEqual(code, 4401)

    def test_frame_roundtrip(self):
        user = get_user_model().objects.create_user(username="w@x.co", email="w@x.co", password="contraseña123")
        token = issue_tokens(user)["access"]

        async def run():
            comm = WebsocketCommunicator(application, f"/ws/recognition/?token={token}&part=frutos")
            connected, _ = await comm.connect()
            ready = json.loads(await comm.receive_from(timeout=10))
            await comm.send_to(bytes_data=jpeg_bytes())
            result = json.loads(await comm.receive_from(timeout=30))
            await comm.send_to(text_data=json.dumps({"part": "inexistente", "image": "AAAA"}))
            error = json.loads(await comm.receive_from(timeout=10))
            await comm.disconnect()
            return connected, ready, result, error
        connected, ready, result, error = async_to_sync(run)()
        self.assertTrue(connected)
        self.assertEqual(ready["type"], "ready")
        self.assertEqual(result["type"], "result")
        self.assertEqual(result["part"], "frutos")
        self.assertEqual(error["type"], "error")
        self.assertEqual(error["code"], "invalid_part")
