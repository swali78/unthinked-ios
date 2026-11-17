/** The live orb's face as a static app icon, for next/og ImageResponse. */
export function OrbIcon({ size }: { size: number }) {
  const orb = size * 0.7;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 35%, #26323a 0%, #0b0b0c 72%)",
      }}
    >
      <div
        style={{
          width: orb,
          height: orb,
          borderRadius: "50%",
          display: "flex",
          position: "relative",
          // Same lagoon → sand → clay wash as ORB_COLORS in ai-orb.tsx
          background: "linear-gradient(135deg, #4FA3B8 0%, #E9C99F 55%, #C9785A 100%)",
          boxShadow: `0 0 ${size * 0.14}px rgba(79,163,184,0.45)`,
        }}
      >
        {[31, 56].map((left) => (
          <div
            key={left}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "34%",
              width: "13%",
              height: "28%",
              borderRadius: orb,
              background: "#0C0C10",
            }}
          />
        ))}
      </div>
    </div>
  );
}
