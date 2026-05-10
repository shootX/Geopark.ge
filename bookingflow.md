# 🏗️ Geopark — სისტემის არქიტექტურა და ბიზნეს ნაკადი

## 1. მომხმარებლის რეგისტრაცია

### როლები

| როლი | აღწერა |
|------|--------|
| `user` | ჩვეულებრივი მომხმარებელი — ეძებს პარკინგებს, ჯავშნის, იღებს/აგზავნის ოფერებს |
| `owner` | პარკინგის მფლობელი — ქმნის პარკინგებს, მართავს ფასებს, ამტკიცებს ჯავშნებს |
| `admin` | ადმინისტრატორი — მართავს ყველაფერს: მომხმარებლები, პარკინგები, ფასები, ანგარიშები |

**წყარო:** [`backend/app/Enums/UserRole.php`](backend/app/Enums/UserRole.php)

### რეგისტრაციის ნაკადი

```
მომხმარებელი → POST /api/v1/auth/register { name, email, password, role? }
                       ↓
              AuthService::register()
                       ↓
              1. Hash::make(password)
              2. role = $data['role'] ?? 'user'
              3. is_active = true
              4. DB: create user
              5. DB: assignRole(role)
              6. event(new Registered($user))
              7. createToken('auth-token')
                       ↓
              ← 201 { user, token }  (Sanctum Bearer Token)
```

**წყარო:** [`backend/app/Http/Controllers/API/Auth/AuthController.php`](backend/app/Http/Controllers/API/Auth/AuthController.php)
[`backend/app/Services/Auth/AuthService.php`](backend/app/Services/Auth/AuthService.php)

### რეგისტრაციის შემდეგ მომხმარებლის სტატუსები

| ველი | მნიშვნელობა | აღწერა |
|------|-------------|---------|
| `is_active` | `true` | ანგარიში აქტიურია (ადმინს შეუძლია გათიშვა) |
| `email_verified_at` | `null` | ელ.ფოსტა დაუდასტურებელია (Laravel `MustVerifyEmail`) |
| `phone_verified_at` | `null` | ტელეფონი დაუდასტურებელია (SMS კოდი cache-ში) |

**Email верификация:** მომხმარებელი იღებს `Illuminate\Auth\Events\Registered` event-ს, რომელიც აგზავნის ვერიფიკაციის ლინკს.

**Phone верификация:** SMS კოდი ინახება cache-ში `phone_verification_{user_id}` გასაღებით, TTL 10 წუთი.

### Auth API Endpoints

| Endpoint | მეთოდი | აღწერა |
|----------|--------|---------|
| `/auth/register` | POST | რეგისტრაცია |
| `/auth/login` | POST | ავტორიზაცია |
| `/auth/logout` | POST | გასვლა (აქტიური token-ის წაშლა) |
| `/auth/logout-all` | POST | ყველა მოწყობილობიდან გასვლა |
| `/auth/me` | GET | პროფილის მონაცემები |
| `/auth/profile` | PUT | პროფილის განახლება |
| `/email/verify/{id}/{hash}` | GET | ელ.ფოსტის დადასტურება |
| `/email/verification-notification` | POST | ხელახალი გაგზავნა |
| `/auth/forgot-password` | POST | პაროლის აღდგენის ლინკი |
| `/auth/reset-password` | POST | პაროლის შეცვლა |

---

## 2. პარკინგის ქირაობა/გაქირავება — სრული ნაკადი

