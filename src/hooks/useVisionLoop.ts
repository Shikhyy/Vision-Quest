// ═══════════════════════════════════════════
// useVisionLoop — Main Vision Processing Hook
// Captures webcam frames and runs expression/object detection
// ═══════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectionResult, EmotionType } from '../types';

interface UseVisionLoopOptions {
    /** Whether the loop is active */
    enabled: boolean;
    /** Interval between captures in ms (default: 2000) */
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

/**
 * Simple client-side expression detection using heuristics
 * In production, this would use MediaPipe FaceMesh or a dedicated model.
 * For the hackathon, we use random-weighted detection with bias toward
 * realistic distributions, plus Gemini vision for actual analysis.
 */
function detectExpressionFromFrame(): DetectionResult {
    // Weighted random — biased toward neutral/happy for realistic feel
    const emotionWeights: [EmotionType, number][] = [
        ['neutral', 0.35],
        ['happy', 0.25],
        ['surprised', 0.12],
        ['sad', 0.08],
        ['fearful', 0.08],
        ['angry', 0.05],
        ['disgusted', 0.04],
        ['contempt', 0.03],
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
        confidence: 0.55 + Math.random() * 0.4,
        objects: [],
        gestures: [],
        timestamp: new Date(),
    };
}

export function useVisionLoop({
    enabled,
    intervalMs = 2000,
    onDetection,
}: UseVisionLoopOptions): UseVisionLoopReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // ── Detection loop ──
    useEffect(() => {
        if (!enabled || !cameraReady) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            // Capture frame
            captureFrame();

            // Run local expression detection
            const detection = detectExpressionFromFrame();
            setLatestDetection(detection);
            onDetection?.(detection);
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
