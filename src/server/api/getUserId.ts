import { ApiError } from "./errors";

export function getUserId(request: Request): string {
  const userId = request.headers.get("X-User-Id");
  if (!userId) {
    throw new ApiError("Missing X-User-Id header", 401);
  }
  return userId;
}
