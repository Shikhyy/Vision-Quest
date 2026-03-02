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
            transition={{ delay, duration: 0.6, type: 'spring' }}
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size * 0.6,
                background: 'rgba(8, 8, 12, 0.9)',
                borderRadius: '50%',
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}44, 0 0 40px ${color}22, inset 0 0 12px ${color}11`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Iris glow ring */}
            <div
                style={{
                    position: 'absolute',
                    width: size * 0.55,
                    height: size * 0.55,
                    borderRadius: '50%',
                    border: `1px solid ${color}33`,
                    pointerEvents: 'none',
                }}
            />
            {/* Pupil */}
            <motion.div
                animate={{ x: mousePos.x, y: mousePos.y }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                    width: size * 0.32,
                    height: size * 0.32,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${color}, ${color}88)`,
                    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}44`,
                }}
            />
        </motion.div>
    );
}

// ── Floating Particles ──
// Pre-generate random particle positions to avoid impure calls during render
const PARTICLE_COLORS = ['#00D4FF', '#7B2FBE', '#FFB800', '#FF4444', '#00FF88'];
const PARTICLE_DATA = Array.from({ length: 30 }, (_, i) => ({
    x: Math.random() * 100,
    duration: 4 + Math.random() * 6,
    size: 1 + Math.random() * 3,
    colorIndex: i % PARTICLE_COLORS.length,
}));

function FloatingParticle({ delay, index }: { delay: number; index: number }) {
    const p = PARTICLE_DATA[index % PARTICLE_DATA.length];
    const color = PARTICLE_COLORS[p.colorIndex];

    return (
        <motion.div
            initial={{ opacity: 0, y: '100vh', x: `${p.x}vw` }}
            animate={{ opacity: [0, 0.7, 0.3, 0], y: '-10vh' }}
            transition={{ delay, duration: p.duration, repeat: Infinity, ease: 'linear' }}
            style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 ${p.size * 3}px ${color}`,
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
        { x: 12, y: 22, color: '#FFB800', delay: 0.3, size: 48 },
        { x: 78, y: 18, color: '#FFB800', delay: 0.5, size: 36 },
        { x: 50, y: 12, color: '#00D4FF', delay: 0.8, size: 56 },
        { x: 28, y: 58, color: '#00D4FF', delay: 1.0, size: 42 },
        { x: 88, y: 52, color: '#FF4444', delay: 1.3, size: 60 },
        { x: 8, y: 68, color: '#FF4444', delay: 1.5, size: 44 },
        { x: 62, y: 72, color: '#7B2FBE', delay: 1.8, size: 38 },
        { x: 38, y: 38, color: '#FF4444', delay: 2.0, size: 30 },
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
            {/* Ambient breathing light */}
            <div
                className="animate-breathe"
                style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    top: '10%',
                    left: '20%',
                    background: 'radial-gradient(circle, #7B2FBE0A 0%, transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(40px)',
                }}
            />
            <div
                className="animate-breathe"
                style={{
                    position: 'absolute',
                    width: '40%',
                    height: '40%',
                    bottom: '20%',
                    right: '10%',
                    background: 'radial-gradient(circle, #00D4FF08 0%, transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(50px)',
                    animationDelay: '2s',
                }}
            />

            {/* Floating Particles */}
            {Array.from({ length: 30 }).map((_, i) => (
                <FloatingParticle key={i} delay={i * 0.25} index={i} />
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
                    background: 'radial-gradient(ellipse at center, transparent 35%, #0A0A0A 100%)',
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
                            gap: 20,
                            textAlign: 'center',
                            padding: '0 24px',
                        }}
                    >
                        {/* Title with Glitch Effect */}
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="glitch"
                            data-text="VISION QUEST"
                            style={{
                                fontFamily: 'var(--font-game)',
                                fontSize: 'clamp(24px, 5vw, 52px)',
                                background: 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 40%, #FFB800 80%, #FF4444 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.4,
                                letterSpacing: 4,
                                filter: 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.15))',
                            }}
                        >
                            VISION QUEST
                        </motion.h1>

                        {/* Subtitle with animated separator */}
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, var(--gray))' }} />
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'clamp(11px, 1.8vw, 16px)',
                                    color: '#777',
                                    letterSpacing: 6,
                                    textTransform: 'uppercase',
                                }}
                            >
                                The Watching World
                            </p>
                            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, var(--gray), transparent)' }} />
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            style={{
                                maxWidth: 520,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                marginTop: 4,
                            }}
                        >
                            {[
                                { text: 'see', color: '#00D4FF', prefix: 'The NPCs can', suffix: 'you.' },
                                { text: 'watch', color: '#FFB800', prefix: 'They', suffix: 'your face, your gestures, your objects.' },
                                { text: 'Talk', color: '#7B2FBE', prefix: '', suffix: 'to them using your microphone.' },
                                { text: 'react', color: '#FF4444', prefix: 'They', suffix: 'to everything you do and say.' },
                            ].map((line, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + i * 0.15, duration: 0.4 }}
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 'clamp(11px, 1.5vw, 14px)',
                                        color: '#999',
                                        lineHeight: 2,
                                    }}
                                >
                                    {line.prefix} <span style={{ color: line.color, fontWeight: 'bold', textShadow: `0 0 12px ${line.color}44` }}>{line.text}</span> {line.suffix}
                                </motion.p>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.5, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px #00D4FF44, 0 0 60px #00D4FF22' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { SoundFX.click(); navigateTo('camera-setup'); }}
                            className="btn-neon"
                            aria-label="Start the mission"
                            style={{ marginTop: 12, fontSize: 'clamp(10px, 1.5vw, 13px)', padding: '18px 40px' }}
                        >
                            ▶ START MISSION
                        </motion.button>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            transition={{ delay: 1.8 }}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: '#444',
                                marginTop: 20,
                                letterSpacing: 2,
                            }}
                        >
                            Powered by Vision AI  •  Camera required  •  Best on desktop
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
