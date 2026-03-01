export interface Riddle {
    id: string;
    text: string;
    acceptableObjects: string[];
    hint: string;
}

export const RIDDLES: Riddle[] = [
    {
        id: 'r1',
        text: 'Show me something that carries water.',
        acceptableObjects: ['bottle', 'cup', 'mug', 'glass', 'container', 'jar', 'bowl', 'kettle', 'pitcher', 'thermos', 'flask', 'water bottle', 'tumbler'],
        hint: 'A vessel, a cup, a thing that holds the rivers...',
    },
    {
        id: 'r2',
        text: 'Show me something that captures light.',
        acceptableObjects: ['phone', 'camera', 'mirror', 'glasses', 'sunglasses', 'lens', 'screen', 'tablet', 'laptop', 'monitor', 'crystal', 'prism'],
        hint: 'It traps the sun, holds it prisoner in glass and silicon...',
    },
    {
        id: 'r3',
        text: 'Show me something with words upon it.',
        acceptableObjects: ['book', 'paper', 'notebook', 'card', 'box', 'bottle', 'can', 'package', 'magazine', 'newspaper', 'letter', 'screen', 'phone', 'keyboard', 'label'],
        hint: 'Letters upon its surface, stories etched in ink or light...',
    },
    {
        id: 'r4',
        text: 'Show me something that tells time.',
        acceptableObjects: ['watch', 'clock', 'phone', 'timer', 'hourglass', 'calendar', 'screen', 'wristwatch', 'smartphone'],
        hint: 'Tick, tock — it measures the immeasurable...',
    },
    {
        id: 'r5',
        text: 'Show me something that creates sound.',
        acceptableObjects: ['phone', 'headphones', 'earbuds', 'speaker', 'bell', 'instrument', 'guitar', 'keyboard', 'keys', 'remote', 'whistle', 'clap'],
        hint: 'It vibrates the air, birthing waves that only ears can taste...',
    },
    {
        id: 'r6',
        text: 'Show me something that provides warmth.',
        acceptableObjects: ['blanket', 'scarf', 'hat', 'jacket', 'sweater', 'hoodie', 'coat', 'gloves', 'socks', 'clothes', 'cup', 'mug', 'candle', 'lamp'],
        hint: 'Against the cold, it wraps you in its gentle embrace...',
    },
    {
        id: 'r7',
        text: 'Show me something that holds knowledge.',
        acceptableObjects: ['book', 'phone', 'laptop', 'tablet', 'notebook', 'paper', 'screen', 'computer', 'hard drive', 'usb', 'flash drive', 'encyclopedia', 'dictionary'],
        hint: 'Wisdom is trapped within its pages... or pixels...',
    },
    {
        id: 'r8',
        text: 'Show me something from the natural world.',
        acceptableObjects: ['plant', 'flower', 'leaf', 'rock', 'stone', 'shell', 'wood', 'stick', 'fruit', 'apple', 'banana', 'orange', 'vegetable', 'feather', 'water', 'seed', 'nut'],
        hint: 'Not crafted by human hands, but by the earth itself...',
    },
    {
        id: 'r9',
        text: 'Show me something that unlocks.',
        acceptableObjects: ['key', 'keys', 'phone', 'card', 'badge', 'keycard', 'remote', 'lock', 'padlock', 'password', 'fingerprint'],
        hint: 'It is the bridge between closed and open, locked and free...',
    },
    {
        id: 'r10',
        text: 'Show me something that reflects.',
        acceptableObjects: ['mirror', 'screen', 'phone', 'glasses', 'sunglasses', 'spoon', 'metal', 'water', 'window', 'glass', 'foil'],
        hint: 'It shows you yourself — or perhaps, who you could be...',
    },
];

export function getRandomRiddles(count: number = 3): Riddle[] {
    const shuffled = [...RIDDLES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
