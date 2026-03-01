import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Badge, Item, ZoneId } from '../types';

// ── XP Level Thresholds ──
const LEVEL_TABLE = [
    { level: 1, title: 'Newcomer', xp: 0 },
    { level: 2, title: 'Newcomer', xp: 100 },
    { level: 3, title: 'Newcomer', xp: 200 },
    { level: 4, title: 'Newcomer', xp: 350 },
    { level: 5, title: 'Seen One', xp: 500 },
    { level: 6, title: 'Seen One', xp: 700 },
    { level: 7, title: 'Seen One', xp: 950 },
    { level: 8, title: 'Watcher', xp: 1200 },
    { level: 9, title: 'Watcher', xp: 1600 },
    { level: 10, title: 'Visionary', xp: 2000 },
    { level: 15, title: 'Lens Bearer', xp: 4000 },
    { level: 20, title: 'All-Seeing', xp: 8000 },
    { level: 30, title: 'The Observed', xp: 20000 },
];

function getLevelForXP(xp: number): { level: number; title: string; xpToNext: number } {
    let current = LEVEL_TABLE[0];
    let next = LEVEL_TABLE[1];

    for (let i = 0; i < LEVEL_TABLE.length; i++) {
        if (xp >= LEVEL_TABLE[i].xp) {
            current = LEVEL_TABLE[i];
            next = LEVEL_TABLE[i + 1] || { ...current, xp: current.xp + 5000 };
        }
    }

    return {
        level: current.level,
        title: current.title,
        xpToNext: next.xp - xp,
    };
}

// ── Player Store ──

interface PlayerState {
    // Identity
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    title: string;

    // Progress
    zonesCompleted: ZoneId[];
    badges: Badge[];
    inventory: Item[];
    visicoins: number;

    // Stats
    emotionStats: Record<string, number>;
    totalPlaytime: number;
    sessionsPlayed: number;

    // Settings
    cameraEnabled: boolean;
    soundEnabled: boolean;
    motionEnabled: boolean;

    // Actions
    setName: (name: string) => void;
    addXP: (amount: number) => number; // returns new level
    completeZone: (zoneId: ZoneId) => void;
    addBadge: (badge: Badge) => void;
    addItem: (item: Item) => void;
    addVisicoin: (amount: number) => void;
    recordEmotion: (emotion: string) => void;
    toggleSound: () => void;
    toggleMotion: () => void;
    resetProgress: () => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            // ── Defaults ──
            name: 'Traveler',
            level: 1,
            xp: 0,
            xpToNext: 100,
            title: 'Newcomer',

            zonesCompleted: [],
            badges: [],
            inventory: [],
            visicoins: 0,

            emotionStats: {},
            totalPlaytime: 0,
            sessionsPlayed: 0,

            cameraEnabled: false,
            soundEnabled: true,
            motionEnabled: true,

            // ── Actions ──
            setName: (name) => set({ name }),

            addXP: (amount) => {
                const newXP = get().xp + amount;
                const { level, title, xpToNext } = getLevelForXP(newXP);
                set({ xp: newXP, level, title, xpToNext });
                return level;
            },

            completeZone: (zoneId) => {
                const current = get().zonesCompleted;
                if (!current.includes(zoneId)) {
                    set({ zonesCompleted: [...current, zoneId] });
                }
            },

            addBadge: (badge) => {
                const current = get().badges;
                if (!current.find((b) => b.id === badge.id)) {
                    set({ badges: [...current, badge] });
                }
            },

            addItem: (item) => {
                set({ inventory: [...get().inventory, item] });
            },

            addVisicoin: (amount) => {
                set({ visicoins: get().visicoins + amount });
            },

            recordEmotion: (emotion) => {
                const stats = { ...get().emotionStats };
                stats[emotion] = (stats[emotion] || 0) + 1;
                set({ emotionStats: stats });
            },

            toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
            toggleMotion: () => set({ motionEnabled: !get().motionEnabled }),

            resetProgress: () =>
                set({
                    level: 1,
                    xp: 0,
                    xpToNext: 100,
                    title: 'Newcomer',
                    zonesCompleted: [],
                    badges: [],
                    inventory: [],
                    visicoins: 0,
                    emotionStats: {},
                    totalPlaytime: 0,
                }),
        }),
        {
            name: 'vq_player',
        }
    )
);
