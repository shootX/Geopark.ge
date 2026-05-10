# 🛠️ План исправлений — GeoPark Technical Audit

## Приоритет: 🔴 Critical → 🟠 High → 🟡 Medium → 🔵 Low

---

## 🔴 #1: Заменить `eval()` в PricingHelper на безопасный парсер

**Файл:** [`backend/app/Helpers/PricingHelper.php`](backend/app/Helpers/PricingHelper.php:60)

**Решение:** Реализовать Shunting-yard алгоритм для безопасного вычисления математических выражений. 
- Поддержка: +, -, *, /, %, (), числа с плавающей точкой
- Без `eval()`, без `exec()`, без `assert()`
- Замена [`safeEval()`](backend/app/Helpers/PricingHelper.php:54) на [`evaluateExpression()`](backend/app/Helpers/PricingHelper.php:54) с Shunting-yard парсером

---

## 🔴 #2: Синхронизировать типы `admin/src/types/index.ts` с API

**Файл:** [`admin/src/types/index.ts`](admin/src/types/index.ts)

**Решение:** Переписать все интерфейсы в соответствии с реальными ответами Laravel Resources:
- [`UserResource`](backend/app/Http/Resources/UserResource.php): `first_name`, `last_name`, `full_name`, `role` (string), `roles` (string[] when loaded)
- [`ParkingResource`](backend/app/Http/Resources/ParkingResource.php): `title`, `base_price`, `occupancy_rate`, `status`, `status_label`, `is_open`, `opening_time`, `closing_time`, `is_verified`, `distance` 
- [`BookingResource`](backend/app/Http/Resources/BookingResource.php): `duration_hours`, `booking_status`, `status_label`, `status_color`, `is_active`, `cancelled_at`, `cancellation_reason`
- [`OfferResource`](backend/app/Http/Resources/OfferResource.php): `sender_id`, `receiver_id`, `booking_id`, `price_offer`, `is_expired`, `expires_at`, `responded_at`
- [`PricingRuleResource`](backend/app/Http/Resources/PricingRuleResource.php): `multiplier` (float), `is_valid`, `valid_from`, `valid_until`, `created_by`
- [`PriceCalculation`](backend/app/Helpers/PricingHelper.php:91): match `calculatePrice()` return

---

## 🔴 #3: Исправить `PricingController::update()` на валидацию

**Файл:** [`backend/app/Http/Controllers/API/PricingController.php`](backend/app/Http/Controllers/API/PricingController.php:48)

**Решение:** 
- Изменить тип параметра с `Request $request` на `StorePricingRuleRequest $request`
- Заменить `$request->all()` на `$request->validated()`

---

## 🟠 #4: Устранить дуальную систему ролей

**Файлы:** [`CheckRole.php`](backend/app/Http/Middleware/CheckRole.php), [`User.php`](backend/app/Models/User.php), [`AuthService.php`](backend/app/Services/Auth/AuthService.php)

**Решение:**
- `CheckRole` middleware: проверять и колонку `role`, и Spatie `hasRole()`
- Удалить `$user->assignRole()` из [`AuthService`](backend/app/Services/Auth/AuthService.php:29) — использовать только колонку `role`
- Spatie оставить только для granular permissions

---

## 🟠 #5: Исправить WebSocket-каналы уведомлений

**Файл:** [`BookingCreatedNotification.php`](backend/app/Notifications/BookingCreatedNotification.php:62)

**Решение:**
- Добавить broadcast в `admin.notifications` для администраторов
- `broadcastOn()` возвращает массив каналов: `['user.'.$userId, 'admin.notifications']`

---

## 🟠 #6: Удалить мок-данные из Dashboard и Reports

**Файлы:** [`dashboard/page.tsx`](admin/src/app/dashboard/page.tsx:116), [`reports/page.tsx`](admin/src/app/reports/page.tsx:37)

**Решение:**
- Dashboard: убрать `mockRevenueData`, `mockBookingActivity`, `mockUserGrowth`, `mockParkingUtil` с `Math.random()`
- Reports: убрать `revenueData`, `bookingData` с `Math.random()`
- Показывать заглушки/скелетоны пока данные загружаются

---

## 🟠 #7: Исправить URL email-уведомлений

**Файл:** [`BookingCreatedNotification.php`](backend/app/Notifications/BookingCreatedNotification.php:34)

**Решение:**
- Заменить `url('/api/v1/bookings/...')` на `config('app.frontend_url') . '/booking/' . $this->booking->id`

---

## 🟡 #8–13: Средний приоритет

8. **DI в BookingController** — заменить `app()` на constructor injection
9. **Валюта GEL** — сменить `'USD'` → `'GEL'`, `'en-US'` → `'ka-GE'`
10. **Типизировать echoRef** — `useRef<any>` → `useRef<Echo | null>`
11. **handleExport** — добавить скачивание blob-файла
12. **SMS-верификация** — улучшить сообщения
13. **BookingController параметры** — специфичные FormRequest вместо базового Request

---

## 🔵 #14–17: Низкий приоритет

14. Удалить неиспользуемые импорты
15. `<img>` → `<Image>` в BottomSheet
16. `catch (err: any)` → `catch (err: unknown)`
17. Лишние проверки в Policies