```
┌─────────────────────────────────────────────────────┐
│                  🔍 ძებნა                           │
│  GET /parkings/nearby?latitude=X&longitude=Y&radius=5│
│  GET /parkings/{id}   (დეტალები + ფასები)           │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              💰 ფასის გამოთვლა                      │
│  POST /pricing/calculate { parking_id, hours }      │
│  POST /pricing/calculate-dynamic { formula, ... }   │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              📅 ჯავშნის შექმნა                     │
│  POST /bookings { parking_id, start_time, end_time }│
│                                                      │
│  🔒 Pessimistic Lock: lockForUpdate()               │
│  ✅ Available slots > 0 ?                           │
│  ✅ No overlapping bookings?                        │
│  ⛽ available_slots-- (atomic decrement)            │
│  📊 Log pricing calculation                         │
│  📢 event(new BookingCreated)                       │
└──────────────────────┬──────────────────────────────┘
                       ↓
              ┌────────────────┐
              │   ⏳ pending   │
              └────────┬───────┘
                       ↓
            Owner ადასტურებს?
           ┌──────────┴──────────┐
           ↓                     ↓
      ┌─────────┐          ┌───────────┐
      │  ✅     │          │  ❌       │
      │approved │          │ cancelled │
      └────┬────┘          └───────────┘
           ↓
    ⏰ დაწყების დრო?
           ↓
      ┌─────────┐
      │  🟢    │
      │ active  │
      └────┬────┘
           ↓
      ┌───────────┐
      │  🏁      │
      │ completed │
      └───────────┘
```

**წყარო:**
- [`backend/app/Http/Controllers/API/ParkingController.php`](backend/app/Http/Controllers/API/ParkingController.php)
- [`backend/app/Http/Controllers/API/BookingController.php`](backend/app/Http/Controllers/API/BookingController.php)
- [`backend/app/Services/Booking/BookingService.php`](backend/app/Services/Booking/BookingService.php)

### Booking სტატუსების სასიცოცხლო ციკლი

```
                  [*]
                   |
                   ↓
              ⏳ Pending
             /         \
            ↓           ↓
        ✅ Approved   ❌ Cancelled
            |
            ↓
        🟢 Active
            |
            ↓
        🏁 Completed
```

**Booking statuses:** [`backend/app/Enums/BookingStatus.php`](backend/app/Enums/BookingStatus.php)

| Status | მნიშვნელობა |
|--------|-------------|
| `pending` | ⏳ მოლოდინი — Owner-ის დამტკიცება |
| `approved` | ✅ დამტკიცებული, ელოდება დაწყებას |
| `active` | 🟢 მიმდინარეობს |
| `completed` | ⚪ დასრულებული |
| `cancelled` | ❌ გაუქმებული |

### Parking სტატუსები

| Status | მნიშვნელობა |
|--------|-------------|
| `active` | 🟢 აქტიური, ხელმისაწვდომი ჯავშნისთვის |
| `inactive` | ⚪ არააქტიური |
| `maintenance` | 🟠 რემონტში |
| `closed` | 🔴 დახურული |

**წყარო:** [`backend/app/Enums/ParkingStatus.php`](backend/app/Enums/ParkingStatus.php)

---

## 3. Pricing სისტემა (ფასის გამოთვლა)

### Backend (PHP)

[`backend/app/Helpers/PricingHelper.php`](backend/app/Helpers/PricingHelper.php):
- **Shunting-Yard** ალგორითმი
- **RPN** (Reverse Polish Notation) — `evaluateRPN()`

### Frontend (JavaScript)

Admin Panel იყენებს `mathjs.evaluate()` client-side preview-სთვის.

### ფორმულის ცვლადები

| ცვლადი | აღწერა |
|---------|---------|
| `{base_price}` | ბაზისური ფასი (₾/საათი) |
| `{hours}` | საათების რაოდენობა |
| `{multiplier}` | მულტიპლიკატორი (PricingRule-დან) |
| `{demand_factor}` | მოთხოვნის ფაქტორი (0.8–2.0, ავტომატური) |
| `{weekend_multiplier}` | შაბათ-კვირის კოეფიციენტი (1.0 ან 1.5) |

### მაგალითის ფორმულები

| სახელი | ფორმულა |
|--------|----------|
| Standard | `{base_price} * {hours}` |
| Weekend Rate | `({base_price} * {hours}) * {weekend_multiplier}` |
| Dynamic | `{base_price} * {hours} * {multiplier} * {demand_factor}` |
| Premium | `{base_price} * {hours} * ({multiplier} + {demand_factor}) / 2` |

### Pricing API Endpoints

