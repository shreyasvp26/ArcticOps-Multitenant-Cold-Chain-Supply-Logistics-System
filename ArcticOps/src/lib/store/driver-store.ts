"use client"
import { create } from "zustand"
import type { Shipment } from "@/lib/types/shipment"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

interface DriverState {
  currentAssignment: Shipment | null
  deliveryProgress: {
    arrivalConfirmed: boolean
    arrivalTimestamp?: string
    photoUploaded: boolean
    signatureCaptured: boolean
    tempLogSnapshot?: number
    conditionNotes?: string
    submitted: boolean
  }
  uploadedDocIds: string[]
  setAssignment: (shipmentId: string) => void
  confirmArrival: () => void
  uploadDoc: (docId: string) => void
  setPhotoUploaded: () => void
  setSignatureCaptured: () => void
  setTempLogSnapshot: (temp: number) => void
  setConditionNotes: (notes: string) => void
  submitDelivery: () => void
  resetDelivery: () => void
}

export const useDriverStore = create<DriverState>()((set, get) => ({
  currentAssignment: MOCK_SHIPMENTS.find((s) => s.id === "SH-2847") ?? null,
  deliveryProgress: {
    arrivalConfirmed: false,
    photoUploaded: false,
    signatureCaptured: false,
    submitted: false,
  },
  uploadedDocIds: [],

  setAssignment: (shipmentId) => {
    const shipment = MOCK_SHIPMENTS.find((s) => s.id === shipmentId) ?? null
    set({ currentAssignment: shipment })
  },

  confirmArrival: () =>
    set((s) => ({
      deliveryProgress: { ...s.deliveryProgress, arrivalConfirmed: true, arrivalTimestamp: new Date().toISOString() },
    })),

  uploadDoc: (docId) =>
    set((s) => ({
      uploadedDocIds: [...new Set([...s.uploadedDocIds, docId])],
    })),

  setPhotoUploaded: () =>
    set((s) => ({ deliveryProgress: { ...s.deliveryProgress, photoUploaded: true } })),

  setSignatureCaptured: () =>
    set((s) => ({ deliveryProgress: { ...s.deliveryProgress, signatureCaptured: true } })),

  setTempLogSnapshot: (temp) =>
    set((s) => ({ deliveryProgress: { ...s.deliveryProgress, tempLogSnapshot: temp } })),

  setConditionNotes: (notes) =>
    set((s) => ({ deliveryProgress: { ...s.deliveryProgress, conditionNotes: notes } })),

  submitDelivery: () =>
    set((s) => ({ deliveryProgress: { ...s.deliveryProgress, submitted: true } })),

  resetDelivery: () =>
    set({
      deliveryProgress: {
        arrivalConfirmed: false,
        photoUploaded: false,
        signatureCaptured: false,
        submitted: false,
      },
    }),
}))
