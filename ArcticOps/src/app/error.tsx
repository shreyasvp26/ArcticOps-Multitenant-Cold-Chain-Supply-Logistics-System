"use client"

import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
      <h1
        style={{
          fontFamily: "var(--ao-font-display)",
          fontSize: "1.75rem",
          fontWeight: 600,
          margin: 0,
        }}
      >
        Something went wrong
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
        Our cold-chain is still running — this is just a display issue.
        {error?.digest && (
          <span style={{ display: "block", fontFamily: "var(--ao-font-mono)", fontSize: "0.75rem", marginTop: "0.5rem", color: "var(--ao-text-muted)" }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "var(--ao-accent)",
            color: "var(--ao-background)",
            borderRadius: "0.5rem",
            fontFamily: "var(--ao-font-body)",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try Again
        </button>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "transparent",
            color: "var(--ao-text-secondary)",
            borderRadius: "0.5rem",
            fontFamily: "var(--ao-font-body)",
            fontWeight: 500,
            textDecoration: "none",
            border: "1px solid var(--ao-border)",
            fontSize: "0.875rem",
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
