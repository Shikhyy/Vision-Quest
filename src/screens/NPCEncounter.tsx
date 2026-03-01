import { useCallback, useEffect, useRef, useState, Component } from 'react';
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
import StreamVideoCall from '../components/StreamVideoCall';
import type { DetectionResult, ZoneId } from '../types';

// Runtime Error Boundary directly on this screen to trap SDK crashes
class StreamErrorBoundary extends Component<{ children: ReactNode, onError: () => void }, { hasError: boolean }> {
    constructor(props: { children: ReactNode, onError: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
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
                    textShadow: `0 0 10px ${zone.color} 66`,
                    zIndex: 1,
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

    if (!zone) return null;

    // Timer warning sound
    useEffect(() => {
        if (timer <= 10 && timer > 0 && challengeState === 'active' && soundEnabled) {
            SoundFX.timerWarning();
        }
    }, [timer, challengeState, soundEnabled]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} `;

    const challengeDescriptions: Record<string, string> = {
        jester: '🃏 Make the Jester laugh! Smile and be expressive.',
        sage: '🧙 Show objects to solve the Sage\'s riddles.',
        shadow: '👁️ Stay calm for 90 seconds. Don\'t show fear!',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Challenge description */}
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--white)',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${zone.color} 44`,
                    lineHeight: 1.6,
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
                        padding: '10px 14px',
                        background: '#00D4FF11',
                        border: '1px solid #00D4FF33',
                        lineHeight: 2,
                    }}
                >
                    Riddle {riddleIndex + 1}/3: "{currentRiddle}"
                </div>
            )}

            {/* Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--gray)' }}>TIME</span>
                <span
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 18,
                        color: timer <= 10 ? 'var(--red)' : 'var(--white)',
                        textShadow: timer <= 10 ? '0 0 10px #FF444466' : 'none',
                        animation: timer <= 10 ? 'neon-pulse 0.5s infinite' : 'none',
                    }}
                >
                    {formatTime(timer)}
                </span>
            </div>

            {/* Progress Bar */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)' }}>
                        {zoneId === 'shadow' ? '😨 FEAR LEVEL' : '📊 PROGRESS'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: zone.color }}>
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
                        }}
                    />
                </div>
            </div>

            {/* Lives */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)' }}>LIVES</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} style={{ fontSize: 16, opacity: i < lives ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                            ❤️
                        </span>
                    ))}
                </div>
            </div>

            {/* Detected Emotion */}
            {currentDetection && (
                <div
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--dark-gray)',
                        padding: '10px 14px',
                    }}
                >
                    <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: 'var(--gray)', marginBottom: 6 }}>
                        👁️ AI DETECTION
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--white)', textTransform: 'capitalize' }}>
                            {currentDetection.emotion}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${currentDetection.confidence * 100}%`, background: zone.color, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: zone.color }}>
                                {Math.round(currentDetection.confidence * 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Gemini Status */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: isGeminiConfigured() ? 'var(--green)' : 'var(--gold)',
                opacity: 0.6,
                textAlign: 'center',
            }}>
                {isGeminiConfigured() ? '✓ Gemini AI Active' : '⚡ Local AI Mode (set VITE_GEMINI_API_KEY for Gemini)'}
            </div>

            {/* Challenge Complete/Failed overlay */}
            {challengeState !== 'active' && challengeState !== 'idle' && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        fontFamily: 'var(--font-game)',
                        fontSize: 14,
                        color: challengeState === 'success' ? 'var(--green)' : 'var(--red)',
                        textAlign: 'center',
                        padding: 16,
                        border: `2px solid ${challengeState === 'success' ? 'var(--green)' : 'var(--red)'}`,
                        textShadow: challengeState === 'success' ? '0 0 10px #00FF8866' : '0 0 10px #FF444466',
                        background: challengeState === 'success' ? '#00FF8811' : '#FF444411',
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
        succeedChallenge, failChallenge, setRiddle, setDetection, resetChallenge,
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

    // ── Voice Recognition ──
    const { isListening, transcript, isSupported, startListening, stopListening, clearTranscript } = useVoiceRecognition();

    // ── Vision Loop ──
    const { processDetection } = useNPCReaction();
    const { videoRef, cameraReady, latestFrame, startCamera } = useVisionLoop({
        enabled: (!isStreamConfigured() || streamFailed) && started && challengeState === 'active',
        intervalMs: 3000,
        onDetection: (detection: DetectionResult) => {
            setDetection(detection);
            processDetection(detection, latestFrame, transcript);
            if (transcript) clearTranscript();
        },
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
        }

        // Welcome dialogue
        const welcomes: Record<string, string> = {
            jester: `Ah, another Traveler stumbles in! Let's see that smile, ${playerName}... or I'll cry for both of us!`,
            sage: `The runes stir... a seeker approaches. ${riddlesRef.current[0]?.text || 'Show me something curious.'}`,
            shadow: `...${playerName}... I've been waiting... so patiently... in the dark...`,
        };
        setNPCDialogue(welcomes[zone.id] || 'Welcome, adventurer...');
    }, [zone, playerName, soundEnabled]);

    // ── Timer tick ──
    useEffect(() => {
        if (challengeState !== 'active') return;

        timerRef.current = setInterval(() => {
            const remaining = tickTimer();
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
            {/* Zone ambient glow */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse at 30% 50%, ${zone.color}11, transparent 60%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* Shadow special: pulsing red vignette when feeding */}
            {zone.id === 'shadow' && npcEmotionState === 'feeding' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 50%, transparent 30%, #FF000033 100%)',
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
                    padding: 24,
                    gap: 16,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* NPC Sprite */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
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
                        fontSize: 12,
                        color: zone.color,
                        textShadow: `0 0 10px ${zone.color}66`,
                        textAlign: 'center',
                        paddingBottom: 8,
                        borderBottom: `1px solid ${zone.color}44`,
                    }}
                >
                    {zone.name.toUpperCase()}
                </div>

                {/* Pre-challenge info OR Challenge HUD */}
                {started ? (
                    <ChallengeHUD zoneId={zone.id} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--white)', textAlign: 'center', lineHeight: 1.8 }}>
                            {zone.description}
                        </p>
                        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                            <span>⏱ {zone.challengeDuration}s</span>
                            <span>✦ {zone.xpReward} XP</span>
                            <span>{'★'.repeat(zone.difficulty)}{'☆'.repeat(5 - zone.difficulty)}</span>
                        </div>
                        <motion.button
                            className="btn-neon"
                            onClick={handleStart}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ borderColor: zone.color, color: zone.color, marginTop: 8 }}
                        >
                            ⚔ BEGIN CHALLENGE
                        </motion.button>
                    </div>
                )}

                {/* Webcam Mirror — Stream or Fallback */}
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>

                    {/* Voice Recognition UI (only in fallback mode) */}
                    {(!isStreamConfigured() || streamFailed) && started && challengeState === 'active' && isSupported && (
                        <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                            <motion.button
                                onMouseDown={startListening}
                                onMouseUp={stopListening}
                                onMouseLeave={stopListening}
                                onTouchStart={startListening}
                                onTouchEnd={stopListening}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    background: isListening ? 'var(--red)' : 'var(--bg-secondary)',
                                    border: `1px solid ${isListening ? 'var(--red)' : 'var(--dark-gray)'}`,
                                    color: 'var(--white)',
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: isListening ? '0 0 15px #FF000088' : 'none',
                                    flexShrink: 0,
                                }}
                            >
                                🎤
                            </motion.button>
                            <div style={{
                                flex: 1,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--dark-gray)',
                                padding: '8px 12px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: transcript ? 'var(--cyan)' : 'var(--gray)',
                                minHeight: 44,
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                                {isListening ? (transcript || 'Listening...') : (transcript || 'Hold 🎤 to speak to the NPC...')}
                            </div>
                        </div>
                    )}

                    {/* Stream Video Mode */}
                    {isStreamConfigured() && !streamFailed ? (
                        <>
                            <StreamErrorBoundary onError={() => setStreamFailed(true)}>
                                <div className="webcam-mirror" style={{ borderColor: zone.color, boxShadow: `0 0 10px ${zone.color}44` }}>
                                    <StreamVideoCall
                                        npcId={zone.id as ZoneId}
                                        npcName={zone.npcName}
                                        npcColor={zone.color}
                                        playerName={playerName}
                                        onDialogue={handleStreamDialogue}
                                        onAgentJoined={handleStreamAgentJoined}
                                        onError={handleStreamError}
                                    />
                                </div>
                            </StreamErrorBoundary>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dark-gray)', marginTop: 4 }}>
                                Magic Mirror — 🔴 LIVE via Vision Agents
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
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--dark-gray)', marginTop: 4 }}>
                                Magic Mirror — {cameraReady ? 'The NPCs can see and hear you' : 'Connecting...'}
                            </div>
                        </>
                    )}
                </div>

                {/* Exit button */}
                <button
                    onClick={() => {
                        stopAmbientMusic();
                        resetChallenge();
                        navigateTo('village-map');
                    }}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--gray)',
                        background: 'none',
                        border: '1px solid var(--dark-gray)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        alignSelf: 'flex-end',
                    }}
                >
                    ← EXIT ZONE
                </button>
            </div>
        </div>
    );
}
