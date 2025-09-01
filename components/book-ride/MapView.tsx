"use client"
import { GoogleMap, LoadScript, OverlayView, Polygon, MarkerF, DirectionsRenderer } from '@react-google-maps/api'

export default function MapView({
  mapsReady,
  setMapsReady,
  defaultCenter,
  userLocation,
  mapZoom,
  mapRef,
  placesServiceRef,
  conePath,
  pickupLocation,
  dropLocation,
  pickupMarkerOptions,
  dropMarkerOptions,
  routeResult,
}: {
  mapsReady: boolean
  setMapsReady: (ready: boolean) => void
  defaultCenter: { lat: number; lng: number }
  userLocation: { lat: number; lng: number } | null
  mapZoom: number
  mapRef: React.MutableRefObject<any>
  placesServiceRef: React.MutableRefObject<any>
  conePath: { lat: number; lng: number }[] | null
  pickupLocation: { lat: number; lng: number } | null
  dropLocation: { lat: number; lng: number } | null
  pickupMarkerOptions: any
  dropMarkerOptions: any
  routeResult: any
}) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={["places"]} onLoad={() => setMapsReady(true)}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={userLocation ?? defaultCenter}
          zoom={mapZoom}
          onLoad={(map) => {
            mapRef.current = map
            const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
            if (g?.maps?.places && !placesServiceRef.current) {
              placesServiceRef.current = new g.maps.places.PlacesService(map)
            }
          }}
        >
          {conePath && (
            <Polygon paths={conePath} options={{ fillColor: '#4285F4', fillOpacity: 0.2, strokeOpacity: 0 }} />
          )}
          {userLocation && (
            <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div style={{ position: 'relative', width: 0, height: 0, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                <span
                  style={{ display: 'block', width: 14, height: 14, background: '#1A73E8', borderRadius: 9999, boxShadow: '0 0 0 6px rgba(26, 115, 232, 0.25)', border: '2px solid #fff' }}
                  title="Your location"
                />
              </div>
            </OverlayView>
          )}
          {pickupLocation && (
            <MarkerF position={pickupLocation} options={pickupMarkerOptions} title="Pickup location" />
          )}
          {dropLocation && (
            <MarkerF position={dropLocation} options={dropMarkerOptions} title="Drop location" />
          )}
          {routeResult && (
            <DirectionsRenderer directions={routeResult} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#171717', strokeWeight: 4 } }} />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  )
}