| Endpoint | მეთოდი | აღწერა |
|----------|--------|---------|
| `/pricing/calculate` | POST | ფასის გამოთვლა parking_id და hours-ით |
| `/pricing/calculate-dynamic` | POST | დინამიკური ფასი custom formula-თ |
| `/pricing/validate-formula` | POST | ფორმულის ვალიდაცია |
| `/pricing-rules` | GET | ფასების წესების სია |
| `/pricing-rules` | POST | ახალი წესის შექმნა |

**წყარო:**
- [`backend/app/Http/Controllers/API/PricingController.php`](backend/app/Http/Controllers/API/PricingController.php)
- [`backend/app/Services/Pricing/PricingService.php`](backend/app/Services/Pricing/PricingService.php)

---

## 4. Offer სისტემა (გაქირავება — ოფერები)

Offer-ები საშუალებას აძლევს მომხმარებლებს **დაუკავშირდნენ** ერთმანეთს პარკინგის ადგილის გადაცემისთვის.

### Offer ნაკადი

```
Sender                    System                    Receiver
  │                         │                         │
  │  POST /offers           │                         │
  │  { receiver_id,         │                         │
  │    booking_id,          │                         │
  │    price_offer,         │                         │
  │    message? }           │                         │
  │────────────────────────>│                         │
  │                         │  event(OfferReceived)   │
  │                         │────────────────────────>│ (Realtime)
  │                         │  Notification Email     │
  │                         │────────────────────────>│
  │                         │                         │
  │                         │  POST /offers/{id}/accept
  │                         │<────────────────────────│
  │  event(OfferResponded)  │                         │
  │<────────────────────────│                         │
```

### Offer სტატუსები

| Status | მნიშვნელობა |
|--------|-------------|
| `pending` | ⏳ მოლოდინი (3 დღე) |
| `accepted` | ✅ მიღებული |
| `rejected` | ❌ უარყოფილი |
| `countered` | 🔄 კონტრ-ოფერი |
| `expired` | ⌛ ვადა გაუვიდა |

**წყარო:** [`backend/app/Enums/OfferStatus.php`](backend/app/Enums/OfferStatus.php)
[`backend/app/Services/Offer/OfferService.php`](backend/app/Services/Offer/OfferService.php)

### Offer API Endpoints

| Endpoint | მეთოდი | აღწერა |
|----------|--------|---------|
| `/offers` | GET | ოფერების სია |
| `/offers/{id}` | GET | ოფერის დეტალები |
| `/offers` | POST | ახალი ოფერის გაგზავნა |
| `/offers/{id}/accept` | POST | ოფერის მიღება |
| `/offers/{id}/reject` | POST | ოფერზე უარი |
| `/my-offers` | GET | ჩემი ოფერები |
| `/my-offers/pending` | GET | მოლოდინის ოფერები |

---

## 5. API Endpoints — სრული სია

### Auth (`/auth/*`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| POST | `/register` | რეგისტრაცია | ❌ |
| POST | `/login` | ავტორიზაცია | ❌ |
| POST | `/logout` | გასვლა | ✅ |
| POST | `/logout-all` | ყველა მოწყობილობიდან | ✅ |
| GET | `/me` | პროფილი | ✅ |
| PUT | `/profile` | პროფილის განახლება | ✅ |

### Parkings (`/parkings`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| GET | `/` | პარკინგების სია | ❌ |
| GET | `/nearby` | ახლოს მდებარე | ❌ |
| GET | `/{id}` | დეტალები | ❌ |
| POST | `/` | ახალი პარკინგი | ✅ (owner) |
| PUT | `/{id}` | განახლება | ✅ (owner) |
| DELETE | `/{id}` | წაშლა | ✅ (owner) |
| PATCH | `/{id}/status` | სტატუსის ცვლილება | ✅ (owner) |
| GET | `/my-parkings` | ჩემი პარკინგები | ✅ (owner) |

