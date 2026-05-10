export enum BookingStatus {
  Pending = 'pending',
  Approved = 'approved',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
  PendingOwnerApproval = 'pending_owner_approval',
  Rejected = 'rejected',
  RenterOnTheWay = 'renter_on_the_way',
  OwnerWaiting = 'owner_waiting',
  Arrived = 'arrived',
  Expired = 'expired',
}

export enum ParkingStatus {
  Active = 'active',
  Inactive = 'inactive',
  Full = 'full',
  Maintenance = 'maintenance',
}

export enum ParkingOfferStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Booked = 'booked',
  Completed = 'completed',
  Blocked = 'blocked',
}

export enum OfferStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Expired = 'expired',
}

export enum UserRole {
  User = 'user',
  Owner = 'owner',
  Admin = 'admin',
}

export enum VehicleCategory {
  Sedan = 'sedan',
  SUV = 'suv',
  Hatchback = 'hatchback',
  Crossover = 'crossover',
  Coupe = 'coupe',
  Convertible = 'convertible',
  Wagon = 'wagon',
  Minivan = 'minivan',
  Pickup = 'pickup',
  Van = 'van',
  Truck = 'truck',
  Motorcycle = 'motorcycle',
  Electric = 'electric',
  Other = 'other',
}

export enum FuelType {
  Petrol = 'petrol',
  Diesel = 'diesel',
  Electric = 'electric',
  Hybrid = 'hybrid',
  Gas = 'gas',
  LPG = 'lpg',
  CNG = 'cng',
}

export interface UserCar {
  id: number;
  user_id: number;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  plate_number: string;
  category: VehicleCategory;
  fuel_type?: FuelType;
  is_default: boolean;
  is_verified: boolean;
  is_flagged: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year?: number;
  color?: string;
  plate_number: string;
  category: VehicleCategory;
  fuel_type?: FuelType;
  is_default?: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_phone_verified?: boolean;
  avatar?: string;
  average_rating?: number;
  total_reviews?: number;
  completed_trips_count?: number;
  full_name: string;
  has_vehicle?: boolean;
  cars_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Parking {
  id: number;
  owner_id: number;
  owner?: User;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
  base_price: number;
  images?: string[];
  status: ParkingStatus;
  is_open?: boolean;
  opening_time?: string;
  closing_time?: string;
  amenities?: string[];
  cancellation_policy?: string;
  is_verified?: boolean;
  distance?: number;
  occupancy_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ParkingOffer {
  id: number;
  owner_id: number;
  owner?: User;
  parking_id?: number;
  parking?: Parking;
  title: string;
  description?: string;
  parking_type: string;
  parking_type_label?: string;
  address: string;
  latitude: number;
  longitude: number;
  supported_vehicle_sizes: string[];
  features: string[];
  hourly_price: number;
  minimum_hours: number;
  available_from?: string;
  available_until?: string;
  is_active: boolean;
  status: ParkingOfferStatus;
  status_label?: string;
  status_color?: string;
  average_rating: number;
  total_reviews: number;
  images?: OfferImage[];
  availability?: OfferAvailability[];
  distance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OfferImage {
  id: number;
  offer_id: number;
  url: string;
  thumbnail_url?: string;
  sort_order: number;
}

export interface OfferAvailability {
  id?: number;
  offer_id?: number;
  day_of_week?: number;
  specific_date?: string;
  from_time: string;
  until_time: string;
  is_available?: boolean;
}

export interface Booking {
  id: number;
  user_id: number;
  user?: User;
  parking_id?: number;
  parking?: Parking;
  parking_offer_id?: number;
  parking_offer?: ParkingOffer;
  start_time: string;
  end_time: string;
  total_price: number;
  duration_hours?: number;
  booking_status: BookingStatus;
  status_label?: string;
  status_color?: string;
  vehicle_plate?: string;
  notes?: string;
  is_active?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  approved_at?: string;
  started_at?: string;
  arrived_at?: string;
  completed_at?: string;
  user_car_id?: number;
  user_car?: UserCar;
  offers?: Offer[];
  transaction?: Transaction;
  ratings?: Rating[];
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  booking_id: number;
  renter_id: number;
  owner_id: number;
  total_amount: number;
  platform_fee: number;
  owner_amount: number;
  status: string;
  status_label?: string;
  status_color?: string;
  held_at?: string;
  released_at?: string;
  refunded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  user?: User;
  balance: number;
  currency: string;
  is_blocked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: string;
  type_label?: string;
  amount: number;
  absolute_amount?: number;
  is_credit?: boolean;
  balance_before: number;
  balance_after: number;
  status: string;
  status_label?: string;
  status_color?: string;
  description?: string;
  reference_type?: string;
  reference_id?: number;
  created_at?: string;
}

export interface Rating {
  id: number;
  booking_id: number;
  from_user_id: number;
  from_user?: User;
  to_user_id: number;
  to_user?: User;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface LiveLocation {
  id: number;
  booking_id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updated_at?: string;
}

export interface PricingRule {
  id: number;
  parking_id: number;
  name: string;
  formula: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PriceCalculation {
  price: number;
  base_price: number;
  hours: number;
  demand_factor: number;
  weekend_multiplier: number;
  formula: string;
}

export interface Offer {
  id: number;
  sender_id: number;
  sender?: User;
  receiver_id: number;
  receiver?: User;
  booking_id: number;
  booking?: Booking;
  price_offer?: number;
  message?: string;
  status: OfferStatus;
  is_expired?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface NearbyParkingsQuery {
  latitude: number;
  longitude: number;
  radius?: number;
  vehicle_size?: string;
  max_price?: number;
  min_price?: number;
  only_available?: boolean;
}

export interface CreateBookingPayload {
  parking_id?: number;
  parking_offer_id?: number;
  start_time: string;
  end_time: string;
  user_car_id?: number;
  vehicle_plate?: string;
  notes?: string;
}

export interface PriceCalculatePayload {
  parking_id: number;
  start_time: string;
  end_time: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: UserRole;
  phone?: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar?: File;
}

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ParkingFilters {
  maxPrice: number | null;
  minPrice: number | null;
  onlyAvailable: boolean;
  maxDistance: number;
  searchQuery: string;
}

export interface ParkingOfferFilters {
  parking_type?: string;
  vehicle_size?: string;
  feature?: string;
  min_price?: number;
  max_price?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}
