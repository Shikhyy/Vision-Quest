// ═══════════════════════════════════════════
// Sound Manager — 8-bit Sound Effects & Zone Music
// Uses Howler.js for low-latency game audio
// ═══════════════════════════════════════════



// ── Sound Effect Generator (Web Audio API synth) ──
// Since we don't have actual audio files, we generate 8-bit sounds programmatically

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctor();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

function play8BitSound(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.15
) {
    try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    } catch { /* audio unavailable */ }
}

function playArpeggio(frequencies: number[], noteLength: number = 0.08, volume: number = 0.12) {
    frequencies.forEach((freq, i) => {
        setTimeout(() => {
            play8BitSound(freq, noteLength * 2, 'square', volume);
        }, i * noteLength * 1000);
    });
}

// ── Sound Effects ──

export const SoundFX = {
    /** Menu click / button press */
    click: () => {
        play8BitSound(800, 0.08, 'square', 0.1);
    },

    /** Start challenge */
    challengeStart: () => {
        playArpeggio([262, 330, 392, 523], 0.1, 0.15);
    },

    /** Challenge success */
    success: () => {
        playArpeggio([523, 659, 784, 1047], 0.12, 0.18);
    },

    /** Challenge fail */
    fail: () => {
        playArpeggio([392, 330, 262, 196], 0.15, 0.15);
    },

    /** XP gained */
    xpGain: () => {
        playArpeggio([660, 880, 1100], 0.06, 0.1);
    },

    /** Badge earned */
    badgeEarned: () => {
        playArpeggio([523, 659, 784, 1047, 1319], 0.1, 0.15);
    },

    /** NPC laugh (Jester) */
    jesterLaugh: () => {
        playArpeggio([440, 550, 440, 550, 660, 880], 0.08, 0.12);
    },

    /** NPC react positive */
    positiveReact: () => {
        playArpeggio([440, 523, 659], 0.07, 0.1);
    },

    /** NPC react negative */
    negativeReact: () => {
        playArpeggio([330, 262, 196], 0.1, 0.1);
    },

    /** Shadow whisper / creepy */
    shadowWhisper: () => {
        play8BitSound(80, 0.6, 'sawtooth', 0.08);
        setTimeout(() => play8BitSound(60, 0.8, 'sawtooth', 0.05), 300);
    },

    /** Jump scare */
    jumpScare: () => {
        play8BitSound(200, 0.3, 'sawtooth', 0.25);
        play8BitSound(100, 0.5, 'square', 0.2);
    },

    /** Sage analyzing / scan */
    sageAnalyze: () => {
        playArpeggio([330, 440, 550, 660, 550, 440], 0.06, 0.08);
    },

    /** Sage correct */
    sageCorrect: () => {
        playArpeggio([523, 659, 784, 1047], 0.1, 0.15);
    },

    /** Zone enter */
    zoneEnter: () => {
        playArpeggio([196, 262, 330, 392], 0.15, 0.12);
    },

    /** Level up */
    levelUp: () => {
        playArpeggio([262, 330, 392, 523, 659, 784, 1047], 0.08, 0.18);
    },

    /** Timer warning (low time) */
    timerWarning: () => {
        play8BitSound(440, 0.15, 'square', 0.12);
    },

    /** Typing / dialogue character */
    dialogueTick: () => {
        play8BitSound(1200, 0.03, 'square', 0.04);
    },
};

// ── Ambient Music Engine (simple looping pads) ──

let currentAmbient: ReturnType<typeof setInterval> | null = null;

export function startAmbientMusic(zone: 'jester' | 'sage' | 'shadow' | 'village') {
    stopAmbientMusic();

    const patterns: Record<string, { notes: number[]; interval: number; type: OscillatorType }> = {
        jester: { notes: [262, 294, 330, 349, 392, 349, 330, 294], interval: 400, type: 'square' },
        sage: { notes: [220, 262, 330, 392, 330, 262], interval: 600, type: 'triangle' },
        shadow: { notes: [110, 104, 98, 92, 87, 82], interval: 800, type: 'sawtooth' },
        village: { notes: [330, 392, 440, 523, 440, 392], interval: 500, type: 'triangle' },
    };

    const pattern = patterns[zone];
    let noteIndex = 0;

    currentAmbient = setInterval(() => {
        play8BitSound(pattern.notes[noteIndex], pattern.interval / 1000 * 1.5, pattern.type, 0.03);
        noteIndex = (noteIndex + 1) % pattern.notes.length;
    }, pattern.interval);
}

export function stopAmbientMusic() {
    if (currentAmbient) {
        clearInterval(currentAmbient);
        currentAmbient = null;
    }
}

// ── Master Volume (respects settings) ──

export function isSoundEnabled(): boolean {
    try {
        const stored = localStorage.getItem('vq_player');
        if (stored) {
            const data = JSON.parse(stored);
            return data?.state?.soundEnabled !== false;
        }
    } catch { /* ignore storage errors */ }
    return true;
}
