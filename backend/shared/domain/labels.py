"""Lectura de `labels.txt` exportados por Teachable Machine.

Formato de línea: `<indice> <Prefijo><Nombre>`, p. ej. `0 F.Pudricion Dura` o `3 H_Marchitez_Bacterial`.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

_PREFIX = re.compile(r"^[A-Za-z]{1,2}[._]")
_HEALTHY_SUFFIXES = ("sano", "sana")


@dataclass(frozen=True)
class Label:
    index: int
    code: str
    name: str
    is_healthy: bool


def slugify(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", ascii_text.lower()).strip("_")


def is_healthy_code(code: str) -> bool:
    return code.split("_")[-1] in _HEALTHY_SUFFIXES


def parse_label_line(line: str) -> Label | None:
    line = line.strip()
    if not line:
        return None
    index_text, _, rest = line.partition(" ")
    if not index_text.isdigit() or not rest.strip():
        return None
    name = _PREFIX.sub("", rest.strip()).replace("_", " ").strip()
    code = slugify(name)
    return Label(index=int(index_text), code=code, name=name, is_healthy=is_healthy_code(code))


def parse_labels(text: str) -> list[Label]:
    labels = [lb for lb in (parse_label_line(line) for line in text.splitlines()) if lb]
    return sorted(labels, key=lambda lb: lb.index)
