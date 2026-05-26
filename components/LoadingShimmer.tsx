'use client';

export function LoadingShimmer() {
  const ShimmerLine = ({ width = '100%', delay = 0 }: { width?: string; delay?: number }) => (
    <div
      className="h-3 rounded bg-gradient-to-r from-[#0A0F0D] via-[#1A3A28] to-[#0A0F0D] bg-[length:1000px_100%] animate-shimmer"
      style={{
        width,
        marginBottom: '10px',
        animationDelay: `${delay}ms`
      }}
    />
  );

  const SkeletonCard = ({ delay }: { delay: number }) => (
    <div
      className="bg-[#141E1A] rounded-lg p-6 border border-[rgba(57,255,20,0.2)] overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Title/Header */}
      <ShimmerLine width="40%" delay={delay} />

      {/* Content Lines */}
      <ShimmerLine width="100%" delay={delay + 100} />
      <ShimmerLine width="95%" delay={delay + 150} />
      <ShimmerLine width="85%" delay={delay + 200} />

      {/* Spacing */}
      <div style={{ height: '12px' }} />

      {/* Secondary Content */}
      <ShimmerLine width="60%" delay={delay + 250} />
      <ShimmerLine width="75%" delay={delay + 300} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Exercise Block */}
      <div className="bg-[#141E1A] rounded-lg p-6 border border-[rgba(57,255,20,0.2)] overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-gradient-to-r from-[#0A0F0D] via-[#1A3A28] to-[#0A0F0D] bg-[length:1000px_100%] animate-shimmer" />
          <ShimmerLine width="30%" delay={0} />
        </div>
        <ShimmerLine width="100%" delay={50} />
        <ShimmerLine width="100%" delay={100} />
        <ShimmerLine width="80%" delay={150} />
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid gap-6">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} delay={200 + i * 100} />
        ))}
      </div>

      {/* Timeline Pulse */}
      <div className="bg-[#141E1A] rounded-lg p-4 border border-[rgba(57,255,20,0.2)] animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <div className="h-2 rounded-full bg-gradient-to-r from-[#0A0F0D] via-[#39FF14] to-[#0A0F0D] bg-[length:1000px_100%] animate-shimmer" />
      </div>
    </div>
  );
}
