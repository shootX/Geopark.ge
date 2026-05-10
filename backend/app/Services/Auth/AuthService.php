<?php

namespace App\Services\Auth;

use App\DTOs\BookingDTO;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private UserRepository $userRepository,
    ) {}

    public function register(array $data): array
    {
        $data['password'] = Hash::make($data['password']);
        $data['role'] = $data['role'] ?? 'user';
        $data['is_active'] = true;

        $user = $this->userRepository->create($data);

        // Assign default role via Spatie
        $user->assignRole($data['role']);

        event(new Registered($user));

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function login(array $credentials): array
    {
        $user = $this->userRepository->findByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        // Revoke old tokens
        if (!empty($credentials['revoke_old']) && $credentials['revoke_old']) {
            $user->tokens()->delete();
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user->load('roles'),
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function logoutAllDevices(User $user): void
    {
        $user->tokens()->delete();
    }

    public function refreshProfile(User $user): User
    {
        return $user->fresh()->load(['roles', 'defaultCar']);
    }

    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        return $this->userRepository->update($user, $data);
    }

    public function sendPasswordResetLink(string $email): string
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }

    public function resetPassword(array $data): string
    {
        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }

    public function verifyEmail(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Email already verified.'],
            ]);
        }
        $user->markEmailAsVerified();
    }

    public function sendEmailVerification(User $user): void
    {
        $user->sendEmailVerificationNotification();
    }

    public function verifyPhone(User $user): void
    {
        $user->markPhoneAsVerified();
    }

    public function sendPhoneVerificationCode(User $user): void
    {
        // Generate and send SMS code (structure ready for integration)
        $code = random_int(100000, 999999);
        // Store code in cache with TTL
        cache()->put("phone_verification_{$user->id}", $code, now()->addMinutes(10));

        // Check if SMS provider is configured
        $smsProvider = config('services.sms.provider');
        if (!$smsProvider) {
            // Log that SMS is not available instead of silently failing
            logger()->warning('Phone verification: SMS provider not configured. User ID: ' . $user->id);
            // In development mode, return the code in the cache so it can be tested
            if (app()->environment('local', 'testing')) {
                return; // Code is stored in cache for dev/test verification
            }
            throw \Illuminate\Validation\ValidationException::withMessages([
                'phone' => ['SMS ვერიფიკაცია დროებით მიუწვდომელია. გთხოვთ, სცადოთ მოგვიანებით.'],
            ]);
        }

        // TODO: Integrate with SMS provider
        // Example: SmsService::send($user->phone, "Your verification code: $code");
    }
}
