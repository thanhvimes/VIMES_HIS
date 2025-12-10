
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface VoiceInputContextType {
    isListening: boolean;
    toggleListening: () => void;
    hasSupport: boolean;
}

const VoiceInputContext = createContext<VoiceInputContextType | undefined>(undefined);

export const VoiceInputProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [hasSupport, setHasSupport] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check browser support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setHasSupport(true);
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true; // Keep listening until stopped
            recognition.interimResults = false; // Only return final results
            recognition.lang = 'vi-VN'; // Vietnamese

            recognition.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                if (transcript) {
                    insertTextToActiveElement(transcript.trim());
                }
            };

            recognition.onend = () => {
                if (isListening) {
                    try {
                        recognition.start();
                    } catch (e) {
                        setIsListening(false);
                    }
                }
            };

            recognition.onerror = (event: any) => {
                // Ignore benign errors
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    return;
                }
                if (event.error === 'audio-capture' || event.error === 'not-allowed') {
                    setIsListening(false);
                    console.warn("Microphone access blocked or missing.");
                    return;
                }
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [isListening]);

    const toggleListening = () => {
        if (!hasSupport) {
            alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (error) {
                console.error("Failed to start recognition:", error);
                setIsListening(false);
            }
        }
    };

    const insertTextToActiveElement = (text: string) => {
        const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            const start = activeEl.selectionStart || 0;
            const end = activeEl.selectionEnd || 0;
            const value = activeEl.value;
            const textToInsert = (start > 0 && value[start - 1] !== ' ') ? ` ${text}` : text;
            const newValue = value.substring(0, start) + textToInsert + value.substring(end);

            const nativeSetter = Object.getOwnPropertyDescriptor(window[activeEl.tagName === 'INPUT' ? 'HTMLInputElement' : 'HTMLTextAreaElement'].prototype, "value")?.set;
            if (nativeSetter) nativeSetter.call(activeEl, newValue);
            else activeEl.value = newValue;

            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    return (
        <VoiceInputContext.Provider value={{ isListening, toggleListening, hasSupport }}>
            {children}
        </VoiceInputContext.Provider>
    );
};

export const useVoiceInput = () => {
    const context = useContext(VoiceInputContext);
    if (context === undefined) throw new Error('useVoiceInput error');
    return context;
};
