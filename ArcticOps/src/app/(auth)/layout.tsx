export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,200,168,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(77,158,255,0.06) 0%, transparent 55%), linear-gradient(160deg, #04090F 0%, #060D1B 35%, #0A1525 65%, #060D1B 100%)",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(30,48,80,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(30,48,80,0.18) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%)",
        }}
      />
      {/* Top-left glow orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,168,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom-right glow orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-5%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,158,255,0.055) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      {/* Center glow — very subtle */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(0,200,168,0.025) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      {/* Floating brand watermark circles */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          border: "1px solid rgba(0,200,168,0.05)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          border: "1px solid rgba(0,200,168,0.03)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        {children}
      </div>
    </div>
  )
}
