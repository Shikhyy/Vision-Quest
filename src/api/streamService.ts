// ═══════════════════════════════════════════
// Stream Video Service — Vision Agents Integration
// ═══════════════════════════════════════════
// Manages Stream Video SDK for real-time NPC communication.
// Falls back to the existing Gemini text API when Stream isn't configured.

import { StreamVideoClient } from '@stream-io/video-react-sdk';
import type { User } from '@stream-io/video-react-sdk';
import type { ZoneId } from '../types';

// ── Configuration ──

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || '';

/**
 * Whether the Stream Video integration is configured.
 * When false, the app uses the existing direct Gemini + webcam flow.
 */
export function isStreamConfigured(): boolean {
    return !!STREAM_API_KEY;
}

// ── Client Management ──

let client: StreamVideoClient | null = null;

/**
 * Initialize the Stream Video client.
 * Call this once when the app starts (if Stream is configured).
 */
export function initStreamClient(userId: string, userName: string, token: string): StreamVideoClient {
    if (client) return client;

    const user: User = {
        id: userId,
        name: userName,
    };

    client = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user,
        token,
    });

    return client;
}

/**
 * Get the current Stream client instance.
 */
export function getStreamClient(): StreamVideoClient | null {
    return client;
}

/**
 * Generate a unique call ID for an NPC encounter.
 */
export function generateCallId(npcId: ZoneId, playerName: string): string {
    const timestamp = Date.now();
    return `vq-${npcId}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
}

/**
 * Disconnect and clean up the Stream client.
 */
export async function disconnectStream(): Promise<void> {
    if (client) {
        await client.disconnectUser();
        client = null;
    }
}


