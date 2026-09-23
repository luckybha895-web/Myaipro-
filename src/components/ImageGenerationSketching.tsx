import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface ImageGenerationSketchingProps {
  label?: string;
  className?: string;
  onComplete?: () => void;
}

/**
 * High-fidelity dot-matrix sketching animation matching ChatGPT image generation UI:
 * - "Sketching it out" status label with subtle shimmer
 * - Rectangular dot-matrix grid with organic undulating wave/ripple animation
 * - Bottom-right floating percentage pill (e.g. 88%)
 */
export function ImageGenerationSketching({
  label = "Sketching it out",
  className = "",
}: ImageGenerationSketchingProps) {
  const [percent, setPercent] = useState(12);

  // Organic progress percentage simulation that advances smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 98) return 98;
        // Natural step increments
        const step =
          prev < 50 ? Math.floor(Math.random() * 6) + 3 : Math.floor(Math.random() * 4) + 1;
        return Math.min(98, prev + step);
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // 14 columns x 22 rows = 308 dots grid
  const cols = 14;
  const rows = 22;

  return (
    <div className={`my-3 flex flex-col items-start select-none ${className}`}>
      {/* Status Label matching Screenshot 1 */}
      <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground/90">
        <Sparkles className="size-3 text-sky-400 animate-pulse" />
        <span>{label}</span>
      </div>

      {/* Dot Matrix Canvas Container */}
      <div className="relative rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-950/20 via-background to-sky-950/10 p-5 shadow-inner overflow-hidden">
        {/* Animated ambient backdrop glow */}
        <div className="absolute -top-10 -left-10 size-40 rounded-full bg-sky-500/10 blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

        {/* The Dot Grid */}
        <div
          className="grid gap-2.5 sm:gap-3 relative z-10"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rows * cols }).map((_, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            // Calculate distance from center for wave ripple
            const centerDist = Math.sqrt(Math.pow(c - cols / 2, 2) + Math.pow(r - rows / 2, 2));
            const delay = (centerDist * 0.12).toFixed(2);
            const isHighlighted = (idx * 17 + percent * 3) % 11 === 0;

            return (
              <span
                key={idx}
                className={`size-1.5 rounded-full transition-all duration-700 ${
                  isHighlighted
                    ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] scale-125"
                    : "bg-sky-500/35 hover:bg-sky-400/60"
                }`}
                style={{
                  animation: `dotPulse 2.2s infinite ease-in-out ${delay}s`,
                  opacity: Math.max(0.2, Math.min(1, (percent / 100) * 0.8 + 0.2)),
                }}
              />
            );
          })}
        </div>

        {/* Floating Percentage Badge at Bottom Right (Screenshot 1: 88%) */}
        <div className="absolute bottom-3.5 right-3.5 z-20">
          <div className="rounded-full bg-sky-500/15 border border-sky-400/35 px-2.5 py-0.5 text-[11px] font-bold text-sky-400 font-mono shadow-xs backdrop-blur-md flex items-center gap-1">
            <span>{percent}%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
}
