// ═══════════════════════════════════════════
// Vision Integration — Detection Types
// ═══════════════════════════════════════════

import type { DetectedObject, DetectionResult, EmotionType } from '../types';

/**
 * Create a default empty detection result
 */
export function createEmptyDetection(): DetectionResult {
    return {
        emotion: 'neutral',
        confidence: 0,
        objects: [],
        gestures: [],
        timestamp: new Date(),
    };
}

/**
 * Calculate the dominant emotion from a list of detections
 */
export function getDominantEmotion(
    emotions: Record<string, number>
): { emotion: EmotionType; confidence: number } {
    let maxEmotion: EmotionType = 'neutral';
    let maxConfidence = 0;

    for (const [emotion, confidence] of Object.entries(emotions)) {
        if (confidence > maxConfidence) {
            maxEmotion = emotion as EmotionType;
            maxConfidence = confidence;
        }
    }

    return { emotion: maxEmotion, confidence: maxConfidence };
}

/**
 * Check if a detected object matches an expected label
 */
export function objectMatchesLabel(
    detected: DetectedObject,
    expectedLabels: string[]
): boolean {
    const detectedLower = detected.label.toLowerCase();
    return expectedLabels.some(
        (label) =>
            detectedLower.includes(label.toLowerCase()) ||
            label.toLowerCase().includes(detectedLower)
    );
}

/**
 * Determine if expression indicates fear (for Shadow NPC)
 */
export function isFearExpression(emotion: EmotionType): boolean {
    return ['fearful', 'surprised', 'disgusted'].includes(emotion);
}

/**
 * Determine if expression indicates happiness (for Jester NPC)
 */
export function isHappyExpression(emotion: EmotionType): boolean {
    return ['happy'].includes(emotion);
}

/**
 * Format detection result for insertion into NPC system prompts
 */
export function formatDetectionForPrompt(detection: DetectionResult): string {
    const parts: string[] = [];

    parts.push(`Expression: ${detection.emotion} (${Math.round(detection.confidence * 100)}% confidence)`);

    if (detection.objects.length > 0) {
        const objectLabels = detection.objects
            .map((o) => `${o.label} (${Math.round(o.confidence * 100)}%)`)
            .join(', ');
        parts.push(`Objects seen: ${objectLabels}`);
    }

    if (detection.gestures.length > 0) {
        parts.push(`Gestures: ${detection.gestures.join(', ')}`);
    }

    return parts.join('. ');
}
