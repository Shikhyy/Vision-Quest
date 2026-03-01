// ═══════════════════════════════════════════
// useNPCReaction — Orchestrates vision → Gemini → NPC dialogue
// ═══════════════════════════════════════════

import { useCallback, useRef } from 'react';
import { generateNPCDialogue, generateNPCDialogueWithVision, isGeminiConfigured } from '../api/geminiService';
import { getJesterReactionPrompt } from '../npcs/jester';
import { getSageReactionPrompt } from '../npcs/sage';
import { getShadowReactionPrompt } from '../npcs/shadow';
import { useChallengeStore } from '../store/challengeStore';
import { usePlayerStore } from '../store/playerStore';
import { isHappyExpression, isFearExpression, formatDetectionForPrompt } from '../vision/detectionUtils';
import type { DetectionResult, ZoneId } from '../types';

interface UseNPCReactionReturn {
    /** Process a detection and generate NPC reaction via Gemini */
    processDetection: (detection: DetectionResult, frame?: string | null, spokenText?: string) => Promise<void>;
    /** Whether a Gemini call is in progress */
    isGenerating: boolean;
}

// Fallback dialogues for when Gemini isn't configured
const FALLBACK_DIALOGUES: Record<ZoneId, Record<string, string[]>> = {
    jester: {
        happy: [
            "Ha! That face! The bells on my hat are jingling with joy, Traveler!",
            "Now THAT'S a smile! My sad half is losing ground!",
            "Magnificent! Even the ale glasses are trembling with laughter!",
            "Keep it up! The tavern brightens with your grin!",
            "Oh ho! A genuine smile! The cobwebs are shaking!",
        ],
        neutral: [
            "Stone face? In MY tavern? The audacity!",
            "I've seen more expression on a brick wall. Try harder, Traveler!",
            "My tears flow freely when you refuse to smile...",
            "Come now, surely you can do better than that dead stare!",
        ],
        negative: [
            "Why the long face, Traveler? Did someone steal your ale?",
            "If frowning were an art, you'd be a master. Now SMILE!",
        ],
    },
    sage: {
        analyzing: [
            "Hmm... the runes stir... show me something curious, seeker...",
            "My arcane sight peers beyond... bring an object closer...",
            "The tower hums with anticipation... what will you reveal?",
        ],
        correct: [
            "Extraordinary! The runes confirm — you have answered well!",
            "The tower door glows with acceptance! Truly wise, seeker!",
            "Ancient knowledge confirms your offering! Remarkable!",
        ],
        wrong: [
            "Hmm... not quite what the riddle seeks. Try again, seeker...",
            "The runes dim with confusion... perhaps another object?",
            "Curious, but not what I seek. The riddle remains...",
        ],
    },
    shadow: {
        fearful: [
            "...yes... I can taste it... your fear is... exquisite...",
            "...don't look away... it only makes me... stronger...",
            "...your eyes betray you... the darkness grows...",
            "...there it is... that beautiful terror... delicious...",
        ],
        calm: [
            "...you're... stronger than I expected...",
            "...how... how do you resist... the darkness calls...",
            "...that calm... it burns me... like sunlight...",
            "...no... you cannot be this brave... it's impossible...",
        ],
    },
    guard: { neutral: ["Stand tall!"] },
    merchant: { neutral: ["What'll it be?"] },
};

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function useNPCReaction(): UseNPCReactionReturn {
    const isGeneratingRef = useRef(false);
    const lastCallRef = useRef<number>(0);
    const MIN_INTERVAL = 3000; // Minimum 3s between Gemini calls

    const processDetection = useCallback(async (detection: DetectionResult, frame?: string | null, spokenText?: string) => {
        // Throttle calls
        const now = Date.now();
        if (now - lastCallRef.current < MIN_INTERVAL) return;
        if (isGeneratingRef.current) return;

        const activeZone = useChallengeStore.getState().activeZone;
        const progress = useChallengeStore.getState().progress;
        const timer = useChallengeStore.getState().timer;
        const playerName = usePlayerStore.getState().name;
        const { setNPCDialogue, setNPCEmotionState, updateProgress } = useChallengeStore.getState();
        const recordEmotion = usePlayerStore.getState().recordEmotion;

        if (!activeZone) return;

        isGeneratingRef.current = true;
        lastCallRef.current = now;
        recordEmotion(detection.emotion);

        const detectionText = formatDetectionForPrompt(detection);

        // ── Zone-specific logic ──
        if (activeZone === 'jester') {
            const isHappy = isHappyExpression(detection.emotion);

            if (isHappy) {
                updateProgress(12 + Math.random() * 10);
                setNPCEmotionState(progress > 66 ? 'laughing' : 'amused');
            } else {
                updateProgress(-5);
                setNPCEmotionState('offended');
            }

            if (isGeminiConfigured()) {
                try {
                    const prompt = getJesterReactionPrompt(detectionText, progress, playerName);
                    const userMsg = `The player's current expression is: ${detectionText}.${spokenText ? ` The player says: "${spokenText}"` : ''} React in character as the Jester.`;

                    const result = frame
                        ? await generateNPCDialogueWithVision({
                            systemPrompt: prompt,
                            userMessage: userMsg,
                            imageBase64: frame,
                            maxTokens: 100,
                        })
                        : await generateNPCDialogue({
                            systemPrompt: prompt,
                            userMessage: userMsg,
                            maxTokens: 100,
                        });
                    setNPCDialogue(result.dialogue);
                } catch {
                    setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.jester[isHappy ? 'happy' : 'neutral']));
                }
            } else {
                setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.jester[isHappy ? 'happy' : 'neutral']));
            }
        } else if (activeZone === 'shadow') {
            const isFear = isFearExpression(detection.emotion);

            if (isFear) {
                updateProgress(8 + Math.random() * 7);
                setNPCEmotionState('feeding');
            } else {
                updateProgress(-3);
                setNPCEmotionState('awakened');
            }

            if (isGeminiConfigured()) {
                try {
                    const prompt = getShadowReactionPrompt(detectionText, progress, playerName, timer);
                    const userMsg = `The player's current expression: ${detectionText}.${spokenText ? ` The player whispers: "${spokenText}"` : ''} Whisper your reaction.`;

                    const result = await generateNPCDialogue({
                        systemPrompt: prompt,
                        userMessage: userMsg,
                        maxTokens: 80,
                    });
                    setNPCDialogue(result.dialogue);
                } catch {
                    setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.shadow[isFear ? 'fearful' : 'calm']));
                }
            } else {
                setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.shadow[isFear ? 'fearful' : 'calm']));
            }
        } else if (activeZone === 'sage') {
            setNPCEmotionState('analyzing');

            const currentRiddle = useChallengeStore.getState().currentRiddle;

            if (isGeminiConfigured() && frame && currentRiddle) {
                try {
                    const prompt = getSageReactionPrompt('analyzing via arcane sight', 0.8, currentRiddle);
                    const userMsg = `Look at this image the player is showing you.${spokenText ? ` The player says: "${spokenText}"` : ''} Identify the object and determine if it satisfies the riddle: "${currentRiddle}". Respond as JSON: {"dialogue": "your response", "correct": true/false}`;

                    const result = await generateNPCDialogueWithVision({
                        systemPrompt: prompt,
                        userMessage: userMsg,
                        imageBase64: frame,
                        maxTokens: 150,
                    });
                    setNPCDialogue(result.dialogue);

                    if (result.correct) {
                        setNPCEmotionState('correct');
                        updateProgress(34); // ~3 riddles to complete
                    } else {
                        setNPCEmotionState('wrong');
                    }
                } catch {
                    setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.sage.analyzing));
                }
            } else {
                setNPCDialogue(pickRandom(FALLBACK_DIALOGUES.sage.analyzing));
            }
        }

        isGeneratingRef.current = false;
    }, []);

    return {
        processDetection,
        isGenerating: isGeneratingRef.current,
    };
}