### Bookings (`/bookings`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| GET | `/` | ჯავშნების სია | ✅ |
| POST | `/` | ჯავშნის შექმნა | ✅ |
| GET | `/{id}` | დეტალები | ✅ |
| POST | `/{id}/cancel` | გაუქმება | ✅ |
| POST | `/{id}/approve` | დამტკიცება | ✅ (owner) |
| GET | `/my-bookings` | ჩემი ჯავშნები | ✅ |
| GET | `/my-bookings/active` | აქტიური | ✅ |
| GET | `/my-bookings/history` | ისტორია | ✅ |

### Offers (`/offers`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| GET | `/` | ოფერების სია | ✅ |
| POST | `/` | გაგზავნა | ✅ |
| GET | `/{id}` | დეტალები | ✅ |
| POST | `/{id}/accept` | მიღება | ✅ |
| POST | `/{id}/reject` | უარი | ✅ |
| GET | `/my-offers` | ჩემი ოფერები | ✅ |
| GET | `/my-offers/pending` | მოლოდინის | ✅ |

### Pricing (`/pricing*`, `/pricing-rules*`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| POST | `/pricing/calculate` | ფასის გამოთვლა | ❌ |
| POST | `/pricing/calculate-dynamic` | დინამიკური | ❌ |
| POST | `/pricing/validate-formula` | ვალიდაცია | ✅ (admin) |
| GET | `/pricing-rules` | წესების სია | ❌ |
| POST | `/pricing-rules` | ახალი წესი | ✅ (admin) |
| PUT | `/pricing-rules/{id}` | განახლება | ✅ (admin) |
| DELETE | `/pricing-rules/{id}` | წაშლა | ✅ (admin) |

### Admin (`/admin/*`)

| მეთოდი | Endpoint | აღწერა | როლი |
|--------|----------|---------|:----:|
| GET | `/admin/dashboard` | Dashboard stats | admin |
| GET | `/admin/dashboard/reports` | ანგარიშები | admin |
| GET | `/admin/users` | მომხმარებლები | admin |
| GET | `/admin/users/{id}` | მომხმარებლის დეტალები | admin |
| PUT | `/admin/users/{id}` | მომხმარებლის განახლება | admin |
| DELETE | `/admin/users/{id}` | მომხმარებლის წაშლა | admin |
| GET | `/admin/bookings` | ჯავშნები | admin |
| GET | `/admin/parkings` | პარკინგები | admin |
| GET | `/admin/pricing-rules` | ფასების წესები | admin |

### Notifications (`/notifications`)

| მეთოდი | Endpoint | აღწერა | ავტორიზაცია |
|--------|----------|---------|:------------:|
| GET | `/` | შეტყობინებები | ✅ |
| GET | `/unread` | წაუკითხავი | ✅ |
| GET | `/count` | რაოდენობა | ✅ |
| POST | `/{id}/read` | წაკითხვა | ✅ |
| POST | `/read-all` | ყველას წაკითხვა | ✅ |
| DELETE | `/{id}` | წაშლა | ✅ |
| DELETE | `/` | ყველას წაშლა | ✅ |

---

## 6. მონაცემთა ბაზის სტრუქტურა (MySQL: `geoparking`)

### ცხრილები

```
users                    — მომხმარებლები
  ├── parkings           — პარკინგები
  │     ├── bookings     — ჯავშნები
  │     ├── pricing_rules — ფასების წესები
  │     └── pricing_logs — ფასების ლოგები
  ├── offers             — ოფერები (sender_id, receiver_id)
  └── notifications      — შეტყობინებები
```

### ძირითადი კავშირები

- `parkings.owner_id → users.id`
- `bookings.user_id → users.id`
- `bookings.parking_id → parkings.id`
- `offers.sender_id → users.id`
- `offers.receiver_id → users.id`
- `offers.booking_id → bookings.id`
- `pricing_rules.parking_id → parkings.id`
- `pricing_rules.created_by → users.id`

---

## 7. ტექნოლოგიური Stack

### Backend
- **Laravel 12** — PHP 8.2+
- **Sanctum** — Token-based Auth
- **Events** — Pusher (broadcast)
- **Database** — MySQL 8
- **Auto-increment** — `available_slots` constraint check

