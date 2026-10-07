import type { ApiErrorResponse } from '../types/index.js';

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly status: number;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorCode = 'REQUEST_FAILED';
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetails: unknown = undefined;

    try {
      const errorJson = (await response.json()) as ApiErrorResponse;
      if (errorJson.error) {
        errorCode = errorJson.error.code;
        errorMessage = errorJson.error.message;
        errorDetails = errorJson.error.details;
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    throw new ApiError(errorMessage, errorCode, response.status, errorDetails);
  }

  // Handle empty content
  if (response.status === 204) {
    return {} as T;
  }

  // Handle JSON
  return (await response.json()) as T;
}

export async function apiDownloadBlob(
  endpoint: string,
  options: RequestInit = {},
): Promise<Blob> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const signal = options.signal || AbortSignal.timeout(10000);

  const response = await fetch(url, {
    ...options,
    signal,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Audio request failed with status ${response.status}`;
    let errorCode = 'TTS_FAILED';
    try {
      const err = await response.json();
      if (err.error) {
        errorMessage = err.error.message;
        errorCode = err.error.code;
      }
    } catch {
      // fallback
    }
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  return await response.blob();
}
