"use client"
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

type Prediction = { description: string; place_id: string }

export default function LocationAutocomplete({
  placeholder,
  query,
  setQuery,
  predictions,
  showDropdown,
  onFocus,
  onBlur,
  onSelect,
  showUseCurrent,
  onUseCurrent,
}: {
  placeholder: string
  query: string
  setQuery: (v: string) => void
  predictions: Prediction[]
  showDropdown: boolean
  onFocus: () => void
  onBlur: () => void
  onSelect: (placeId: string, description: string) => void
  showUseCurrent?: boolean
  onUseCurrent?: () => void
}) {
  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333333]" />
      <Input
        placeholder={placeholder}
        className="pl-10 bg-white/60 border-[#d8d8d8] text-[#171717] placeholder:text-[#666666]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {showDropdown && (predictions.length > 0 || showUseCurrent) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur border border-[#e5e5e5] rounded-md shadow max-h-64 overflow-auto">
          {showUseCurrent && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-start gap-2 border-b border-[#eee]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onUseCurrent}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
              <span className="text-sm text-[#171717]">Use current location</span>
            </button>
          )}
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-start gap-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(p.place_id, p.description)}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-[#666666]" />
              <span className="text-sm text-[#171717]">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
