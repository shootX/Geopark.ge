# 🅿️ Geopark.ge — Smart Parking Marketplace

> **Version 4** — Full-stack parking reservation & peer-to-peer parking marketplace platform.

**Geopark.ge** is a comprehensive digital parking ecosystem connecting drivers with available parking spaces across Georgia. The platform supports both **municipal** and **private** parking listings, enabling property owners to monetize unused parking spots while drivers find, book, and pay for parking — all in real time.

---

## ✨ Key Features

### 🚗 For Drivers (User App)
- **Interactive Map** — Browse available parking spots on a Mapbox-powered map with real-time availability
- **Smart Search & Filters** — Filter by location, price, distance, parking type, and availability
- **Instant Booking** — Reserve parking spots with flexible time windows
- **Real-time Tracking** — Live location sharing during parking rental periods
- **Wallet System** — Pre-funded digital wallet for seamless payments
- **Offer Marketplace** — Browse and accept parking offers from private property owners
- **Vehicle Management** — Register and manage multiple vehicles
- **Booking Timeline** — Full lifecycle tracking from booking → arrival → completion
- **Rating & Reviews** — Rate parking experiences
- **Push Notifications** — Real-time alerts via Pusher/Reverb WebSockets

### 🏢 For Administrators (Admin Panel)
- **Dashboard** — Real-time analytics with revenue, booking activity, and utilization charts
- **Parking Management** — CRUD operations for all parking locations
- **Booking Oversight** — Full booking lifecycle management with approval/rejection workflows
- **User Management** — Role-based access control (RBAC) with granular permissions
- **Pricing Engine** — Dynamic pricing rules engine with formula validation
- **Offer Moderation** — Approve/reject parking offers from property owners
- **Transaction Logs** — Complete financial audit trail
- **Reports & Analytics** — Revenue reports, occupancy rates, user growth metrics
- **Wallet Management** — User balance oversight and transaction history

### 💰 Marketplace Features
- **Peer-to-Peer Parking** — Property owners list private parking spaces for short-term rental
- **Offer System** — Owners create offers with custom pricing, availability schedules, and photos
- **Automated Settlement** — Secure payment release upon booking completion
- **Dynamic Pricing** — Smart pricing engine with configurable formulas and surge pricing

---

## 🏗️ Architecture

```
geopark.anovo.ge/
├── admin/          # Next.js 16 — Admin Panel (port 3100)
├── user/           # Next.js 16 — User Frontend (port 3001)
└── backend/        # Laravel 13 — REST API + WebSocket server
```

### Backend Stack (`backend/`)
| Technology | Purpose |
|---|---|
| **Laravel 13** | PHP framework — API, business logic, queues |
| **Laravel Reverb** | WebSocket server for real-time features |
| **Sanctum** | Token-based API authentication |
| **SQLite / MySQL** | Database layer |
| **Spatie Laravel Permission** | Role-based access control |
| **Pusher PHP SDK** | WebSocket broadcasting fallback |
| **PHP 8.3+** | Runtime environment |

### Frontend Stack (`admin/` & `user/`)
| Technology | Purpose |
|---|---|
| **Next.js 16 (App Router)** | React framework — SSR & SPA |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **TanStack React Query** | Server state management |
| **Zustand** | Client state management |
| **Mapbox GL JS** | Interactive parking map |
| **Framer Motion** | UI animations |
| **Laravel Echo** | Real-time WebSocket client |
| **Radix UI** | Accessible UI primitives (admin) |

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.3+
- Composer
- Node.js 20+
- npm / pnpm

### 1. Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Admin Panel Setup

```bash
cd admin
npm install
cp .env.production .env.local   # configure your API URL
npm run dev                      # starts on http://localhost:3100
```

### 3. User App Setup

```bash
cd user
npm install
cp .env.production .env.local   # configure your API URL & Mapbox token
npm run dev                      # starts on http://localhost:3001
```

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | ✅ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token | ✅ |
| `NEXT_PUBLIC_PUSHER_APP_ID` | Pusher/Reverb app ID | ⬜ |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher/Reverb key | ⬜ |
| `NEXT_PUBLIC_PUSHER_SECRET` | Pusher/Reverb secret | ⬜ |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (default: `eu`) | ⬜ |

---

## 📡 API Overview

All API routes are prefixed under `/api/v1`.

### Public Endpoints
- `GET /api/v1/parkings` — List all parkings
- `GET /api/v1/parkings/nearby` — Nearby parking search (lat/lng/radius)
- `POST /api/v1/pricing/calculate` — Calculate parking price
- `POST /api/v1/auth/login` — User login
- `POST /api/v1/auth/register` — User registration

### Authenticated Endpoints
- `GET /api/v1/auth/me` — Current user profile
- `GET /api/v1/bookings` — User's bookings
- `POST /api/v1/bookings` — Create booking
- `GET /api/v1/offers` — Available marketplace offers
- `POST /api/v1/offers` — Create offer (owner)
- `GET/POST /api/v1/wallet` — Wallet management
- `GET /api/v1/notifications` — User notifications

---

## 🧩 Domain Models

| Model | Description |
|---|---|
| **User** | Drivers, parking owners, admins |
| **Parking** | Municipal & private parking locations |
| **ParkingOffer** | Private parking space listings by owners |
| **Booking** | Parking reservation lifecycle |
| **Offer** | Price offers on parking requests |
| **Wallet** | User pre-funded balance |
| **Transaction** | Financial audit trail |
| **Rating** | Post-booking reviews |
| **UserCar** | Registered vehicles |
| **PricingRule** | Dynamic pricing formulas |
| **LiveLocation** | Real-time GPS tracking |

---

## 🔐 Roles & Permissions

| Role | Capabilities |
|---|---|
| **Super Admin** | Full system access |
| **Admin** | User & parking management, reports |
| **Parking Owner** | List properties, manage offers |
| **Driver** | Search, book, pay, review |

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👤 Author

**Shota Chkhvirkia** — [shootX](https://github.com/shootX)

---

*Built with Laravel 13, Next.js 16, Mapbox, and Reverb WebSockets.*
