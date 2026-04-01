/**
 * Helper utilities for testing Next.js 16 API route handlers.
 *
 * Route handlers are plain async functions that accept (Request, context?)
 * and return a Response. In Next.js 16, dynamic route params are Promises.
 */

/** Create a mock Request for API route testing */
export function createMockRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/** Create a mock FormData Request (for file uploads) */
export function createMockFormDataRequest(
  method: string,
  url: string,
  formData: FormData,
  headers?: Record<string, string>
): Request {
  return new Request(url, {
    method,
    body: formData,
    headers,
  });
}

/** Parse a Response's JSON body */
export async function parseResponse<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/** Create mock params for Next.js 16 dynamic routes (params is a Promise) */
export function createMockParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

/** Base URL for constructing test request URLs */
export const BASE_URL = "http://localhost:3000";
