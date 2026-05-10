<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        foreach (UserRole::values() as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@geopark.com'],
            [
                'first_name' => 'System',
                'last_name' => 'Admin',
                'birth_date' => '1990-01-01',
                'personal_number' => '00000000000',
                'phone' => '+995555000000',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => UserRole::Admin,
                'is_active' => true,
            ]
        );
        $admin->assignRole('admin');

        // Create demo owner
        $owner = User::firstOrCreate(
            ['email' => 'owner@geopark.com'],
            [
                'first_name' => 'Giorgi',
                'last_name' => 'ParkingOwner',
                'birth_date' => '1985-05-15',
                'personal_number' => '00000000001',
                'phone' => '+995555111111',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => UserRole::Owner,
                'is_active' => true,
            ]
        );
        $owner->assignRole('owner');

        // Create demo user
        $user = User::firstOrCreate(
            ['email' => 'user@geopark.com'],
            [
                'first_name' => 'Nino',
                'last_name' => 'TestUser',
                'birth_date' => '1995-10-20',
                'personal_number' => '00000000002',
                'phone' => '+995555222222',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => UserRole::User,
                'is_active' => true,
            ]
        );
        $user->assignRole('user');
    }
}
