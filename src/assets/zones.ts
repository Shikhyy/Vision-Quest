import type { ZoneConfig } from '../types';

export const ZONES: ZoneConfig[] = [
    {
        id: 'jester',
        name: 'The Laughing Tavern',
        npcName: 'JESTER',
        description: 'A darkly comedic trickster who lives for laughter. Make him laugh — or face his wrath.',
        loreText: 'The tavern door creaks open. Inside, the air is thick with the smell of spilled ale and stale jokes. A figure stands on the stage, bells jingling, face split between joy and sorrow...',
        color: '#FFB800',
        xpReward: 50,
        difficulty: 1,
        unlockLevel: 1,
        challengeDuration: 60,
        icon: '🃏',
    },
    {
        id: 'sage',
        name: "The Wizard's Tower",
        npcName: 'THE SAGE',
        description: 'An ancient wizard made of floating runes. He sees meaning in the mundane. Show him what he seeks.',
        loreText: 'Stone steps spiral upward into blue light. The tower hums with arcane energy. At the top, a being of pure knowledge awaits — not solid, but shimmer and text, ancient and curious...',
        color: '#00D4FF',
        xpReward: 75,
        difficulty: 2,
        unlockLevel: 1,
        challengeDuration: 90,
        icon: '🧙',
    },
    {
        id: 'shadow',
        name: 'The Dark Forest',
        npcName: 'THE SHADOW',
        description: 'A void with burning red eyes. It feeds on fear. Stay calm — or be consumed.',
        loreText: 'The trees grow so thick that even moonlight cannot reach the forest floor. Something watches from the darkness. Two red embers glow where eyes should be. It knows your name...',
        color: '#FF4444',
        xpReward: 100,
        difficulty: 3,
        unlockLevel: 1,
        challengeDuration: 90,
        icon: '👁️',
    },
];

export function getZoneById(id: string): ZoneConfig | undefined {
    return ZONES.find((z) => z.id === id);
}
