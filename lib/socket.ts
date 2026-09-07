import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocketUrl = (): string => {
  if (typeof window === "undefined") return "http://localhost:8000";
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:8000"
  );
};

export const getSocket = (): Socket => {
  if (!socket) {
    const url = getSocketUrl();
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

/**
 * Synthesizes a crisp, pleasant 3-tone notification chime using Web Audio API.
 * Ensures zero asset load latency and works universally on all modern browsers.
 */
export const playOrderNotificationSound = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonious melody chords (D5 -> F#5 -> A5 -> D6)
    const tones = [
      { freq: 587.33, start: 0, duration: 0.15 },
      { freq: 739.99, start: 0.08, duration: 0.18 },
      { freq: 880.0, start: 0.16, duration: 0.22 },
      { freq: 1174.66, start: 0.24, duration: 0.45 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (e) {
    console.warn("[Audio] Could not play notification chime:", e);
  }
};
