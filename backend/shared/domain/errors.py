class DomainError(Exception):
    """Error de negocio. Las capas externas lo traducen a HTTP/WebSocket."""

    code = "domain_error"
    status = 400

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class ValidationError(DomainError):
    code = "validation_error"
    status = 400


class NotFoundError(DomainError):
    code = "not_found"
    status = 404


class PermissionDeniedError(DomainError):
    code = "permission_denied"
    status = 403


class ConflictError(DomainError):
    code = "conflict"
    status = 409
