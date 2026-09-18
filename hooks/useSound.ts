"use client";

import { useCallback, useEffect, useRef } from "react";

type Sound = "move" | "win" | "draw" | "start";
export function useSound(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  useEffect(() => () => {
    const active = context.current;
    context.current = null;
    if (active && active.state !== "closed") void active.close().catch(() => undefined);
  }, []);
  return useCallback((sound: Sound) => {
    if (!enabled) return;
    try {
      const Audio = window.AudioContext;
      if (!Audio) return;
      const audio = context.current ?? new Audio();
      context.current = audio;
      const play = () => {
        if (audio.state === "closed") return;
        const frequencies = sound === "win" ? [523.25, 659.25, 783.99, 1046.5] : sound === "draw" ? [392, 349.23, 329.63] : sound === "start" ? [392, 587.33] : [660];
        frequencies.forEach((frequency, index) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const time = audio.currentTime + index * 0.095;
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, time);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.07, time + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start(time);
          oscillator.stop(time + 0.2);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
      };
      if (audio.state === "suspended") void audio.resume().then(play).catch(() => undefined);
      else play();
    } catch { /* Audio is optional; gameplay remains available. */ }
  }, [enabled]);
}
