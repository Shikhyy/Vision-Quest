// ═══════════════════════════════════════════
// LevelUpOverlay — Fullscreen celebration on level-up
// ═══════════════════════════════════════════
// Displays a dramatic level-up animation with particle effects
// when the player gains enough XP to advance.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundFX } from '../audio/soundManager';

interface LevelUpOverlayProps {
    prevLevel: number;
    newLevel: number;
    newTitle: string;
    onComplete: () => void;
}

export default function LevelUpOverlay({ prevLevel, newLevel, newTitle, onComplete }: LevelUpOverlayProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        SoundFX.badgeEarned();
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 500);
        }, 3500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                    }}
                    onClick={() => {
                        setVisible(false);
                        setTimeout(onComplete, 300);
                    }}
                >
                    {/* Radiating rings */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0.3, opacity: 0.6 }}
                            animate={{ scale: 3 + i, opacity: 0 }}
                            transition={{ delay: i * 0.3, duration: 2, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                border: '2px solid var(--gold)',
                                pointerEvents: 'none',
                            }}
                        />
                    ))}

                    {/* Particle burst */}
                    {Array.from({ length: 20 }).map((_, i) => {
                        const angle = (i / 20) * Math.PI * 2;
                        const dist = 100 + Math.random() * 150;
                        return (
                            <motion.div
                                key={`p-${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: Math.cos(angle) * dist,
                                    y: Math.sin(angle) * dist,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                transition={{ delay: 0.2, duration: 1.2 + Math.random() * 0.5, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    width: 6 + Math.random() * 6,
                                    height: 6 + Math.random() * 6,
                                    background: ['var(--gold)', 'var(--cyan)', 'var(--purple)', '#00FF88', 'var(--white)'][i % 5],
                                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                                    pointerEvents: 'none',
                                }}
                            />
                        );
                    })}

                    {/* Level number */}
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                        style={{
                            fontFamily: 'var(--font-game)',
                            fontSize: 72,
                            color: 'var(--gold)',
                            textShadow: '0 0 30px #FFB80088, 0 0 60px #FFB80044',
                            lineHeight: 1,
                        }}
                    >
                        {newLevel}
                    </motion.div>

                    {/* LEVEL UP text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            fontFamily: 'var(--font-game)',
                            fontSize: 14,
                            color: 'var(--gold)',
                            letterSpacing: 8,
                            marginTop: 12,
                        }}
                    >
                        LEVEL UP
                    </motion.div>

                    {/* New title */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--cyan)',
                            marginTop: 8,
                        }}
                    >
                        New Title: {newTitle}
                    </motion.div>

                    {/* Previous level indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1.5 }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--gray)',
                            marginTop: 16,
                        }}
                    >
                        Lv.{prevLevel} → Lv.{newLevel}
                    </motion.div>

                    {/* Tap to continue */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0.3] }}
                        transition={{ delay: 2.5, duration: 2, repeat: Infinity }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--dark-gray)',
                            marginTop: 32,
                        }}
                    >
                        tap to continue
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
