import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useChallengeStore } from '../store/challengeStore';
import { getZoneById } from '../assets/zones';
import { BADGES } from '../assets/badges';
import { ITEMS } from '../assets/items';
import { SoundFX } from '../audio/soundManager';

// Pre-generated confetti data - richer burst
const CONFETTI_COLORS = ['#FFB800', '#00D4FF', '#00FF88', '#7B2FBE', '#FF4444', '#FFFFFF'];
const CONFETTI_DATA = Array.from({ length: 30 }, (_, i) => ({
    x: (Math.random() - 0.5) * 500,
    duration: 1.8 + Math.random() * 1.2,
    size: 4 + Math.random() * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
}));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional run-once on mount to award rewards
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
            {/* Celebration ambiance — layered radial glow */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse at 50% 30%, ${zone.color}18, transparent 50%),
                        radial-gradient(ellipse at 30% 70%, var(--gold-dim), transparent 55%),
                        radial-gradient(ellipse at 70% 60%, var(--purple-dim), transparent 55%)
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Confetti burst */}
            {CONFETTI_DATA.map((c, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        y: -350 - Math.random() * 100,
                        x: c.x,
                        rotate: c.rotation,
                        scale: [1, 1.2, 0.8, 0],
                    }}
                    transition={{ delay: c.delay + i * 0.08, duration: c.duration, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: '60%',
                        left: '50%',
                        width: c.size,
                        height: c.size,
                        background: c.color,
                        borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
                        pointerEvents: 'none',
                        boxShadow: `0 0 6px ${c.color}66`,
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
                    gap: 28,
                    maxWidth: 520,
                    padding: 36,
                    zIndex: 1,
                }}
            >
                {/* Title */}
                <motion.h2
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 22,
                        color: 'var(--green)',
                        textShadow: '0 0 20px #00FF8844, 0 0 40px #00FF8822',
                        letterSpacing: 3,
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
                            initial={{ opacity: 0, scale: 0.3, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                            style={{
                                fontFamily: 'var(--font-game)',
                                fontSize: 32,
                                color: 'var(--gold)',
                                textShadow: '0 0 24px #FFB80066, 0 0 48px #FFB80033',
                                letterSpacing: 2,
                            }}
                        >
                            +{xpAnimated} XP
                        </motion.div>
                    )}

                    {/* Badge */}
                    {step >= 2 && zoneBadge && (
                        <motion.div
                            key="badge"
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 150, damping: 14 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 10,
                                background: 'var(--bg-glass)',
                                padding: '20px 28px',
                                borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${zone.color}33`,
                                backdropFilter: 'blur(12px)',
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', letterSpacing: 3 }}>
                                BADGE EARNED
                            </div>
                            <div
                                className="badge badge-rare"
                                style={{
                                    fontSize: 16,
                                    padding: '14px 24px',
                                    borderColor: zone.color,
                                    boxShadow: `0 0 20px ${zone.color}44, inset 0 0 10px ${zone.color}11`,
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <span style={{ fontSize: 24 }}>{zoneBadge.emoji}</span>
                                <span style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: zone.color }}>
                                    {zoneBadge.name}
                                </span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)', textAlign: 'center', maxWidth: 300 }}>
                                {zoneBadge.description}
                            </div>
                        </motion.div>
                    )}

                    {/* Item */}
                    {step >= 3 && itemReward && (
                        <motion.div
                            key="item"
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 150, damping: 14 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                background: 'var(--bg-glass)',
                                padding: '20px 28px',
                                borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${itemReward.rarity === 'legendary' ? 'var(--gold)' : itemReward.rarity === 'rare' ? 'var(--cyan)' : 'var(--dark-gray)'}33`,
                                backdropFilter: 'blur(12px)',
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', letterSpacing: 3 }}>
                                ITEM FOUND
                            </div>
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    fontSize: 40,
                                    padding: 12,
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${itemReward.rarity === 'legendary' ? 'var(--gold)' : itemReward.rarity === 'rare' ? 'var(--cyan)' : 'var(--gray)'}`,
                                    boxShadow: itemReward.rarity === 'legendary'
                                        ? 'var(--glow-gold)'
                                        : itemReward.rarity === 'rare'
                                            ? 'var(--glow-cyan)'
                                            : 'none',
                                    background: 'var(--bg-secondary)',
                                }}
                            >
                                {itemReward.icon}
                            </motion.div>
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--white)' }}>
                                {itemReward.name}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
                                {itemReward.description}
                            </div>
                        </motion.div>
                    )}

                    {/* Farewell */}
                    {step >= 4 && (
                        <motion.div
                            key="farewell"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 20,
                                marginTop: 8,
                            }}
                        >
                            <div
                                className="dialogue-box"
                                style={{
                                    borderColor: zone.color,
                                    maxWidth: 420,
                                    borderRadius: 'var(--radius-md)',
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                <p style={{ fontFamily: 'var(--font-game)', fontSize: 9, lineHeight: 2.2, textAlign: 'center' }}>
                                    {farewells[zone.id]}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <motion.button
                                    className="btn-neon btn-neon-green"
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
