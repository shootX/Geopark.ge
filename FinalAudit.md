# GeoPark — Полный Аудит Файловой Системы

## 1. ОБЩАЯ СТРУКТУРА ПРОЕКТА

Проект **GeoPark** — это платформа для бронирования парковок, построенная по архитектуре **3-звенного монолита** (3 отдельных приложения):

```
/www/wwwroot/geopark.anovo.ge/
├── admin/          ← Next.js 16 (Admin Panel)
├── backend/        ← Laravel 13 (API Backend)
├── user/           ← Next.js 16 (User Frontend)
├── Audit.md
├── FinalAudit.md
├── FunctionalAudit.md
├── SOLUTION_PLAN.md
├── TechnicalAudit.md
└── .roo/
```

---

## 2. BACKEND — Laravel 13 (PHP 8.3)

### 2.1. Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Laravel 13.x |
| PHP | ^8.3 |
| Аутентификация | Laravel Sanctum (токены) |
| Realtime | Laravel Reverb + Pusher |
| Rоли | Spatie `laravel-permission` + кастомная `role` колонка |
| БД | SQLite (`geopark.sqlite`) |
| Очереди | Laravel Queue (драйвер: database) |

### 2.2. Полная структура `backend/`

```
backend/
├── app/
│   ├── Actions/
│   │   └── CreateBookingAction.php          ← Action-класс (создание брони)
│   │
│   ├── DTOs/
│   │   ├── BookingDTO.php                   ← Data Transfer Object: бронь
│   │   ├── OfferDTO.php                     ← Data Transfer Object: оффер
│   │   ├── ParkingSearchDTO.php             ← Data Transfer Object: поиск парковки
│   │   └── PricingRuleDTO.php               ← Data Transfer Object: правило цены
│   │
│   ├── Enums/
│   │   ├── BookingStatus.php                ← pending|approved|active|completed|cancelled
│   │   ├── OfferStatus.php                  ← статусы офферов
│   │   ├── ParkingStatus.php                ← статусы парковок
│   │   └── UserRole.php                     ← admin|owner|user
│   │
│   ├── Events/
│   │   ├── BookingApproved.php              ← событие: бронь подтверждена
│   │   ├── BookingCreated.php               ← событие: бронь создана
│   │   ├── OfferReceived.php                ← событие: получен оффер
│   │   ├── OfferResponded.php               ← событие: ответ на оффер
│   │   └── ParkingAvailabilityUpdated.php   ← событие: обновление доступности
│   │
│   ├── Exceptions/                          ← (пусто)
│   │
│   ├── Helpers/
│   │   ├── GeoHelper.php                    ← гео-расчёты (дистанция, координаты)
│   │   └── PricingHelper.php                ← формулы ценообразования
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php               ← базовый контроллер
│   │   │   └── API/
│   │   │       ├── BookingController.php     ← CRUD броней + approve/cancel
│   │   │       ├── OfferController.php       ← CRUD офферов + accept/reject
│   │   │       ├── ParkingController.php     ← CRUD парковок + nearby/search
│   │   │       ├── PricingController.php     ← расчёт цен, управление правилами
│   │   │       ├── Admin/
│   │   │       │   └── DashboardController.php ← админ-дашборд, users, parkings, bookings
│   │   │       ├── Auth/
│   │   │       │   └── AuthController.php    ← register/login/logout/verify/profile
│   │   │       ├── Owner/                   ← (пусто)
│   │   │       └── User/
│   │   │           └── NotificationController.php ← управление уведомлениями
│   │   │
│   │   ├── Middleware/
│   │   │   └── CheckRole.php                ← дуальная проверка роли (column + Spatie)
│   │   │
│   │   ├── Requests/
│   │   │   ├── Admin/
│   │   │   │   └── StorePricingRuleRequest.php
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.php
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   └── UpdateProfileRequest.php
│   │   │   ├── Booking/
│   │   │   │   ├── CancelBookingRequest.php
│   │   │   │   └── StoreBookingRequest.php
│   │   │   ├── Offer/
│   │   │   │   └── StoreOfferRequest.php
│   │   │   ├── Parking/
│   │   │   │   ├── StoreParkingRequest.php
│   │   │   │   └── UpdateParkingRequest.php
│   │   │   └── Profile/                     ← (пусто)
│   │   │
│   │   └── Resources/
│   │       ├── BookingResource.php
│   │       ├── OfferResource.php
│   │       ├── ParkingResource.php
│   │       ├── PricingRuleResource.php
│   │       └── UserResource.php
│   │
│   ├── Models/
│   │   ├── Booking.php                      ← Модель бронирования
│   │   ├── Offer.php                        ← Модель оффера (частная аренда)
│   │   ├── Parking.php                      ← Модель парковки
│   │   ├── PricingLog.php                   ← Лога изменений цены
│   │   ├── PricingRule.php                  ← Правила ценообразования
│   │   └── User.php                         ← Модель пользователя
│   │
│   ├── Notifications/
│   │   ├── BookingApprovedNotification.php
│   │   ├── BookingCreatedNotification.php
│   │   └── OfferReceivedNotification.php
│   │
│   ├── Observers/
│   │   └── BookingObserver.php              ← Observer: события при изменении брони
│   │
│   ├── Policies/
│   │   ├── BookingPolicy.php
│   │   ├── OfferPolicy.php
│   │   └── ParkingPolicy.php
│   │
│   ├── Providers/
│   │   └── AppServiceProvider.php           ← регистрация репозиториев, сервисов, observers, policies
│   │
│   ├── Repositories/
│   │   ├── BookingRepository.php
│   │   ├── OfferRepository.php
│   │   ├── ParkingRepository.php
│   │   ├── PricingRuleRepository.php
│   │   └── UserRepository.php
│   │
│   ├── Services/
│   │   ├── Auth/
│   │   │   └── AuthService.php              ← бизнес-логика аутентификации
│   │   ├── Booking/
│   │   │   └── BookingService.php           ← бизнес-логика броней
│   │   ├── Notification/
│   │   │   └── NotificationService.php      ← отправка уведомлений
│   │   ├── Offer/
│   │   │   └── OfferService.php             ← бизнес-логика офферов
│   │   ├── Parking/
│   │   │   └── ParkingService.php           ← бизнес-логика парковок
│   │   └── Pricing/
│   │       └── PricingService.php           ← бизнес-логика ценообразования
│   │
│   └── Traits/
│       └── ApiResponse.php                  ← success/error/created/forbidden/notFound/validationError
│
├── bootstrap/
│   ├── app.php
│   ├── providers.php
│   └── cache/                               ← кеш конфигов
│
├── config/
│   ├── app.php, auth.php, broadcasting.php,
│   ├── cache.php, cors.php, database.php,
│   ├── filesystems.php, logging.php, mail.php,
│   ├── permission.php, queue.php, sanctum.php,
│   ├── services.php, session.php
│
├── database/
│   ├── factories/                           ← BookingFactory, ParkingFactory, UserFactory
│   ├── migrations/                          ← 12 миграций (users→parkings→bookings→offers→pricing→permissions→notifications)
│   ├── seeders/                             ← DatabaseSeeder, BookingSeeder, ParkingSeeder, RolePermissionSeeder
│   ├── database.sqlite
│   └── geopark.sqlite                       ← основная БД
│
├── public/
│   ├── .htaccess, index.php, robots.txt
│   └── build/                               ← Vite-сборка (CSS/JS ассеты)
│
├── resources/
│   ├── css/app.css
│   ├── js/app.js
│   └── views/                               ← home.blade.php, welcome.blade.php
│
├── routes/
│   ├── api.php                              ← ~120 строк маршрутов API v1
│   ├── console.php
│   └── web.php
│
└── tests/
    ├── TestCase.php
    ├── Feature/
    │   ├── AuthTest.php
    │   ├── BookingRaceConditionTest.php      ← тест race condition
    │   ├── BookingTest.php
    │   ├── ExampleTest.php
    │   ├── ParkingTest.php
    │   └── PricingTest.php
    └── Unit/
        └── ExampleTest.php
```

