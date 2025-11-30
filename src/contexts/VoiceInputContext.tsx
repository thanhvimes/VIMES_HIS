
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
    
    // Use a ref to track listening state inside event callbacks (closures)
    const isListeningRef = useRef(isListening);
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

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
                // If it stops but state is still listening (e.g. silence timeout), restart it
                if (isListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        // If start fails, sync state
                        setIsListening(false);
                    }
                }
            };

            recognition.onerror = (event: any) => {
                // Ignore 'no-speech' error to prevent console spam
                if (event.error === 'no-speech') {
                    return;
                }
                
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false);
                    alert("Không thể truy cập Micro. Vui lòng kiểm tra quyền truy cập.");
                }
            };

            recognitionRef.current = recognition;
        }
    }, []); // Run only once on mount

    const toggleListening = () => {
        if (!hasSupport) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome hoặc Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
                
                // Play a subtle sound to indicate start
                const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3');
                audio.volume = 0.2;
                audio.play().catch(() => {}); // Ignore auto-play errors
                
            } catch (error) {
                console.error(error);
            }
        }
    };

    // Helper to insert text into React inputs correctly
    const insertTextToActiveElement = (text: string) => {
        const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            const start = activeEl.selectionStart || 0;
            const end = activeEl.selectionEnd || 0;
            const value = activeEl.value;
            
            // Add a space if not at start
            const textToInsert = (start > 0 && value[start - 1] !== ' ') ? ` ${text}` : text;
            const newValue = value.substring(0, start) + textToInsert + value.substring(end);

            // This part is crucial for React to detect the change
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

            if (activeEl.tagName === 'INPUT' && nativeInputValueSetter) {
                nativeInputValueSetter.call(activeEl, newValue);
            } else if (activeEl.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
                nativeTextAreaValueSetter.call(activeEl, newValue);
            } else {
                activeEl.value = newValue;
            }

            // Dispatch input event
            const event = new Event('input', { bubbles: true });
            activeEl.dispatchEvent(event);
            
            // Restore focus and move cursor
            const newCursorPos = start + textToInsert.length;
            activeEl.setSelectionRange(newCursorPos, newCursorPos);
            activeEl.focus();
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
    if (context === undefined) {
        throw new Error('useVoiceInput must be used within a VoiceInputProvider');
    }
    return context;
};
