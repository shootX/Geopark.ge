# Функциональный аудит синхронизации Backend / Admin Panel / User Frontend

**Дата:** 2026-05-09  
**Цель:** Проверка согласованности endpoint-ов, типов данных и функциональности между тремя слоями системы.

---

## 1. Эндпоинты (API Routes vs Client Calls)

### 1.1. Backend ↔ Admin Panel

| Backend Route | Admin Call | Статус |
|---|---|---|
| `POST /auth/login` | `api.auth.login()` | ✅ OK |
| `POST /auth/register` | `api.auth.register()` | ✅ OK |
| `POST /auth/logout` | `api.auth.logout()` | ✅ OK |
| `POST /auth/logout-all` | `api.auth.logoutAll()` | ✅ OK |
| `GET /auth/me` | `api.auth.me()` | ✅ OK |
| `PUT /auth/profile` | `api.auth.updateProfile()` | ✅ OK |
| `POST /auth/forgot-password` | `api.auth.forgotPassword()` | ✅ OK |
| `POST /auth/reset-password` | `api.auth.resetPassword()` | ✅ OK |
| `GET /admin/dashboard` | `api.dashboard.index()` | ✅ OK |
| `GET /admin/dashboard/reports` | `api.dashboard.reports()` | ✅ OK |
| `GET /admin/users` | `api.users.list()` | ✅ OK |
| `GET /admin/users/{id}` | `api.users.get()` | ✅ OK |
| `PUT /admin/users/{id}` | `api.users.update()` | ✅ OK |
| `DELETE /admin/users/{id}` | `api.users.delete()` | ✅ OK |
| `GET /parkings` | `api.parkings.list()` | ✅ OK |
| `GET /parkings/nearby` | `api.parkings.nearby()` | ✅ OK |
| `GET /parkings/{id}` | `api.parkings.get()` | ✅ OK |
| `POST /parkings` | `api.parkings.create()` | ✅ OK |
| `PUT /parkings/{id}` | `api.parkings.update()` — **использует POST + `_method: PUT`** | ⚠️ См. ниже |
| `DELETE /parkings/{id}` | `api.parkings.delete()` | ✅ OK |
| `PATCH /parkings/{id}/status` | `api.parkings.toggleStatus()` | ✅ OK |
| `GET /my-parkings` | `api.parkings.myParkings()` | ✅ OK |
| `GET /admin/parkings` | `api.parkings.adminList()` | ✅ OK |
| `GET /bookings` | `api.bookings.list()` | ✅ OK |
| `GET /bookings/{id}` | `api.bookings.get()` | ✅ OK |
| `POST /bookings` | `api.bookings.create()` | ✅ OK |
| `POST /bookings/{id}/cancel` | `api.bookings.cancel()` | ✅ OK |
| `POST /bookings/{id}/approve` | `api.bookings.approve()` | ✅ OK |
| `GET /my-bookings` | `api.bookings.myBookings()` | ✅ OK |
| `GET /my-bookings/active` | `api.bookings.active()` | ✅ OK |
| `GET /my-bookings/history` | `api.bookings.history()` | ✅ OK |
| `GET /admin/bookings` | `api.bookings.adminList()` | ✅ OK |
| `GET /offers` | `api.offers.list()` | ✅ OK |
| `POST /offers` | `api.offers.create()` | ✅ OK |
| `GET /offers/{id}` | `api.offers.get()` | ✅ OK |
| `POST /offers/{id}/accept` | `api.offers.accept()` | ✅ OK |
| `POST /offers/{id}/reject` | `api.offers.reject()` | ✅ OK |
| `GET /my-offers` | `api.offers.myOffers()` | ✅ OK |
| `GET /my-offers/pending` | `api.offers.pending()` | ✅ OK |
| `GET /pricing-rules` | `api.pricing.rules.list()` | ✅ OK |
| `GET /pricing-rules/{id}` | `api.pricing.rules.get()` | ✅ OK |
| `POST /pricing-rules` | `api.pricing.rules.create()` | ✅ OK |
| `PUT /pricing-rules/{id}` | `api.pricing.rules.update()` | ✅ OK |
| `DELETE /pricing-rules/{id}` | `api.pricing.rules.delete()` | ✅ OK |
| `GET /admin/pricing-rules` | `api.pricing.rules.adminList()` | ✅ OK |
| `POST /pricing/calculate` | `api.pricing.calculate()` | ✅ OK |
| `POST /pricing/calculate-dynamic` | `api.pricing.calculateDynamic()` | ✅ OK |
| `POST /pricing/validate-formula` | `api.pricing.validateFormula()` | ✅ OK |
| `GET /parkings/{id}/pricing-logs` | `api.pricing.logs()` | ✅ OK |
| `GET /notifications` | `api.notifications.list()` | ✅ OK |
| `GET /notifications/unread` | `api.notifications.unread()` | ✅ OK |
| `POST /notifications/{id}/read` | `api.notifications.markAsRead()` | ✅ OK |
| `POST /notifications/read-all` | `api.notifications.markAllAsRead()` | ✅ OK |
| `DELETE /notifications/{id}` | `api.notifications.delete()` | ✅ OK |
| `DELETE /notifications` | `api.notifications.clearAll()` | ✅ OK |
| `GET /notifications/count` | `api.notifications.count()` | ✅ OK |

