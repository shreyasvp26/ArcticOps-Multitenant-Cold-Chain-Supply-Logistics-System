import { redirect } from "next/navigation"

export default function OrderHistoryPage() {
  redirect("/procurement?view=history")
}
