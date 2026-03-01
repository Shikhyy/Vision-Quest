// ═══════════════════════════════════════════
// useVisionLoop — Main Vision Processing Hook
// Captures webcam frames and runs Gemini-powered expression detection
// ═══════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectionResult, EmotionType } from '../types';
import { isGeminiConfigured, generateNPCDialogueWithVision } from '../api/geminiService';

interface UseVisionLoopOptions {
    /** Whether the loop is active */
    enabled: boolean;
    /** Interval between captures in ms (default: 3000) */
    intervalMs?: number;
    /** Callback when a new detection is available */
    onDetection?: (result: DetectionResult) => void;
}

interface UseVisionLoopReturn {
    /** Ref to attach to a <video> element */
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** Whether the camera is ready */
    cameraReady: boolean;
    /** Latest detection result */
    latestDetection: DetectionResult | null;
    /** Latest captured frame as base64 JPEG */
    latestFrame: string | null;
    /** Error message if any */
    error: string | null;
    /** Start the camera stream */
    startCamera: () => Promise<void>;
    /** Stop the camera stream */
    stopCamera: () => void;
    /** Manually capture a single frame */
    captureFrame: () => string | null;
}

// System prompt for Gemini expression detection
const EXPRESSION_DETECTION_PROMPT =
    `You are a facial expression analyzer for an RPG game. ` +
    `Analyze the player's face in the image and respond with ONLY a JSON object (no markdown, no code fences). ` +
    `Format: {"emotion":"<emotion>","confidence":<0.0-1.0>,"objects":["<visible_objects>"],"gestures":["<gestures>"]}` +
    `\nValid emotions: neutral, happy, surprised, sad, fearful, angry, disgusted, contempt` +
    `\nFor objects, list any real-world objects visible (phone, cup, book, etc).` +
    `\nFor gestures, list any hand gestures visible (thumbs_up, wave, peace_sign, pointing, etc).` +
    `\nBe accurate. If the person is smiling, say "happy". If they look scared, say "fearful". If neutral face, say "neutral".`;

/**
 * Use Gemini 2.0 Flash to analyze a webcam frame for expression/objects/gestures.
 * Falls back to basic heuristic if Gemini is not configured.
 */
async function detectExpressionWithGemini(frameBase64: string): Promise<DetectionResult> {
    if (!isGeminiConfigured()) {
        return detectExpressionFallback();
    }

    try {
        const result = await generateNPCDialogueWithVision({
            systemPrompt: EXPRESSION_DETECTION_PROMPT,
            userMessage: 'Analyze this person\'s facial expression, visible objects, and gestures. Respond with JSON only.',
            imageBase64: frameBase64,
            maxTokens: 100,
        });

        // Parse the JSON response
        const text = result.dialogue.trim();
        // Strip any markdown code fences that Gemini might add
        const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleanText);

        const validEmotions: EmotionType[] = ['neutral', 'happy', 'surprised', 'sad', 'fearful', 'angry', 'disgusted', 'contempt'];
        const emotion: EmotionType = validEmotions.includes(parsed.emotion) ? parsed.emotion : 'neutral';

        return {
            emotion,
            confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7,
            objects: Array.isArray(parsed.objects)
                ? parsed.objects.map((label: string) => ({ label, confidence: 0.8 }))
                : [],
            gestures: Array.isArray(parsed.gestures) ? parsed.gestures : [],
            timestamp: new Date(),
        };
    } catch (error) {
        console.warn('[VisionLoop] Gemini detection failed, using fallback:', error);
        return detectExpressionFallback();
    }
}

/**
 * Basic fallback detection when Gemini is not available.
 * Uses a slight bias toward neutral to avoid wild reactions.
 */
function detectExpressionFallback(): DetectionResult {
    const emotionWeights: [EmotionType, number][] = [
        ['neutral', 0.45],
        ['happy', 0.25],
        ['surprised', 0.10],
        ['sad', 0.06],
        ['fearful', 0.06],
        ['angry', 0.04],
        ['disgusted', 0.02],
        ['contempt', 0.02],
    ];

    let random = Math.random();
    let selectedEmotion: EmotionType = 'neutral';
    for (const [emotion, weight] of emotionWeights) {
        random -= weight;
        if (random <= 0) {
            selectedEmotion = emotion;
            break;
        }
    }

    return {
        emotion: selectedEmotion,
        confidence: 0.5 + Math.random() * 0.3,
        objects: [],
        gestures: [],
        timestamp: new Date(),
    };
}

export function useVisionLoop({
    enabled,
    intervalMs = 3000,
    onDetection,
}: UseVisionLoopOptions): UseVisionLoopReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isProcessingRef = useRef(false);

    const [cameraReady, setCameraReady] = useState(false);
    const [latestDetection, setLatestDetection] = useState<DetectionResult | null>(null);
    const [latestFrame, setLatestFrame] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create off-screen canvas for frame capture
    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
            canvasRef.current.width = 320;
            canvasRef.current.height = 240;
        }
    }, []);

    // ── Start Camera ──
    const startCamera = useCallback(async () => {
        try {
            setError(null);
            // Don't request camera again if already connected
            if (streamRef.current && videoRef.current?.srcObject) {
                setCameraReady(true);
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraReady(true);
            }
        } catch (err) {
            setError('Camera access denied. Please allow camera access.');
            console.error('Camera error:', err);
        }
    }, []);

    // ── Stop Camera ──
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    // ── Capture a single frame as base64 ──
    const captureFrame = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current || !cameraReady) return null;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        // Strip the data:image/jpeg;base64, prefix
        const base64 = dataUrl.split(',')[1];
        setLatestFrame(base64);
        return base64;
    }, [cameraReady]);

    // ── Detection loop — uses Gemini Vision for real analysis ──
    useEffect(() => {
        if (!enabled || !cameraReady) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(async () => {
            // Prevent overlapping Gemini calls
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                // Capture frame
                const frame = captureFrame();

                // Run Gemini-powered expression detection
                const detection = frame
                    ? await detectExpressionWithGemini(frame)
                    : detectExpressionFallback();

                setLatestDetection(detection);
                onDetection?.(detection);
            } catch (err) {
                console.error('[VisionLoop] Detection error:', err);
            } finally {
                isProcessingRef.current = false;
            }
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, cameraReady, intervalMs, captureFrame, onDetection]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
        videoRef,
        cameraReady,
        latestDetection,
        latestFrame,
        error,
        startCamera,
        stopCamera,
        captureFrame,
    };
}
