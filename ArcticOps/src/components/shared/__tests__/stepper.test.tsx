import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Stepper } from "../stepper"

const steps = [
  { id: 1, label: "Company Profile" },
  { id: 2, label: "Compliance" },
  { id: 3, label: "Team Invites" },
]

describe("Stepper", () => {
  it("renders all step labels", () => {
    render(<Stepper steps={steps} currentStep={0} />)
    expect(screen.getByText("Company Profile")).toBeInTheDocument()
    expect(screen.getByText("Compliance")).toBeInTheDocument()
    expect(screen.getByText("Team Invites")).toBeInTheDocument()
  })

  it("has accessible role='list'", () => {
    render(<Stepper steps={steps} currentStep={0} />)
    expect(screen.getByRole("list")).toHaveAttribute("aria-label", "Progress steps")
  })

  it("renders list items", () => {
    render(<Stepper steps={steps} currentStep={0} />)
    expect(screen.getAllByRole("listitem").length).toBe(3)
  })

  it("marks current step with aria-current", () => {
    const { container } = render(<Stepper steps={steps} currentStep={1} />)
    const currentMarker = container.querySelector("[aria-current='step']")
    expect(currentMarker).toBeInTheDocument()
  })

  it("shows step numbers for upcoming steps", () => {
    render(<Stepper steps={steps} currentStep={0} />)
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("shows check icon for completed steps", () => {
    const { container } = render(<Stepper steps={steps} currentStep={2} />)
    const checks = container.querySelectorAll("svg[aria-hidden='true']")
    expect(checks.length).toBeGreaterThanOrEqual(2)
  })

  it("renders connector lines between steps", () => {
    const { container } = render(<Stepper steps={steps} currentStep={0} />)
    const connectors = container.querySelectorAll("[aria-hidden='true']")
    expect(connectors.length).toBeGreaterThan(0)
  })
})
