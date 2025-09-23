import { Suspense } from 'react'
import PoolRideClient from './PoolRideClient'

export default function PoolRidePage() {
  // Server component wrapper ensures client hooks like useSearchParams are within a Suspense boundary
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PoolRideClient />
    </Suspense>
  )
}
