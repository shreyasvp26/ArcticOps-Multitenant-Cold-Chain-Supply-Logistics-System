import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { EmptyState } from "../empty-state"
import { Search } from "lucide-react"

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No shipments found" />)
    expect(screen.getByText("No shipments found")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No shipments found"
        description="Try adjusting your filters"
      />
    )
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />)
    const paragraphs = container.querySelectorAll("p")
    expect(paragraphs.length).toBe(0)
  })

  it("renders CTA button when provided", () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="No data"
        cta={{ label: "Clear Filters", onClick }}
      />
    )
    const button = screen.getByText("Clear Filters")
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not render CTA when not provided", () => {
    render(<EmptyState title="No data" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders custom icon", () => {
    const { container } = render(<EmptyState title="Search" icon={Search} />)
    const icon = container.querySelector("svg")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("applies custom className", () => {
    const { container } = render(<EmptyState title="Test" className="my-class" />)
    expect(container.firstChild).toHaveClass("my-class")
  })
})
