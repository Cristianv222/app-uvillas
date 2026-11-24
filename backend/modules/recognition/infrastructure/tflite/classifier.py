"""Clasificador TFLite (modelos exportados de Teachable Machine, `model_unquant.tflite`)."""
import io
import threading
from dataclasses import dataclass
from functools import lru_cache

import numpy as np
from django.conf import settings
from PIL import Image, ImageOps

from shared.domain.errors import ValidationError
from shared.domain.labels import Label, parse_labels
from shared.domain.parts import Part

from ...domain.entities import Prediction

try:  # ai-edge-litert es el sucesor de tflite-runtime
    from ai_edge_litert.interpreter import Interpreter
except ImportError:  # pragma: no cover
    from tflite_runtime.interpreter import Interpreter


@dataclass
class _Loaded:
    interpreter: Interpreter
    labels: list[Label]
    input_index: int
    output_index: int
    size: tuple[int, int]
    dtype: type
    lock: threading.Lock


@lru_cache(maxsize=None)
def _load(part: str) -> _Loaded:
    folder = settings.ML_MODELS_DIR / part
    interpreter = Interpreter(model_path=str(folder / "model_unquant.tflite"))
    interpreter.allocate_tensors()
    inp = interpreter.get_input_details()[0]
    out = interpreter.get_output_details()[0]
    _, height, width, _ = inp["shape"]
    labels = parse_labels((folder / "labels.txt").read_text(encoding="utf-8"))
    return _Loaded(interpreter, labels, inp["index"], out["index"], (int(width), int(height)), inp["dtype"], threading.Lock())


def preprocess(image_bytes: bytes, size: tuple[int, int], dtype) -> np.ndarray:
    """Igual que Teachable Machine: recorte central cuadrado, redimensionado y normalización a [-1, 1]."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception as exc:
        raise ValidationError("No se pudo leer la imagen.", "invalid_image") from exc
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    array = np.asarray(image, dtype=np.float32)
    if dtype == np.float32:
        array = array / 127.5 - 1.0
    else:
        array = array.astype(dtype)
    return np.expand_dims(array, axis=0)


class TFLiteClassifier:
    def classify(self, part: str, image_bytes: bytes) -> list[Prediction]:
        model = _load(Part.parse(part).value)
        batch = preprocess(image_bytes, model.size, model.dtype)
        with model.lock:
            model.interpreter.set_tensor(model.input_index, batch)
            model.interpreter.invoke()
            scores = model.interpreter.get_tensor(model.output_index)[0].astype(np.float64)
        if not np.isclose(scores.sum(), 1.0, atol=1e-2):  # por si el modelo entrega logits
            exp = np.exp(scores - scores.max())
            scores = exp / exp.sum()
        predictions = [
            Prediction(code=lb.code, name=lb.name, confidence=float(scores[lb.index]), is_healthy=lb.is_healthy)
            for lb in model.labels
            if lb.index < len(scores)
        ]
        return sorted(predictions, key=lambda p: p.confidence, reverse=True)


def get_classifier() -> TFLiteClassifier:
    return TFLiteClassifier()
