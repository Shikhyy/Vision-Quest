import { create } from 'zustand';
import type { ChallengeState, DetectionResult, ZoneId } from '../types';

interface ChallengeStoreState {
    activeZone: ZoneId | null;
    challengeState: ChallengeState;
    progress: number; // 0–100
    timer: number; // seconds remaining
    lives: number;
    currentDetection: DetectionResult | null;
    npcDialogue: string;
    npcEmotionState: string;
    lastApiCall: Date | null;
    currentRiddle: string | null;
    riddleIndex: number;

    // Actions
    startChallenge: (zoneId: ZoneId, duration: number) => void;
    updateProgress: (delta: number) => void;
    incrementProgress: (delta: number) => void;
    setProgress: (value: number) => void;
    tickTimer: () => number; // returns remaining
    loseLife: () => number; // returns remaining lives
    setDetection: (detection: DetectionResult) => void;
    setNPCDialogue: (dialogue: string) => void;
    setNPCEmotionState: (state: string) => void;
    succeedChallenge: () => void;
    failChallenge: () => void;
    setRiddle: (riddle: string, index: number) => void;
    resetChallenge: () => void;
}

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
    activeZone: null,
    challengeState: 'idle',
    progress: 0,
    timer: 60,
    lives: 3,
    currentDetection: null,
    npcDialogue: '',
    npcEmotionState: 'idle',
    lastApiCall: null,
    currentRiddle: null,
    riddleIndex: 0,

    startChallenge: (zoneId, duration) =>
        set({
            activeZone: zoneId,
            challengeState: 'active',
            progress: 0,
            timer: duration,
            lives: 3,
            npcDialogue: '',
            npcEmotionState: 'idle',
            currentDetection: null,
            lastApiCall: null,
            currentRiddle: null,
            riddleIndex: 0,
        }),

    updateProgress: (delta) => {
        const newProgress = Math.max(0, Math.min(100, get().progress + delta));
        set({ progress: newProgress });
        if (newProgress >= 100) {
            set({ challengeState: 'success' });
        }
    },

    incrementProgress: (delta) => {
        const newProgress = Math.max(0, Math.min(100, get().progress + delta));
        set({ progress: newProgress });
        if (newProgress >= 100) {
            set({ challengeState: 'success' });
        }
    },

    setProgress: (value) => {
        const clamped = Math.max(0, Math.min(100, value));
        set({ progress: clamped });
        if (clamped >= 100) {
            set({ challengeState: 'success' });
        }
    },

    tickTimer: () => {
        const remaining = Math.max(0, get().timer - 1);
        set({ timer: remaining });
        if (remaining <= 0 && get().challengeState === 'active') {
            // Timer ran out — zone-specific logic determines success/fail
        }
        return remaining;
    },

    loseLife: () => {
        const remaining = Math.max(0, get().lives - 1);
        set({ lives: remaining });
        if (remaining <= 0) {
            set({ challengeState: 'failed' });
        }
        return remaining;
    },

    setDetection: (detection) =>
        set({ currentDetection: detection, lastApiCall: new Date() }),

    setNPCDialogue: (dialogue) => set({ npcDialogue: dialogue }),

    setNPCEmotionState: (state) => set({ npcEmotionState: state }),

    succeedChallenge: () => set({ challengeState: 'success' }),
    failChallenge: () => set({ challengeState: 'failed' }),

    setRiddle: (riddle, index) => set({ currentRiddle: riddle, riddleIndex: index }),

    resetChallenge: () =>
        set({
            activeZone: null,
            challengeState: 'idle',
            progress: 0,
            timer: 60,
            lives: 3,
            currentDetection: null,
            npcDialogue: '',
            npcEmotionState: 'idle',
            lastApiCall: null,
            currentRiddle: null,
            riddleIndex: 0,
        }),
}));
