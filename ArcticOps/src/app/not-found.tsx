import Link from "next/link"

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--ao-background)",
        color: "var(--ao-text-primary)",
        gap: "1.5rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--ao-font-display)",
          fontSize: "6rem",
          fontWeight: 700,
          color: "var(--ao-text-muted)",
          lineHeight: 1,
          margin: 0,
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "var(--ao-font-display)",
          fontSize: "1.5rem",
          fontWeight: 600,
          margin: 0,
        }}
      >
        Route not found
      </h1>
      <p
        style={{
          fontFamily: "var(--ao-font-body)",
          fontSize: "1rem",
          color: "var(--ao-text-secondary)",
          maxWidth: "400px",
          margin: 0,
        }}
      >
        The shipment you&apos;re looking for may have been delivered — or it never existed.
      </p>
      <Link
        href="/login"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--ao-accent)",
          color: "var(--ao-background)",
          borderRadius: "0.5rem",
          fontFamily: "var(--ao-font-body)",
          fontWeight: 500,
          textDecoration: "none",
          fontSize: "0.875rem",
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
