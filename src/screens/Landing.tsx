import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SoundFX } from '../audio/soundManager';

// ── Animated Eye Component ──
function WatchingEye({
    x, y, color, delay, size = 40
}: {
    x: number; y: number; color: string; delay: number; size?: number
}) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const eyeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!eyeRef.current) return;
            const rect = eyeRef.current.getBoundingClientRect();
            const eyeX = rect.left + rect.width / 2;
            const eyeY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
            const distance = Math.min(size * 0.15, 6);
            setMousePos({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [size]);

    return (
        <motion.div
            ref={eyeRef}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, type: 'spring' }}
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size * 0.6,
                background: '#111',
                borderRadius: '50%',
                border: `2px solid ${color}`,
                boxShadow: `0 0 15px ${color}66, 0 0 30px ${color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Pupil */}
            <motion.div
                animate={{ x: mousePos.x, y: mousePos.y }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                    width: size * 0.35,
                    height: size * 0.35,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                }}
            />
        </motion.div>
    );
}

// ── Floating Particles ──
function FloatingParticle({ delay }: { delay: number }) {
    const x = Math.random() * 100;
    const duration = 3 + Math.random() * 4;

    return (
        <motion.div
            initial={{ opacity: 0, y: '100vh', x: `${x}vw` }}
            animate={{ opacity: [0, 0.6, 0], y: '-10vh' }}
            transition={{ delay, duration, repeat: Infinity, ease: 'linear' }}
            style={{
                position: 'absolute',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: '#00D4FF',
                boxShadow: '0 0 6px #00D4FF',
                pointerEvents: 'none',
            }}
        />
    );
}

// ── Village Silhouette ──
function VillageSilhouette() {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 200' preserveAspectRatio='none'>
        <path d='M0,200 L0,150 Q150,100 300,140 T600,120 T1000,150 L1000,200 Z' fill='#050508'/>
        <path d='M0,200 L0,170 Q100,140 250,160 T550,150 T1000,170 L1000,200 Z' fill='#08080C'/>
        <rect x='150' y='110' width='30' height='60' fill='#0a0a0f'/>
        <polygon points='165,70 140,110 190,110' fill='#0a0a0f'/>
        <rect x='250' y='140' width='40' height='30' fill='#0a0a0f'/>
        <polygon points='270,120 240,140 300,140' fill='#0a0a0f'/>
        <rect x='265' y='150' width='10' height='10' fill='#ffb800' opacity='0.5'/>
        <rect x='600' y='90' width='40' height='80' fill='#0a0a0f'/>
        <polygon points='620,40 580,90 660,90' fill='#0a0a0f'/>
        <rect x='615' y='110' width='10' height='20' fill='#00d4ff' opacity='0.5'/>
        <rect x='750' y='130' width='50' height='40' fill='#0a0a0f'/>
        <polygon points='775,100 740,130 810,130' fill='#0a0a0f'/>
        <rect x='770' y='150' width='10' height='10' fill='#ff4444' opacity='0.5'/>
        <polygon points='400,130 380,170 420,170' fill='#08080c'/>
        <polygon points='400,110 385,140 415,140' fill='#08080c'/>
        <polygon points='850,140 830,170 870,170' fill='#08080c'/>
        <polygon points='850,120 835,150 865,150' fill='#08080c'/>
    </svg>
    `;
    const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '25vh',
            backgroundImage: `url("${encodedSvg}")`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
            zIndex: 1,
            pointerEvents: 'none',
            opacity: 0.9,
        }} />
    );
}

// ── Main Landing Page ──
export default function Landing() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const eyes = [
        { x: 15, y: 25, color: '#FFB800', delay: 0.3, size: 48 },   // Jester
        { x: 75, y: 20, color: '#FFB800', delay: 0.5, size: 36 },   // Jester
        { x: 50, y: 15, color: '#00D4FF', delay: 0.8, size: 52 },   // Sage
        { x: 30, y: 60, color: '#00D4FF', delay: 1.0, size: 40 },   // Sage
        { x: 85, y: 55, color: '#FF4444', delay: 1.3, size: 56 },   // Shadow
        { x: 10, y: 70, color: '#FF4444', delay: 1.5, size: 44 },   // Shadow
        { x: 60, y: 75, color: '#7B2FBE', delay: 1.8, size: 38 },   // Purple
        { x: 40, y: 40, color: '#FF4444', delay: 2.0, size: 32 },   // Shadow small
    ];

    return (
        <div
            className="game-cursor"
            style={{
                width: '100%',
                height: '100vh',
                background: 'radial-gradient(ellipse at 50% 30%, #111118 0%, #0A0A0A 60%, #050508 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Floating Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <FloatingParticle key={i} delay={i * 0.3} />
            ))}

            {/* Watching Eyes */}
            {eyes.map((eye, i) => (
                <WatchingEye key={i} {...eye} />
            ))}

            {/* Vignette */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 40%, #0A0A0A 100%)',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />

            <VillageSilhouette />

            {/* Content */}
            <AnimatePresence>
                {showContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                            position: 'relative',
                            zIndex: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 24,
                            textAlign: 'center',
                            padding: '0 24px',
                        }}
                    >
                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            style={{
                                fontFamily: 'var(--font-game)',
                                fontSize: 'clamp(24px, 5vw, 48px)',
                                background: 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 50%, #FFB800 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.4,
                                letterSpacing: 2,
                            }}
                        >
                            VISION QUEST
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'clamp(12px, 2vw, 18px)',
                                color: '#888',
                                letterSpacing: 4,
                                textTransform: 'uppercase',
                            }}
                        >
                            The Watching World
                        </motion.p>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                            style={{
                                maxWidth: 500,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                                The NPCs can <span style={{ color: '#00D4FF' }}>see</span> you.
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                                They <span style={{ color: '#FFB800' }}>watch</span> your face, your gestures, your objects.
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                                <span style={{ color: '#7B2FBE' }}>Talk</span> to them using your microphone.
                            </p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                                They <span style={{ color: '#FF4444' }}>react</span> to everything you do and say.
                            </p>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3, duration: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { SoundFX.click(); navigateTo('camera-setup'); }}
                            className="btn-neon"
                            aria-label="Start the mission"
                            style={{ marginTop: 16 }}
                        >
                            ▶ START MISSION
                        </motion.button>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ delay: 1.6 }}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: '#555',
                                marginTop: 24,
                            }}
                        >
                            Powered by Vision AI • Camera required • Best on desktop
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
