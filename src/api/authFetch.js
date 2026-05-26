const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Small helper for authenticated backend requests.
 * If a Firebase user is provided, the ID token is attached automatically.
 */
export async function authFetch(path, options = {}) {
  const { user, headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers || {});

  if (user) {
    const token = await user.getIdToken();
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let requestBody = body;
  if (
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData)
  ) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    requestBody = JSON.stringify(body);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    headers: requestHeaders,
    body: requestBody,
    ...rest,
  });
}
