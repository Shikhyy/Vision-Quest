// ═══════════════════════════════════════════
// Token Server — Generates Stream Video tokens for dev
// ═══════════════════════════════════════════
// In development, this generates a user token using the Node SDK.
// In production, replace this with a real backend endpoint.
//
// IMPORTANT: This file is meant to be run server-side or as a Vite plugin.
// For simplicity in dev, we use the StreamVideoClient's dev token capability.

/**
 * For development, Stream Video supports guest/anonymous users.
 * This module provides helpers for the dev workflow.
 *
 * Production setup: Create a /api/token endpoint on your backend that uses
 * @stream-io/node-sdk to generate proper JWT tokens.
 */

export const TOKEN_PROVIDER_URL = import.meta.env.VITE_STREAM_TOKEN_URL || '';

/**
 * Fetch a token from the backend token provider.
 * For dev, if no token URL is configured, return empty string
 * and the StreamVideoClient will use dev tokens.
 */
export async function fetchStreamToken(userId: string): Promise<string> {
    if (!TOKEN_PROVIDER_URL) {
        // In dev mode without a token server, return empty.
        // StreamVideoClient can work with tokenProvider + dev mode.
        return '';
    }

    try {
        const response = await fetch(`${TOKEN_PROVIDER_URL}?user_id=${userId}`);
        const data = await response.json();
        return data.token || '';
    } catch (error) {
        console.error('Failed to fetch Stream token:', error);
        return '';
    }
}