### 2.3. Архитектурный паттерн Backend

```
Controller → Service → Repository → Model (Eloquent)
                ↓
            Action (CreateBookingAction)
                ↓
            Event → Notification
```

**Слои:**

1. **Controllers** (`Http/Controllers/API/`) — принимают HTTP-запросы, валидируют через Form Requests, вызывают Service
2. **Services** (`Services/*/`) — бизнес-логика, оркестрация
3. **Repositories** (`Repositories/`) — абстракция доступа к данным поверх Eloquent
4. **Models** (`Models/`) — Eloquent ORM модели
5. **Actions** (`Actions/`) —单一 responsibility операции (CreateBookingAction)
6. **DTOs** (`DTOs/`) — объекты передачи данных между слоями
7. **Events** → **Notifications** — реактивный пайплайн

### 2.4. API Маршруты (v1)

```
PUBLIC:
  POST   auth/register
  POST   auth/login
  POST   auth/forgot-password
  POST   auth/reset-password
  GET    auth/verify-email/{id}/{hash}
  GET    parkings
  GET    parkings/nearby
  GET    parkings/{parking}
  POST   pricing/calculate
  POST   pricing/calculate-dynamic
  POST   pricing/validate-formula

AUTH:
  POST   auth/logout
  POST   auth/logout-all
  GET    auth/me
  PUT    auth/profile
  POST   auth/email/resend
  POST   auth/phone/send
  POST   auth/phone/verify
  POST   parkings (owner)
  PUT    parkings/{parking} (owner)
  DELETE parkings/{parking} (owner)
  GET    my-parkings
  PATCH  parkings/{parking}/status
  GET    bookings
  POST   bookings
  GET    bookings/{booking}
  POST   bookings/{booking}/cancel
  POST   bookings/{booking}/approve
  GET    my-bookings
  GET    my-bookings/active
  GET    my-bookings/history
  GET    offers
  POST   offers
  GET    offers/{offer}
  POST   offers/{offer}/accept
  POST   offers/{offer}/reject
  GET    my-offers
  GET    my-offers/pending
  GET    pricing-rules
  GET    pricing-rules/{pricingRule}
  POST   pricing-rules
  PUT    pricing-rules/{pricingRule}
  DELETE pricing-rules/{pricingRule}
  GET    parkings/{parking}/pricing-logs
  GET    notifications
  GET    notifications/unread
  POST   notifications/{id}/read
  POST   notifications/read-all
  DELETE notifications/{id}
  DELETE notifications
  GET    notifications/count

ADMIN (role:admin):
  GET    admin/dashboard
  GET    admin/dashboard/reports
  GET    admin/users
  GET    admin/users/{id}
  PUT    admin/users/{id}
  DELETE admin/users/{id}
  GET    admin/parkings
  GET    admin/bookings
  GET    admin/pricing-rules
```

