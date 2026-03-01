// ═══════════════════════════════════════════
// StreamVideoCall — Real-time NPC Video Chat Component
// ═══════════════════════════════════════════
// Wraps the Stream Video React SDK to enable real-time video+audio
// communication between the player and the NPC agent.
//
// The NPC agent (Python backend) joins the same call and processes
// the player's video/audio using Gemini Realtime.
//
// FALLBACK: If Stream fails at any point (missing token, connection error,
// agent timeout), fires `onError` so the parent can switch to local Gemini mode.

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    useCallStateHooks,
    useCall,
} from '@stream-io/video-react-sdk';
import type { User } from '@stream-io/video-react-sdk';
import { fetchStreamToken } from '../api/tokenProvider';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import type { ZoneId } from '../types';

interface StreamVideoCallProps {
    npcId: ZoneId;
    npcName: string;
    npcColor: string;
    playerName: string;
    onDialogue: (text: string) => void;
    onAgentJoined: () => void;
    onError: (error: string) => void;
    onGameEvent?: (event: { type: string; action: string; npc: string }) => void;
    videoRef?: React.Ref<HTMLVideoElement>;
}

function CallUI({
    npcName,
    npcColor,
    onDialogue,
    onAgentJoined,
    onError,
    onGameEvent,
    videoRef,
}: {
    npcName: string;
    npcColor: string;
    onDialogue: (text: string) => void;
    onAgentJoined: () => void;
    onError: (error: string) => void;
    onGameEvent?: (event: { type: string; action: string; npc: string }) => void;
    videoRef?: React.Ref<HTMLVideoElement>;
}) {
    const { useParticipants, useCallCallingState } = useCallStateHooks();
    const participants = useParticipants();
    const callingState = useCallCallingState();
    const hasNotifiedRef = useRef(false);
    const errorFiredRef = useRef(false);

    // If agent doesn't join within 10 seconds of call joining, trigger error fallback
    useEffect(() => {
        if (callingState !== 'joined') return;
        if (errorFiredRef.current) return;

        const timeoutId = setTimeout(() => {
            if (errorFiredRef.current) return;
            errorFiredRef.current = true;
            onError('Agent failed to join. The Vision Quest python backend seems to be offline.');
        }, 10_000);

        return () => {
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callingState]);

    const call = useCall();

    // Listen for custom game events from the Python agent
    useEffect(() => {
        if (!call) return;

        const handleCustomEvent = (event: any) => {
            if (event.custom?.type === 'game_event' && onGameEvent) {
                onGameEvent(event.custom as { type: string; action: string; npc: string });
            }
        };

        call.on('custom', handleCustomEvent);

        return () => {
            call.off('custom', handleCustomEvent);
        };
    }, [call, onGameEvent]);

    // Find user's own video track
    const localParticipant = participants.find(
        (p) => p.isLocalParticipant
    );

    // Detect agent joining (any participant that isn't the local user)
    const agentParticipant = participants.find((p) => !p.isLocalParticipant);
    if (agentParticipant && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        onAgentJoined();
        onDialogue(`${npcName} has entered the realm...`);
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Webcam Feed - Captured but hidden for immersion */}
            {localParticipant?.videoStream && (
                <video
                    ref={(el) => {
                        if (el && localParticipant.videoStream) {
                            el.srcObject = localParticipant.videoStream as unknown as MediaStream;
                        }
                        if (typeof videoRef === 'function') {
                            videoRef(el);
                        } else if (videoRef) {
                            (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                        }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        position: 'absolute',
                        width: 320,
                        height: 240,
                        opacity: 0.01,
                        pointerEvents: 'none',
                        zIndex: -10,
                    }}
                />
            )}

            {/* Connection Status */}
            <div
                style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    color: callingState === 'joined' ? '#00FF88' : '#FFB800',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '2px 6px',
                    borderRadius: 4,
                }}
            >
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background:
                            callingState === 'joined' ? '#00FF88' : '#FFB800',
                        boxShadow: `0 0 4px ${callingState === 'joined' ? '#00FF88' : '#FFB800'}`,
                    }}
                />
                {callingState === 'joined' ? 'LIVE' : 'CONNECTING'}
            </div>

            {/* Agent indicator */}
            {participants.some((p) => !p.isLocalParticipant) && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 8,
                        color: npcColor,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '2px 6px',
                        borderRadius: 4,
                    }}
                >
                    🎭 {npcName} is watching
                </div>
            )}
        </div>
    );
}

