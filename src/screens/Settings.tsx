// ═══════════════════════════════════════════
// Settings Screen — Player preferences
// ═══════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { SoundFX } from '../audio/soundManager';

function ToggleRow({
    label,
    description,
    value,
    onChange,
    color = 'var(--cyan)',
}: {
    label: string;
    description: string;
    value: boolean;
    onChange: () => void;
    color?: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid var(--dark-gray)',
            }}
        >
            <div>
                <div style={{ fontFamily: 'var(--font-game)', fontSize: 9, color: 'var(--white)' }}>
                    {label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>
                    {description}
                </div>
            </div>
            <motion.button
                onClick={() => {
                    SoundFX.click();
                    onChange();
                }}
                whileTap={{ scale: 0.9 }}
                style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    border: `1px solid ${value ? color : 'var(--dark-gray)'}`,
                    background: value ? `${color}22` : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                }}
            >
                <motion.div
                    animate={{ x: value ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                        position: 'absolute',
                        top: 2,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: value ? color : 'var(--gray)',
                        boxShadow: value ? `0 0 8px ${color}88` : 'none',
                    }}
                />
            </motion.button>
        </div>
    );
}

export default function Settings() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const showCRT = useGameStore((s) => s.showCRT);
    const toggleCRT = useGameStore((s) => s.toggleCRT);
    const { soundEnabled, motionEnabled, toggleSound, toggleMotion, resetProgress, name } =
        usePlayerStore();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    return (
        <div
            className="game-cursor"
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'auto',
                padding: '32px 24px',
                position: 'relative',
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 50% 20%, #00D4FF08, transparent 60%)',
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    maxWidth: 520,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2
                        style={{
                            fontFamily: 'var(--font-game)',
                            fontSize: 14,
                            color: 'var(--cyan)',
                        }}
                        className="text-glow-cyan"
                    >
                        SETTINGS
                    </h2>
                    <button
                        onClick={() => {
                            SoundFX.click();
                            navigateTo('village-map');
                        }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--gray)',
                            background: 'none',
                            border: '1px solid var(--dark-gray)',
                            padding: '4px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        ← Back
                    </button>
                </div>

                {/* Audio & Visual */}
                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--dark-gray)',
                        padding: '4px 20px 16px',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', padding: '12px 0', letterSpacing: 2 }}>
                        AUDIO & VISUAL
                    </h3>
                    <ToggleRow
                        label="Sound Effects"
                        description="8-bit SFX and ambient music"
                        value={soundEnabled}
                        onChange={toggleSound}
                    />
                    <ToggleRow
                        label="CRT Scanlines"
                        description="Retro TV overlay effect"
                        value={showCRT}
                        onChange={toggleCRT}
                        color="var(--green)"
                    />
                    <ToggleRow
                        label="Animations"
                        description="Particle effects and transitions"
                        value={motionEnabled}
                        onChange={toggleMotion}
                        color="var(--purple)"
                    />
                </div>

                {/* Account */}
                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--dark-gray)',
                        padding: '4px 20px 16px',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', padding: '12px 0', letterSpacing: 2 }}>
                        ACCOUNT
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 0',
                            borderBottom: '1px solid var(--dark-gray)',
                        }}
                    >
                        <div>
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 9, color: 'var(--white)' }}>
                                Player Name
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>
                                Currently: {name}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '14px 0' }}>
                        <div style={{ fontFamily: 'var(--font-game)', fontSize: 9, color: 'var(--red)', marginBottom: 8 }}>
                            Danger Zone
                        </div>
                        <AnimatePresence>
                            {!showResetConfirm ? (
                                <motion.button
                                    key="reset"
                                    onClick={() => setShowResetConfirm(true)}
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 11,
                                        color: 'var(--red)',
                                        background: 'none',
                                        border: '1px solid var(--red)',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        width: '100%',
                                    }}
                                >
                                    🗑️ Reset All Progress
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        background: '#FF444411',
                                        border: '1px solid var(--red)',
                                        padding: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--white)' }}>
                                        This will erase all XP, badges, items, and zone progress. Are you sure?
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => {
                                                SoundFX.negativeReact();
                                                resetProgress();
                                                setShowResetConfirm(false);
                                            }}
                                            style={{
                                                flex: 1,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 11,
                                                color: 'var(--white)',
                                                background: 'var(--red)',
                                                border: 'none',
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Yes, Reset
                                        </button>
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            style={{
                                                flex: 1,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 11,
                                                color: 'var(--gray)',
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--dark-gray)',
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* About */}
                <div
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--dark-gray)',
                        padding: 20,
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--gold)', marginBottom: 6 }}>
                        VISION QUEST: THE WATCHING WORLD
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)' }}>
                        v1.0.0 • Powered by Gemini AI + Vision Agents SDK
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dark-gray)', marginTop: 4 }}>
                        © 2026 The Watching World
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
