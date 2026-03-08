import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "../status-badge"

describe("StatusBadge", () => {
  it("renders the correct label for each status", () => {
    const statuses = [
      { status: "on_track" as const, label: "On Track" },
      { status: "in_transit" as const, label: "In Transit" },
      { status: "delayed" as const, label: "Delayed" },
      { status: "at_risk" as const, label: "At Risk" },
      { status: "delivered" as const, label: "Delivered" },
      { status: "pending" as const, label: "Pending" },
      { status: "excursion" as const, label: "Excursion" },
      { status: "compliant" as const, label: "Compliant" },
      { status: "non_compliant" as const, label: "Non-Compliant" },
    ]

    statuses.forEach(({ status, label }) => {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    })
  })

  it("has accessible aria-label", () => {
    render(<StatusBadge status="on_track" />)
    expect(screen.getByLabelText("Status: On Track")).toBeInTheDocument()
  })

  it("renders icon with aria-hidden", () => {
    const { container } = render(<StatusBadge status="on_track" />)
    const icon = container.querySelector("svg")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("applies custom className", () => {
    const { container } = render(<StatusBadge status="on_track" className="test-class" />)
    expect(container.firstChild).toHaveClass("test-class")
  })

  it("renders all three sizes", () => {
    const sizes = ["sm", "md", "lg"] as const
    sizes.forEach((size) => {
      const { unmount } = render(<StatusBadge status="on_track" size={size} />)
      expect(screen.getByLabelText("Status: On Track")).toBeInTheDocument()
      unmount()
    })
  })

  it("uses correct color for danger statuses", () => {
    const { container } = render(<StatusBadge status="at_risk" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.color).toBe("rgb(255, 71, 87)")
  })

  it("uses correct color for success statuses", () => {
    const { container } = render(<StatusBadge status="on_track" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.color).toBe("rgb(46, 213, 115)")
  })
})
