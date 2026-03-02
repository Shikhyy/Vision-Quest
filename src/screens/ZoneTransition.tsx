import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getZoneById } from '../assets/zones';
import { SoundFX } from '../audio/soundManager';

export default function ZoneTransition() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const transitionZone = useGameStore((s) => s.transitionZone);
    const [textIndex, setTextIndex] = useState(0);

    const zone = transitionZone ? getZoneById(transitionZone) : null;

    // Auto-advance after lore text is shown
    useEffect(() => {
        if (!zone) {
            navigateTo('village-map');
            return;
        }

        SoundFX.zoneEnter();

        const loreWords = zone.loreText.split(' ');
        const wordTimer = setInterval(() => {
            setTextIndex((prev) => {
                if (prev >= loreWords.length) {
                    clearInterval(wordTimer);
                    return prev;
                }
                return prev + 1;
            });
        }, 80);

        // Auto-navigate after animation
        const navTimer = setTimeout(() => {
            navigateTo('npc-encounter');
        }, Math.max(4000, loreWords.length * 80 + 1500));

        return () => {
            clearInterval(wordTimer);
            clearTimeout(navTimer);
        };
    }, [zone, navigateTo]);

    if (!zone) return null;

    const loreWords = zone.loreText.split(' ');
    const displayedText = loreWords.slice(0, textIndex).join(' ');

    return (
        <div
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Zone color ambiance — layered */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse at 50% 80%, ${zone.color}18, transparent 55%),
                        radial-gradient(ellipse at 50% 20%, ${zone.color}08, transparent 50%)
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Atmospheric grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(${zone.color}05 1px, transparent 1px),
                        linear-gradient(90deg, ${zone.color}05 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px',
                    pointerEvents: 'none',
                    opacity: 0.6,
                }}
            />

            {/* Walking pixel dots (decorative) */}
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    bottom: '30%',
                    display: 'flex',
                    gap: 4,
                }}
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 4,
                            height: 4,
                            background: zone.color,
                            boxShadow: `0 0 6px ${zone.color}`,
                            animation: `npc-bob ${0.5 + i * 0.1}s ease-in-out infinite`,
                        }}
                    />
                ))}
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                    maxWidth: 500,
                    padding: '0 24px',
                    zIndex: 1,
                }}
            >
                {/* Zone icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                    style={{
                        fontSize: 72,
                        filter: `drop-shadow(0 0 20px ${zone.color}44)`,
                    }}
                >
                    {zone.icon}
                </motion.div>

                {/* Zone name */}
                <h2
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 18,
                        color: zone.color,
                        textShadow: `0 0 18px ${zone.color}55, 0 0 36px ${zone.color}22`,
                        letterSpacing: 4,
                        textAlign: 'center',
                    }}
                >
                    {zone.name.toUpperCase()}
                </h2>

                {/* Lore text (typewriter) */}
                <p
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: '#aaa',
                        lineHeight: 2,
                        textAlign: 'center',
                        minHeight: 120,
                    }}
                >
                    {displayedText}
                    {textIndex < loreWords.length && (
                        <span style={{ color: zone.color, animation: 'typewriter-cursor 0.7s infinite' }}>▌</span>
                    )}
                </p>

                {/* NPC name */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: textIndex >= loreWords.length ? 1 : 0, scale: textIndex >= loreWords.length ? 1 : 0.9 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 12,
                        color: zone.color,
                        border: `1px solid ${zone.color}33`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 20px',
                        background: `${zone.color}08`,
                        backdropFilter: 'blur(8px)',
                        textShadow: `0 0 10px ${zone.color}44`,
                        letterSpacing: 2,
                    }}
                >
                    {zone.npcName} AWAITS...
                </motion.div>
            </motion.div>

            {/* Skip hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.5 }}
                onClick={() => navigateTo('npc-encounter')}
                style={{
                    position: 'absolute',
                    bottom: 28,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--gray)',
                    cursor: 'pointer',
                    letterSpacing: 1,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid transparent',
                    transition: 'border-color 0.2s ease',
                }}
                whileHover={{ opacity: 0.8, borderColor: 'var(--dark-gray)' }}
            >
                Click to skip →
            </motion.div>
        </div>
    );
}
