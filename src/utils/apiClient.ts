type ApiClientOptions = {
  userId: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export function createApiClient(options: ApiClientOptions) {
  return {
    async fetch<T>(path: string, requestOptions?: RequestOptions): Promise<T> {
      const headers: Record<string, string> = {
        "X-User-Id": options.userId,
      };

      if (requestOptions?.body) {
        headers["Content-Type"] = "application/json";
      }

      const response = await globalThis.fetch(path, {
        method: requestOptions?.method ?? "GET",
        headers,
        body: requestOptions?.body
          ? JSON.stringify(requestOptions.body)
          : undefined,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Request failed");
      }

      return json.data as T;
    },
  };
}
