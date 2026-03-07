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
        background: "linear-gradient(135deg, #0A1628 0%, #111D33 50%, #0A1628 100%)",
        padding: "2rem",
      }}
    >
      {children}
    </div>
  )
}
