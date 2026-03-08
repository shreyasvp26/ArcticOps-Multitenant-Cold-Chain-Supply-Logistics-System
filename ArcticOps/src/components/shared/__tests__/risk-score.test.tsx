import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RiskScore } from "../risk-score"

describe("RiskScore", () => {
  it("renders the score value", () => {
    const { container } = render(<RiskScore score={73} />)
    const text = container.querySelector("text")
    expect(text?.textContent).toBe("73")
  })

  it("shows risk label by default", () => {
    render(<RiskScore score={73} />)
    expect(screen.getByText("High Risk")).toBeInTheDocument()
  })

  it("hides label when showLabel is false", () => {
    render(<RiskScore score={73} showLabel={false} />)
    expect(screen.queryByText("High Risk")).not.toBeInTheDocument()
  })

  it("has accessible aria-label", () => {
    render(<RiskScore score={73} />)
    expect(
      screen.getByLabelText("Risk score: 73 out of 100, High risk")
    ).toBeInTheDocument()
  })

  it("clamps score to 0-100 range", () => {
    const { container: c1 } = render(<RiskScore score={150} />)
    expect(c1.querySelector("text")?.textContent).toBe("100")

    const { container: c2 } = render(<RiskScore score={-10} />)
    expect(c2.querySelector("text")?.textContent).toBe("0")
  })

  it("labels low risk correctly", () => {
    render(<RiskScore score={10} />)
    expect(screen.getByText("Low Risk")).toBeInTheDocument()
  })

  it("labels medium risk correctly", () => {
    render(<RiskScore score={35} />)
    expect(screen.getByText("Medium Risk")).toBeInTheDocument()
  })

  it("labels critical risk correctly", () => {
    render(<RiskScore score={90} />)
    expect(screen.getByText("Critical Risk")).toBeInTheDocument()
  })

  it("accepts custom label", () => {
    render(<RiskScore score={50} label="Custom" />)
    expect(screen.getByText("Custom Risk")).toBeInTheDocument()
  })

  it("renders SVG with aria-hidden", () => {
    const { container } = render(<RiskScore score={50} />)
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
  })

  it("renders all three sizes without error", () => {
    const sizes = ["sm", "md", "lg"] as const
    sizes.forEach((size) => {
      const { unmount } = render(<RiskScore score={50} size={size} />)
      unmount()
    })
  })
})
