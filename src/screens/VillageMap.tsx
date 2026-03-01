import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { ZONES } from '../assets/zones';
import { SoundFX, startAmbientMusic, stopAmbientMusic } from '../audio/soundManager';
import type { ZoneConfig } from '../types';

// ── Animated Star ──
function Star({ delay }: { delay: number }) {
    const size = 1 + Math.random() * 2;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.3, 0.8, 0] }}
            transition={{ delay, duration: 3 + Math.random() * 4, repeat: Infinity }}
            style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: ['#00D4FF', '#FFB800', '#FF4444', '#7B2FBE', '#00FF88', '#FFFFFF'][Math.floor(Math.random() * 6)],
                boxShadow: `0 0 ${size * 3}px currentColor`,
                pointerEvents: 'none',
            }}
        />
    );
}

// ── Zone Node Component ──
function ZoneNode({ zone, index }: { zone: ZoneConfig; index: number }) {
    const startZoneTransition = useGameStore((s) => s.startZoneTransition);
    const zonesCompleted = usePlayerStore((s) => s.zonesCompleted);
    const playerLevel = usePlayerStore((s) => s.level);
    const [hovered, setHovered] = useState(false);

    const isCompleted = zonesCompleted.includes(zone.id);
    const isUnlocked = playerLevel >= zone.unlockLevel;

    const handleClick = () => {
        if (!isUnlocked) return;
        SoundFX.click();
        startZoneTransition(zone.id);
    };

    // Better radial positioning for map feel
    const positions = [
        { left: '22%', top: '42%' },   // Jester - Tavern (left)
        { left: '50%', top: '25%' },   // Sage - Tower (top center)
        { left: '78%', top: '48%' },   // Shadow - Forest (right)
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.2, type: 'spring', stiffness: 150 }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'absolute',
                ...positions[index],
                transform: 'translate(-50%, -50%)',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                opacity: isUnlocked ? 1 : 0.35,
                zIndex: 10,
            }}
        >
            {/* Glow ring behind node */}
            <motion.div
                animate={{
                    boxShadow: hovered && isUnlocked
                        ? `0 0 30px ${zone.color}88, 0 0 60px ${zone.color}44, 0 0 90px ${zone.color}22`
                        : `0 0 15px ${zone.color}44, 0 0 30px ${zone.color}22`,
                }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                }}
            />

            {/* Zone Icon Node */}
            <motion.div
                whileHover={isUnlocked ? { scale: 1.12, y: -6 } : {}}
                whileTap={isUnlocked ? { scale: 0.93 } : {}}
                style={{
                    width: 88,
                    height: 88,
                    background: `radial-gradient(circle at 40% 35%, ${zone.color}33, ${zone.color}0A, var(--bg-secondary))`,
                    border: `3px solid ${isCompleted ? 'var(--green)' : zone.color}`,
                    borderRadius: isCompleted ? '16px' : '50%',
                    boxShadow: isCompleted
                        ? '0 0 20px #00FF8844, 0 0 40px #00FF8822, inset 0 0 15px #00FF8811'
                        : `0 0 20px ${zone.color}44, 0 0 40px ${zone.color}22, inset 0 0 15px ${zone.color}11`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 38,
                    position: 'relative',
                    transition: 'border-radius 0.3s, border-color 0.3s',
                }}
                className={isUnlocked && !isCompleted ? 'animate-pulse-neon' : ''}
            >
                {zone.icon}

                {/* Completion badge */}
                {isCompleted && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 24,
                            height: 24,
                            background: 'var(--green)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: 'var(--bg-primary)',
                            boxShadow: '0 0 10px #00FF88',
                        }}
                    >
                        ✓
                    </motion.div>
                )}

                {/* Lock overlay */}
                {!isUnlocked && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.75)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            backdropFilter: 'blur(2px)',
                        }}
                    >
                        🔒
                    </div>
                )}
            </motion.div>

            {/* Zone Name */}
            <div
                style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: 9,
                    color: zone.color,
                    textAlign: 'center',
                    textShadow: `0 0 12px ${zone.color}88`,
                    lineHeight: 1.6,
                    maxWidth: 120,
                    letterSpacing: 1,
                }}
            >
                {zone.name}
            </div>

            {/* NPC Name */}
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--gray)',
                    textAlign: 'center',
                }}
            >
                {zone.npcName}
            </div>

            {/* Stats */}
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--dark-gray)',
                }}
            >
                <span style={{ color: 'var(--gold)' }}>{zone.xpReward} XP</span>
                <span>{'★'.repeat(zone.difficulty)}{'☆'.repeat(5 - zone.difficulty)}</span>
            </div>

            {/* Hover tooltip */}
            {hovered && isUnlocked && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: zone.color,
                        background: 'rgba(10,10,10,0.9)',
                        border: `1px solid ${zone.color}44`,
                        padding: '6px 12px',
                        maxWidth: 180,
                        textAlign: 'center',
                        lineHeight: 1.6,
                    }}
                >
                    {isCompleted ? '✓ Completed — Replay?' : zone.description}
                </motion.div>
            )}
        </motion.div>
    );
}