### 1.2. Backend ↔ User Frontend

| Backend Route | User Call | Статус |
|---|---|---|
| `POST /auth/login` | `authService.login()` | ✅ OK |
| `POST /auth/register` | `authService.register()` | ✅ OK |
| `POST /auth/logout` | `authService.logout()` | ✅ OK |
| `POST /auth/logout-all` | `authService.logoutAll()` | ✅ OK |
| `GET /auth/me` | `authService.me()` | ✅ OK |
| `PUT /auth/profile` | `authService.updateProfile()` | ✅ OK |
| `GET /parkings` | `parkingService.getAll()`, `parkingService.search()` | ✅ OK |
| `GET /parkings/nearby` | `parkingService.getNearby()` | ✅ OK |
| `GET /parkings/{id}` | `parkingService.getById()` | ✅ OK |
| `GET /my-bookings` | `bookingService.getMyBookings()` | ✅ OK |
| `GET /my-bookings/active` | `bookingService.getActiveBooking()` | ✅ OK |
| `GET /my-bookings/history` | `bookingService.getHistory()` | ✅ OK |
| `GET /bookings/{id}` | `bookingService.getById()` | ✅ OK |
| `POST /bookings` | `bookingService.create()` | ✅ OK |
| `POST /bookings/{id}/cancel` | `bookingService.cancel()` | ✅ OK |
| `POST /pricing/calculate` | `bookingService.calculatePrice()` | ✅ OK |
| `POST /pricing/calculate-dynamic` | `bookingService.calculateDynamic()` | ✅ OK |
| `GET /notifications` | `notificationService.getAll()` | ✅ OK |
| `GET /notifications/unread` | `notificationService.getUnread()` | ✅ OK |
| `GET /notifications/count` | `notificationService.getCount()` | ✅ OK |
| `POST /notifications/{id}/read` | `notificationService.markAsRead()` | ✅ OK |
| `POST /notifications/read-all` | `notificationService.markAllAsRead()` | ✅ OK |
| `DELETE /notifications/{id}` | `notificationService.delete()` | ✅ OK |
| `DELETE /notifications` | `notificationService.clearAll()` | ✅ OK |
| `POST /offers` | ❌ **Нет вызова** | ❌ |
| `GET /offers` | ❌ **Нет вызова** | ❌ |
| `GET /offers/{id}` | ❌ **Нет вызова** | ❌ |
| `POST /offers/{id}/accept` | ❌ **Нет вызова** | ❌ |
| `POST /offers/{id}/reject` | ❌ **Нет вызова** | ❌ |
| `GET /my-offers` | ❌ **Нет вызова** | ❌ |
| `GET /my-offers/pending` | ❌ **Нет вызова** | ❌ |
| `GET /pricing-rules` | ❌ **Нет вызова** | ❌ |
| `POST /pricing-rules` | ❌ **Нет вызова** | ❌ |
| `PUT /pricing-rules/{id}` | ❌ **Нет вызова** | ❌ |
| `DELETE /pricing-rules/{id}` | ❌ **Нет вызова** | ❌ |
| `POST /parkings` | ❌ **Нет вызова** | ❌ |
| `PUT /parkings/{id}` | ❌ **Нет вызова** | ❌ |
| `DELETE /parkings/{id}` | ❌ **Нет вызова** | ❌ |
| `GET /my-parkings` | ❌ **Нет вызова** | ❌ |
| `PATCH /parkings/{id}/status` | ❌ **Нет вызова** | ❌ |

---

## 2. Проблемы с эндпоинтами

### ⚠️ 2.1. Admin: Parking Update использует POST вместо PUT

**Файл:** [`admin/src/services/api.ts:123-127`](admin/src/services/api.ts:123-127)

