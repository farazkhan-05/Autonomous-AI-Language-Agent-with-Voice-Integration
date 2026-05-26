export class ApiError extends Error {
  constructor({ message, status, code, detail }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export async function normalizeApiError(response, fallbackMessage = 'Request failed') {
  let detail = null;
  let message = fallbackMessage;
  let code = '';

  try {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      detail = payload?.detail ?? payload?.error ?? payload;
    } else {
      const text = await response.text();
      detail = text || null;
    }
  } catch {
    detail = null;
  }

  if (typeof detail === 'string' && detail.trim()) {
    message = detail;
  } else if (detail && typeof detail === 'object') {
    code = detail.code || '';
    message = detail.message || detail.detail || fallbackMessage;
  }

  return {
    status: response.status,
    code,
    message,
    detail,
  };
}

export async function throwApiError(response, fallbackMessage) {
  if (response.ok) return response;
  throw new ApiError(await normalizeApiError(response, fallbackMessage));
}
