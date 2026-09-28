import React from 'react';

/**
 * CurrencyWatermark:
 * Generates an artistic banknote guilloche pattern, security seals,
 * and elegant Indian Rupee (₹) watermarks in the background with subtle floating animation.
 */
export const CurrencyWatermark: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {/* Background Guilloche Security Rosette (SVG) */}
      <svg
        className="absolute -top-24 -right-24 w-96 h-96 text-emerald-800 animate-spin-slow"
        style={{ animationDuration: '90s' }}
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="1" />
        <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 4" />
        <circle cx="200" cy="200" r="90" stroke="currentColor" strokeWidth="1" />
        {/* Geometric petals */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <ellipse
            key={deg}
            cx="200"
            cy="200"
            rx="120"
            ry="45"
            transform={`rotate(${deg} 200 200)`}
            stroke="currentColor"
            strokeWidth="0.8"
          />
        ))}
      </svg>

      {/* Giant Rupee Watermark in Center Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] font-black text-emerald-900 leading-none select-none tracking-tighter transform -rotate-12">
        ₹
      </div>

      {/* Floating 3D Metallic Rupee Coin Watermarks (Top Left & Bottom Right) */}
      <svg
        className="absolute top-1/4 -left-12 w-64 h-64 text-emerald-800/80 animate-float-slow"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <text
          x="100"
          y="130"
          fontSize="90"
          fontWeight="900"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="system-ui, sans-serif"
        >
          ₹
        </text>
      </svg>

      <svg
        className="absolute -bottom-16 right-1/4 w-80 h-80 text-teal-800/80 animate-float-reverse"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
        <text
          x="100"
          y="135"
          fontSize="100"
          fontWeight="900"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="system-ui, sans-serif"
        >
          ₹
        </text>
      </svg>

      {/* Banknote Micro-Line Waves across the screen */}
      <svg
        className="absolute inset-x-0 top-1/3 w-full h-48 text-emerald-700/60"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,100 C300,160 600,40 900,100 C1050,130 1150,80 1200,100"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M0,120 C300,180 600,60 900,120 C1050,150 1150,100 1200,120"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="6 6"
        />
        <path
          d="M0,80 C300,140 600,20 900,80 C1050,110 1150,60 1200,80"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
};