```typescript
update: (id: number, data: FormData | Record<string, unknown>) =>
  apiClient.post(`/parkings/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    params: { _method: 'PUT' },
  }),
```

Работает через Laravel method spoofing, но:
- Для `FormData` (загрузка файлов) — это вынужденная мера, так как `multipart/form-data` не поддерживает PUT нативно
- Для обычных объектов (`Record<string, unknown>`) — лучше использовать `apiClient.put()` напрямую

---

## 3. Критические несоответствия типов (Type Mismatches)

### 🔴 3.1. Offer — ПОЛНОЕ НЕСООТВЕТСТВИЕ (User vs Backend)

**Backend модель** [`backend/app/Models/Offer.php:13-22`](backend/app/Models/Offer.php:13-22):
```
sender_id, receiver_id, booking_id, message, price_offer, status, expires_at, responded_at
```

**Admin тип** [`admin/src/types/index.ts:206-223`](admin/src/types/index.ts:206-223):
```typescript
interface Offer {
  id, sender_id, sender?, receiver_id, receiver?,
  booking_id, booking?, message?, price_offer,
  status, status_label, is_expired, expires_at,
  responded_at?, created_at, updated_at
}
```
✅ Соответствует backend-у.

**User тип** [`user/src/types/index.ts:127-142`](user/src/types/index.ts:127-142):
```typescript
interface Offer {
  id, sender_id, receiver_id, booking_id?,
  parking_id?,       // ❌ Нет в backend
  title,             // ❌ Нет в backend
  description?,      // ❌ Нет в backend
  discount_percentage?,  // ❌ Нет в backend (используется price_offer)
  fixed_discount?,       // ❌ Нет в backend
  valid_until,          // ❌ Backend использует expires_at
  status, sender?, receiver?, created_at
}
```

**Вывод:** User-фронтенд использует **старую/альтернативную модель Offer**, которая не соответствует backend-у. Из-за этого [`user/src/app/my-offers/page.tsx:17-25`](user/src/app/my-offers/page.tsx:17-25) использует **хардкоженный пустой массив**, т.к. не может работать с реальным API.

---

### 🔴 3.2. PricingRule — НЕСООТВЕТСТВИЕ (User vs Backend)

**Backend модель** [`backend/app/Models/PricingRule.php:12-22`](backend/app/Models/PricingRule.php:12-22):
```
parking_id, name, description, formula, multiplier, is_active, created_by, valid_from, valid_until
```

**Admin тип** [`admin/src/types/index.ts:235-251`](admin/src/types/index.ts:235-251):
```typescript
interface PricingRule {
  id, parking_id?, parking?, name, description?,
  formula, multiplier, is_active, is_valid,
  valid_from?, valid_until?, created_by?, creator?, created_at, updated_at
}
```
✅ Соответствует backend-у.

**User тип** [`user/src/types/index.ts:99-111`](user/src/types/index.ts:99-111):
```typescript
interface PricingRule {
  id, parking_id, name,
  type: 'base' | 'dynamic' | 'discount' | 'surcharge',  // ❌ Нет в backend
  formula?: string,       // ❌ В backend — обязательное поле
  price_per_hour?: number, // ❌ Нет в backend
  is_active, priority,    // ❌ priority нет в backend (admin использует multiplier)
  conditions?, created_by?, created_at
}
```

**Вывод:** User-фронтенд имеет **полностью несовместимую модель PricingRule**.

---

### 🔴 3.3. PriceCalculation — НЕСООТВЕТСТВИЕ (User vs Backend)

**Backend** [`backend/app/Helpers/PricingHelper.php:232-240`](backend/app/Helpers/PricingHelper.php:232-240) возвращает:
```php
[
  'price' => round($price, 2),
  'base_price' => (float) $parking->base_price,
  'hours' => $hours,
  'demand_factor' => $demandFactor,
  'weekend_multiplier' => $weekendMultiplier,
  'formula' => $rule->formula ?? 'base_price * hours',
  'rule_applied' => $rule?->name ?? 'default',
]
```

**Admin тип** [`admin/src/types/index.ts:267-275`](admin/src/types/index.ts:267-275):
```typescript
interface PriceCalculation {
  price, base_price, hours,
  demand_factor, weekend_multiplier,
  formula, rule_applied
}
```
✅ Соответствует backend-у.

**User тип** [`user/src/types/index.ts:113-123`](user/src/types/index.ts:113-123):
```typescript
interface PriceCalculation {
  base_price, total_price,   // ❌ Backend возвращает 'price', не 'total_price'
  breakdown: [{ label, amount, type }],  // ❌ Backend не возвращает breakdown
  duration_hours,             // ❌ Backend возвращает 'hours'
  parking_id                  // ❌ Backend не возвращает parking_id в calculatePrice()
}
```

**Вывод:** Если user-фронтенд вызовет `POST /pricing/calculate`, ответ от backend-а не совпадёт с ожидаемой структурой `PriceCalculation`. Это приведёт к ошибкам рантайма.

---

### 🟡 3.4. Notification — Незначительное несоответствие

**Admin** [`admin/src/types/index.ts:278-292`](admin/src/types/index.ts:278-292):
```typescript
interface AppNotification {
  id: string;        // <-- string
  type, notifiable_type, notifiable_id,
  data: { title, message, icon?, action_url? },
  read_at, created_at, updated_at
}
```

**User** [`user/src/types/index.ts:146-152`](user/src/types/index.ts:146-152):
```typescript
interface AppNotification {
  id: number;        // <-- number
  type, data: Record<string, unknown>,
  read_at?, created_at
}
```

**Вывод:** Разница в типе `id` (string vs number) и структуре `data`. Скорее всего, в БД `id` — integer, так что user-тип корректнее. Admin использует string для совместимости с UUID. Структура `data` в admin типизирована точнее.

---

### 🟡 3.5. Booking — Незначительные различия

**Admin** добавляет поля: `status_label`, `status_color`, `offers[]`, `updated_at`  
**User** не имеет этих полей.

Совместимость сохранена — пользователь просто не использует эти поля.

### 🟡 3.6. User — Дополнительные поля

**Admin** добавляет поля: `role_label`, `phone_verified_at`, `roles[]`, `permissions[]`, `parkings_count`, `bookings_count`, `updated_at`  
**User** не имеет этих полей, но использует вычисляемое `is_phone_verified`.

Совместимость сохранена.

---

## 4. Функциональные проблемы

### ❌ 4.1. User Frontend: Offers не подключены к API

**Файл:** [`user/src/app/my-offers/page.tsx:17-25`](user/src/app/my-offers/page.tsx:17-25)

Страница `/my-offers` использует хардкоженный пустой массив:
```typescript
const offers: Array<{...}> = [];
```

Нет сервиса offers на user-фронтенде (`user/src/services/` не содержит файла offers.ts). Страница предлагает устаревшую модель Offer (с title, description, discount_percentage и т.д.), которая не соответствует backend-у.

### ❌ 4.2. User Frontend: PriceCalculation несовместим с ответом backend-а

Если user-фронтенд вызовет `POST /pricing/calculate` (через `bookingService.calculatePrice()`), то:
1. Backend вернёт `{ price, base_price, hours, demand_factor, weekend_multiplier, formula, rule_applied }`
2. User ожидает `{ base_price, total_price, breakdown[], duration_hours, parking_id }`
3. Это вызовет ошибку типов в рантайме

### ⚠️ 4.3. User Frontend: Нет вызовов для Offers API

Backend предоставляет полный CRUD для offers (7 эндпоинтов), но user-фронтенд не использует ни один из них. Функциональность offers доступна только через admin-panel.

---

## 5. Резюме

| Компонент | Статус | Описание |
|---|---|---|
| **Backend ↔ Admin: Endpoints** | ✅ **OK** | Все админские эндпоинты совпадают. |
| **Backend ↔ User: Endpoints** | ⚠️ **Частично** | Основные эндпоинты совпадают, но offers и pricing-rules не используются. |
| **Backend ↔ Admin: Types** | ✅ **OK** | Типы данных согласованы. |
| **Backend ↔ User: Types** | 🔴 **Критично** | 3 типа (Offer, PricingRule, PriceCalculation) полностью несовместимы. |
| **Admin → Parking Update** | ⚠️ **Косметика** | Использует POST+`_method` вместо PUT для не-File данных. |
| **User → Offers** | 🔴 **Сломано** | Страница offers не подключена к API. |
| **User → Price Calculation** | 🔴 **Сломано** | Тип PriceCalculation не совпадает с ответом backend-а. |

### Приоритет исправлений:

1. **🔴 Высокий:** Исправить `user/src/types/index.ts` — Offer, PricingRule, PriceCalculation
2. **🔴 Высокий:** Создать `user/src/services/offers.ts` и подключить offers API
3. **🔴 Высокий:** Исправить `user/src/app/my-offers/page.tsx` для работы с реальным API
4. **🟡 Средний:** Исправить `admin/src/services/api.ts` — использовать PUT для update без FormData
5. **🟢 Низкий:** Синхронизировать Notification тип между admin и user
