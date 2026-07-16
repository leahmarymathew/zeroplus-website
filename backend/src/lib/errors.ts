// Thrown anywhere in a service/controller; converted to the Section 6.1
// error envelope by middleware/errorHandler.ts. `code` is the machine-readable
// string the frontend branches on (e.g. "OUT_OF_STOCK").
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what = "Resource") => new ApiError(404, "NOT_FOUND", `${what} not found`);
export const unauthorized = (message = "Authentication required") =>
  new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Not allowed") => new ApiError(403, "FORBIDDEN", message);
