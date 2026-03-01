// ═══════════════════════════════════════════
// Gemini API Service — NPC Dialogue Generation
// ═══════════════════════════════════════════

import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!ai) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.');
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

export interface GeminiNPCRequest {
    systemPrompt: string;
    userMessage: string;
    maxTokens?: number;
}

export interface GeminiNPCResponse {
    dialogue: string;
    emotionState?: string;
    correct?: boolean; // For Sage riddle judging
}

/**
 * Send a prompt to Gemini Flash for fast NPC dialogue generation
 */
export async function generateNPCDialogue(
    request: GeminiNPCRequest
): Promise<GeminiNPCResponse> {
    try {
        const genai = getAI();

        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: request.userMessage,
            config: {
                systemInstruction: request.systemPrompt,
                maxOutputTokens: request.maxTokens || 150,
                temperature: 0.9,
            },
        });

        const text = response.text || '';

        // Try parsing as JSON (Sage returns structured JSON)
        try {
            const parsed = JSON.parse(text);
            if (parsed.dialogue) {
                return {
                    dialogue: parsed.dialogue,
                    emotionState: parsed.emotionState,
                    correct: parsed.correct,
                };
            }
        } catch {
            // Not JSON, use as plain dialogue
        }

        return {
            dialogue: text.trim().slice(0, 300), // Cap length
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        // Return fallback dialogue so the game doesn't break
        return {
            dialogue: '*stares silently, processing ancient thoughts...*',
        };
    }
}

/**
 * Generate dialogue with vision (image) input — for analyzing webcam frames
 */
export async function generateNPCDialogueWithVision(
    request: GeminiNPCRequest & { imageBase64?: string }
): Promise<GeminiNPCResponse> {
    try {
        const genai = getAI();

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
            { text: request.userMessage },
        ];

        // Add image if provided
        if (request.imageBase64) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: request.imageBase64,
                },
            });
        }

        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts }],
            config: {
                systemInstruction: request.systemPrompt,
                maxOutputTokens: request.maxTokens || 150,
                temperature: 0.9,
            },
        });

        const text = response.text || '';

        // Try parsing as JSON (Sage returns structured)
        try {
            const parsed = JSON.parse(text);
            if (parsed.dialogue) {
                return {
                    dialogue: parsed.dialogue,
                    emotionState: parsed.emotionState,
                    correct: parsed.correct,
                };
            }
        } catch {
            // Not JSON, use as plain text
        }

        return {
            dialogue: text.trim().slice(0, 300),
        };
    } catch (error) {
        console.error('Gemini Vision API error:', error);
        return {
            dialogue: '*the arcane sight flickers momentarily...*',
        };
    }
}

/**
 * Check if the Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
}
