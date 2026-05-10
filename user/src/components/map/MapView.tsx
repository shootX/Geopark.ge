'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapStore } from '@/store/mapStore';
import { useNearbyParkings } from '@/hooks/useQueries';
import { MAP_CONFIG, MAPBOX_TOKEN } from '@/utils/constants';
import { MapControls } from './MapControls';
import type { Parking } from '@/types';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapViewProps {
  onParkingSelect?: (parking: Parking) => void;
  className?: string;
}

export function MapView({ onParkingSelect, className = '' }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const {
    viewState,
    userLocation,
    filters,
    setViewState,
    setUserLocation,
    setLoaded,
    selectedParking,
  } = useMapStore();

  const { data: parkings = [] } = useNearbyParkings({
    latitude: viewState.latitude,
    longitude: viewState.longitude,
    radius: filters.maxDistance,
    max_price: filters.maxPrice ?? undefined,
    min_price: filters.minPrice ?? undefined,
    only_available: filters.onlyAvailable || undefined,
  });

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      maxZoom: MAP_CONFIG.maxZoom,
      minZoom: MAP_CONFIG.minZoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      setMapReady(true);
      setLoaded(true);
    });

    map.on('move', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setViewState({
        latitude: center.lat,
        longitude: center.lng,
        zoom,
      });
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      setLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map initialisation only runs once
  }, []);

  // User location
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });

          // Add user location marker
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.innerHTML = `
            <div class="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg
                        animate-pulse ring-2 ring-blue-400" />
          `;

          new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          // Fly to user on first load
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: MAP_CONFIG.zoom + 1,
            duration: 1500,
          });
        },
        () => {
          // Default to Tbilisi center
          mapRef.current?.flyTo({
            center: [MAP_CONFIG.center.lng, MAP_CONFIG.center.lat],
            zoom: MAP_CONFIG.zoom,
            duration: 1000,
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [mapReady, setUserLocation]);

  // Update markers when parkings change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    parkings.forEach((parking) => {
      const el = createMarkerElement(parking);
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
        createPopupHTML(parking)
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([parking.longitude, parking.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      el.addEventListener('click', () => {
        onParkingSelect?.(parking);
        useMapStore.getState().setSelectedParking(parking);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [parkings, mapReady, onParkingSelect]);

  // Handle selected parking -> fly to it
  useEffect(() => {
    if (selectedParking && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedParking.longitude, selectedParking.latitude],
        zoom: 16,
        duration: 800,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapRef is a ref, stable across renders
  }, [selectedParking?.id, selectedParking?.longitude, selectedParking?.latitude]);

  const handleLocateMe = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      duration: 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapRef is a ref, stable across renders
  }, [userLocation?.latitude, userLocation?.longitude]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {mapReady && (
        <MapControls
          onLocateMe={handleLocateMe}
          hasUserLocation={!!userLocation}
        />
      )}

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Marker Element ───

function createMarkerElement(parking: Parking): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'parking-marker cursor-pointer transition-transform hover:scale-110';

  const priceColor =
    parking.base_price < 10
      ? 'bg-green-500'
      : parking.base_price < 25
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const availColor = parking.available_slots > 0 ? 'text-green-600' : 'text-red-500';

  el.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="${priceColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg
                  whitespace-nowrap -mb-1 z-10">
        ${parking.base_price}₾/h
      </div>
      <div class="w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md
                  ${parking.available_slots > 0 ? '' : 'opacity-50'}" />
    </div>
  `;

  return el;
}

// ─── Helper: Popup HTML ───

function createPopupHTML(parking: Parking): string {
  const occupancy = parking.occupancy_rate ?? 0;
  const isOpen = parking.is_open;

  return `
    <div class="p-2 min-w-[200px]">
      <h3 class="font-bold text-sm text-gray-900">${parking.title}</h3>
      <p class="text-xs text-gray-500 mt-1">${parking.address}</p>
      <div class="flex items-center justify-between mt-2">
        <span class="text-lg font-bold text-emerald-600">${parking.base_price}₾<span class="text-xs text-gray-400">/h</span></span>
        <span class="text-xs ${parking.available_slots > 0 ? 'text-green-600' : 'text-red-500'}">
          ${parking.available_slots}/${parking.total_slots} slots
        </span>
      </div>
      <div class="mt-1 w-full bg-gray-200 rounded-full h-1.5">
        <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${Math.min(occupancy, 100)}%"></div>
      </div>
      <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>${isOpen ? '🟢 Open' : '🔴 Closed'}</span>
        ${parking.distance ? `<span>${parking.distance.toFixed(1)} km</span>` : ''}
      </div>
    </div>
  `;
}
