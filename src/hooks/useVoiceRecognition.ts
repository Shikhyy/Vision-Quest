import { useState, useEffect, useCallback, useRef } from 'react';

// Web Speech API Types
interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    transcript: string;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    clearTranscript: () => void;
}

function getSpeechRecognitionCtor() {
    return typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const isSupported = !!getSpeechRecognitionCtor();

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = getSpeechRecognitionCtor();

        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Prefer final transcript, otherwise update with interim
            if (finalTranscript) {
                setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript).trim());
            } else if (interimTranscript) {
                // If it's just interim, we might want to temporarily display it,
                // but for simplicity and stability, we'll just update the transcript state
                // This might cause jumping, alternatively we could have separate final/interim states.
                // Let's stick with updating the main transcript for now, but only appending final sentences.
                // Actually, let's just replace the current state if it's purely interim,
                // and append when final.
                setTranscript(interimTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setIsListening(false);
                setTranscript('Microphone access denied.');
            }
        };

        recognition.onend = () => {
            // If it ends abruptly but we want it continuous, we could restart it here
            // but for a push-to-talk or manual toggle, it's better to manage it strictly.
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListening) return;
        try {
            recognitionRef.current.start();
            setIsListening(true);
            setTranscript(''); // Clear existing when starting fresh
        } catch (err) {
            console.error('Error starting speech recognition:', err);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListening) return;
        try {
            recognitionRef.current.stop();
            setIsListening(false);
        } catch (err) {
            console.error('Error stopping speech recognition:', err);
        }
    }, [isListening]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        isSupported,
        startListening,
        stopListening,
        clearTranscript,
    };
}
