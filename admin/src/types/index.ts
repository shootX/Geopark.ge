// ============================================================
// Geopark - Enterprise Admin Panel Types
// SYNCHRONIZED with Backend API Responses (Laravel Resources)
// ============================================================

// ─── Auth Types ───
/** @see backend/app/Http/Resources/UserResource.php */
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;         // 'Y-m-d' format
  personal_number?: string;
  role: string;                 // UserRole enum value: 'admin' | 'owner' | 'user'
  role_label: string;
  is_active: boolean;
  avatar?: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  is_phone_verified: boolean;
  created_at: string;           // ISO8601
  updated_at: string;           // ISO8601
  roles?: string[];             // Spatie role names (when loaded)
  permissions?: string[];       // Spatie permission names (when loaded)
  parkings_count?: number;      // When user is owner
  bookings_count?: number;      // When user is regular user
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  birth_date?: string;
  personal_number?: string;
}

// ─── Dashboard Types ───
/** @see backend/app/Repositories/BookingRepository.php::getDashboardStats() */
export interface DashboardStats {
  total_revenue: number;
  active_bookings: number;
  occupancy_rate: number;
  total_users: number;
  total_parkings: number;
  revenue_growth: number;
  revenue_today: number;
  new_users_today: number;
  total_bookings: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface BookingActivityPoint {
  date: string;
  created: number;
  completed: number;
  cancelled: number;
}

export interface UserGrowthPoint {
  date: string;
  total: number;
  new_users: number;
}

export interface ParkingUtilization {
  parking_id: number;
  parking_name: string;
  total_slots: number;
  available_slots: number;
  occupancy_rate: number;
}

export interface DashboardReport {
  stats: DashboardStats;
  revenue_chart: RevenueDataPoint[];
  booking_activity: BookingActivityPoint[];
  user_growth: UserGrowthPoint[];
  parking_utilization: ParkingUtilization[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ─── Parking Types ───
/** @see backend/app/Http/Resources/ParkingResource.php */
export type ParkingStatus = 'active' | 'inactive' | 'maintenance';

export interface Parking {
  id: number;
  owner_id: number;
  owner?: User;                 // UserResource (when loaded)
  title: string;                // Backend uses 'title', NOT 'name'
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
  occupancy_rate: number;
  base_price: number;           // Backend uses 'base_price', NOT 'hourly_rate'
  images: string[];
  status: ParkingStatus;        // ParkingStatus enum value
  status_label: string;
  is_open: boolean;
  opening_time?: string;        // 'H:i' format
  closing_time?: string;        // 'H:i' format
  amenities: string[];
  cancellation_policy?: string;
  is_verified: boolean;
  distance?: number;            // When queried with nearby scope
  active_pricing_rule?: PricingRule; // PricingRuleResource (when loaded)
  bookings_count?: number;      // When loaded
  created_at: string;           // ISO8601
  updated_at: string;           // ISO8601
}

export interface ParkingFormData {
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  base_price: number;           // Backend uses 'base_price'
  images?: File[];
  amenities?: string[];
  opening_time?: string;
  closing_time?: string;
  cancellation_policy?: string;
}

// ─── Booking Types ───
/** @see backend/app/Http/Resources/BookingResource.php */
export type BookingStatus = 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'rejected';

export interface Booking {
  id: number;
  user_id: number;
  user?: User;                  // UserResource (when loaded)
  parking_id: number;
  parking?: Parking;            // ParkingResource (when loaded)
  start_time: string;           // ISO8601
  end_time: string;             // ISO8601
  total_price: number;
  duration_hours: number;       // Backend uses 'duration_hours', NOT 'hours'
  booking_status: string;       // Backend uses 'booking_status', NOT 'status'
  status_label: string;
  status_color?: string;
  vehicle_plate?: string;
  notes?: string;
  is_active: boolean;
  cancelled_at?: string;        // ISO8601
  cancellation_reason?: string;
  offers?: Offer[];             // OfferResource collection (when loaded)
  created_at: string;           // ISO8601
  updated_at: string;           // ISO8601
}

export interface BookingFormData {
  parking_id: number;
  start_time: string;
  end_time: string;
  vehicle_plate?: string;
  notes?: string;
}

// ─── Offer Types ───
/** @see backend/app/Http/Resources/OfferResource.php */
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Offer {
  id: number;
  sender_id: number;            // Backend uses 'sender_id', NOT 'user_id'
  sender?: User;                // UserResource (when loaded)
  receiver_id: number;          // Backend has 'receiver_id'
  receiver?: User;              // UserResource (when loaded)
  booking_id: number;           // Backend links to booking, NOT parking
  booking?: Booking;            // BookingResource (when loaded)
  message?: string;
  price_offer: number;          // Backend uses 'price_offer', NOT 'amount'
  status: OfferStatus;          // OfferStatus enum value
  status_label: string;
  is_expired: boolean;
  expires_at: string;           // ISO8601
  responded_at?: string;        // ISO8601
  created_at: string;           // ISO8601
  updated_at: string;           // ISO8601
}

export interface OfferFormData {
  receiver_id: number;          // Backend needs receiver_id
  booking_id: number;           // Backend links to booking
  price_offer: number;          // Backend uses 'price_offer'
  message?: string;
  expires_at?: string;
}

// ─── Pricing Types ───
/** @see backend/app/Http/Resources/PricingRuleResource.php */
export interface PricingRule {
  id: number;
  parking_id?: number;
  parking?: Parking;            // ParkingResource (when loaded)
  name: string;
  description?: string;
  formula: string;              // Backend stores formula as string, NOT variables[]
  multiplier: number;           // Backend uses 'multiplier' (float), NOT 'priority'
  is_active: boolean;
  is_valid: boolean;
  valid_from?: string;          // ISO8601
  valid_until?: string;         // ISO8601
  created_by?: number;          // User ID of creator
  creator?: User;               // UserResource (when loaded)
  created_at: string;           // ISO8601
  updated_at: string;           // ISO8601
}

/** @see backend/app/Models/PricingLog.php */
export interface PricingLog {
  id: number;
  pricing_rule_id: number;
  parking_id: number;
  base_price: number;
  calculated_price: number;
  variables: Record<string, number>;
  formula: string;
  result: number;
  created_at: string;           // ISO8601
}

/** @see backend/app/Helpers/PricingHelper.php::calculatePrice() */
export interface PriceCalculation {
  price: number;                // Calculated final price
  base_price: number;
  hours: number;
  demand_factor: number;
  weekend_multiplier: number;
  formula: string;              // Formula string used
  rule_applied: string;         // Name of the pricing rule applied, or 'default'
}

// ─── Notification Types ───
export interface AppNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    title: string;
    message: string;
    icon?: string;
    action_url?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Filter & Table Types ───
export interface TableFilters {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  date_from?: string;
  date_to?: string;
  [key: string]: unknown;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface BulkAction {
  label: string;
  action: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline';
}

// ─── Marketplace Types ───
/** @see backend/app/Http/Resources/ParkingOfferResource.php */
export type ParkingOfferStatusType = 'active' | 'paused' | 'blocked' | 'draft';

export interface ParkingOffer {
  id: number;
  owner_id: number;
  owner?: User;
  parking_id?: number;
  parking?: Parking;
  title: string;
  description?: string;
  parking_type: 'private' | 'municipal';
  parking_type_label: string;
  address: string;
  latitude: number;
  longitude: number;
  supported_vehicle_sizes: string[];
  features: string[];
  hourly_price: number;
  minimum_hours?: number;
  available_from?: string;
  available_until?: string;
  is_active: boolean;
  status: ParkingOfferStatusType;
  status_label: string;
  status_color?: string;
  average_rating: number;
  total_reviews: number;
  images?: { id: number; url: string }[];
  availability?: { id: number; day_of_week?: number; specific_date?: string; from_time: string; until_time: string; is_available: boolean }[];
  distance?: number;
  created_at: string;
  updated_at: string;
}

/** @see backend/app/Http/Resources/WalletResource.php */
export interface Wallet {
  id: number;
  user_id: number;
  user?: User;
  balance: number;
  currency: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

/** @see backend/app/Enums/TransactionStatus.php */
export type TransactionStatusType = 'pending' | 'held' | 'released' | 'refunded' | 'failed';

/** @see backend/app/Http/Resources/TransactionResource.php */
export interface Transaction {
  id: number;
  booking_id: number;
  renter_id: number;
  owner_id: number;
  total_amount: number;
  platform_fee: number;
  owner_amount: number;
  status: TransactionStatusType;
  status_label: string;
  status_color?: string;
  held_at?: string;
  released_at?: string;
  refunded_at?: string;
  booking?: Booking;
  renter?: User;
  owner?: User;
  created_at: string;
  updated_at: string;
}

/** @see backend/app/Http/Resources/RatingResource.php */
export interface Rating {
  id: number;
  booking_id: number;
  from_user_id: number;
  from_user?: User;
  to_user_id: number;
  to_user?: User;
  rating: number;
  comment?: string;
  created_at: string;
}

/** @see backend/app/Models/LiveLocation.php */
export interface LiveLocation {
  id: number;
  booking_id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  created_at: string;
}

// ─── Marketplace Stats ───
export interface MarketplaceStats {
  active_offers: number;
  total_offers: number;
  total_wallets: number;
  blocked_wallets: number;
  held_transactions: number;
  total_platform_fees: number;
  total_revenue: number;
}

// ─── User Car Types ───
/** @see backend/app/Enums/VehicleCategory.php */
export type VehicleCategory =
  | 'sedan'
  | 'hatchback'
  | 'suv'
  | 'crossover'
  | 'coupe'
  | 'convertible'
  | 'wagon'
  | 'minivan'
  | 'van'
  | 'pickup'
  | 'truck'
  | 'bus'
  | 'motorcycle'
  | 'other';

/** @see backend/app/Enums/FuelType.php */
export type FuelType =
  | 'petrol'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'plugin_hybrid'
  | 'lpg';

/** @see backend/app/Http/Resources/UserCarResource.php */
export interface UserCar {
  id: number;
  user_id: number;
  user?: User;                    // UserResource (when loaded)
  brand: string;
  model: string;
  category: VehicleCategory;
  category_label: string;
  fuel_type: FuelType;
  fuel_type_label: string;
  year: number;
  plate_number: string;
  is_default: boolean;
  created_at: string;             // ISO8601
  updated_at: string;             // ISO8601
}
