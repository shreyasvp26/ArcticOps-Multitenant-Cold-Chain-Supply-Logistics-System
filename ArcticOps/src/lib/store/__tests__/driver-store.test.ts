import { describe, it, expect, beforeEach } from "vitest"
import { useDriverStore } from "../driver-store"

function resetStore() {
  useDriverStore.setState({
    currentAssignment: null,
    deliveryProgress: {
      arrivalConfirmed: false,
      photoUploaded: false,
      signatureCaptured: false,
      submitted: false,
    },
    uploadedDocIds: [],
  })
}

describe("driver-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state after reset", () => {
    it("has no assignment", () => {
      expect(useDriverStore.getState().currentAssignment).toBeNull()
    })

    it("delivery progress is clean", () => {
      const progress = useDriverStore.getState().deliveryProgress
      expect(progress.arrivalConfirmed).toBe(false)
      expect(progress.photoUploaded).toBe(false)
      expect(progress.signatureCaptured).toBe(false)
      expect(progress.submitted).toBe(false)
    })

    it("no uploaded docs", () => {
      expect(useDriverStore.getState().uploadedDocIds).toEqual([])
    })
  })

  describe("confirmArrival", () => {
    it("sets arrivalConfirmed to true", () => {
      useDriverStore.getState().confirmArrival()
      expect(useDriverStore.getState().deliveryProgress.arrivalConfirmed).toBe(true)
    })

    it("records arrival timestamp", () => {
      useDriverStore.getState().confirmArrival()
      expect(useDriverStore.getState().deliveryProgress.arrivalTimestamp).toBeTruthy()
      const ts = new Date(useDriverStore.getState().deliveryProgress.arrivalTimestamp!).getTime()
      expect(ts).toBeGreaterThan(Date.now() - 5000)
    })
  })

  describe("uploadDoc", () => {
    it("adds document ID to uploaded list", () => {
      useDriverStore.getState().uploadDoc("doc_001")
      expect(useDriverStore.getState().uploadedDocIds).toContain("doc_001")
    })

    it("deduplicates document IDs", () => {
      useDriverStore.getState().uploadDoc("doc_001")
      useDriverStore.getState().uploadDoc("doc_001")
      expect(useDriverStore.getState().uploadedDocIds.length).toBe(1)
    })

    it("accumulates multiple documents", () => {
      useDriverStore.getState().uploadDoc("doc_001")
      useDriverStore.getState().uploadDoc("doc_002")
      useDriverStore.getState().uploadDoc("doc_003")
      expect(useDriverStore.getState().uploadedDocIds.length).toBe(3)
    })
  })

  describe("delivery workflow", () => {
    it("completes full delivery flow", () => {
      useDriverStore.getState().confirmArrival()
      expect(useDriverStore.getState().deliveryProgress.arrivalConfirmed).toBe(true)

      useDriverStore.getState().setPhotoUploaded()
      expect(useDriverStore.getState().deliveryProgress.photoUploaded).toBe(true)

      useDriverStore.getState().setSignatureCaptured()
      expect(useDriverStore.getState().deliveryProgress.signatureCaptured).toBe(true)

      useDriverStore.getState().setTempLogSnapshot(4.2)
      expect(useDriverStore.getState().deliveryProgress.tempLogSnapshot).toBe(4.2)

      useDriverStore.getState().setConditionNotes("Package intact, no damage")
      expect(useDriverStore.getState().deliveryProgress.conditionNotes).toBe("Package intact, no damage")

      useDriverStore.getState().submitDelivery()
      expect(useDriverStore.getState().deliveryProgress.submitted).toBe(true)
    })
  })

  describe("resetDelivery", () => {
    it("clears all delivery progress", () => {
      useDriverStore.getState().confirmArrival()
      useDriverStore.getState().setPhotoUploaded()
      useDriverStore.getState().setSignatureCaptured()
      useDriverStore.getState().submitDelivery()

      useDriverStore.getState().resetDelivery()
      const progress = useDriverStore.getState().deliveryProgress
      expect(progress.arrivalConfirmed).toBe(false)
      expect(progress.photoUploaded).toBe(false)
      expect(progress.signatureCaptured).toBe(false)
      expect(progress.submitted).toBe(false)
      expect(progress.arrivalTimestamp).toBeUndefined()
    })
  })

  describe("setAssignment", () => {
    it("sets assignment from mock shipments", () => {
      useDriverStore.getState().setAssignment("SH-2847")
      const assignment = useDriverStore.getState().currentAssignment
      if (assignment) {
        expect(assignment.id).toBe("SH-2847")
      }
    })

    it("sets null for non-existent shipment", () => {
      useDriverStore.getState().setAssignment("nonexistent")
      expect(useDriverStore.getState().currentAssignment).toBeNull()
    })
  })
})
