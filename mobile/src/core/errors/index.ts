export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export class NetworkError extends Error {
  constructor(message = 'Sin conexión con el servidor.') {
    super(message);
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError || e instanceof NetworkError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
