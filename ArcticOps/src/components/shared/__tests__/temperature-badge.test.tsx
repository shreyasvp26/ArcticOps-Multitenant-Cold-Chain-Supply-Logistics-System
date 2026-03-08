import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TemperatureBadge } from "../temperature-badge"

describe("TemperatureBadge", () => {
  it("displays temperature with 1 decimal place and unit", () => {
    render(
      <TemperatureBadge temperature={4.2} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    expect(screen.getByText("4.2°C")).toBeInTheDocument()
  })

  it("has accessible aria-label for in-range temperature", () => {
    render(
      <TemperatureBadge temperature={4.2} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    expect(
      screen.getByLabelText("Temperature: 4.2°C — Refrigerated")
    ).toBeInTheDocument()
  })

  it("has accessible aria-label for excursion", () => {
    render(
      <TemperatureBadge temperature={15} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    expect(
      screen.getByLabelText(/Excursion/)
    ).toBeInTheDocument()
  })

  it("has accessible aria-label for approaching limit", () => {
    render(
      <TemperatureBadge temperature={1.6} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    expect(
      screen.getByLabelText(/Approaching limit/)
    ).toBeInTheDocument()
  })

  it("renders icon with aria-hidden", () => {
    const { container } = render(
      <TemperatureBadge temperature={4.2} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    const icon = container.querySelector("svg")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("displays correct color for excursion", () => {
    const { container } = render(
      <TemperatureBadge temperature={15} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge.style.color).toBe("rgb(255, 71, 87)")
  })

  it("displays zone color for in-range temperature", () => {
    const { container } = render(
      <TemperatureBadge temperature={5} zone="refrigerated" requiredMin={2} requiredMax={8} />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge.style.color).toBe("rgb(6, 182, 212)")
  })

  it("renders frozen zone correctly", () => {
    render(
      <TemperatureBadge temperature={-20} zone="frozen" requiredMin={-25} requiredMax={-15} />
    )
    expect(screen.getByText("-20.0°C")).toBeInTheDocument()
    expect(screen.getByLabelText(/Frozen/)).toBeInTheDocument()
  })

  it("renders ultra-cold zone correctly", () => {
    render(
      <TemperatureBadge temperature={-70} zone="ultra_cold" requiredMin={-80} requiredMax={-60} />
    )
    expect(screen.getByText("-70.0°C")).toBeInTheDocument()
    expect(screen.getByLabelText(/Ultra-Cold/)).toBeInTheDocument()
  })
})
