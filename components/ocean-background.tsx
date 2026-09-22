/**
 * Ambient ocean depth: a slow gradient drift, two light rays and a slow bubble column.
 * Values are hard-coded rather than random so server and client render identically.
 */

const BUBBLES = [
  { left: "8%", size: 6, duration: 22, delay: 0, drift: "18px", opacity: 0.25 },
  { left: "19%", size: 3, duration: 28, delay: 6, drift: "-12px", opacity: 0.18 },
  { left: "31%", size: 8, duration: 34, delay: 12, drift: "24px", opacity: 0.2 },
  { left: "44%", size: 4, duration: 26, delay: 3, drift: "-20px", opacity: 0.22 },
  { left: "58%", size: 5, duration: 31, delay: 16, drift: "14px", opacity: 0.16 },
  { left: "69%", size: 3, duration: 24, delay: 9, drift: "-10px", opacity: 0.24 },
  { left: "78%", size: 7, duration: 36, delay: 20, drift: "22px", opacity: 0.18 },
  { left: "91%", size: 4, duration: 29, delay: 14, drift: "-16px", opacity: 0.2 },
];

export function OceanBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020814_0%,#04101f_28%,#072044_62%,#0a3358_100%)]" />

      {/* Deep currents drifting under the surface */}
      <div className="absolute -top-1/4 left-1/2 h-[70vh] w-[140vw] -translate-x-1/2 animate-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,230,197,0.16),transparent_62%)] blur-3xl" />
      <div
        className="absolute bottom-[-20vh] left-[-10vw] h-[60vh] w-[90vw] animate-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgba(13,85,112,0.55),transparent_68%)] blur-3xl"
        style={{ animationDelay: "-8s" }}
      />

      {/* Light rays from the surface */}
      <div className="absolute -top-[30vh] left-[12%] h-[120vh] w-[28vw] animate-sweep bg-[linear-gradient(180deg,rgba(95,227,239,0.20),transparent_72%)] blur-2xl" />
      <div
        className="absolute -top-[30vh] right-[8%] h-[110vh] w-[18vw] animate-sweep bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_66%)] blur-2xl"
        style={{ animationDelay: "-6s" }}
      />

      {BUBBLES.map((bubble, index) => (
        <span
          key={index}
          className="absolute bottom-0 animate-rise rounded-full bg-foam/40"
          style={
            {
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `-${bubble.delay}s`,
              "--bubble-drift": bubble.drift,
              "--bubble-opacity": bubble.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Grain keeps the large gradients from banding */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
}
