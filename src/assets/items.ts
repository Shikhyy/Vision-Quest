import type { Item } from '../types';

export const ITEMS: Record<string, Item> = {
    jesters_hat: {
        id: 'jesters_hat',
        name: "Jester's Hat",
        type: 'cosmetic',
        rarity: 'common',
        icon: '🎩',
        description: 'A floppy hat with jingling bells. Slightly damp with tears.',
    },
    comedy_scroll: {
        id: 'comedy_scroll',
        name: 'Comedy Scroll',
        type: 'scroll',
        rarity: 'common',
        icon: '📜',
        description: 'A scroll containing the Jester\'s worst jokes. Reading it is optional.',
    },
    ancient_tome: {
        id: 'ancient_tome',
        name: 'Ancient Tome',
        type: 'scroll',
        rarity: 'rare',
        icon: '📕',
        description: 'A book of forgotten wisdom. The runes shift when you look away.',
    },
    rare_artifact: {
        id: 'rare_artifact',
        name: 'Arcane Prism',
        type: 'artifact',
        rarity: 'rare',
        icon: '🔷',
        description: 'A crystalline prism that refracts light into colors that shouldn\'t exist.',
    },
    shadow_cloak: {
        id: 'shadow_cloak',
        name: 'Shadow Cloak',
        type: 'cosmetic',
        rarity: 'rare',
        icon: '🧥',
        description: 'A cloak woven from pure darkness. Wearing it makes shadows avoid you.',
    },
    legendary_dark_eye: {
        id: 'legendary_dark_eye',
        name: 'Dark Eye Artifact',
        type: 'artifact',
        rarity: 'legendary',
        icon: '👁️',
        description: 'A pulsing orb of shadow energy. It blinks when you\'re not looking.',
    },
    speed_boots: {
        id: 'speed_boots',
        name: 'Speed Boots',
        type: 'cosmetic',
        rarity: 'common',
        icon: '👢',
        description: 'Enchanted boots that make you feel faster. You aren\'t, but you feel it.',
    },
    drama_mask: {
        id: 'drama_mask',
        name: 'Drama Mask',
        type: 'cosmetic',
        rarity: 'rare',
        icon: '🎭',
        description: 'A mask with a thousand faces. Each one tells a different story.',
    },
    observers_lens: {
        id: 'observers_lens',
        name: 'Observer\'s Lens',
        type: 'artifact',
        rarity: 'legendary',
        icon: '🔍',
        description: 'A mystical lens that reveals what the eyes cannot see alone.',
    },
    tavern_lore_scroll: {
        id: 'tavern_lore_scroll',
        name: 'Tavern Lore Scroll',
        type: 'scroll',
        rarity: 'common',
        icon: '🍺',
        description: 'Secrets of The Laughing Tavern, written in invisible ink that reacts to laughter.',
    },
    spell_scroll: {
        id: 'spell_scroll',
        name: 'Spell Scroll',
        type: 'scroll',
        rarity: 'rare',
        icon: '✨',
        description: 'An ancient spell written in arcane glyphs. The ink glows faintly cyan.',
    },
    nerves_of_steel_badge: {
        id: 'nerves_of_steel_badge',
        name: 'Nerves of Steel',
        type: 'artifact',
        rarity: 'rare',
        icon: '🛡️',
        description: 'Proof that darkness could not consume you. The Shadow remembers.',
    },
};

export function getItemById(id: string): Item | undefined {
    return ITEMS[id];
}