// ── Main Component ──
export default function StreamVideoCall({
    npcId,
    npcName,
    npcColor,
    playerName,
    onDialogue,
    onAgentJoined,
    onError,
    onGameEvent,
    videoRef,
}: StreamVideoCallProps) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const errorFiredRef = useRef(false);

    const apiKey = import.meta.env.VITE_STREAM_API_KEY || '';
    const callIdRef = useRef(
        `vq-${npcId}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    );

    const setupCall = useCallback(async () => {
        if (!apiKey) {
            if (!errorFiredRef.current) {
                errorFiredRef.current = true;
                onError('Stream API key not configured');
            }
            return;
        }

        try {
            const userId = `player-${playerName.toLowerCase().replace(/\s+/g, '-')}`;

            // Pre-fetch the token BEFORE creating the client
            const token = await fetchStreamToken(userId);
            if (!token) {
                throw new Error('Could not obtain a valid Stream token. Token server may be down.');
            }

            const user: User = {
                id: userId,
                name: playerName,
            };

            const videoClient = StreamVideoClient.getOrCreateInstance({
                apiKey,
                user,
                token,  // Use the pre-fetched token directly instead of tokenProvider
            });

            const videoCall = videoClient.call('default', callIdRef.current);

            await videoCall.join({ create: true });

            // Enable camera and microphone
            try { await videoCall.camera.enable(); } catch { /* Camera might be denied */ }
            try { await videoCall.microphone.enable(); } catch { /* Mic might be denied */ }

            setClient(videoClient);
            setCall(videoCall);
            setIsConnecting(false);

            onDialogue(
                `Connected to the Magic Mirror. Waiting for ${npcName}...`
            );

            // Trigger the Python agent backend to join this call
            console.log(`[Stream] Call created: ${callIdRef.current}. Triggering backend agent...`);
            try {
                // The Vision Agent API uses /sessions to trigger the AgentLauncher action
                await fetch(`http://127.0.0.1:8000/sessions?npc=${npcId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        call_type: 'default',
                        call_id: callIdRef.current
                    })
                });
            } catch (err) {
                console.warn('Backend agent trigger failed. Is the python server running?', err);
            }
        } catch (error: any) {
            console.error('[Stream] Connection error:', error);
            if (!errorFiredRef.current) {
                errorFiredRef.current = true;
                onError(
                    `Failed to connect: ${error.message || 'Unknown error'}. Falling back to local mode.`
                );
            }
        }
    }, [apiKey, npcId, playerName, npcName, onDialogue, onError]);

    useEffect(() => {
        setupCall();

        return () => {
            // Cleanup on unmount — wrap in try/catch so SDK crashes don't propagate
            try {
                if (call) {
                    call.leave().catch(() => { });
                }
            } catch { /* swallow */ }
            try {
                if (client) {
                    client.disconnectUser?.().catch(() => { });
                }
            } catch { /* swallow */ }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!client || !call || isConnecting) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: npcColor,
                }}
            >
                🔮 Connecting to the Magic Mirror...
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallUI
                    npcName={npcName}
                    npcColor={npcColor}
                    onDialogue={onDialogue}
                    onAgentJoined={onAgentJoined}
                    onError={onError}
                    onGameEvent={onGameEvent}
                    videoRef={videoRef}
                />
            </StreamCall>
        </StreamVideo>
    );
}
