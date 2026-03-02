import { useCallback, useEffect, useRef, useState, Component, lazy, Suspense } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useChallengeStore } from '../store/challengeStore';
import { usePlayerStore } from '../store/playerStore';
import { getZoneById } from '../assets/zones';
import { getRandomRiddles } from '../assets/riddles';
import { useVisionLoop } from '../hooks/useVisionLoop';
import { useNPCReaction } from '../hooks/useNPCReaction';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { SoundFX, startAmbientMusic, stopAmbientMusic } from '../audio/soundManager';
import { isGeminiConfigured } from '../api/geminiService';
import { isStreamConfigured } from '../api/streamService';
import type { DetectionResult, ZoneId } from '../types';

// Lazy-load Stream Video SDK only when needed (saves ~850KB from initial bundle)
const StreamVideoCall = lazy(() => import('../components/StreamVideoCall'));

// Runtime Error Boundary directly on this screen to trap SDK crashes
class StreamErrorBoundary extends Component<{ children: ReactNode, onError: () => void }, { hasError: boolean }> {
    constructor(props: { children: ReactNode, onError: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Caught Stream SDK crash:", error, errorInfo);
        this.props.onError();
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

// ═══════════════════════════════════════════
// NPC Sprite Component
// ═══════════════════════════════════════════
function NPCSprite({ zoneId, emotionState }: { zoneId: ZoneId; emotionState: string }) {
    const zone = getZoneById(zoneId);
    if (!zone) return null;

    const emotionEmojis: Record<string, Record<string, string>> = {
        jester: { idle: '🃏', amused: '😏', laughing: '🤣', offended: '😤' },
        sage: { idle: '🧙', analyzing: '🔍', recognition: '✨', correct: '🌟', wrong: '🤔' },
        shadow: { dormant: '👁️', awakened: '👁️‍🗨️', feeding: '😈', dominant: '💀', banished: '💨' },
    };

    const emoji = emotionEmojis[zoneId]?.[emotionState] || emotionEmojis[zoneId]?.idle || '❓';

    // Shadow special: expanding darkness effect
    const shadowExpand = zoneId === 'shadow' && (emotionState === 'feeding' || emotionState === 'dominant');

    return (
        <motion.div
            className="animate-bob"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                width: '100%',
                height: '100%',
                position: 'relative',
                background: `radial-gradient(circle, ${zone.color}${shadowExpand ? '33' : '11'}, transparent)`,
            }}
        >
            {/* Shadow overlay for feeding state */}
            {shadowExpand && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 50%, transparent 20%, #FF000022 60%, #00000088 100%)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            <motion.div
                key={emotionState}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                style={{ fontSize: 120, lineHeight: 1, zIndex: 1 }}
            >
                {emoji}
            </motion.div>
            <div
                style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: 14,
                    color: zone.color,
                    textShadow: `0 0 12px ${zone.color}55, 0 0 24px ${zone.color}22`,
                    zIndex: 1,
                    letterSpacing: 2,
                }}
            >
                {zone.npcName}
            </div>
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--gray)',
                    textTransform: 'capitalize',
                    zIndex: 1,
                    opacity: 0.7,
                    letterSpacing: 1,
                }}
            >
                {emotionState}
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════
// NPC Dialogue Box with Typewriter
// ═══════════════════════════════════════════
function DialogueBox({ text, color, npcName }: { text: string; color: string; npcName: string }) {
    const [displayedText, setDisplayedText] = useState('');
    const soundEnabled = usePlayerStore((s) => s.soundEnabled);

    useEffect(() => {
        setDisplayedText('');
        if (!text) return;

        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayedText(text.slice(0, i));
            if (soundEnabled && i % 3 === 0) {
                SoundFX.dialogueTick();
            }
            if (i >= text.length) clearInterval(timer);
        }, 25);

        return () => clearInterval(timer);
    }, [text, soundEnabled]);

    return (
        <div
            className="dialogue-box"
            style={{ borderColor: color }}
        >
            <div
                style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: 8,
                    color,
                    marginBottom: 8,
                    opacity: 0.7,
                }}
            >
                {npcName}
            </div>
            <p style={{ fontFamily: 'var(--font-game)', fontSize: 10, lineHeight: 2.2, color: 'var(--white)' }}>
                {displayedText}
                {displayedText.length < text.length && (
                    <span style={{ color, animation: 'typewriter-cursor 0.7s infinite' }}>▌</span>
                )}
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════
// Challenge HUD
// ═══════════════════════════════════════════
function ChallengeHUD({ zoneId }: { zoneId: ZoneId }) {
    const { progress, timer, lives, currentDetection, challengeState, currentRiddle, riddleIndex } = useChallengeStore();
    const zone = getZoneById(zoneId);
    const soundEnabled = usePlayerStore((s) => s.soundEnabled);

    // Timer warning sound
    useEffect(() => {
        if (timer <= 10 && timer > 0 && challengeState === 'active' && soundEnabled) {
            SoundFX.timerWarning();
        }
    }, [timer, challengeState, soundEnabled]);

    if (!zone) return null;

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} `;

    const challengeDescriptions: Record<string, string> = {
        jester: '🃏 Make the Jester laugh! Smile and be expressive.',
        sage: '🧙 Show objects to solve the Sage\'s riddles.',
        shadow: '👁️ Stay calm for 90 seconds. Don\'t show fear!',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Challenge description */}
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--white)',
                    padding: '12px 16px',
                    background: `var(--bg-glass)`,
                    border: `1px solid ${zone.color}33`,
                    borderRadius: 'var(--radius-md)',
                    lineHeight: 1.7,
                    backdropFilter: 'blur(8px)',
                }}
            >
                {challengeDescriptions[zoneId] || 'Complete the challenge!'}
            </div>

            {/* Current Riddle (Sage only) */}
            {zoneId === 'sage' && currentRiddle && (
                <div
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 9,
                        color: 'var(--cyan)',
                        padding: '12px 16px',
                        background: '#00D4FF08',
                        border: '1px solid #00D4FF22',
                        borderRadius: 'var(--radius-md)',
                        lineHeight: 2,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${((riddleIndex + 1) / 3) * 100}%`,
                        height: 2,
                        background: 'var(--cyan)',
                        transition: 'width 0.5s ease',
                    }} />
                    Riddle {riddleIndex + 1}/3: &ldquo;{currentRiddle}&rdquo;
                </div>
            )}

            {/* Timer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                background: timer <= 10 ? '#FF000008' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: timer <= 10 ? '1px solid #FF000033' : '1px solid transparent',
                transition: 'all 0.3s ease',
            }}>
                <span style={{ fontFamily: 'var(--font-game)', fontSize: 9, color: 'var(--gray)', letterSpacing: 2 }}>TIME</span>
                <span
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 20,
                        color: timer <= 10 ? 'var(--red)' : 'var(--white)',
                        textShadow: timer <= 10 ? '0 0 14px #FF444488' : '0 0 6px rgba(255,255,255,0.1)',
                        animation: timer <= 10 ? 'neon-pulse 0.5s infinite' : 'none',
                        letterSpacing: 2,
                    }}
                >
                    {formatTime(timer)}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{
                padding: '10px 14px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${zone.color}15`,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', letterSpacing: 1 }}>
                        {zoneId === 'shadow' ? '😨 FEAR LEVEL' : '📊 PROGRESS'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: zone.color, fontWeight: 'bold' }}>
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${Math.min(100, progress)}%`,
                            background: zoneId === 'shadow'
                                ? `linear-gradient(90deg, #FF6600, #FF0000)`
                                : `linear-gradient(90deg, ${zone.color}, ${zone.color}CC)`,
                            boxShadow: `0 0 8px ${zoneId === 'shadow' ? '#FF000044' : zone.color + '44'}`,
                        }}
                    />
                </div>
            </div>

            {/* Lives */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 14px',
            }}>
                <span style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', letterSpacing: 2 }}>LIVES</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <motion.span
                            key={i}
                            animate={{ scale: i < lives ? [1, 1.2, 1] : 1, opacity: i < lives ? 1 : 0.15 }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            style={{ fontSize: 18, filter: i < lives ? 'drop-shadow(0 0 4px #FF444466)' : 'grayscale(1)' }}
                        >
                            ❤️
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Detected Emotion */}
            {currentDetection && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--bg-glass)',
                        border: `1px solid ${zone.color}22`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', marginBottom: 8, letterSpacing: 1.5 }}>
                        👁️ AI DETECTION
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--white)', textTransform: 'capitalize' }}>
                            {currentDetection.emotion}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-tertiary)', overflow: 'hidden', borderRadius: 3 }}>
                                <div style={{
                                    height: '100%',
                                    width: `${currentDetection.confidence * 100}%`,
                                    background: `linear-gradient(90deg, ${zone.color}88, ${zone.color})`,
                                    transition: 'width 0.3s ease',
                                    borderRadius: 3,
                                }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: zone.color, minWidth: 36, textAlign: 'right' }}>
                                {Math.round(currentDetection.confidence * 100)}%
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Gemini Status */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: isGeminiConfigured() ? 'var(--green)' : 'var(--gold)',
                opacity: 0.5,
                textAlign: 'center',
                letterSpacing: 0.5,
            }}>
                {isGeminiConfigured() ? '✓ Gemini AI Active' : '⚡ Local AI Mode (set VITE_GEMINI_API_KEY for Gemini)'}
            </div>

            {/* Challenge Complete/Failed overlay */}
            {challengeState !== 'active' && challengeState !== 'idle' && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 14,
                        color: challengeState === 'success' ? 'var(--green)' : 'var(--red)',
                        textAlign: 'center',
                        padding: 20,
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${challengeState === 'success' ? 'var(--green)' : 'var(--red)'}`,
                        textShadow: challengeState === 'success' ? '0 0 14px #00FF8866' : '0 0 14px #FF444466',
                        background: challengeState === 'success'
                            ? 'linear-gradient(135deg, #00FF8808, #00FF8818)'
                            : 'linear-gradient(135deg, #FF444408, #FF444418)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {challengeState === 'success' ? '✦ CHALLENGE COMPLETE! ✦' : '✗ CHALLENGE FAILED'}
                </motion.div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// Main NPC Encounter Screen
// ═══════════════════════════════════════════
export default function NPCEncounter() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const transitionZone = useGameStore((s) => s.transitionZone);
    const {
        challengeState, npcDialogue, npcEmotionState, activeZone,
    } = useChallengeStore();
    const {
        startChallenge, tickTimer, setNPCDialogue,
        succeedChallenge, failChallenge, setRiddle, setRiddles, setDetection, resetChallenge,
    } = useChallengeStore.getState();

    const playerName = usePlayerStore((s) => s.name);
    const soundEnabled = usePlayerStore((s) => s.soundEnabled);

    const zone = getZoneById(transitionZone || activeZone || '');
    const [started, setStarted] = useState(false);
    const [streamFailed, setStreamFailed] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const riddlesRef = useRef(getRandomRiddles(3));

    // ── Stable callbacks for StreamVideoCall (avoid hooks-in-JSX violation) ──
    const handleStreamDialogue = useCallback((text: string) => setNPCDialogue(text), [setNPCDialogue]);
    const handleStreamAgentJoined = useCallback(() => console.log('[Stream] NPC agent joined the call'), []);
    const handleStreamError = useCallback((err: string) => {
        console.warn('[Stream] Error:', err);
        setStreamFailed(true);
    }, []);

    const handleGameEvent = useCallback((event: { type: string; action: string; npc: string }) => {
        console.log('🎮 [GameEvent] Received from backend:', event);
        if (event.type !== 'game_event') return;

        if (event.action === 'laugh_detected') {
            useChallengeStore.getState().incrementProgress(20);
            if (soundEnabled) SoundFX.success(); // Minor chime
        } else if (event.action === 'fear_detected') {
            useChallengeStore.getState().incrementProgress(15);
        } else if (event.action === 'riddle_solved') {
            const state = useChallengeStore.getState();
            state.incrementProgress(34);

            if (state.riddleIndex < 2) {
                // Next riddle
                state.setRiddle(riddlesRef.current[state.riddleIndex + 1].text, state.riddleIndex + 1);
                if (soundEnabled) SoundFX.success();
            } else {
                // All riddles solved
                state.succeedChallenge();
                if (soundEnabled) SoundFX.success();
            }
        }
    }, [soundEnabled]);

    // ── Voice Recognition ──
    const { isListening, transcript, isSupported, startListening, stopListening, clearTranscript } = useVoiceRecognition();

    // ── Vision Loop ──
    const { processDetection } = useNPCReaction();
    const transcriptRef = useRef('');
    transcriptRef.current = transcript;

    const handleDetection = useCallback((detection: DetectionResult, frame: string | null) => {
        setDetection(detection);
        processDetection(detection, frame, transcriptRef.current, isStreamConfigured() && !streamFailed);
        if (transcriptRef.current) clearTranscript();
    }, [setDetection, processDetection, streamFailed, clearTranscript]);

    const { videoRef, cameraReady, startCamera } = useVisionLoop({
        enabled: started && challengeState === 'active',
        intervalMs: 3000,
        onDetection: handleDetection,
    });

    // ── Start camera when in local mode ──
    useEffect(() => {
        if (!isStreamConfigured() || streamFailed) {
            startCamera();
        }
    }, [startCamera, streamFailed]);

    // ── Start Challenge ──
    const handleStart = useCallback(() => {
        if (!zone) return;
        startChallenge(zone.id, zone.challengeDuration);
        setStarted(true);

        if (soundEnabled) SoundFX.challengeStart();
        startAmbientMusic(zone.id as 'jester' | 'sage' | 'shadow');

        // Zone-specific setup
        if (zone.id === 'sage') {
            riddlesRef.current = getRandomRiddles(3);
            setRiddle(riddlesRef.current[0].text, 0);
            setRiddles(riddlesRef.current.map(r => r.text));
        }

        // Welcome dialogue
        const welcomes: Record<string, string> = {
            jester: `Ah, another Traveler stumbles in! Let's see that smile, ${playerName}... or I'll cry for both of us!`,
            sage: `The runes stir... a seeker approaches. ${riddlesRef.current[0]?.text || 'Show me something curious.'}`,
            shadow: `...${playerName}... I've been waiting... so patiently... in the dark...`,
        };
        setNPCDialogue(welcomes[zone.id] || 'Welcome, adventurer...');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store actions from getState() are stable refs
    }, [zone, playerName, soundEnabled]);

    // ── Timer tick ──
    useEffect(() => {
        if (challengeState !== 'active') return;

        timerRef.current = setInterval(() => {
            const remaining = tickTimer();

            // Shadow fear decay (drains fear by 2% per second if no new fear is detected)
            if (zone?.id === 'shadow') {
                useChallengeStore.getState().incrementProgress(-2);
            }

            if (remaining <= 0) {
                if (zone?.id === 'shadow') {
                    // Shadow: win if fear < 30%
                    const currentProgress = useChallengeStore.getState().progress;
                    if (currentProgress < 30) {
                        succeedChallenge();
                        if (soundEnabled) SoundFX.success();
                    } else {
                        failChallenge();
                        if (soundEnabled) SoundFX.fail();
                    }
                } else if (zone?.id === 'jester') {
                    const currentProgress = useChallengeStore.getState().progress;
                    if (currentProgress >= 100) {
                        succeedChallenge();
                        if (soundEnabled) SoundFX.success();
                    } else {
                        failChallenge();
                        if (soundEnabled) SoundFX.fail();
                    }
                } else if (zone?.id === 'sage') {
                    const currentProgress = useChallengeStore.getState().progress;
                    if (currentProgress >= 100) {
                        succeedChallenge();
                        if (soundEnabled) SoundFX.success();
                    } else {
                        failChallenge();
                        if (soundEnabled) SoundFX.fail();
                    }
                }
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store actions from getState() are stable refs
    }, [challengeState, zone, soundEnabled]);

    // ── Handle challenge end ──
    useEffect(() => {
        if (challengeState === 'success' && zone) {
            stopAmbientMusic();
            if (soundEnabled) SoundFX.success();
            // XP + zone completion happen in RewardScreen to avoid double-awarding
            const t = setTimeout(() => navigateTo('reward'), 2500);
            return () => clearTimeout(t);
        }
        if (challengeState === 'failed') {
            stopAmbientMusic();
            if (soundEnabled) SoundFX.fail();
            const t = setTimeout(() => navigateTo('village-map'), 3000);
            return () => clearTimeout(t);
        }
    }, [challengeState, zone, navigateTo, soundEnabled]);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            stopAmbientMusic();
        };
    }, []);

    if (!zone) {
        navigateTo('village-map');
        return null;
    }

    return (
        <div
            className="game-cursor"
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Zone ambient glow — dual radial for depth */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse at 25% 40%, ${zone.color}15, transparent 55%),
                        radial-gradient(ellipse at 75% 80%, ${zone.color}08, transparent 50%)
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Subtle animated grid underlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(${zone.color}06 1px, transparent 1px),
                        linear-gradient(90deg, ${zone.color}06 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }}
            />

            {/* Shadow special: pulsing red vignette when feeding */}
            {zone.id === 'shadow' && (
                <motion.div
                    animate={{
                        opacity: npcEmotionState === 'feeding' ? [0.6, 0.8, 0.6] : 0.6,
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        // The transparent hole shrinks as fear (progress) rises
                        background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(5, 50 - (useChallengeStore.getState().progress / 2))}%, #000000 100%)`,
                        pointerEvents: 'none',
                        zIndex: 2,
                    }}
                />
            )}

            {/* ═══ Left: NPC Zone ═══ */}
            <div
                className="npc-zone-left"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 28,
                    gap: 20,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* NPC Sprite */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '30vh',
                    position: 'relative',
                }}>
                    {/* NPC background aura */}
                    <div className="animate-breathe" style={{
                        position: 'absolute',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${zone.color}15, transparent 70%)`,
                        filter: 'blur(30px)',
                        pointerEvents: 'none',
                    }} />
                    <NPCSprite zoneId={zone.id} emotionState={npcEmotionState || 'idle'} />
                </div>

                {/* Dialogue */}
                <DialogueBox
                    text={npcDialogue || `${zone.npcName} watches you silently...`}
                    color={zone.color}
                    npcName={zone.npcName}
                />
            </div>

            {/* ═══ Right: HUD Zone ═══ */}
            <div
                className="npc-zone-right"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 24,
                    gap: 16,
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'auto',
                }}
            >
                {/* Zone header */}
                <div
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 11,
                        color: zone.color,
                        textShadow: `0 0 12px ${zone.color}44`,
                        textAlign: 'center',
                        paddingBottom: 10,
                        borderBottom: `1px solid ${zone.color}33`,
                        letterSpacing: 3,
                    }}
                >
                    {zone.name.toUpperCase()}
                </div>

                {/* Pre-challenge info OR Challenge HUD */}
                {started ? (
                    <ChallengeHUD zoneId={zone.id} />
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: 20,
                        padding: '16px 0',
                    }}>
                        <p style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 13,
                            color: 'var(--white)',
                            textAlign: 'center',
                            lineHeight: 1.9,
                            opacity: 0.9,
                            maxWidth: 320,
                        }}>
                            {zone.description}
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 20,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--gray)',
                            background: 'var(--bg-glass)',
                            padding: '10px 18px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${zone.color}15`,
                        }}>
                            <span style={{ color: 'var(--cyan)' }}>⏱ {zone.challengeDuration}s</span>
                            <span style={{ color: 'var(--gold)' }}>✦ {zone.xpReward} XP</span>
                            <span style={{ color: zone.color }}>{'★'.repeat(zone.difficulty)}{'☆'.repeat(5 - zone.difficulty)}</span>
                        </div>
                        <motion.button
                            className="btn-neon"
                            onClick={handleStart}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            style={{ borderColor: zone.color, color: zone.color, marginTop: 4, letterSpacing: 2 }}
                        >
                            ⚔ BEGIN CHALLENGE
                        </motion.button>
                    </div>
                )}

                {/* Webcam Mirror — Stream or Fallback */}
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>

                    {/* Voice Recognition UI (only in fallback mode) */}
                    {(!isStreamConfigured() || streamFailed) && started && challengeState === 'active' && isSupported && (
                        <div style={{
                            marginBottom: 12,
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                        }}>
                            <motion.button
                                onMouseDown={startListening}
                                onMouseUp={stopListening}
                                onMouseLeave={stopListening}
                                onTouchStart={startListening}
                                onTouchEnd={stopListening}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                style={{
                                    background: isListening
                                        ? 'linear-gradient(135deg, var(--red), #CC0000)'
                                        : 'var(--bg-glass)',
                                    border: `1px solid ${isListening ? 'var(--red)' : 'var(--dark-gray)'}`,
                                    color: 'var(--white)',
                                    width: 46,
                                    height: 46,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: isListening ? '0 0 18px #FF000066, inset 0 0 10px #FF000033' : 'none',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease',
                                    backdropFilter: isListening ? 'none' : 'blur(8px)',
                                }}
                            >
                                🎤
                            </motion.button>
                            <div style={{
                                flex: 1,
                                background: 'var(--bg-glass)',
                                border: `1px solid ${isListening ? zone.color + '44' : 'var(--dark-gray)'}`,
                                borderRadius: 'var(--radius-md)',
                                padding: '10px 14px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: transcript ? 'var(--cyan)' : 'var(--gray)',
                                minHeight: 46,
                                display: 'flex',
                                alignItems: 'center',
                                backdropFilter: 'blur(8px)',
                                transition: 'border-color 0.3s ease',
                            }}>
                                {isListening ? (transcript || 'Listening...') : (transcript || 'Hold 🎤 to speak to the NPC...')}
                            </div>
                        </div>
                    )}

                    {/* Stream Video Mode */}
                    {isStreamConfigured() && !streamFailed ? (
                        <>
                            <StreamErrorBoundary onError={() => setStreamFailed(true)}>
                                <Suspense fallback={
                                    <div className="webcam-mirror" style={{ borderColor: zone.color, boxShadow: `0 0 10px ${zone.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10, color: zone.color }}>
                                        🔮 Loading Magic Mirror...
                                    </div>
                                }>
                                <div className="webcam-mirror" style={{ borderColor: zone.color, boxShadow: `0 0 10px ${zone.color}44` }}>
                                    <StreamVideoCall
                                        npcId={zone.id as ZoneId}
                                        npcName={zone.npcName}
                                        npcColor={zone.color}
                                        playerName={playerName}
                                        onDialogue={handleStreamDialogue}
                                        onAgentJoined={handleStreamAgentJoined}
                                        onError={handleStreamError}
                                        onGameEvent={handleGameEvent}
                                        videoRef={videoRef}
                                    />
                                </div>
                                </Suspense>
                            </StreamErrorBoundary>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dark-gray)', marginTop: 6, letterSpacing: 0.5, textAlign: 'center' }}>
                                Magic Mirror — <span style={{ color: 'var(--red)' }}>●</span> LIVE via Vision Agents
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="webcam-mirror" style={{ borderColor: zone.color, boxShadow: `0 0 10px ${zone.color}44` }}>
                                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                {!cameraReady && (
                                    <div style={{
                                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)', background: 'var(--bg-secondary)',
                                    }}>
                                        📷 Camera starting...
                                    </div>
                                )}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dark-gray)', marginTop: 6, letterSpacing: 0.5, textAlign: 'center' }}>
                                Magic Mirror — {cameraReady ? <><span style={{ color: 'var(--green)' }}>●</span> The NPCs can see and hear you</> : <><span style={{ color: 'var(--gold)' }}>●</span> Connecting...</>}
                            </div>
                        </>
                    )}
                </div>

                {/* Exit button */}
                <motion.button
                    onClick={() => {
                        stopAmbientMusic();
                        resetChallenge();
                        navigateTo('village-map');
                    }}
                    whileHover={{ scale: 1.04, borderColor: 'var(--red)' }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--gray)',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--dark-gray)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        alignSelf: 'flex-end',
                        backdropFilter: 'blur(4px)',
                        letterSpacing: 1,
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gray)'; }}
                >
                    ← EXIT ZONE
                </motion.button>
            </div>
        </div>
    );
}
