import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let orderNotificationSoundEnabled = false;
let audioUnlocked = false;

export const getSocketUrl = (): string => {
  if (typeof window === "undefined") return "http://localhost:8000";

  const isProduction =
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (isProduction) {
    const configured =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
    if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
      return configured;
    }
    return "https://kawser-backend-wvmd.onrender.com";
  }

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

export const setOrderNotificationSoundEnabled = (enabled: boolean) => {
  orderNotificationSoundEnabled = enabled;
};

/**
 * Silently unlocks the browser's autoplay gate by playing a zero-duration
 * AudioContext buffer. Must be called inside a user-gesture handler (e.g. the
 * Sound On/Off button click). Once unlocked, subsequent Audio.play() calls
 * are permitted without a gesture.
 */
export const unlockAudioForAutoplay = (): void => {
  if (typeof window === "undefined" || audioUnlocked) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    src.onended = () => {
      audioUnlocked = true;
      void ctx.close();
    };
  } catch {
    // Non-fatal — audio will fall back gracefully
  }
};

/**
 * Plays the new-order ding SFX exactly once.
 * - loop is always false; the Audio element is dereferenced after playback ends.
 * - Skipped if sound is disabled, unless force=true (e.g. Test Sound button).
 */
export const playOrderNotificationSound = (force = false) => {
  if (typeof window === "undefined") return;
  if (!force && !orderNotificationSoundEnabled) return;

  try {
    const audio = new Audio("/sounds/new-order.mp3");
    audio.loop = false;        // Never loop
    audio.autoplay = false;    // We call play() explicitly
    audio.volume = 1.0;

    // Release the element from memory once playback finishes naturally
    audio.addEventListener("ended", () => {
      audio.src = "";
    }, { once: true });

    void audio.play().catch((error: unknown) => {
      console.warn("[Audio] Could not play order notification:", error);
    });
  } catch (e) {
    console.warn("[Audio] Could not play order notification:", e);
  }
};

/**
 * Plays a pleasant 2-tone melodic chime for order status transitions.
 */
export const playStatusChangeSound = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const tones = [
      { freq: 659.25, start: 0, duration: 0.12 }, // E5
      { freq: 880.0, start: 0.08, duration: 0.28 }, // A5
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (e) {
    console.warn("[Audio] Could not play status sound:", e);
  }
};
