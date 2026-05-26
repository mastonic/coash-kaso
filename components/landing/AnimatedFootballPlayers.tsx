'use client';

export function AnimatedFootballPlayers() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Player 1 - Running */}
      <div className="absolute bottom-20 left-10 w-24 h-24 opacity-20 animate-float" style={{ animationDelay: '0s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Head */}
          <circle cx="50" cy="20" r="8" fill="#39FF14" />
          {/* Body */}
          <line x1="50" y1="28" x2="50" y2="50" stroke="#39FF14" strokeWidth="3" />
          {/* Left arm */}
          <line x1="50" y1="32" x2="30" y2="25" stroke="#39FF14" strokeWidth="2" />
          {/* Right arm */}
          <line x1="50" y1="32" x2="70" y2="40" stroke="#39FF14" strokeWidth="2" />
          {/* Left leg */}
          <line x1="50" y1="50" x2="35" y2="75" stroke="#39FF14" strokeWidth="2" />
          {/* Right leg */}
          <line x1="50" y1="50" x2="65" y2="70" stroke="#39FF14" strokeWidth="2" />
          {/* Ball */}
          <circle cx="68" cy="72" r="3" fill="#39FF14" />
        </svg>
      </div>

      {/* Player 2 - Kicking */}
      <div className="absolute bottom-32 right-20 w-28 h-28 opacity-20 animate-float" style={{ animationDelay: '1s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Head */}
          <circle cx="50" cy="20" r="8" fill="#39FF14" />
          {/* Body */}
          <line x1="50" y1="28" x2="50" y2="50" stroke="#39FF14" strokeWidth="3" />
          {/* Left arm */}
          <line x1="50" y1="32" x2="25" y2="35" stroke="#39FF14" strokeWidth="2" />
          {/* Right arm */}
          <line x1="50" y1="32" x2="75" y2="28" stroke="#39FF14" strokeWidth="2" />
          {/* Left leg */}
          <line x1="50" y1="50" x2="40" y2="80" stroke="#39FF14" strokeWidth="2" />
          {/* Right leg - kicking */}
          <line x1="50" y1="50" x2="80" y2="45" stroke="#39FF14" strokeWidth="3" />
          {/* Ball */}
          <circle cx="85" cy="43" r="4" fill="#39FF14" />
        </svg>
      </div>

      {/* Player 3 - Standing with ball */}
      <div className="absolute top-40 right-32 w-20 h-20 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Head */}
          <circle cx="50" cy="20" r="8" fill="#39FF14" />
          {/* Body */}
          <line x1="50" y1="28" x2="50" y2="50" stroke="#39FF14" strokeWidth="3" />
          {/* Left arm */}
          <line x1="50" y1="32" x2="30" y2="30" stroke="#39FF14" strokeWidth="2" />
          {/* Right arm - holding ball */}
          <line x1="50" y1="32" x2="70" y2="35" stroke="#39FF14" strokeWidth="2" />
          {/* Left leg */}
          <line x1="50" y1="50" x2="42" y2="75" stroke="#39FF14" strokeWidth="2" />
          {/* Right leg */}
          <line x1="50" y1="50" x2="58" y2="75" stroke="#39FF14" strokeWidth="2" />
          {/* Ball */}
          <circle cx="75" cy="30" r="5" fill="#39FF14" />
        </svg>
      </div>

      {/* Coach */}
      <div className="absolute top-32 left-20 w-32 h-32 opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Head */}
          <circle cx="50" cy="18" r="8" fill="#39FF14" />
          {/* Whistle */}
          <circle cx="65" cy="15" r="2" fill="#39FF14" />
          {/* Body */}
          <rect x="45" y="27" width="10" height="25" fill="#39FF14" opacity="0.8" />
          {/* Left arm - pointing */}
          <line x1="45" y1="30" x2="20" y2="25" stroke="#39FF14" strokeWidth="3" />
          {/* Right arm */}
          <line x1="55" y1="30" x2="75" y2="35" stroke="#39FF14" strokeWidth="2" />
          {/* Left leg */}
          <line x1="48" y1="52" x2="45" y2="75" stroke="#39FF14" strokeWidth="2" />
          {/* Right leg */}
          <line x1="52" y1="52" x2="55" y2="75" stroke="#39FF14" strokeWidth="2" />
        </svg>
      </div>

      {/* Player 4 - Jumping */}
      <div className="absolute bottom-40 left-1/3 w-20 h-20 opacity-20 animate-bounce" style={{ animationDelay: '0.3s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Head */}
          <circle cx="50" cy="15" r="7" fill="#39FF14" />
          {/* Body */}
          <line x1="50" y1="22" x2="50" y2="45" stroke="#39FF14" strokeWidth="3" />
          {/* Left arm - up */}
          <line x1="50" y1="25" x2="30" y2="10" stroke="#39FF14" strokeWidth="2" />
          {/* Right arm - up */}
          <line x1="50" y1="25" x2="70" y2="12" stroke="#39FF14" strokeWidth="2" />
          {/* Left leg */}
          <line x1="50" y1="45" x2="42" y2="65" stroke="#39FF14" strokeWidth="2" />
          {/* Right leg */}
          <line x1="50" y1="45" x2="58" y2="65" stroke="#39FF14" strokeWidth="2" />
        </svg>
      </div>

      {/* Decorative ball - rotating */}
      <div className="absolute top-1/2 left-1/4 w-16 h-16 opacity-5 animate-spin" style={{ animationDelay: '1.5s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#39FF14" strokeWidth="2" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="#39FF14" strokeWidth="1" opacity="0.5" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#39FF14" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
