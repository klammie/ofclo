// components/upload/UploadProgress.tsx
"use client";

interface UploadProgressProps {
  progress: number; // 0-100
}

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="w-full max-w-md">
      {/* Progress bar */}
      <div className="relative w-full h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Percentage text */}
      <div className="mt-2 text-center">
        <span className="text-white font-bold text-sm">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Add this to your tailwind.config.ts:
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
}
*/