### Frontend (Admin + User)
- **Next.js 16** — React 19.2
- **TanStack React Query** — Server state
- **Zustand** — Client state
- **Framer Motion** — Animations
- **Tailwind CSS 4** — Styling
- **Axios** — HTTP client
- **Laravel Echo + Pusher** — Realtime
- **TanStack Virtual** — Virtual scrolling
- **mathjs** — Formula evaluation (client-side)

### Infrastructure
- **Nginx** — Reverse proxy
- **PM2** — Process management
- **Node.js** — Runtime for frontends

---

## 8. მთავარი ბიზნეს ლოგიკა

### Pessimistic Locking

Race condition-ის თავიდან ასაცილებლად, ჯავშნის შექმნისას გამოიყენება `lockForUpdate()`:

```php
$parking = Parking::where('id', $dto->parkingId)
    ->lockForUpdate()
    ->first();
```

### Atomic Decrement

```php
$affected = Parking::where('id', $parking->id)
    ->where('available_slots', '>', 0)
    ->decrement('available_slots');
```

### Realtime Events

- `BookingCreated` → Pusher channel
- `BookingApproved` → Pusher channel
- `OfferReceived` → Pusher channel
- `OfferResponded` → Pusher channel
- `ParkingAvailabilityUpdated` → Pusher channel

### Notifications

- `BookingCreatedNotification` ✉️
- `BookingApprovedNotification` ✉️
- `OfferReceivedNotification` ✉️

---

## 9. Frontend Services

### User Frontend

| Service | File | ძირითადი მეთოდები |
|---------|------|--------------------|
| **auth** | [`user/src/services/auth.ts`](user/src/services/auth.ts) | login, register, me, logout, updateProfile |
| **parking** | [`user/src/services/parking.ts`](user/src/services/parking.ts) | getNearby, getById, getAll, search |
| **booking** | [`user/src/services/booking.ts`](user/src/services/booking.ts) | getMyBookings, create, cancel, calculatePrice |
| **offers** | [`user/src/services/offers.ts`](user/src/services/offers.ts) | getMyOffers, send, accept, reject |
| **notifications** | [`user/src/services/notifications.ts`](user/src/services/notifications.ts) | getAll, getUnread, getCount |
| **realtime** | [`user/src/services/realtime.tsx`](user/src/services/realtime.tsx) | Laravel Echo + Pusher listeners |

### Admin Panel

| Service | File | ძირითადი მეთოდები |
|---------|------|--------------------|
| **api** | [`admin/src/services/api.ts`](admin/src/services/api.ts) | ყველა API endpoint |
| **store** | [`admin/src/store/index.ts`](admin/src/store/index.ts) | Zustand stores (auth, notifications, dashboard, UI) |
| **utils** | [`admin/src/utils/index.ts`](admin/src/utils/index.ts) | queryKeys, formatters |

---

## 10. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   User Frontend (Next.js 16)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │ Parking  │  │ Booking  │  │  Offers   │  │
│  │ Service  │  │ Service  │  │ Service  │  │  Service  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │             │              │         │
│  ┌────┴──────────────┴─────────────┴──────────────┴────┐   │
│  │              Axios (apiClient)                       │   │
│  │  baseURL: /api/v1  +  Bearer Token                  │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────┐
│                    Nginx Proxy                              │
│              /api/v1/* → Laravel (127.0.0.1:8000)          │
└────────────────────────────┼───────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────┐
│                    Laravel 12 Backend                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │ Parking  │  │ Booking  │  │  Offers   │  │
│  │  Service │  │ Service  │  │ Service  │  │  Service  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │             │              │         │
│  ┌────┴──────────────┴─────────────┴──────────────┴────┐   │
│  │              Sanctum Auth                            │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            ↓                                │
│                      ┌──────────┐                           │
│                      │  MySQL   │                           │
│                      │ geopark  │                           │
│                      └──────────┘                           │
│                            ↓                                │
│                      ┌──────────┐                           │
│                      │  Pusher  │─── Events ──→ User FE    │
│                      └──────────┘                           │
└─────────────────────────────────────────────────────────────┘
```
