import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useChallengeStore } from '../store/challengeStore';
import { getZoneById } from '../assets/zones';
import { BADGES } from '../assets/badges';
import { ITEMS } from '../assets/items';
import { SoundFX } from '../audio/soundManager';

export default function RewardScreen() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const transitionZone = useGameStore((s) => s.transitionZone);
    const activeZone = useChallengeStore((s) => s.activeZone);
    const addBadge = usePlayerStore((s) => s.addBadge);
    const addItem = usePlayerStore((s) => s.addItem);
    const playerName = usePlayerStore((s) => s.name);


    const zone = getZoneById(transitionZone || activeZone || '');
    const [step, setStep] = useState(0);
    const [xpAnimated, setXpAnimated] = useState(0);
    const addXP = usePlayerStore((s) => s.addXP);
    const completeZone = usePlayerStore((s) => s.completeZone);

    // Find the badge for this zone
    const zoneBadge = BADGES.find((b) => b.zone === zone?.id && b.id !== 'zone_clear');
    const itemReward = zoneBadge?.itemReward ? ITEMS[zoneBadge.itemReward] : null;

    // Award badge, item, XP, and mark zone complete
    useEffect(() => {
        if (!zone || !zoneBadge) return;

        // Award XP (triggers level-up detection in App.tsx)
        addXP(zone.xpReward);

        // Mark zone as completed
        completeZone(zone.id);

        addBadge({
            id: zoneBadge.id,
            name: zoneBadge.name,
            emoji: zoneBadge.emoji,
            description: zoneBadge.description,
            earnedAt: new Date(),
            zone: zone.id,
        });

        if (itemReward) {
            addItem(itemReward);
        }
    }, []);

    // Animate XP counter
    useEffect(() => {
        if (!zone) return;
        const target = zone.xpReward;
        let current = 0;
        const increment = Math.ceil(target / 30);

        const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            setXpAnimated(current);
            if (current >= target) clearInterval(timer);
        }, 40);

        return () => clearInterval(timer);
    }, [zone]);

    // Step through reveal with sounds
    useEffect(() => {
        const timers = [
            setTimeout(() => { setStep(1); SoundFX.xpGain(); }, 500),
            setTimeout(() => { setStep(2); SoundFX.badgeEarned(); }, 1500),
            setTimeout(() => { setStep(3); SoundFX.positiveReact(); }, 2500),
            setTimeout(() => setStep(4), 3500),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    if (!zone) {
        navigateTo('village-map');
        return null;
    }

    const farewells: Record<string, string> = {
        jester: `Until next time, ${playerName}! May your smile never fade... unlike mine.`,
        sage: `Go forth with knowledge, ${playerName}. The runes whisper your name now.`,
        shadow: `...you've earned your freedom... for now... I'll be watching, ${playerName}...`,
    };

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
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Celebration ambiance */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 40%, ${zone.color}1A, transparent 60%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* Floating particles as confetti */}
            {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: -300,
                        x: (Math.random() - 0.5) * 400,
                    }}
                    transition={{ delay: i * 0.15, duration: 2 + Math.random(), ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: '60%',
                        left: '50%',
                        width: 8,
                        height: 8,
                        background: [zone.color, 'var(--green)', 'var(--gold)', 'var(--purple)'][i % 4],
                        borderRadius: i % 2 === 0 ? '50%' : '0',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                    maxWidth: 500,
                    padding: 32,
                    zIndex: 1,
                }}
            >
                {/* Title */}
                <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 20,
                        color: 'var(--green)',
                    }}
                    className="text-glow-green"
                >
                    ✦ QUEST COMPLETE ✦
                </motion.h2>

                <AnimatePresence>
                    {/* XP Reward */}
                    {step >= 1 && (
                        <motion.div
                            key="xp"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                fontFamily: 'var(--font-game)',
                                fontSize: 28,
                                color: 'var(--gold)',
                                textShadow: '0 0 20px #FFB80066',
                            }}
                        >
                            +{xpAnimated} XP
                        </motion.div>
                    )}

                    {/* Badge */}
                    {step >= 2 && zoneBadge && (
                        <motion.div
                            key="badge"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)' }}>
                                BADGE EARNED
                            </div>
                            <div
                                className="badge badge-rare"
                                style={{
                                    fontSize: 16,
                                    padding: '12px 20px',
                                    borderColor: zone.color,
                                    boxShadow: `0 0 15px ${zone.color}44`,
                                }}
                            >
                                <span style={{ fontSize: 20 }}>{zoneBadge.emoji}</span>
                                <span style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: zone.color }}>
                                    {zoneBadge.name}
                                </span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                                {zoneBadge.description}
                            </div>
                        </motion.div>
                    )}

                    {/* Item */}
                    {step >= 3 && itemReward && (
                        <motion.div
                            key="item"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)' }}>
                                ITEM FOUND
                            </div>
                            <div
                                style={{
                                    fontSize: 32,
                                    padding: 8,
                                    border: `2px solid ${itemReward.rarity === 'legendary' ? 'var(--gold)' : itemReward.rarity === 'rare' ? 'var(--cyan)' : 'var(--gray)'}`,
                                    boxShadow: itemReward.rarity === 'legendary'
                                        ? 'var(--glow-gold)'
                                        : itemReward.rarity === 'rare'
                                            ? 'var(--glow-cyan)'
                                            : 'none',
                                }}
                            >
                                {itemReward.icon}
                            </div>
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 9, color: 'var(--white)' }}>
                                {itemReward.name}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', textAlign: 'center', maxWidth: 300 }}>
                                {itemReward.description}
                            </div>
                        </motion.div>
                    )}

                    {/* Farewell */}
                    {step >= 4 && (
                        <motion.div
                            key="farewell"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 16,
                                marginTop: 8,
                            }}
                        >
                            <div
                                className="dialogue-box"
                                style={{ borderColor: zone.color, maxWidth: 400 }}
                            >
                                <p style={{ fontFamily: 'var(--font-game)', fontSize: 9, lineHeight: 2 }}>
                                    {farewells[zone.id]}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <motion.button
                                    className="btn-neon"
                                    onClick={() => {
                                        SoundFX.click();
                                        useChallengeStore.getState().resetChallenge();
                                        navigateTo('village-map');
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    ← RETURN TO MAP
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
