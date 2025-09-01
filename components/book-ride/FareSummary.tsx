"use client"
import { Button } from '@/components/ui/button'

export default function FareSummary({
  distanceText,
  durationText,
  fareAmount,
  onPayNow,
}: {
  distanceText: string | null
  durationText: string | null
  fareAmount: number | null
  onPayNow: () => void
}) {
  if (fareAmount == null && !distanceText && !durationText) return null
  return (
    <div className="mt-4 p-4 bg-white/80 border border-[#e5e5e5] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[#333]">Distance</div>
        <div className="text-sm font-medium text-[#171717]">{distanceText ?? '-'}</div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-[#333]">ETA</div>
        <div className="text-sm font-medium text-[#171717]">{durationText ?? '-'}</div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[#333]">Estimated Fare</div>
        <div className="text-lg font-semibold text-[#171717]">₹{fareAmount?.toLocaleString() ?? '-'}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button className="bg-[#10b981] hover:bg-[#0ea971] text-white" onClick={onPayNow}>Pay Now</Button>
        <Button variant="outline" className="border-[#d8d8d8]">Pay Later</Button>
      </div>
    </div>
  )
}
