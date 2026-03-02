// ═══════════════════════════════════════════
// Token Server — Generates Stream Video tokens
// ═══════════════════════════════════════════
// In development, the Vite dev server plugin at /api/token generates tokens.
// In production, set VITE_STREAM_TOKEN_URL to your backend token endpoint.

/**
 * Resolves the token endpoint URL.
 * In dev: falls back to the Vite plugin at /api/token
 * In prod: requires VITE_STREAM_TOKEN_URL to be set
 */
function getTokenUrl(): string {
    const configured = import.meta.env.VITE_STREAM_TOKEN_URL;
    if (configured) return configured;
    // In dev mode, the Vite plugin serves /api/token
    if (import.meta.env.DEV) return '/api/token';
    return '';
}

/**
 * Fetch a token from the backend token provider.
 * Returns empty string if no token endpoint is available.
 */
export async function fetchStreamToken(userId: string): Promise<string> {
    const tokenUrl = getTokenUrl();
    if (!tokenUrl) {
        console.warn('[TokenProvider] No token URL configured. Set VITE_STREAM_TOKEN_URL for production.');
        return '';
    }

    try {
        const response = await fetch(`${tokenUrl}?user_id=${encodeURIComponent(userId)}`);
        if (!response.ok) {
            throw new Error(`Token fetch failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.token || '';
    } catch (error) {
        console.error('Failed to fetch Stream token:', error);
        return '';
    }
}
