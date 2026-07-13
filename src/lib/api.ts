import { storage } from './storage';

const BASE_URL = ''; // Relative paths work since the frontend and backend are hosted on the same origin (port 3000)

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<{ data: T }> {
  const token = storage.get('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Do not set Content-Type if we're sending FormData (for file uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore parsing failure
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
