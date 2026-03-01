import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';

type SetupStep = 'permission' | 'preview' | 'name' | 'ready';

export default function CameraSetup() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const setName = usePlayerStore((s) => s.setName);
    const playerName = usePlayerStore((s) => s.name);

    const [step, setStep] = useState<SetupStep>('permission');
    const [nameInput, setNameInput] = useState(playerName === 'Traveler' ? '' : playerName);
    const [error, setError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // ── Request Camera ──
    const requestCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraReady(true);
            setStep('preview');
        } catch (err) {
            console.error('Camera access denied:', err);
            setError(
                'Camera access was denied. Vision Quest needs your camera so NPCs can see you. Please allow camera access and try again.'
            );
        }
    }, []);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const handleNameSubmit = () => {
        const finalName = nameInput.trim() || 'Traveler';
        setName(finalName);
        setStep('ready');
    };

    const handleStart = () => {
        navigateTo('village-map');
    };

    return (
        <div
            className="game-cursor"
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            {/* Background grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
                    backgroundSize: '32px 32px',
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                    maxWidth: 600,
                    padding: 32,
                }}
            >
                {/* Title */}
                <h2
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 16,
                        color: 'var(--cyan)',
                        letterSpacing: 2,
                    }}
                    className="text-glow-cyan"
                >
                    CAMERA SETUP
                </h2>

                {/* Step Indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {(['permission', 'preview', 'name', 'ready'] as SetupStep[]).map((s, i) => (
                        <div
                            key={s}
                            style={{
                                width: 40,
                                height: 4,
                                background:
                                    i <= ['permission', 'preview', 'name', 'ready'].indexOf(step)
                                        ? 'var(--cyan)'
                                        : 'var(--dark-gray)',
                                transition: 'background 0.3s',
                                boxShadow:
                                    i <= ['permission', 'preview', 'name', 'ready'].indexOf(step)
                                        ? '0 0 6px #00D4FF44'
                                        : 'none',
                            }}
                        />
                    ))}
                </div>

                {/* Video Preview (hidden until camera ready) */}
                <div
                    style={{
                        width: 320,
                        height: 240,
                        background: '#111',
                        border: `2px solid ${cameraReady ? 'var(--cyan)' : 'var(--dark-gray)'}`,
                        boxShadow: cameraReady ? 'var(--glow-cyan)' : 'none',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                    }}
                >
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)',
                            display: cameraReady ? 'block' : 'none',
                        }}
                        playsInline
                        muted
                    />
                    {!cameraReady && (
                        <div
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 13,
                                color: 'var(--gray)',
                                textAlign: 'center',
                                padding: 20,
                            }}
                        >
                            📷 Camera feed will appear here
                        </div>
                    )}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {/* Step 1: Permission */}
                    {step === 'permission' && (
                        <motion.div
                            key="permission"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 14,
                                    color: 'var(--white)',
                                    textAlign: 'center',
                                    lineHeight: 1.8,
                                    maxWidth: 400,
                                }}
                            >
                                The NPCs need to <span style={{ color: 'var(--cyan)' }}>see you</span> to react.
                                <br />
                                Allow camera access to begin your quest.
                            </p>

                            <div
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '12px 16px',
                                    border: '1px solid var(--dark-gray)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--gray)',
                                    lineHeight: 1.6,
                                    maxWidth: 380,
                                }}
                            >
                                💡 <strong style={{ color: '#aaa' }}>Tips:</strong> Good lighting helps detection accuracy.
                                Sit 2-3 feet from your screen. A clear background works best.
                            </div>

                            <button className="btn-neon" onClick={requestCamera} aria-label="Enable camera">
                                👁️ ENABLE CAMERA
                            </button>

                            {error && (
                                <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, maxWidth: 380, textAlign: 'center' }}>
                                    {error}
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-game)',
                                    fontSize: 12,
                                    color: 'var(--green)',
                                }}
                                className="text-glow-green"
                            >
                                ✓ WE CAN SEE YOU!
                            </p>
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 13,
                                    color: '#aaa',
                                    textAlign: 'center',
                                }}
                            >
                                Camera is working. The NPCs are already watching...
                            </p>
                            <button className="btn-neon" onClick={() => setStep('name')}>
                                CONTINUE →
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Name */}
                    {step === 'name' && (
                        <motion.div
                            key="name"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 14,
                                    color: 'var(--white)',
                                    textAlign: 'center',
                                }}
                            >
                                What shall the NPCs call you?
                            </p>
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                placeholder="Enter your name..."
                                maxLength={20}
                                autoFocus
                                style={{
                                    fontFamily: 'var(--font-game)',
                                    fontSize: 12,
                                    padding: '12px 20px',
                                    background: 'var(--bg-secondary)',
                                    border: '2px solid var(--cyan)',
                                    color: 'var(--white)',
                                    width: 300,
                                    textAlign: 'center',
                                    outline: 'none',
                                }}
                                aria-label="Your name"
                            />
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 11,
                                    color: 'var(--gray)',
                                }}
                            >
                                Leave blank to be called "Traveler"
                            </p>
                            <button className="btn-neon-gold btn-neon" onClick={handleNameSubmit}>
                                CONFIRM →
                            </button>
                        </motion.div>
                    )}

                    {/* Step 4: Ready */}
                    {step === 'ready' && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                        >
                            <p
                                style={{
                                    fontFamily: 'var(--font-game)',
                                    fontSize: 14,
                                    color: 'var(--gold)',
                                }}
                                className="text-glow-gold"
                            >
                                READY, {usePlayerStore.getState().name.toUpperCase()}?
                            </p>
                            <p
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 13,
                                    color: '#aaa',
                                    textAlign: 'center',
                                    lineHeight: 1.8,
                                }}
                            >
                                Three NPCs await you in the village.
                                <br />
                                Each one can see you. Each one will react.
                                <br />
                                <span style={{ color: 'var(--red)' }}>Be prepared.</span>
                            </p>
                            <motion.button
                                className="btn-neon-gold btn-neon"
                                onClick={handleStart}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ fontSize: 14, padding: '20px 40px' }}
                            >
                                ⚔ ENTER THE VILLAGE
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
