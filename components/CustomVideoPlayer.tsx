"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface CustomVideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
}

export default function CustomVideoPlayer({
  src = "/images/video.mp4",
  poster,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused || videoRef.current.ended) {
      if (isEnded) {
        videoRef.current.currentTime = 0;
        setIsEnded(false);
      }
      // Audio is unmuted with full volume
      videoRef.current.muted = false;
      videoRef.current.volume = 1;

      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Playback error:", err);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isEnded]);

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
  };

  return (
    <div className="relative w-full max-w-[500px] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-black border-2 border-yellow-500/30 hover:border-yellow-500/60 shadow-2xl shadow-yellow-500/10 transition-all duration-300 group select-none">
      {/* Video Container with aspect-video */}
      <div
        className="relative aspect-video w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          onEnded={handleEnded}
          className="w-full h-full object-cover"
        />

        {/* Play / Pause / Replay Button Inside the Video */}
        {(!isPlaying || isEnded) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="relative group/play flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-full cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
              aria-label={isEnded ? "পুনরায় দেখুন" : "ভিডিও প্লে করুন"}
            >
              {/* Outer Pulsing Glow */}
              <span className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping opacity-75" />
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 opacity-60 blur-md group-hover/play:opacity-100 transition-opacity" />

              {/* Main Circular Gold Button */}
              <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-2 border-yellow-200">
                {isEnded ? (
                  <RotateCcw size={32} className="stroke-[2.5]" />
                ) : (
                  <Play size={34} className="fill-black text-black ml-1.5" />
                )}
              </div>
            </button>

            {/* Click-to-Play Badge */}
            <div className="mt-4 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-500/40 text-yellow-300 text-xs font-bold shadow-xl flex items-center gap-1.5 animate-pulse">
              <span>{isEnded ? "আবার দেখতে ক্লিক করুন" : "ভিডিও প্লে করতে ক্লিক করুন"}</span>
            </div>
          </div>
        )}

        {/* Hover Pause Overlay indicator when playing */}
        {isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/70 border border-yellow-500/40 text-yellow-400 flex items-center justify-center shadow-xl">
              <Pause size={28} className="fill-yellow-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