// ── Player Card ──
function PlayerCard() {
    const { name, level, xp, xpToNext, title, zonesCompleted, badges } = usePlayerStore();
    const navigateTo = useGameStore((s) => s.navigateTo);

    const xpProgress = xpToNext > 0 ? Math.max(0, 1 - xpToNext / (xp + xpToNext)) * 100 : 100;

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            onClick={() => { SoundFX.click(); navigateTo('player-profile'); }}
            whileHover={{ scale: 1.02 }}
            style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(10, 10, 10, 0.92)',
                border: '2px solid var(--cyan)',
                boxShadow: '0 0 15px #00D4FF22, inset 0 0 20px rgba(0,0,0,0.5)',
                padding: '16px 20px',
                minWidth: 220,
                cursor: 'pointer',
                zIndex: 20,
                backdropFilter: 'blur(8px)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Name & Level */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--gold)', textShadow: '0 0 8px #FFB80044' }}>
                        {name || 'Traveler'}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 9,
                        color: 'var(--cyan)',
                        background: '#00D4FF11',
                        padding: '2px 8px',
                        border: '1px solid #00D4FF33',
                    }}>
                        Lv.{level}
                    </span>
                </div>

                {/* Title */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--purple)', opacity: 0.8 }}>
                    {title}
                </div>

                {/* XP Bar */}
                <div>
                    <div className="progress-bar" style={{ height: 10, background: '#111' }}>
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${xpProgress}%`,
                                background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gray)', marginTop: 4 }}>
                        <span>{xp} XP</span>
                        <span>{xpToNext > 0 ? `${xpToNext} to next` : 'MAX'}</span>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--gray)',
                    paddingTop: 6,
                    borderTop: '1px solid var(--dark-gray)',
                }}>
                    <span>🗺️ {zonesCompleted.length}/3</span>
                    <span>🏅 {badges.length}</span>
                    <span style={{ color: 'var(--cyan)', fontSize: 9 }}>VIEW →</span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Village Map ──
export default function VillageMap() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Start ambient village music on mount
    useEffect(() => {
        startAmbientMusic('village');
        return () => stopAmbientMusic();
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20; // -10 to 10
        const y = (clientY / window.innerHeight - 0.5) * 20;
        setMousePos({ x, y });
    };

    return (
        <div
            className="game-cursor"
            onMouseMove={handleMouseMove}
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* ── Deep space background ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                    radial-gradient(ellipse at 30% 20%, #0D1B2A 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 70%, #1B0D2A 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, #0A1628 0%, transparent 70%),
                    var(--bg-primary)
                `,
                pointerEvents: 'none',
            }} />

            {/* ── Animated stars ── */}
            {Array.from({ length: 60 }).map((_, i) => (
                <Star key={i} delay={i * 0.15} />
            ))}

            {/* ── Nebula glow accents ── */}
            <motion.div
                animate={{ x: mousePos.x * -1.5, y: mousePos.y * -1.5 }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                style={{
                    position: 'absolute',
                    left: '15%', top: '30%',
                    width: 300, height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFB8000A, transparent 70%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                }}
            />
            <motion.div
                animate={{ x: mousePos.x * -0.8, y: mousePos.y * -0.8 }}
                transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                style={{
                    position: 'absolute',
                    right: '10%', top: '20%',
                    width: 250, height: 250,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FF44440A, transparent 70%)',
                    filter: 'blur(50px)',
                    pointerEvents: 'none',
                }}
            />
            <motion.div
                animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                style={{
                    position: 'absolute',
                    left: '40%', top: '10%',
                    width: 200, height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #00D4FF0B, transparent 70%)',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                }}
            />

            {/* ── Grid overlay ── */}
            <motion.div
                animate={{ x: mousePos.x * -0.3, y: mousePos.y * -0.3 }}
                transition={{ type: 'spring', stiffness: 100, damping: 30 }}
                style={{
                    position: 'absolute',
                    inset: -20, // slightly larger to prevent edges showing on parallax
                    backgroundImage: `
                        linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }}
            />

            {/* ── Title ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    position: 'absolute',
                    top: 28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    zIndex: 20,
                }}
            >
                <h2
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 18,
                        background: 'linear-gradient(135deg, #00D4FF, #7B2FBE)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: 4,
                    }}
                >
                    THE VILLAGE
                </h2>
                <p
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--gray)',
                        marginTop: 6,
                        letterSpacing: 2,
                    }}
                >
                    Choose your quest, adventurer
                </p>
            </motion.div>

            {/* ── Connecting paths (animated dashed lines) ── */}
            <svg
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 5,
                }}
            >
                <defs>
                    <linearGradient id="path-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="path-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FF4444" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="path-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#FF4444" stopOpacity="0.15" />
                    </linearGradient>
                </defs>

                {/* Tavern → Tower */}
                <line x1="22%" y1="42%" x2="50%" y2="25%" stroke="url(#path-grad-1)" strokeWidth="1.5" strokeDasharray="6 6">
                    <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite" />
                </line>

                {/* Tower → Forest */}
                <line x1="50%" y1="25%" x2="78%" y2="48%" stroke="url(#path-grad-2)" strokeWidth="1.5" strokeDasharray="6 6">
                    <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite" />
                </line>

                {/* Tavern → Forest (subtle) */}
                <line x1="22%" y1="42%" x2="78%" y2="48%" stroke="url(#path-grad-3)" strokeWidth="1" strokeDasharray="4 8">
                    <animate attributeName="stroke-dashoffset" values="0;12" dur="3s" repeatCount="indefinite" />
                </line>

                {/* Center village node */}
                <circle cx="50%" cy="55%" r="4" fill="#7B2FBE" opacity="0.5">
                    <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Village label */}
                <text x="50%" y="62%" textAnchor="middle" fill="#7B2FBE" opacity="0.4" fontFamily="Share Tech Mono" fontSize="10">
                    VILLAGE CENTER
                </text>
            </svg>

            {/* ── Zone Nodes ── */}
            {ZONES.map((zone, i) => (
                <ZoneNode key={zone.id} zone={zone} index={i} />
            ))}

            {/* ── Player Card ── */}
            <PlayerCard />

            {/* ── Bottom status bar ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px 24px',
                    background: 'linear-gradient(transparent, rgba(10,10,10,0.9))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 20,
                }}
            >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dark-gray)' }}>
                    Click a zone to begin quest
                </div>
                <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dark-gray)' }}>
                    <span>ESC ← Map</span>
                    <span>P → Profile</span>
                    <span>S → Settings</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#333' }}>
                    Vision Quest v1.0
                </div>
            </motion.div>
        </div>
    );
}
