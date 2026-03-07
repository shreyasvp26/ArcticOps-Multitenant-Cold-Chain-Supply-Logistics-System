import { LoadingCrystallize } from "@/components/shared/loading-crystallize"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <LoadingCrystallize size="lg" label="Loading…" />
    </div>
  )
}