---

## 3. ADMIN PANEL — Next.js 16 (React 19)

### 3.1. Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 16.2.5 (App Router) |
| Язык | TypeScript |
| Стейт-менеджмент | Zustand 5 |
| Серверные данные | TanStack React Query 5 |
| UI Kit | Radix UI (primitive components) |
| Стилизация | Tailwind CSS 4 |
| Формы | React Hook Form + Zod 4 |
| HTTP | Axios |
| Realtime | Laravel Echo + Pusher |
| Графики | Recharts |
| Анимации | Framer Motion 12 |
| Дата | date-fns 4 |

### 3.2. Полная структура `admin/src/`

```
admin/src/
├── app/                              ← Next.js App Router
│   ├── globals.css
│   ├── layout.tsx                    ← корневой layout
│   ├── page.tsx                      ← корневая страница (редирект на /dashboard)
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx              ← страница входа
│   ├── bookings/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← управление бронями
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← главный дашборд
│   ├── notifications/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← уведомления
│   ├── offers/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← управление офферами
│   ├── parkings/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← управление парковками
│   ├── pricing/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← правила ценообразования
│   ├── reports/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← отчёты
│   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx                  ← настройки
│   └── users/
│       ├── layout.tsx
│       └── page.tsx                  ← управление пользователями
│
├── components/
│   ├── auth/
│   │   └── permission-guard.tsx      ← guard доступа по ролям
│   ├── charts/
│   │   ├── booking-activity-chart.tsx
│   │   ├── parking-utilization-chart.tsx
│   │   ├── revenue-chart.tsx
│   │   └── user-growth-chart.tsx
│   ├── forms/                        ← (пусто)
│   ├── layout/
│   │   ├── admin-layout.tsx          ← основной layout админки
│   │   ├── protected-layout.tsx      ← HOC с проверкой аутентификации
│   │   ├── sidebar.tsx               ← боковое меню
│   │   └── topbar.tsx                ← верхняя панель
│   ├── tables/
│   │   └── data-table.tsx            ← универсальная таблица
│   └── ui/                           ← Radix UI примитивы
│       ├── badge.tsx, button.tsx, card.tsx,
│       ├── dialog.tsx, dropdown-menu.tsx,
│       ├── input.tsx, select.tsx, skeleton.tsx,
│       ├── switch.tsx, tabs.tsx, textarea.tsx, toast.tsx
│
├── features/                         ← feature-модули (каталоги)
│   ├── auth/, bookings/, dashboard/,
│   ├── notifications/, offers/,
│   ├── parkings/, pricing/,
│   ├── reports/, settings/, users/
│
├── hooks/
│   └── use-realtime.ts               ← хук для Laravel Echo / Pusher
│
├── lib/
│   └── api-public.ts                 ← публичный API-клиент
│
├── providers/
│   ├── index.tsx                     ← композиция провайдеров
│   └── theme-provider.tsx            ← провайдер темы
│
├── services/
│   ├── api.ts                        ← основной API-сервис (Axios instance)
│   └── index.ts                      ← реэкспорт сервисов
│
├── store/
│   └── index.ts                      ← Zustand store
│
├── types/
│   └── index.ts                      ← глобальные TypeScript типы
│
└── utils/
    ├── cn.ts                         ← clsx + tailwind-merge
    └── index.ts                      ← утилиты
```

