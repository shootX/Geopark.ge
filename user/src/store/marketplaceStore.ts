import { create } from 'zustand';
import type {
  ParkingOffer,
  ParkingOfferFilters,
  Wallet,
  WalletTransaction,
  Rating,
  LiveLocation,
} from '@/types';
import { parkingOfferService } from '@/services/parking-offer';
import { walletService } from '@/services/wallet';
import { ratingService } from '@/services/rating';
import { locationService } from '@/services/location';
import { bookingService } from '@/services/booking';
import { useUIStore } from './uiStore';

// ─── Types ───

interface MarketplaceState {
  // Parking Offers
  offers: ParkingOffer[];
  myOffers: ParkingOffer[];
  selectedOffer: ParkingOffer | null;
  offersLoading: boolean;
  offerFilters: ParkingOfferFilters;

  // Wallet
  wallet: Wallet | null;
  walletLoading: boolean;
  transactions: WalletTransaction[];
  transactionsLoading: boolean;

  // Ratings
  receivedRatings: Rating[];
  givenRatings: Rating[];
  ratingsLoading: boolean;

  // Location Tracking
  currentLocation: LiveLocation | null;
  locationLoading: boolean;

  // Actions: Offers
  fetchOffers: (filters?: Partial<ParkingOfferFilters>) => Promise<void>;
  fetchMyOffers: () => Promise<void>;
  fetchOfferById: (id: number) => Promise<ParkingOffer | null>;
  createOffer: (data: Partial<ParkingOffer> & { availability?: unknown[] }) => Promise<ParkingOffer>;
  updateOffer: (id: number, data: Partial<ParkingOffer>) => Promise<ParkingOffer>;
  deleteOffer: (id: number) => Promise<void>;
  activateOffer: (id: number) => Promise<void>;
  pauseOffer: (id: number) => Promise<void>;
  setOfferFilters: (filters: Partial<ParkingOfferFilters>) => void;
  clearOfferFilters: () => void;
  setSelectedOffer: (offer: ParkingOffer | null) => void;

  // Actions: Wallet
  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  walletDeposit: (amount: number) => Promise<void>;
  walletWithdraw: (amount: number) => Promise<void>;

  // Actions: Bookings lifecycle
  approveBooking: (id: number) => Promise<void>;
  rejectBooking: (id: number, reason?: string) => Promise<void>;

  // Actions: Location
  updateLocation: (bookingId: number, latitude: number, longitude: number, heading?: number, speed?: number) => Promise<void>;
  confirmArrival: (bookingId: number) => Promise<void>;
  ownerConfirmArrival: (bookingId: number) => Promise<void>;

  // Actions: Ratings
  fetchReceivedRatings: () => Promise<void>;
  fetchGivenRatings: () => Promise<void>;
  submitRating: (bookingId: number, rating: number, comment?: string) => Promise<void>;
}

const defaultOfferFilters: ParkingOfferFilters = {};

