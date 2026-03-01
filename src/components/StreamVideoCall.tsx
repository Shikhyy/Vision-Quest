// ═══════════════════════════════════════════
// StreamVideoCall — Real-time NPC Video Chat Component
// ═══════════════════════════════════════════
// Wraps the Stream Video React SDK to enable real-time video+audio
// communication between the player and the NPC agent.
//
// The NPC agent (Python backend) joins the same call and processes
// the player's video/audio using Gemini Realtime.

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';
import type { User } from '@stream-io/video-react-sdk';
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
}

// ── Inner component (has access to call state hooks) ──
function CallUI({
    npcName,
    npcColor,
    onDialogue,
    onAgentJoined,
}: {
    npcName: string;
    npcColor: string;
    onDialogue: (text: string) => void;
    onAgentJoined: () => void;
}) {
    const { useParticipants, useCallCallingState } = useCallStateHooks();
    const participants = useParticipants();
    const callingState = useCallCallingState();
    const hasNotifiedRef = useRef(false);

    // Check if the NPC agent has joined
    useEffect(() => {
        const agentParticipant = participants.find(
            (p) => p.userId.startsWith('npc-')
        );
        if (agentParticipant && !hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            onAgentJoined();
            onDialogue(`${npcName} has entered the realm...`);
        }
    }, [participants, npcName, onAgentJoined, onDialogue]);

    // Find user's own video track
    const localParticipant = participants.find(
        (p) => !p.userId.startsWith('npc-')
    );

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
            {/* Webcam Feed - Mirror */}
            {localParticipant?.videoStream && (
                <video
                    ref={(el) => {
                        if (el && localParticipant.videoStream) {
                            el.srcObject = localParticipant.videoStream as unknown as MediaStream;
                        }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
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
            {participants.some((p) => p.userId.startsWith('npc-')) && (
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
}: StreamVideoCallProps) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    const apiKey = import.meta.env.VITE_STREAM_API_KEY || '';
    const callIdRef = useRef(
        `vq-${npcId}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    );

    const setupCall = useCallback(async () => {
        if (!apiKey) {
            onError('Stream API key not configured');
            return;
        }

        try {
            const userId = `player-${playerName.toLowerCase().replace(/\s+/g, '-')}`;

            const user: User = {
                id: userId,
                name: playerName,
            };

            const videoClient = StreamVideoClient.getOrCreateInstance({
                apiKey,
                user,
                tokenProvider: async () => '',
            });

            const videoCall = videoClient.call('default', callIdRef.current);

            await videoCall.join({ create: true });

            // Enable camera and microphone
            await videoCall.camera.enable();
            await videoCall.microphone.enable();

            setClient(videoClient);
            setCall(videoCall);
            setIsConnecting(false);

            onDialogue(
                `Connected to the Magic Mirror. Waiting for ${npcName}...`
            );

            console.log(
                `[Stream] Call created: ${callIdRef.current}. Start the agent with:\n` +
                `cd agent && uv run python main.py --npc ${npcId} --call-id ${callIdRef.current}`
            );
        } catch (error: any) {
            console.error('[Stream] Connection error:', error);
            onError(
                `Failed to connect: ${error.message || 'Unknown error'}. Falling back to local mode.`
            );
        }
    }, [apiKey, npcId, playerName, npcName, onDialogue, onError]);

    useEffect(() => {
        setupCall();

        return () => {
            // Cleanup on unmount
            if (call) {
                call.leave().catch(console.error);
            }
            if (client) {
                client.disconnectUser?.().catch(console.error);
            }
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
                />
            </StreamCall>
        </StreamVideo>
    );
}
