import { create } from 'zustand';
import type { Parking } from '@/types';
import type { MapViewState, ParkingFilters } from '@/types';
import { MAP_CONFIG } from '@/utils/constants';

interface MapState {
  viewState: MapViewState;
  selectedParking: Parking | null;
  isBottomSheetOpen: boolean;
  filters: ParkingFilters;
  userLocation: { latitude: number; longitude: number } | null;
  nearbyParkings: Parking[];
  isLoaded: boolean;

  setViewState: (state: Partial<MapViewState>) => void;
  setSelectedParking: (parking: Parking | null) => void;
  setBottomSheetOpen: (open: boolean) => void;
  setFilters: (filters: Partial<ParkingFilters>) => void;
  resetFilters: () => void;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  setNearbyParkings: (parkings: Parking[]) => void;
  setLoaded: (loaded: boolean) => void;
}

const defaultFilters: ParkingFilters = {
  maxPrice: null,
  minPrice: null,
  onlyAvailable: true,
  maxDistance: 10,
  searchQuery: '',
};

export const useMapStore = create<MapState>()((set) => ({
  viewState: {
    latitude: MAP_CONFIG.center.lat,
    longitude: MAP_CONFIG.center.lng,
    zoom: MAP_CONFIG.zoom,
  },
  selectedParking: null,
  isBottomSheetOpen: false,
  filters: { ...defaultFilters },
  userLocation: null,
  nearbyParkings: [],
  isLoaded: false,

  setViewState: (partial) =>
    set((state) => ({
      viewState: { ...state.viewState, ...partial },
    })),

  setSelectedParking: (parking) =>
    set({
      selectedParking: parking,
      isBottomSheetOpen: !!parking,
    }),

  setBottomSheetOpen: (open) =>
    set({
      isBottomSheetOpen: open,
      selectedParking: open ? undefined : null,
    }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  setUserLocation: (location) =>
    set({
      userLocation: location,
      viewState: {
        latitude: location.latitude,
        longitude: location.longitude,
        zoom: MAP_CONFIG.zoom + 1,
      },
    }),

  setNearbyParkings: (parkings) => set({ nearbyParkings: parkings }),

  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));
