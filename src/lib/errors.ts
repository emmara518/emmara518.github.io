/** Domain errors raised by services; API handlers map them to the HTTP envelope. */
export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function toEnvelope(e: unknown): { status: number; code: string; message: string } {
  if (e instanceof ServiceError) {
    return { status: e.status, code: e.code, message: e.message };
  }
  return { status: 500, code: "INTERNAL", message: "حدث خطأ غير متوقع" };
}
