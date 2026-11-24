from rest_framework.response import Response
from rest_framework.views import exception_handler

from shared.domain.errors import DomainError


def handle(exc, context):
    if isinstance(exc, DomainError):
        return Response({"code": exc.code, "detail": exc.message}, status=exc.status)
    return exception_handler(exc, context)
