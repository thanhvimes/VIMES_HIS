
import { RoomVoiceConfig } from "../types";

export const playChime = async (ctx: AudioContext): Promise<void> => {
  return new Promise((resolve) => {
    const t = ctx.currentTime;
    
    // "Ding"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.exponentialRampToValueAtTime(0.01, t + 1.5);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 1.5);

    // "Dong"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(698.46, t + 0.6);
    osc2.frequency.exponentialRampToValueAtTime(0.01, t + 2.5);
    gain2.gain.setValueAtTime(0.3, t + 0.6);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.6);
    osc2.stop(t + 2.5);

    setTimeout(() => {
      resolve();
    }, 2000);
  });
};
