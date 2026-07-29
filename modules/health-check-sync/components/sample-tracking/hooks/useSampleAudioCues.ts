import { useCallback } from 'react';

// Using standard beep sounds generated via Web Audio API for a reliable, no-asset approach
export const useSampleAudioCues = () => {
    
    const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            oscillator.stop(context.currentTime + duration);
        } catch (err) {
            console.error("Audio API not supported or blocked", err);
        }
    }, []);

    const playSuccessBeep = useCallback(() => {
        // High pitched short beep (Success scan)
        playTone(880, 'sine', 0.1, 0.1); 
    }, [playTone]);

    const playErrorBuzz = useCallback(() => {
        // Low pitched long buzz (Failed scan / Error)
        playTone(150, 'sawtooth', 0.4, 0.2); 
    }, [playTone]);

    return {
        playSuccessBeep,
        playErrorBuzz
    };
};
