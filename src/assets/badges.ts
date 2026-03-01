import type { ZoneId } from '../types';

export interface BadgeDefinition {
    id: string;
    name: string;
    emoji: string;
    description: string;
    zone: ZoneId;
    xpReward: number;
    itemReward?: string;
}

export const BADGES: BadgeDefinition[] = [
    {
        id: 'comedian',
        name: 'Comedian',
        emoji: '😂',
        description: 'Complete the Jester zone for the first time',
        zone: 'jester',
        xpReward: 50,
        itemReward: 'jesters_hat',
    },
    {
        id: 'stand_up',
        name: 'Stand-Up',
        emoji: '🤣',
        description: 'Make the Jester laugh 10 times total',
        zone: 'jester',
        xpReward: 100,
        itemReward: 'comedy_scroll',
    },
    {
        id: 'scholar',
        name: 'Scholar',
        emoji: '🔮',
        description: 'Solve all 3 Sage riddles in a single run',
        zone: 'sage',
        xpReward: 75,
        itemReward: 'ancient_tome',
    },
    {
        id: 'hoarder',
        name: 'Hoarder',
        emoji: '📦',
        description: 'Show the Sage 20 unique objects in total',
        zone: 'sage',
        xpReward: 150,
        itemReward: 'rare_artifact',
    },
    {
        id: 'ice_veins',
        name: 'Ice Veins',
        emoji: '🧊',
        description: 'Beat the Shadow with 0% fear detected',
        zone: 'shadow',
        xpReward: 100,
        itemReward: 'shadow_cloak',
    },
    {
        id: 'stoic',
        name: 'Stoic',
        emoji: '😤',
        description: 'Complete the Shadow zone 3 times',
        zone: 'shadow',
        xpReward: 200,
        itemReward: 'legendary_dark_eye',
    },
    {
        id: 'zone_clear',
        name: 'Zone Clear',
        emoji: '🏆',
        description: 'Complete all 3 zones',
        zone: 'jester',
        xpReward: 300,
    },
    {
        id: 'speed_run',
        name: 'Speed Run',
        emoji: '⚡',
        description: 'Complete any zone under par time',
        zone: 'jester',
        xpReward: 50,
        itemReward: 'speed_boots',
    },
    {
        id: 'method_actor',
        name: 'Method Actor',
        emoji: '🎭',
        description: 'Show 8 different emotions in a single session',
        zone: 'jester',
        xpReward: 75,
        itemReward: 'drama_mask',
    },
    {
        id: 'watcher',
        name: 'Watcher',
        emoji: '👁️',
        description: 'Play for a total of 30 minutes',
        zone: 'shadow',
        xpReward: 100,
        itemReward: 'observers_lens',
    },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
    return BADGES.find((b) => b.id === id);
}
