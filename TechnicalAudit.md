# 🚨 Комплексный Технический Аудит — GeoPark

> **Дата:** 2026-05-09
> **Вердикт:** 🚫 **НЕ ПРОДАКШН-РЕАДИ** — Критические проблемы с безопасностью, несоответствие типов Frontend/Backend, мок-данные в production, и дуальная система ролей.

---

## 📋 Содержание

1. [🔴 Критические (Critical)](#1--критические-critical)
2. [🟠 Высокие (High)](#2--высокие-high)
3. [🟡 Средние (Medium)](#3--средние-medium)
4. [🔵 Низкие (Low)](#4--низкие-low)
5. [🏗️ Архитектурные проблемы](#5-архитектурные-проблемы)
6. [📊 Сводка по предыдущим аудитам](#6-сводка-по-предыдущим-аудитам)
7. [🎯 Рекомендации](#7-рекомендации)

---

## 1. 🔴 Критические (Critical)

### 1.1. `eval()` в `PricingHelper::safeEval()` — Уязвимость Remote Code Execution (RCE)

| Файл | Строка |
|------|--------|
| [`backend/app/Helpers/PricingHelper.php`](backend/app/Helpers/PricingHelper.php) | 60 |

**Проблема:** Метод [`safeEval()`](backend/app/Helpers/PricingHelper.php:54) использует нативный `eval()` PHP для вычисления динамических формул ценообразования:

```php
private static function safeEval(string $expression): float
{
    $sanitized = preg_replace('/[^0-9+\-*\/.()%\s]/', '', $expression);
    $result = @eval("return {$sanitized};");
    // ...
}
```

Хотя применяется санитизация через regex `/[^0-9+\-*\/.()%\s]/`, это **не является достаточной защитой**. Злоумышленник, имеющий доступ к созданию/редактированию правил ценообразования (администратор или владелец парковки), может передать строку, которая пройдет regex-фильтр, но всё равно выполнит произвольный код.

**Пример вектора атаки:** Некоторые конструкции PHP могут быть закодированы или обфусцированы так, чтобы пройти regex `/[^0-9+\-*\/.()%\s]/`. Даже `(7+8)` проходит — и если логика замены плейсхолдеров `{{variable}}` пропустит вредоносный код до вызова `safeEval()`, это RCE.

**Риск:** Полная компрометация сервера.

**Рекомендация:** Не использовать `eval()`. Реализовать парсер математических выражений (например, библиотека `matthiasmullie/minify` или самописный Shunting-yard алгоритм) или использовать встроенный `bcmod` / символьные вычисления без `eval()`.

---

### 1.2. Полное несоответствие типов Frontend (Admin) и Backend API

| Файл | Строка |
|------|--------|
| [`admin/src/types/index.ts`](admin/src/types/index.ts) | 6–226 |

**Проблема:** Типы TypeScript в админ-панели **полностью не соответствуют** тому, что возвращает Laravel API. Это означает, что все страницы, работающие с реальными данными (bookings, parkings, offers, pricing), **не могут корректно отображать данные**.

#### Таблица несоответствий:

| Сущность | Frontend (TypeScript) | Backend (Laravel Resource) | Статус |
|----------|----------------------|---------------------------|--------|
| **User** | `name: string` | `first_name`, `last_name`, `full_name` | ❌ |
| **Parking** | `name: string` | `title: string` | ❌ |
| **Parking** | `hourly_rate: number` | `base_price: float` | ❌ |
| **Parking** | `owner_id: number` | `owner: UserResource` (вложенный объект) | ❌ |
| **Parking** | `address: string` | `location: string` или отсутствует | ❌ |
| **Booking** | `status: string` | `booking_status: BookingStatus` (enum) | ❌ |
| **Booking** | `hours: number` | `duration_hours: float` | ❌ |
| **Booking** | `user_id: number` | `user: UserResource` | ❌ |
| **Booking** | `parking_id: number` | `parking: ParkingResource` | ❌ |
| **Offer** | `user_id: number` | `sender_id`, `receiver_id` | ❌ |
| **Offer** | `parking_id: number` | `booking_id` (привязано к брони, не к парковке) | ❌ |
| **Offer** | `amount: number` | `price_offer: float` | ❌ |
| **PricingRule** | `variables: string[]` | `formula: string` | ❌ |
| **PricingRule** | `priority: number` | `multiplier: float` | ❌ |
| **PriceCalculation** | полная структура | совсем другой формат | ❌ |

**Риск:** Все страницы админ-панели, работающие с API, отображают `undefined`, `NaN` или падают с ошибкой при получении реальных данных. Поскольку сейчас, вероятно, используются мок-данные, эта проблема скрыта.

**Рекомендация:** Полная синхронизация типов. Либо:
- Сгенерировать TypeScript-типы из Laravel Resources (например, через `openapi-generator`)
- Либо переписать [`admin/src/types/index.ts`](admin/src/types/index.ts) вручную, строго по ответам API

---

### 1.3. `PricingController::update()` использует `$request->all()` вместо `$request->validated()`

| Файл | Строка |
|------|--------|
| [`backend/app/Http/Controllers/API/PricingController.php`](backend/app/Http/Controllers/API/PricingController.php) | 48–62 |

**Проблема:** Метод `update()` принимает `Request $request` (базовый класс) вместо `StorePricingRuleRequest $request` (FormRequest с валидацией):

```php
public function update(Request $request, PricingRule $pricingRule): JsonResponse
{
    $pricingRule = $this->pricingService->update($pricingRule, $request->all());
    // ...
}
```

Метод `store()` использует `StorePricingRuleRequest $request` и `$request->validated()`, но `update()` **обходит валидацию**.

**Риск:** Возможность передать произвольные данные в метод `update()`, включая манипуляции с `formula` (что усугубляет проблему 1.1).

**Рекомендация:** Использовать `StorePricingRuleRequest $request` и `$request->validated()` в методе `update()`.

---

## 2. 🟠 Высокие (High)

### 2.1. Дуальная система ролей: колонка `role` + Spatie `roles`

| Файл | Строка |
|------|--------|
| [`backend/app/Models/User.php`](backend/app/Models/User.php) | 94–107 |
| [`backend/app/Http/Middleware/CheckRole.php`](backend/app/Http/Middleware/CheckRole.php) | 11–26 |
| [`backend/app/Services/Auth/AuthService.php`](backend/app/Services/Auth/AuthService.php) | 20–39 |

**Проблема:** В проекте используется **две независимые системы ролей**:

1. **Колонка `role` в таблице `users`** (enum `UserRole`) — проверяется в `CheckRole` middleware и в методах `User::isAdmin()`, `User::isOwner()`, `User::isRegularUser()`
2. **Spatie Laravel Permission** (`HasRoles` trait) — роли назначаются через `$user->assignRole()` при регистрации ([`AuthService.php:33`](backend/app/Services/Auth/AuthService.php:33))

При регистрации устанавливается и колонка `role`, и Spatie-роль. Но middleware `CheckRole` проверяет только колонку [`$user->role?->value`](backend/app/Http/Middleware/CheckRole.php:18), а Gates/Policies из `AppServiceProvider` используют Spatie-проверки.

**Риски:**
- Рассогласование: можно изменить колонку `role` без изменения Spatie-роли, и наоборот
- `CheckRole` middleware и Spatie `role` middleware могут давать разные результаты
- Администратор, созданный через Spatie, но с неправильной колонкой `role`, будет заблокирован

**Рекомендация:** Выбрать **одну** систему. Рекомендуется Spatie (более гибкая). Удалить колонку `role` и методы `isAdmin()`/`isOwner()`/`isRegularUser()`, заменив их Spatie-проверками.

---

### 2.2. Несоответствие каналов WebSocket-уведомлений

| Файл | Строка |
|------|--------|
| [`backend/app/Notifications/BookingCreatedNotification.php`](backend/app/Notifications/BookingCreatedNotification.php) | 62–65 |
| [`admin/src/hooks/use-realtime.ts`](admin/src/hooks/use-realtime.ts) | 76–101 |

**Проблема:** [`BookingCreatedNotification`](backend/app/Notifications/BookingCreatedNotification.php:62) транслируется в канал:

```php
public function broadcastOn(): array
{
    return [new PrivateChannel('user.' . $this->booking->user_id)];
}
```

Но админ-панель слушает канал [`admin.notifications`](admin/src/hooks/use-realtime.ts:76):

```typescript
const adminChannel = echo.private('admin.notifications');
```

**Риск:** Администраторы **никогда не получают WebSocket-уведомления** о новых бронированиях в реальном времени. Уведомления о новых бронированиях доходят до администраторов только через polling или при обновлении страницы.

**Рекомендация:** Создать второй канал для администраторов (например, `admin.notifications`) и отправлять туда копию уведомления, либо сделать канал динамическим для всех ролей.

---

### 2.3. Мок-данные в production-коде админ-панели

| Файл | Строка |
|------|--------|
| [`admin/src/app/dashboard/page.tsx`](admin/src/app/dashboard/page.tsx) | 116–151 |
| [`admin/src/app/reports/page.tsx`](admin/src/app/reports/page.tsx) | 37–48 |

**Проблема:**

[**Dashboard**](admin/src/app/dashboard/page.tsx:116): `useMemo` генерирует данные с `Math.random()`:

```typescript
const mockRevenueData = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    revenue: Math.floor(Math.random() * 50000) + 10000, // ← random!
    expenses: Math.floor(Math.random() * 30000) + 5000,
    profit: 0,
})), []);
```

[**Reports**](admin/src/app/reports/page.tsx:37): Данные генерируются **вне `useMemo`**, на каждый рендер:

```typescript
const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: months[i],
    revenue: Math.floor(Math.random() * 100000) + 10000, // ← random каждый рендер!
    bookings: Math.floor(Math.random() * 2000) + 200,
    occupancy: Math.random() * 100,
}));
```

**Риск:** Панель администратора показывает нереальные данные. Невозможно принимать бизнес-решения на основе такой аналитики. При обновлении страницы цифры полностью меняются.

**Рекомендация:** Удалить весь мок-код. Подключить реальные API-эндпоинты, которые уже существуют в [`DashboardController::reports()`](backend/app/Http/Controllers/API/Admin/DashboardController.php:176).

---

### 2.4. URL подтверждения email ведет на API, а не на фронтенд

| Файл | Строка |
|------|--------|
| [`backend/app/Notifications/BookingCreatedNotification.php`](backend/app/Notifications/BookingCreatedNotification.php) | 24–36 |

**Проблема:** В `toMail()` ссылка ведет на API-эндпоинт:

```php
url('/api/v1/bookings/' . $this->booking->id)
```

Пользователь, нажавший на эту ссылку в email, попадет на JSON-ответ API вместо красивого интерфейса.

**Рекомендация:** Использовать URL фронтенда: `config('app.frontend_url') . '/booking/' . $this->booking->id`

---

## 3. 🟡 Средние (Medium)

### 3.1. Отсутствие Dependency Injection в `BookingController`

| Файл | Строка |
|------|--------|
| [`backend/app/Http/Controllers/API/BookingController.php`](backend/app/Http/Controllers/API/BookingController.php) | 34, 87, 105, 120 |

**Проблема:** Вместо Constructor Injection используется сервис-локатор `app()`:

```php
$repo = app(\App\Repositories\BookingRepository::class);
// ...
$service = app(\App\Services\Booking\BookingService::class);
```

**Риск:** Нарушение принципов SOLID (Inversion of Control), сложнее тестировать, сложнее подменять реализации.

**Рекомендация:** Использовать DI через конструктор, как это сделано в [`DashboardController`](backend/app/Http/Controllers/API/Admin/DashboardController.php:22).

---

### 3.2. Валюта USD вместо GEL (₾)

| Файл | Строка |
|------|--------|
| [`admin/src/utils/index.ts`](admin/src/utils/index.ts) | 12 |

**Проблема:** [`formatCurrency()`](admin/src/utils/index.ts:8) использует USD:

```typescript
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};
```

Проект — грузинский (GeoPark). Валюта должна быть `GEL` (₾). Также в базе данных цены хранятся в `decimal(8,2)` без указания валюты.

**Рекомендация:** Использовать `'ka-GE'` locale и `'GEL'` валюту. Или сделать конфигурируемым.

---

### 3.3. `echoRef` имеет тип `any` в use-realtime

| Файл | Строка |
|------|--------|
| [`admin/src/hooks/use-realtime.ts`](admin/src/hooks/use-realtime.ts) | 39 |

**Проблема:** Реф Echo объявлен как `any`:

```typescript
const echoRef = useRef<any>(null);
```

**Рекомендация:** Использовать типизированный реф: `useRef<Echo | null>(null)`

---

### 3.4. `handleExport` в Reports не скачивает файл

| Файл | Строка |
|------|--------|
| [`admin/src/app/reports/page.tsx`](admin/src/app/reports/page.tsx) | 50–61 |

**Проблема:** Метод вызывает API, но не обрабатывает ответ как файл для скачивания:

```typescript
const handleExport = async (format: 'csv' | 'excel') => {
    const response = await api.dashboard.exportReport({ format, period, reportType });
    // response никак не обрабатывается — файл не скачивается!
};
```

---

### 3.5. `BookingController::show()` — Route Model Binding может не сработать с SoftDeletes

| Файл | Строка |
|------|--------|
| [`backend/app/Http/Controllers/API/BookingController.php`](backend/app/Http/Controllers/API/BookingController.php) | 50–55 |

**Проблема:** [`Booking`](backend/app/Models/Booking.php) использует `SoftDeletes`. Route Model Binding (`Booking $booking`) не будет находить мягко удаленные записи без `->withTrashed()`.

---

### 3.6. `OfferService::accept()` — параметр `$user` не используется

| Файл | Строка |
|------|--------|
| [`backend/app/Services/Offer/OfferService.php`](backend/app/Services/Offer/OfferService.php) | 68 |

**Проблема:** Параметр `User $user` передается в методы [`accept()`](backend/app/Services/Offer/OfferService.php:68) и [`reject()`](backend/app/Services/Offer/OfferService.php:90), но не используется внутри. Только проверка `$offer->receiver_id === $user->id` в контроллере.

---

## 4. 🔵 Низкие (Low)

### 4.1. Неиспользуемые импорты в админ-панели

| Файл | Импорты |
|------|---------|
| [`admin/src/app/bookings/page.tsx`](admin/src/app/bookings/page.tsx) | `Ban`, `User`, `Car`, `Clock`, `DialogFooter` |
| [`admin/src/app/parkings/page.tsx`](admin/src/app/parkings/page.tsx) | `Search`, `Clock` |

**Риск:** Увеличивают размер бандла и создают шум в коде.

---

### 4.2. `<img>` вместо Next.js `<Image>` в User App

| Файл | Строка |
|------|--------|
| [`user/src/components/map/BottomSheet.tsx`](user/src/components/map/BottomSheet.tsx) | 109 |

**Проблема:** Используется нативный `<img>` без оптимизации Next.js Image component.

---

### 4.3. `catch (err: any)` в User App `api.ts`

| Файл | Строка |
|------|--------|
| [`user/src/services/api.ts`](user/src/services/api.ts) | 58–67 |

**Проблема:** Перехватчик ошибок использует `catch (err: any)`, хотя в [`authStore.ts`](user/src/store/authStore.ts) уже исправлено на `catch (err: unknown)`.

---

### 4.4. `BookingController` использует `Request $request` вместо специфичных FormRequest

| Файл | Строка |
|------|--------|
| [`backend/app/Http/Controllers/API/BookingController.php`](backend/app/Http/Controllers/API/BookingController.php) | 77, 85 |

**Проблема:** Методы `approve()` и `cancel()` принимают `Request $request` вместо `CancelBookingRequest`.

---

### 4.5. Лишняя проверка в `BookingPolicy::view()`

| Файл | Строка |
|------|--------|
| [`backend/app/Policies/BookingPolicy.php`](backend/app/Policies/BookingPolicy.php) | 15–20 |

**Проблема:** Проверка `$user->isAdmin()` дублируется — если пользователь админ, то `viewAny` уже разрешил доступ. А `view()` дополнительно проверяет `isAdmin()`.

---

## 5. 🏗️ Архитектурные проблемы

### 5.1. Три архитектуры аутентификации

Проект использует **три разных подхода к аутентификации**:

| Слой | Механизм | Файл |
|------|----------|------|
| **Backend Admin** | Sanctum Token (Bearer) | [`api.ts:14-21`](admin/src/services/api.ts:14) |
| **Backend User App** | Sanctum SPA (Cookie) | [`api.ts:43-54`](user/src/services/api.ts:43) |
| **Backend Web** | Laravel Web (Session) | default |

Это усложняет обслуживание и увеличивает поверхность атаки.

### 5.2. Репозитории + Сервисы + DTO — избыточная абстракция

Для каждой сущности созданы:
- **Model** (Eloquent)
- **Repository** (прослойка над Model)
- **Service** (бизнес-логика)
- **DTO** (для Booking)
- **FormRequest** (валидация)
- **Resource** (форматирование ответа)
- **Policy** (авторизация)

Это 7 слоев для одной сущности. Для небольшого приложения (4-5 моделей) такая архитектура избыточна и замедляет разработку. Repository и Service часто дублируют методы Eloquent без добавления ценности.

### 5.3. Отсутствие тестов

Не найдено ни одного автоматического теста (unit/feature). В `composer.json` есть `"test"` скрипт, но нет тестовых файлов. В `phpunit.xml` есть настройки, но тесты не реализованы.

### 5.4. SMS-верификация не реализована

| Файл | Строка |
|------|--------|
| [`backend/app/Services/Auth/AuthService.php`](backend/app/Services/Auth/AuthService.php) | 146–169 |

Метод [`sendPhoneVerificationCode()`](backend/app/Services/Auth/AuthService.php:146) проверяет конфигурацию SMS-провайдера, но:

```php
if (!config('services.sms.provider')) {
    throw new \Exception('SMS service is not configured');
}
```

SMS-провайдер не настроен, и весь функционал телефонной верификации **не работает**.

---

## 6. 📊 Сводка по предыдущим аудитам

### ✅ Исправлено в предыдущих аудитах

| # | Проблема | Статус |
|---|----------|--------|
| 1 | PHP 8.2 → 8.4 | ✅ |
| 2 | `console.log` в reports/page.tsx | ✅ |
| 3 | `any` типы в use-realtime (частично) | ✅ |
| 4 | `eslint-disable` в data-table, MapView | ✅ |
| 5 | `catch (err: any)` → `catch (err: unknown)` в authStore | ✅ |
| 6 | localStorage → Zustand store | ✅ |
| 7 | SMS verification (incomplete state handling) | ✅ |

### ❌ Осталось (не исправлено в предыдущих аудитах)

| # | Проблема | Статус |
|---|----------|--------|
| 1 | `eval()` в PricingHelper | ❌ Критическое |
| 2 | Несоответствие типов Frontend/Backend | ❌ Критическое |
| 3 | `$request->all()` в PricingController::update() | ❌ Критическое |
| 4 | Dual role system | ❌ Высокое |
| 5 | Channel mismatch | ❌ Высокое |
| 6 | Mock data в dashboard/reports | ❌ Высокое |
| 7 | Email verification URL | ❌ Среднее |
| 8 | BookingController без DI | ❌ Среднее |
| 9 | USD вместо GEL | ❌ Среднее |
| 10 | echoRef typed as any | ❌ Среднее |
| 11 | handleExport не работает | ❌ Среднее |
| 12 | Неиспользуемые импорты | ❌ Низкое |
| 13 | `<img>` вместо `<Image>` | ❌ Низкое |

---

## 7. 🎯 Рекомендации

### Немедленно (Critical — до выхода в продакшн)

1. **Заменить `eval()`** в [`PricingHelper`](backend/app/Helpers/PricingHelper.php:60) на парсер математических выражений (Shunting-yard или библиотека).
2. **Синхронизировать типы** [`admin/src/types/index.ts`](admin/src/types/index.ts) с реальными ответами Laravel API.
3. **Заменить `$request->all()`** на `$request->validated()` в [`PricingController::update()`](backend/app/Http/Controllers/API/PricingController.php:48).

### Высокий приоритет (High — до релиза)

4. **Устранить дуальную систему ролей** — выбрать Spatie, удалить колонку `role`.
5. **Исправить WebSocket-каналы** — добавить трансляцию в `admin.notifications`.
6. **Удалить все мок-данные** из Dashboard и Reports.
7. **Исправить URL email-уведомлений** на фронтенд.

### Средний приоритет (Medium — следующий спринт)

8. Внедрить Dependency Injection в [`BookingController`](backend/app/Http/Controllers/API/BookingController.php).
9. Сменить валюту USD → GEL в [`formatCurrency()`](admin/src/utils/index.ts:8).
10. Типизировать `echoRef` в [`use-realtime.ts`](admin/src/hooks/use-realtime.ts:39).
11. Реализовать скачивание файлов в [`handleExport`](admin/src/app/reports/page.tsx:50).
12. Реализовать SMS-верификацию или удалить заглушки.

### Низкий приоритет (Low — технический долг)

13. Удалить неиспользуемые импорты.
14. Заменить `<img>` на `<Image>` в [`BottomSheet.tsx`](user/src/components/map/BottomSheet.tsx:109).
15. Унифицировать обработку ошибок (`catch (err: unknown)`).
16. Написать unit/feature тесты.

---

## 📈 Общая оценка качества кода

| Категория | Оценка | Комментарий |
|-----------|--------|-------------|
| **Безопасность** | 🚫 2/10 | `eval()` — это RCE. Дуальная роль может привести к privilege escalation. |
| **Типобезопасность** | 🚫 1/10 | Полный mismatch типов между админкой и API. |
| **Архитектура** | 🟡 5/10 | Repository+Service паттерн хорош, но избыточен для масштаба проекта. |
| **UI/UX** | 🟡 5/10 | Мок-данные, неработающий экспорт, USD валюта. |
| **Тестирование** | 🚫 0/10 | Нет тестов. |
| **Code Quality** | 🟡 5/10 | Неиспользуемые импорты, `any`, `eval()`. |

> **Итоговая оценка: 🟡 3/10 — НЕ РЕКОМЕНДУЕТСЯ К ЗАПУСКУ В ПРОДАКШН до исправления критических проблем.**
