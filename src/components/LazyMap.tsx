import { lazy, Suspense, ComponentType, useMemo } from 'react'
import { Loading } from './ui/loading'

// Type pour les props de Map
interface MapProps {
  googleMapsApiKey?: string;
  libraries?: ("drawing" | "geometry" | "localContext" | "places" | "visualization")[];
  [key: string]: any;
}

/**
 * Lazy loading of the heavy Google Maps library and internal loading synchronization.
 */
const MapInternal = lazy(async () => {
  const module = await import('@react-google-maps/api');
  const { GoogleMap, useJsApiLoader } = module;

  const MapWrapper = (props: MapProps) => {
    const { googleMapsApiKey, libraries, ...rest } = props;

    // We use the loader hook HERE, inside the lazy-loaded chunk
    const { isLoaded, loadError } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: googleMapsApiKey || '',
      libraries: libraries as any
    });

    if (loadError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-red-500 p-4 text-center">
          Erreur lors du chargement de Google Maps. Veuillez vérifier votre connexion.
        </div>
      );
    }

    if (!isLoaded) return <Loading />;

    // Once loaded, 'google' is available globably, and we can safely render the map
    return <GoogleMap {...rest} />;
  }

  return { default: MapWrapper };
});

export const LazyMap = (props: MapProps) => {
  return (
    <Suspense fallback={<Loading />}>
      <MapInternal {...props} />
    </Suspense>
  )
}

// For Markers and other sub-components, we also want to be safe.
// They are usually children of LazyMap, so they should only mount when map is ready.
// By using lazy, we also ensure their code is in the separate chunk.

export const LazyMarker = lazy(async () => {
  const module = await import('@react-google-maps/api')
  return { default: module.Marker }
})

export const LazyInfoWindow = lazy(async () => {
  const module = await import('@react-google-maps/api')
  return { default: module.InfoWindow }
})

export const LazyDirectionsRenderer = lazy(async () => {
  const module = await import('@react-google-maps/api')
  return { default: module.DirectionsRenderer }
})

export const LazyAutocomplete = lazy(async () => {
  const module = await import('@react-google-maps/api')
  return { default: module.Autocomplete }
})
