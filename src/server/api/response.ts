type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function success<T>(data: T): Response {
  return Response.json({ success: true, data } satisfies ApiSuccessResponse<T>);
}

export function created<T>(data: T): Response {
  return Response.json(
    { success: true, data } satisfies ApiSuccessResponse<T>,
    { status: 201 },
  );
}

export function error(message: string, status = 400): Response {
  return Response.json(
    { success: false, error: message } satisfies ApiErrorResponse,
    { status },
  );
}
