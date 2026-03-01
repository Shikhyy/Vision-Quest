// ═══════════════════════════════════════════
// Vision Quest — Core Type Definitions
// ═══════════════════════════════════════════

export type ZoneId = 'jester' | 'sage' | 'shadow' | 'guard' | 'merchant';

export type ChallengeState = 'idle' | 'active' | 'success' | 'failed';

export type Rarity = 'common' | 'rare' | 'legendary';

export type ItemType = 'scroll' | 'artifact' | 'cosmetic';

export type EmotionType =
    | 'happy'
    | 'sad'
    | 'surprised'
    | 'fearful'
    | 'angry'
    | 'disgusted'
    | 'neutral'
    | 'contempt';

// ── NPC Types ──

export type NPCEmotionState = string; // Each NPC defines their own states

export interface NPCReaction {
    dialogue: string;
    emotionState: NPCEmotionState;
    challengeDelta: number; // -10 to +20
    soundEffect?: string;
    animationTrigger?: string;
}

export interface NPCConfig {
    id: ZoneId;
    name: string;
    title: string;
    zoneName: string;
    description: string;
    color: string;
    glowColor: string;
    systemPrompt: string;
    challengeDuration: number; // seconds
    xpReward: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    emotionStates: Record<string, string>; // state -> sprite frame
}

// ── Detection Types ──

export interface DetectedObject {
    label: string;
    confidence: number;
    bbox: [number, number, number, number]; // x, y, w, h
    color?: string;
}

export interface DetectionResult {
    emotion: EmotionType;
    confidence: number;
    objects: DetectedObject[];
    gestures: string[];
    timestamp: Date;
}

// ── Player Types ──

export interface Badge {
    id: string;
    name: string;
    emoji: string;
    description: string;
    earnedAt: Date;
    zone: ZoneId;
}

export interface Item {
    id: string;
    name: string;
    type: ItemType;
    rarity: Rarity;
    icon: string;
    description: string;
}

// ── Screen / Navigation ──

export type ScreenId =
    | 'landing'
    | 'camera-setup'
    | 'village-map'
    | 'zone-transition'
    | 'npc-encounter'
    | 'reward'
    | 'player-profile'
    | 'settings';

// ── API Types ──

export interface NPCRespondRequest {
    npcId: ZoneId;
    detectionResult: DetectionResult;
    challengeState: ChallengeState;
    challengeProgress: number;
    playerName: string;
    currentRiddle?: string;
}

export interface NPCRespondResponse {
    dialogue: string;
    emotionState: string;
    challengeProgress: number;
    correct?: boolean; // For Sage riddle judging
}

// ── Zone Config ──

export interface ZoneConfig {
    id: ZoneId;
    name: string;
    npcName: string;
    description: string;
    loreText: string;
    color: string;
    xpReward: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
    unlockLevel: number;
    challengeDuration: number;
    icon: string;
}

// ── XP / Level ──

export interface LevelInfo {
    level: number;
    title: string;
    xpRequired: number;
    unlocks: string;
}
