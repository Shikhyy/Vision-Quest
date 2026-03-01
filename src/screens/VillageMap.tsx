import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

// ── Premium Zone Card Component ──
function ZoneCard({ zone, index }: { zone: ZoneConfig; index: number }) {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.3 + index * 0.15, type: 'spring', stiffness: 100, damping: 15 }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 300,
                height: 480,
                borderRadius: 24,
                position: 'relative',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transformStyle: 'preserve-3d',
                perspective: 1000,
                zIndex: hovered ? 10 : 1,
            }}
        >
            <motion.div
                animate={{
                    scale: hovered ? 1.05 : 1,
                    y: hovered ? -10 : 0,
                    boxShadow: hovered
                        ? `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${zone.color}66, inset 0 0 20px ${zone.color}44`
                        : `0 10px 30px rgba(0,0,0,0.5), inset 0 0 0px ${zone.color}00`,
                    borderColor: hovered ? zone.color : 'rgba(255,255,255,0.1)'
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 24,
                    background: isUnlocked
                        ? `linear-gradient(180deg, rgba(15,15,20,0.9) 0%, rgba(20,20,30,0.85) 100%)`
                        : `linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.98) 100%)`,
                    border: '1px solid',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '30px 20px',
                    backdropFilter: 'blur(16px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background ambient glow inside card */}
                <motion.div
                    animate={{ opacity: hovered ? 0.8 : 0.2 }}
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-20%',
                        width: '140%',
                        height: '140%',
                        background: `radial-gradient(circle at 50% 0%, ${zone.color}33, transparent 60%)`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Character Icon / Emoji */}
                <motion.div
                    animate={{
                        scale: hovered ? 1.2 : 1,
                        y: hovered && !isCompleted ? [0, -5, 0] : 0
                    }}
                    transition={hovered ? { y: { repeat: Infinity, duration: 2 } } : {}}
                    style={{
                        fontSize: 80,
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: isUnlocked ? `drop-shadow(0 0 20px ${zone.color}88)` : 'grayscale(100%) opacity(30%)',
                        marginBottom: 20,
                        zIndex: 2,
                    }}
                >
                    {zone.icon}
                </motion.div>

                {/* Status Badge */}
                {isCompleted && (
                    <div style={{
                        position: 'absolute',
                        top: 20, right: 20,
                        background: 'var(--green)',
                        color: '#000',
                        fontSize: 10,
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: 12,
                        boxShadow: '0 0 15px #00FF88',
                        letterSpacing: 1
                    }}>
                        COMPLETED
                    </div>
                )}

                {/* Lock Overlay */}
                {!isUnlocked && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(5,5,10,0.6)',
                        zIndex: 10,
                    }}>
                        <span style={{ fontSize: 40, marginBottom: 10, filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.8))' }}>🔒</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#888', letterSpacing: 2 }}>UNLOCK LV. {zone.unlockLevel}</span>
                    </div>
                )}

                {/* Zone Info */}
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 12 }}>
                    <div style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 14,
                        color: isUnlocked ? zone.color : '#555',
                        textShadow: isUnlocked ? `0 0 10px ${zone.color}88` : 'none',
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                    }}>
                        {zone.name}
                    </div>

                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 18,
                        color: isUnlocked ? '#FFF' : '#666',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                    }}>
                        {zone.npcName}
                    </div>

                    <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: isUnlocked ? '#AAA' : '#444',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        height: 60,
                        marginTop: 10,
                    }}>
                        {zone.description}
                    </p>

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginTop: 'auto',
                        paddingTop: 20,
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: '#888',
                    }}>
                        <span style={{ color: isUnlocked ? 'var(--gold)' : '#555' }}>
                            {isUnlocked ? `✦ ${zone.xpReward} XP` : '???'}
                        </span>
                        <span style={{ color: isUnlocked ? '#DDD' : '#444' }}>
                            {isUnlocked ? `${'★'.repeat(zone.difficulty)}${'☆'.repeat(5 - zone.difficulty)}` : '☆☆☆☆☆'}
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <motion.div
                    animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 20 }}
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        background: zone.color,
                        color: '#000',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 'bold',
                        padding: '10px 24px',
                        borderRadius: 20,
                        boxShadow: `0 0 20px ${zone.color}`,
                        pointerEvents: 'none',
                        letterSpacing: 1,
                        zIndex: 3,
                    }}
                >
                    ENTER REALM
                </motion.div>
            </motion.div>
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
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const nebula1X = useTransform(smoothMouseX, v => v * -1.5);
    const nebula1Y = useTransform(smoothMouseY, v => v * -1.5);
    const nebula2X = useTransform(smoothMouseX, v => v * -0.8);
    const nebula2Y = useTransform(smoothMouseY, v => v * -0.8);
    const gridX = useTransform(smoothMouseX, v => v * -0.3);
    const gridY = useTransform(smoothMouseY, v => v * -0.3);

    // Start ambient village music on mount
    useEffect(() => {
        startAmbientMusic('village');
        return () => stopAmbientMusic();
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20; // -10 to 10
        const y = (clientY / window.innerHeight - 0.5) * 20;
        mouseX.set(x);
        mouseY.set(y);
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
            {/* ── Retro Synthwave Background ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, #050510 0%, #1a0b2e 55%, #050510 100%)',
                pointerEvents: 'none',
            }} />

            {/* Glowing Horizon Line */}
            <div style={{
                position: 'absolute',
                top: '45%', // Aligns with the Tower node
                left: 0,
                right: 0,
                height: 2,
                background: 'rgba(0, 212, 255, 0.5)',
                boxShadow: '0 0 20px 5px rgba(0, 212, 255, 0.4), 0 0 40px 10px rgba(123, 47, 190, 0.4)',
                zIndex: 1,
            }} />

            {/* Bottom Moving Grid */}
            <div style={{
                position: 'absolute',
                top: '45%',
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                perspective: '1000px',
                zIndex: 1,
            }}>
                <motion.div
                    animate={{ backgroundPositionY: [0, 60] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        inset: '-100% -100% 0 -100%',
                        backgroundImage: `
                            linear-gradient(90deg, rgba(0, 212, 255, 0.15) 1px, transparent 1px),
                            linear-gradient(rgba(0, 212, 255, 0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                        transform: 'rotateX(75deg) translateZ(0)',
                        transformOrigin: 'top center',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* ── Animated stars (Top Half) ── */}
            <div style={{ position: 'absolute', inset: '0 0 55% 0', zIndex: 1, overflow: 'hidden' }}>
                {Array.from({ length: 80 }).map((_, i) => (
                    <Star key={i} delay={i * 0.1} />
                ))}
            </div>

            {/* ── Nebula glow accents ── */}
            <motion.div
                style={{
                    x: nebula1X, y: nebula1Y,
                    position: 'absolute',
                    left: '20%', top: '25%',
                    width: 350, height: 350,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #7B2FBE1A, transparent 70%)',
                    filter: 'blur(60px)',
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />
            <motion.div
                style={{
                    x: nebula2X, y: nebula2Y,
                    position: 'absolute',
                    right: '20%', top: '20%',
                    width: 300, height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #00D4FF1A, transparent 70%)',
                    filter: 'blur(50px)',
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />

            {/* ── Grid overlay ── */}
            <motion.div
                style={{
                    x: gridX, y: gridY,
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
                    top: 40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    zIndex: 20,
                    pointerEvents: 'none',
                }}
            >
                <h2
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 24,
                        background: 'linear-gradient(135deg, #00D4FF, #7B2FBE)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: 8,
                        textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                    }}
                >
                    THE VILLAGE
                </h2>
                <p
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--gray)',
                        marginTop: 8,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        opacity: 0.8,
                    }}
                >
                    Choose your destiny
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
                    <linearGradient id="path-grad-1" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="path-grad-2" x1="100%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#FF4444" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Tavern to Tower */}
                <line x1="30%" y1="70%" x2="50%" y2="45%" stroke="url(#path-grad-1)" strokeWidth="2" strokeDasharray="8 6">
                    <animate attributeName="stroke-dashoffset" values="14;0" dur="1.5s" repeatCount="indefinite" />
                </line>

                {/* Forest to Tower */}
                <line x1="70%" y1="70%" x2="50%" y2="45%" stroke="url(#path-grad-2)" strokeWidth="2" strokeDasharray="8 6">
                    <animate attributeName="stroke-dashoffset" values="14;0" dur="1.5s" repeatCount="indefinite" />
                </line>
            </svg>

            {/* ── Premium Card Flex Layout ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 40,
                zIndex: 10,
                perspective: 1500,
            }}>
                {ZONES.map((zone, i) => (
                    <ZoneCard key={zone.id} zone={zone} index={i} />
                ))}
            </div>

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