### 3.3. Роутинг Admin Panel

```
/auth/login           → вход в админку
/dashboard            → дашборд со статистикой
/bookings             → управление бронями
/parkings             → управление парковками
/offers               → управление офферами
/users                → управление пользователями
/pricing              → правила ценообразования
/reports              → отчёты и аналитика
/notifications        → уведомления
/settings             → настройки
```

---

## 4. USER FRONTEND — Next.js 16 (React 19)

### 4.1. Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Фреймворк | Next.js 16.2.5 (App Router) |
| Язык | TypeScript |
| Стейт-менеджмент | Zustand 5 |
| Серверные данные | TanStack React Query 5 |
| Карты | Mapbox GL JS 3 + Mapbox Geocoder |
| UI | Tailwind CSS 4 + Framer Motion |
| HTTP | Axios |
| Realtime | Laravel Echo + Pusher |
| PWA | Web App Manifest (иконки 192x192, 512x512) |

### 4.2. Полная структура `user/src/`

```
user/src/
├── app/                              ← Next.js App Router
│   ├── globals.css
│   ├── layout.tsx                    ← корневой layout (с TopNav)
│   ├── page.tsx                      ← главная (карта с парковками)
│   │
│   ├── (auth)/                       ← Route Group: аутентификация
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (booking)/                    ← Route Group: бронирование
│   ├── (dashboard)/                  ← Route Group: дашборд
│   ├── (map)/                        ← Route Group: карта
│   ├── (profile)/                    ← Route Group: профиль
│   │
│   ├── booking/
│   │   └── page.tsx                  ← страница бронирования
│   ├── login/
│   │   └── page.tsx                  ← логин (standalone)
│   ├── my-bookings/
│   │   └── page.tsx                  ← мои бронирования
│   ├── my-offers/
│   │   └── page.tsx                  ← мои офферы
│   ├── notifications/
│   │   └── page.tsx                  ← уведомления
│   ├── profile/
│   │   └── page.tsx                  ← профиль пользователя
│   └── register/
│       └── page.tsx                  ← регистрация (standalone)
│
├── components/
│   ├── Providers.tsx                 ← композиция провайдеров (QueryClient, Echo)
│   ├── layout/
│   │   └── TopNav.tsx                ← верхняя навигация
│   ├── map/
│   │   ├── BottomSheet.tsx           ← нижняя панель (bottom sheet с Framer Motion)
│   │   ├── MapControls.tsx           ← элементы управления картой
│   │   └── MapView.tsx               ← компонент карты (Mapbox GL)
│   ├── parking/
│   │   └── FilterPanel.tsx           ← панель фильтров парковок
│   └── ui/
│       ├── Skeleton.tsx              ← скелетон-лоадер
│       └── ToastContainer.tsx        ← контейнер уведомлений (toast)
│
├── hooks/
│   └── useQueries.ts                 ← React Query хуки для API
│
├── services/
│   ├── api.ts                        ← Axios instance (base URL, интерцепторы)
│   ├── auth.ts                       ← сервис аутентификации
│   ├── booking.ts                    ← сервис бронирований
│   ├── notifications.ts             ← сервис уведомлений
│   ├── parking.ts                    ← сервис парковок
│   └── realtime.tsx                  ← Laravel Echo + Pusher провайдер
│
├── store/
│   ├── authStore.ts                  ← Zustand: аутентификация
│   ├── bookingStore.ts               ← Zustand: бронирования
│   ├── mapStore.ts                   ← Zustand: состояние карты
│   └── uiStore.ts                    ← Zustand: UI-состояние
│
├── types/
│   └── index.ts                      ← TypeScript типы
│
└── utils/
    └── constants.ts                  ← константы (API_URL, MAPBOX_TOKEN, etc.)
```

