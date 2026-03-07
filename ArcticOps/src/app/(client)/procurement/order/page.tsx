import { redirect } from "next/navigation"

export default function OrderBuilderPage() {
  redirect("/procurement?view=wizard")
}
