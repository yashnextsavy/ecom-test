import "server-only";

type FetchJsonOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  revalidate?: number;
};

const DEFAULT_TIMEOUT_MS = 10000;

export async function fetchJson<T>(
  url: string,
  options?: FetchJsonOptions
): Promise<T | null> {

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    revalidate,
    headers,
    body,
    signal: callerSignal,
    ...requestOptions
  } = options ?? {};

  const timeoutController = new AbortController();
  const requestController = new AbortController();

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
    requestController.abort();
  }, timeoutMs);

  const onCallerAbort = () => requestController.abort();

  if (callerSignal) {
    if (callerSignal.aborted) {
      requestController.abort();
    } else {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: requestController.signal,
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    });

    if (!response.ok) {
      const errorBody = await safeReadText(response);

      if (response.status === 404) {
        return null as T;
      }
      throw new Error(
        `Request failed ${response.status} ${response.statusText}: ${errorBody}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) {
      if (timeoutController.signal.aborted) {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
      }

      throw new Error(`Request was aborted: ${url}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);

    if (callerSignal) {
      callerSignal.removeEventListener("abort", onCallerAbort);
    }
  }
}

async function safeReadText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return "unable to parse response body";
  }
}

function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError";
}