### 4.3. Роутинг User Frontend

```
/                   → карта с парковками (главная)
/login              → вход
/register           → регистрация
/booking            → процесс бронирования
/my-bookings        → список моих броней
/my-offers          → список моих офферов
/notifications      → уведомления
/profile            → профиль пользователя
```

---

## 5. БАЗА ДАННЫХ — СХЕМА МИГРАЦИЙ

| Миграция | Таблицы | Описание |
|----------|---------|----------|
| `0001_01_01_000000_create_users_table` | `users` | Пользователи (role, phone, coordinates) |
| `0001_01_01_000001_create_cache_table` | `cache`, `cache_locks` | Кеш |
| `0001_01_01_000002_create_jobs_table` | `jobs`, `job_batches`, `failed_jobs` | Очереди |
| `2025_01_01_000001_create_parkings_table` | `parkings` | Парковки (владелец, адрес, слоты, цена, координаты) |
| `2025_01_01_000003_create_bookings_table` | `bookings` | Брони (пользователь, парковка, статус, время) |
| `2025_01_01_000004_create_offers_table` | `offers` | Офферы (частная аренда) |
| `2025_01_01_000005_create_pricing_rules_table` | `pricing_rules` | Правила ценообразования |
| `2025_01_01_000006_create_pricing_logs_table` | `pricing_logs` | Логи изменений цен |
| `2026_05_07_070233_create_personal_access_tokens_table` | `personal_access_tokens` | Sanctum токены |
| `2026_05_07_071954_add_custom_fields_to_users_table` | — | Доп. поля users |
| `2026_05_07_072029_create_permission_tables` | `permissions`, `roles`, `model_has_roles`, etc. | Spatie permissions |
| `2026_05_07_072731_create_notifications_table` | `notifications` | Уведомления (БД-канал) |
| `2026_05_07_073440_add_available_slots_check_constraint` | — | CHECK constraint на available_slots |

---

## 6. АРХИТЕКТУРНАЯ СХЕМА ВЗАИМОДЕЙСТВИЯ

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER (порт 3001)                         │
│  Next.js 16 App ─── React 19 ─── Zustand ─── TanStack Query    │
│  Mapbox GL (карта), BottomSheet, FilterPanel                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS / API /v1
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Laravel 13)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │Auth      │  │Parking   │  │Booking   │  │Pricing        │   │
│  │Controller│  │Controller│  │Controller│  │Controller     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│       │              │             │                │            │
│  ┌────▼──────────────▼─────────────▼────────────────▼────────┐  │
│  │                   Services Layer                            │  │
│  │  AuthService │ BookingService │ ParkingService             │  │
│  │  OfferService │ PricingService │ NotificationService       │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │                Repositories Layer                           │  │
│  │  UserRepo │ ParkingRepo │ BookingRepo │ OfferRepo          │  │
│  │  PricingRuleRepo                                            │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │              Eloquent Models (ORM)                          │  │
│  │  User │ Parking │ Booking │ Offer │ PricingRule            │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │              SQLite Database (geopark.sqlite)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Events: BookingCreated → BookingApproved → OfferReceived       │
│  Notifications: DB Channel + Pusher/Reverb (WebSocket)          │
│  Auth: Sanctum Token-based                                      │
│  Policies: BookingPolicy, OfferPolicy, ParkingPolicy            │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS / API /v1
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     ADMIN (порт 3100)                            │
│  Next.js 16 App ─── React 19 ─── Zustand ─── TanStack Query    │
│  Radix UI ─── Recharts ─── DataTable ─── Framer Motion         │
│  Модули: Bookings, Parkings, Users, Offers, Pricing, Reports   │
│  Защита: PermissionGuard (по ролям)                             │
└──────────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────────────────┐
         │           Realtime (WebSocket)               │
         │  Laravel Reverb (WS) + Pusher (fallback)    │
         │  Laravel Echo Client (admin + user)          │
         │  События: брони, офферы, уведомления         │
         └─────────────────────────────────────────────┘
