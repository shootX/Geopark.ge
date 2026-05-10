<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->created([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 'Registration successful. Please verify your email.');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return $this->success([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->success(null, 'Logged out successfully.');
    }

    public function logoutAllDevices(Request $request): JsonResponse
    {
        $this->authService->logoutAllDevices($request->user());

        return $this->success(null, 'Logged out from all devices successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->refreshProfile($request->user());

        return $this->success(new UserResource($user));
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return $this->success(new UserResource($user), 'Profile updated successfully.');
    }

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = \App\Models\User::findOrFail($id);

        if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return $this->error('Invalid verification link.', 400);
        }

        $this->authService->verifyEmail($user);

        return $this->success(null, 'Email verified successfully.');
    }

    public function resendEmailVerification(Request $request): JsonResponse
    {
        $this->authService->sendEmailVerification($request->user());

        return $this->success(null, 'Verification email sent.');
    }

    public function sendPhoneVerification(Request $request): JsonResponse
    {
        $this->authService->sendPhoneVerificationCode($request->user());

        return $this->success(null, 'Verification code sent to your phone.');
    }

    public function verifyPhone(Request $request): JsonResponse
    {
        $this->authService->verifyPhone($request->user());

        return $this->success(null, 'Phone verified successfully.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $this->authService->sendPasswordResetLink($request->email);

        return $this->success(null, 'Password reset link sent to your email.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->authService->resetPassword($request->only('token', 'email', 'password', 'password_confirmation'));

        return $this->success(null, 'Password reset successfully.');
    }
}
