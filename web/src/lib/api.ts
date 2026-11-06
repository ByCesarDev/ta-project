import { supabase } from './supabase.js';

/**
 * Retrieves the current authenticated user's JWT access token from Supabase session.
 * Returns an authorization header object if session is active, or empty object otherwise.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  } catch (err) {
    console.warn('[getAuthHeaders] Error retrieving session:', err);
  }
  return {};
}

/**
 * Universal fetch wrapper that automatically injects the Supabase JWT bearer token
 * into request headers for authenticated backend communication.
 */
export async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(init.headers || {});

  Object.entries(authHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  return fetch(url, {
    ...init,
    headers,
  });
}