```

---

## 7. КЛЮЧЕВЫЕ ПАТТЕРНЫ И РЕШЕНИЯ

### 7.1. Dual Role System
- Пользователь имеет роль через колонку `users.role` (enum: `App\Enums\UserRole`)
- И дополнительно роли через Spatie `laravel-permission`
- Middleware [`CheckRole.php`](backend/app/Http/Middleware/CheckRole.php:16) проверяет обе системы

### 7.2. API Response Trait
- Trait [`ApiResponse.php`](backend/app/Traits/ApiResponse.php:8) — единый формат JSON-ответов
- Методы: `success()`, `error()`, `created()`, `forbidden()`, `notFound()`, `validationError()`

### 7.3. Repository Pattern
- Абстракция запросов к БД через Repository classes
- Зарегистрированы как singletons в [`AppServiceProvider`](backend/app/Providers/AppServiceProvider.php:31)

### 7.4. Action + DTO
- [`CreateBookingAction`](backend/app/Actions/CreateBookingAction.php) — отдельный класс для сложной операции создания брони
- DTOs для передачи структурированных данных между слоями

### 7.5. Events → Notifications Pipeline
- События (`BookingCreated`, `BookingApproved`, `OfferReceived`) запускают уведомления
- Notifications используют DB channel + Pusher/Reverb для realtime

### 7.6. Observer Pattern
- [`BookingObserver`](backend/app/Observers/BookingObserver.php) — слушает изменения модели Booking

### 7.7. Policy-based Authorization
- [`BookingPolicy`](backend/app/Policies/BookingPolicy.php)
- [`OfferPolicy`](backend/app/Policies/OfferPolicy.php)
- [`ParkingPolicy`](backend/app/Policies/ParkingPolicy.php)

---

## 8. СТАТИСТИКА ПРОЕКТА

| Метрика | Значение |
|---------|----------|
| **Всего файлов** | ~110 (без node_modules/vendor) |
| **Backend PHP файлов** | ~55 |
| **Admin TSX/TS файлов** | ~45 |
| **User TSX/TS файлов** | ~25 |
| **Миграций БД** | 12 |
| **API Endpoints** | ~45 |
| **Моделей** | 6 (User, Parking, Booking, Offer, PricingRule, PricingLog) |
| **Сервисов** | 6 (Auth, Booking, Parking, Offer, Pricing, Notification) |
| **Репозиториев** | 5 |
| **Enum'ов** | 4 |
| **Events** | 5 |
| **Notifications** | 3 |
| **Policies** | 3 |
| **Тестов** | 6 feature + 1 unit |
| **Zustand Store (user)** | 4 |
| **Библиотек (admin)** | ~20 зависимостей |
| **Библиотек (user)** | ~10 зависимостей |
| **Порт admin** | 3100 |
| **Порт user** | 3001 |

---

## 9. ЗАМЕЧАНИЯ И ПОТЕНЦИАЛЬНЫЕ ПРОБЛЕМЫ

1. **Пустые директории**: `Exceptions/`, `Owner/` — не реализованы
2. **Пустые группы роутов** в user: `(booking)/`, `(dashboard)/`, `(map)/`, `(profile)/` — не содержат файлов
3. **Пустая папка `forms/`** в admin — компоненты форм не вынесены
4. **Дублирование `/login` и `/register`** в user: есть как `(auth)/login` + `(auth)/register`, так и `login/` + `register/` — вероятно, дублирование роутов
5. **SQLite в продакшене** — не рекомендуется для высокой нагрузки
6. **Отсутствуют Horizon/Octane** — нет конфигурации для масштабирования
7. **Тестовое покрытие** — минимально (6 feature тестов)
8. **Отсутствует Swagger/OpenAPI** — нет документации API
