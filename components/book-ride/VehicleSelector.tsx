"use client"

export type Vehicle = { name: string; price: string; passengers: string }

export default function VehicleSelector({
  vehicles,
  selected,
  onSelect,
}: {
  vehicles: Vehicle[]
  selected: string | null
  onSelect: (name: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-2">
      {vehicles.map((vehicle, index) => {
        const isSelected = selected === vehicle.name
        return (
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(vehicle.name)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(vehicle.name) } }}
            className={`p-4 rounded-lg transition-colors cursor-pointer border ${
              isSelected ? 'bg-white border-[#171717] ring-2 ring-[#171717]' : 'bg-white/60 border-[#d8d8d8] hover:bg-white/80'
            }`}
            aria-pressed={isSelected}
          >
            <h3 className="font-semibold text-[#171717] mb-1">{vehicle.name}</h3>
            <p className="text-sm text-[#333333] mb-1">{vehicle.price}</p>
            <p className="text-xs text-[#666666]">{vehicle.passengers}</p>
          </div>
        )
      })}
    </div>
  )
}