export const useMarketplaceStore = create<MarketplaceState>()((set, get) => ({
  // State
  offers: [],
  myOffers: [],
  selectedOffer: null,
  offersLoading: false,
  offerFilters: { ...defaultOfferFilters },

  wallet: null,
  walletLoading: false,
  transactions: [],
  transactionsLoading: false,

  receivedRatings: [],
  givenRatings: [],
  ratingsLoading: false,

  // Location
  currentLocation: null,
  locationLoading: false,

  // ─── Offer Actions ───

  fetchOffers: async (filters) => {
    const merged = { ...get().offerFilters, ...filters };
    set({ offersLoading: true, offerFilters: merged });
    try {
      const result = await parkingOfferService.getAll(merged);
      set({
        offers: result.offers,
        offersLoading: false,
      });
    } catch (err: unknown) {
      set({ offersLoading: false });
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to fetch offers';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  fetchMyOffers: async () => {
    set({ offersLoading: true });
    try {
      const offers = await parkingOfferService.getMyOffers();
      set({ myOffers: offers, offersLoading: false });
    } catch (err: unknown) {
      set({ offersLoading: false });
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to fetch your offers';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  fetchOfferById: async (id) => {
    try {
      const offer = await parkingOfferService.getById(id);
      set({ selectedOffer: offer });
      return offer;
    } catch {
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message: 'Offer not found' });
      return null;
    }
  },

  createOffer: async (data) => {
    try {
      const offer = await parkingOfferService.create(data);
      set((state) => ({ myOffers: [offer, ...state.myOffers] }));
      useUIStore.getState().addToast({ type: 'success', title: 'Created', message: 'Parking offer created successfully' });
      return offer;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create offer';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
      throw err;
    }
  },

  updateOffer: async (id, data) => {
    try {
      const offer = await parkingOfferService.update(id, data);
      set((state) => ({
        myOffers: state.myOffers.map((o) => (o.id === id ? offer : o)),
      }));
      useUIStore.getState().addToast({ type: 'success', title: 'Updated', message: 'Parking offer updated' });
      return offer;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update offer';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
      throw err;
    }
  },

  deleteOffer: async (id) => {
    try {
      await parkingOfferService.delete(id);
      set((state) => ({
        myOffers: state.myOffers.filter((o) => o.id !== id),
      }));
      useUIStore.getState().addToast({ type: 'success', title: 'Deleted', message: 'Parking offer deleted' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete offer';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  activateOffer: async (id) => {
    try {
      const offer = await parkingOfferService.activate(id);
      set((state) => ({
        myOffers: state.myOffers.map((o) => (o.id === id ? offer : o)),
      }));
      useUIStore.getState().addToast({ type: 'success', title: 'Activated', message: 'Offer is now active' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to activate offer';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  pauseOffer: async (id) => {
    try {
      const offer = await parkingOfferService.pause(id);
      set((state) => ({
        myOffers: state.myOffers.map((o) => (o.id === id ? offer : o)),
      }));
      useUIStore.getState().addToast({ type: 'info', title: 'Paused', message: 'Offer is now paused' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to pause offer';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  setOfferFilters: (filters) =>
    set((state) => ({
      offerFilters: { ...state.offerFilters, ...filters },
    })),

  clearOfferFilters: () => set({ offerFilters: { ...defaultOfferFilters } }),

  setSelectedOffer: (offer) => set({ selectedOffer: offer }),

  // ─── Wallet Actions ───

  fetchWallet: async () => {
    set({ walletLoading: true });
    try {
      const wallet = await walletService.getWallet();
      set({ wallet, walletLoading: false });
    } catch {
      set({ walletLoading: false });
    }
  },

  fetchTransactions: async () => {
    set({ transactionsLoading: true });
    try {
      const { transactions } = await walletService.getTransactions();
      set({ transactions, transactionsLoading: false });
    } catch {
      set({ transactionsLoading: false });
    }
  },

  walletDeposit: async (amount) => {
    try {
      await walletService.deposit(amount);
      useUIStore.getState().addToast({ type: 'success', title: 'Deposit', message: 'Deposit successful' });
      get().fetchWallet();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Deposit failed';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  walletWithdraw: async (amount) => {
    try {
      await walletService.withdraw(amount);
      useUIStore.getState().addToast({ type: 'success', title: 'Withdrawal', message: 'Withdrawal successful' });
      get().fetchWallet();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Withdrawal failed';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  // ─── Booking Lifecycle Actions ───

  approveBooking: async (id) => {
    try {
      await bookingService.approve(id);
      useUIStore.getState().addToast({ type: 'success', title: 'Approved', message: 'Booking approved' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to approve booking';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  rejectBooking: async (id, reason) => {
    try {
      await bookingService.reject(id, reason);
      useUIStore.getState().addToast({ type: 'info', title: 'Rejected', message: 'Booking rejected' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reject booking';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  // ─── Location Actions ───

  updateLocation: async (bookingId, latitude, longitude, heading, speed) => {
    try {
      const location = await locationService.updateLocation(bookingId, latitude, longitude, heading, speed);
      set({ currentLocation: location });
    } catch {
      // silent - location updates are frequent
    }
  },

  confirmArrival: async (bookingId) => {
    try {
      await locationService.confirmArrival(bookingId);
      useUIStore.getState().addToast({ type: 'success', title: 'Arrived', message: 'Arrival confirmed' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to confirm arrival';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  ownerConfirmArrival: async (bookingId) => {
    try {
      await locationService.ownerConfirmArrival(bookingId);
      useUIStore.getState().addToast({ type: 'success', title: 'Confirmed', message: 'Renter arrival confirmed' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to confirm arrival';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },

  // ─── Rating Actions ───

  fetchReceivedRatings: async () => {
    set({ ratingsLoading: true });
    try {
      const result = await ratingService.getReceived();
      set({ receivedRatings: result.ratings, ratingsLoading: false });
    } catch {
      set({ ratingsLoading: false });
    }
  },

  fetchGivenRatings: async () => {
    set({ ratingsLoading: true });
    try {
      const result = await ratingService.getGiven();
      set({ givenRatings: result.ratings, ratingsLoading: false });
    } catch {
      set({ ratingsLoading: false });
    }
  },

  submitRating: async (bookingId, rating, comment) => {
    try {
      await ratingService.submit(bookingId, rating, comment);
      useUIStore.getState().addToast({ type: 'success', title: 'Rated', message: 'Rating submitted successfully' });
      get().fetchReceivedRatings();
      get().fetchGivenRatings();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit rating';
      useUIStore.getState().addToast({ type: 'error', title: 'Error', message });
    }
  },
}));
