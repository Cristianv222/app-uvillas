import base64
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.conf import settings

from shared.domain.errors import DomainError
from shared.domain.parts import Part

from ...application.use_cases import ClassifyImage
from ...infrastructure.tflite.classifier import get_classifier
from ..api.views import classification_to_dict
from .auth import authenticate_scope

CLOSE_UNAUTHORIZED = 4401


class RecognitionConsumer(AsyncWebsocketConsumer):
    """Reconocimiento en tiempo real.

    Conexión:  ws://host/ws/recognition/?token=<access>&part=hojas
    Cliente -> servidor (cualquiera de las dos):
      - bytes: imagen JPEG/PNG
      - texto JSON: {"image": "<base64>", "part": "tallos", "id": "<opcional, se devuelve igual>"}
                    o {"part": "frutos"} para cambiar de parte sin enviar imagen
    Servidor -> cliente: {"type": "result", "id", "part", "best", "predictions"}
                         {"type": "error", "code", "detail"}
    """

    async def connect(self):
        user = await authenticate_scope(self.scope)
        if user is None:
            await self.close(code=CLOSE_UNAUTHORIZED)
            return
        self.user = user
        self.part = "hojas"
        qs = self.scope.get("query_string", b"").decode()
        for pair in qs.split("&"):
            if pair.startswith("part="):
                self.part = pair.split("=", 1)[1]
        try:
            self.part = Part.parse(self.part).value
        except DomainError as exc:
            await self.accept()
            await self._error(exc)
            await self.close(code=4400)
            return
        self.use_case = ClassifyImage(get_classifier(), settings.RECOGNITION_MAX_IMAGE_BYTES)
        await self.accept()
        await self.send(text_data=json.dumps({"type": "ready", "part": self.part}))

    async def receive(self, text_data=None, bytes_data=None):
        request_id = None
        try:
            if bytes_data is not None:
                image = bytes_data
            else:
                payload = json.loads(text_data or "{}")
                request_id = payload.get("id")
                if "part" in payload:
                    self.part = Part.parse(payload["part"]).value
                if not payload.get("image"):
                    await self.send(text_data=json.dumps({"type": "ready", "part": self.part}))
                    return
                image = base64.b64decode(payload["image"], validate=False)
            result = await sync_to_async(self.use_case.execute, thread_sensitive=False)(self.part, image)
            await self.send(text_data=json.dumps(
                {"type": "result", "id": request_id, **classification_to_dict(result)}
            ))
        except DomainError as exc:
            await self._error(exc, request_id)
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({"type": "error", "code": "bad_payload", "detail": "Mensaje inválido."}))

    async def _error(self, exc: DomainError, request_id=None):
        await self.send(text_data=json.dumps(
            {"type": "error", "id": request_id, "code": exc.code, "detail": exc.message}
        ))
